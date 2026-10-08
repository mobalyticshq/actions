import { mkdtempSync, mkdirSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import * as path from 'path';
import { describeError, describeGameEnv } from './common.utils';

describe('describeGameEnv', () => {
  // Forward slashes, as the static_data_path input always has them (also on a Windows dev box)
  const root = mkdtempSync(path.join(tmpdir(), 'game-env-')).split(path.sep).join('/');
  const gameDir = (abbr: string, slug?: string) => {
    const dataDir = `${root}/games/${abbr}/dev/static_data`;
    mkdirSync(dataDir, { recursive: true });
    if (slug !== undefined) writeFileSync(`${root}/games/${abbr}/slug.txt`, slug);
    return dataDir;
  };

  it('resolves the folder abbreviation through slug.txt', () => {
    expect(describeGameEnv(gameDir('d4', 'diablo-4'))).toBe('Diablo 4 :d4: DEV');
  });

  it('tolerates a trailing newline in slug.txt and leaves no gap for a missing icon', () => {
    expect(describeGameEnv(gameDir('wowfor', 'wow-forever\n'))).toBe('World of Warcraft: Forever :wowz: DEV');
    expect(describeGameEnv(gameDir('xko', '2xko'))).toBe('2XKO DEV');
  });

  it('falls back to the folder name without slug.txt', () => {
    expect(describeGameEnv(gameDir('newgame'))).toBe('newgame DEV');
    expect(describeGameEnv('moba-equipment/prod/static_data')).toBe('moba-equipment PROD');
  });
});

describe('describeError', () => {
  it('flattens, truncates and escapes Slack markup', () => {
    expect(describeError(new Error('bad <file>\n & more'))).toBe('bad &lt;file&gt; &amp; more');
    expect(describeError('x'.repeat(400))).toHaveLength(301);
  });
});
