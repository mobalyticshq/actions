import fs from 'fs';
import os from 'os';
import path from 'path';
import { findMissingOutputs } from '@shared/claude-cli/find-missing-outputs';

describe('findMissingOutputs', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'expected-outputs-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('returns nothing when all files exist and all dirs have entries', () => {
    const file = path.join(tmpDir, 'query.gql.ts');
    const dir = path.join(tmpDir, 'mapping');
    fs.writeFileSync(file, '');
    fs.mkdirSync(dir);
    fs.writeFileSync(path.join(dir, 'index.ts'), '');

    expect(findMissingOutputs({ files: [file], nonEmptyDirs: [dir] })).toEqual([]);
  });

  it('lists files that do not exist', () => {
    const file = path.join(tmpDir, 'worker-output.types.ts');

    expect(findMissingOutputs({ files: [file] })).toEqual([file]);
  });

  it('lists dirs that are empty or do not exist', () => {
    const emptyDir = path.join(tmpDir, 'empty');
    const absentDir = path.join(tmpDir, 'absent');
    fs.mkdirSync(emptyDir);

    expect(findMissingOutputs({ nonEmptyDirs: [emptyDir, absentDir] })).toEqual([
      `${emptyDir}/ (empty)`,
      `${absentDir}/ (empty)`,
    ]);
  });

  it('treats a file as a missing dir', () => {
    const file = path.join(tmpDir, 'not-a-dir.ts');
    fs.writeFileSync(file, 'x');

    expect(findMissingOutputs({ nonEmptyDirs: [file] })).toEqual([`${file}/ (empty)`]);
  });
});
