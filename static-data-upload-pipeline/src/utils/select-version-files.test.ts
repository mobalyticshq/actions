import { mkdtempSync, writeFileSync, mkdirSync } from 'fs';
import { tmpdir } from 'os';
import * as path from 'path';
import { selectVersionFiles, versionOf } from './common.utils';

describe('selectVersionFiles', () => {
  // A digit run with a leading zero in the directory: the old pad/sort/unpad rewrote it (007 -> 7)
  const dir = path.join(mkdtempSync(path.join(tmpdir(), 'versions-')), 'game-007', 'static_data');
  mkdirSync(dir, { recursive: true });
  for (const name of [
    'static_data_v1.2.10.json',
    'static_data_v1.10.0.json',
    'static_data_v0.9.99.json',
    'static_data_v1.2.9.json',
    'static_data_v10000.0.0.json',
    'schema.json',
    'static_data_v0.010.json',
    'static_data_v1.2.json',
    'static_data_v1.2.3.json.json',
  ]) writeFileSync(path.join(dir, name), '{}');

  const { versions, malformed } = selectVersionFiles(dir);

  it('orders numerically per component and keeps the paths as they are on disk', () => {
    expect(versions).toEqual(
      ['static_data_v0.9.99.json', 'static_data_v1.2.9.json', 'static_data_v1.2.10.json', 'static_data_v1.10.0.json', 'static_data_v10000.0.0.json'].map(n =>
        path.join(dir, n),
      ),
    );
  });

  it('reports every static_data_v* name that is not a version, leading zeros included', () => {
    expect(malformed.sort()).toEqual(['static_data_v0.010.json', 'static_data_v1.2.3.json.json', 'static_data_v1.2.json']);
  });
});

describe('versionOf', () => {
  it('parses a well-formed name and rejects leading zeros', () => {
    expect(versionOf('static_data_v1.2.3.json')).toEqual([1, 2, 3]);
    expect(versionOf('static_data_v0.0.0.json')).toEqual([0, 0, 0]);
    expect(versionOf('static_data_v1.02.3.json')).toBeNull();
  });
});
