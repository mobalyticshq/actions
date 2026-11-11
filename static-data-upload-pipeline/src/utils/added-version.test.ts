import { mkdtempSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import * as path from 'path';
import { addedFiles, staleAddedVersion } from './common.utils';

const dir = 'games/wowfor/prod/static_data';
const file = (v: string) => `${dir}/static_data_v${v}.json`;
// What selectVersionFiles returns: OS-native paths, oldest first
const versions = (...v: string[]) => v.map(x => path.join(dir, `static_data_v${x}.json`));

describe('staleAddedVersion', () => {
  it('passes when the added file is the newest', () => {
    expect(staleAddedVersion([file('0.0.46')], dir, versions('0.0.44', '0.0.45', '0.0.46'))).toBeNull();
  });

  it('names both files when an older-sorting file is added', () => {
    // 0.0.5 typed instead of 0.0.50: it sorts below 0.0.46 and would be merged as history
    expect(staleAddedVersion([file('0.0.5')], dir, versions('0.0.5', '0.0.45', '0.0.46'))).toEqual({
      added: 'static_data_v0.0.5.json',
      newest: 'static_data_v0.0.46.json',
    });
  });

  it('passes when several files are added and the newest is one of them', () => {
    expect(staleAddedVersion([file('0.0.45'), file('0.0.46')], dir, versions('0.0.44', '0.0.45', '0.0.46'))).toBeNull();
  });

  it('reports the highest added file when none of them is the newest', () => {
    expect(staleAddedVersion([file('0.0.3'), file('0.0.4')], dir, versions('0.0.3', '0.0.4', '0.0.9'))?.added).toBe('static_data_v0.0.4.json');
  });

  it('ignores other folders, other files and a change that adds nothing', () => {
    const others = ['games/wowfor/stg/static_data/static_data_v0.0.1.json', `${dir}/schema.json`, `${dir}/tests/static_data_v0.0.1.json`];
    expect(staleAddedVersion(others, dir, versions('0.0.1', '0.0.46'))).toBeNull();
    expect(staleAddedVersion([], dir, versions('0.0.1', '0.0.46'))).toBeNull();
  });

  it('accepts the folder the way an ini or a Windows shell may spell it', () => {
    const stale = { added: 'static_data_v0.0.5.json', newest: 'static_data_v0.0.46.json' };
    expect(staleAddedVersion([file('0.0.5')], `./${dir}/`, versions('0.0.5', '0.0.46'))).toEqual(stale);
    expect(staleAddedVersion([file('0.0.5')], dir.replace(/\//g, '\\'), versions('0.0.5', '0.0.46'))).toEqual(stale);
  });
});

describe('addedFiles', () => {
  const env = { ...process.env };
  const realFetch = global.fetch;
  const event = (payload: object) => {
    const p = path.join(mkdtempSync(path.join(tmpdir(), 'event-')), 'event.json');
    writeFileSync(p, JSON.stringify(payload));
    process.env.GITHUB_EVENT_PATH = p;
    process.env.GITHUB_REPOSITORY = 'mobalyticshq/ngf-configuration';
    delete process.env.GITHUB_API_URL;
  };
  const answer = (status: number, body: object) => {
    const fetchMock = jest.fn(async (_url: string, _init?: object) => ({ ok: status === 200, status, json: async () => body }));
    global.fetch = fetchMock as any;
    return fetchMock;
  };
  afterEach(() => {
    process.env = { ...env };
    global.fetch = realFetch;
  });

  it('compares base...head of a pull request and keeps added and renamed files', async () => {
    event({ pull_request: { base: { sha: 'aaa' }, head: { sha: 'bbb' } } });
    const fetchMock = answer(200, {
      files: [
        { filename: file('0.0.46'), status: 'added' },
        { filename: file('0.0.47'), status: 'renamed' },
        { filename: `${dir}/schema.json`, status: 'modified' },
        { filename: file('0.0.1'), status: 'removed' },
      ],
    });
    expect(await addedFiles('t0ken')).toEqual([file('0.0.46'), file('0.0.47')]);
    expect(fetchMock.mock.calls[0][0]).toBe('https://api.github.com/repos/mobalyticshq/ngf-configuration/compare/aaa...bbb?per_page=1');
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ headers: { Authorization: 'Bearer t0ken' } });
  });

  it('compares before...after of a push', async () => {
    event({ before: 'ccc', after: 'ddd' });
    const fetchMock = answer(200, { files: [] });
    expect(await addedFiles('t')).toEqual([]);
    expect(fetchMock.mock.calls[0][0]).toContain('/compare/ccc...ddd?');
  });

  it('has nothing to compare without an event, or on the first push of a branch', async () => {
    const fetchMock = answer(200, { files: [] });
    delete process.env.GITHUB_EVENT_PATH;
    expect(await addedFiles('t')).toBeNull();
    event({ before: '0000000000000000000000000000000000000000', after: 'ddd' });
    expect(await addedFiles('t')).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('throws on an API error, so the caller can skip the check', async () => {
    event({ before: 'ccc', after: 'ddd' });
    answer(403, {});
    await expect(addedFiles('t')).rejects.toThrow('answered 403');
  });
});
