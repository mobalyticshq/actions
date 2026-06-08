// @ts-check
import { describe, test, expect } from '@jest/globals';
import { validateManifestObject, validateEnvEntries } from './validate-manifest.mjs';

/** @returns {Record<string, any>} */
const baseGame = () => ({
  gameIds: [1],
  game: 'alpha',
  hotkeys: {},
  mainWindow: 'W',
  windows: { W: { type: 'MAIN' } },
  version: '0.0.0',
  minDesktopVersion: '0.0.0',
});

describe('validateManifestObject rules', () => {
  test('valid object → no problems', () => {
    expect(validateManifestObject(baseGame())).toEqual([]);
  });

  test('missing required string field is flagged', () => {
    const m = baseGame();
    delete m.version;
    expect(validateManifestObject(m).some(p => p.includes('"version"'))).toBe(true);
  });

  test('gameIds must be a non-empty integer array', () => {
    const m = baseGame();
    m.gameIds = [];
    expect(validateManifestObject(m).some(p => p.includes('gameIds'))).toBe(true);
  });

  test('invalid semver is flagged', () => {
    const m = baseGame();
    m.version = '1.0';
    expect(validateManifestObject(m).some(p => p.includes('semver'))).toBe(true);
  });

  test('mainWindow must be a key of windows', () => {
    const m = baseGame();
    m.mainWindow = 'NOPE';
    expect(validateManifestObject(m).some(p => p.includes('mainWindow'))).toBe(true);
  });

  test('non-object → flagged', () => {
    expect(validateManifestObject([])).toEqual(['manifest must be a single JSON object']);
  });
});

describe('validateEnvEntries cross-game rules', () => {
  test('duplicate game across files is flagged', () => {
    const entries = [
      { file: 'a.json', manifest: { ...baseGame(), game: 'alpha', gameIds: [1] } },
      { file: 'b.json', manifest: { ...baseGame(), game: 'alpha', gameIds: [2] } },
    ];
    expect(validateEnvEntries(entries).cross.some(p => p.includes('duplicate game'))).toBe(true);
  });

  test('overlapping gameId between different games is flagged', () => {
    const entries = [
      { file: 'a.json', manifest: { ...baseGame(), game: 'alpha', gameIds: [1] } },
      { file: 'b.json', manifest: { ...baseGame(), game: 'beta', gameIds: [1] } },
    ];
    expect(validateEnvEntries(entries).cross.some(p => p.includes('gameId 1'))).toBe(true);
  });

  test('distinct games with distinct ids → no conflicts', () => {
    const entries = [
      { file: 'a.json', manifest: { ...baseGame(), game: 'alpha', gameIds: [1] } },
      { file: 'b.json', manifest: { ...baseGame(), game: 'beta', gameIds: [2] } },
    ];
    expect(validateEnvEntries(entries).cross).toEqual([]);
  });
});
