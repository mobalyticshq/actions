#!/usr/bin/env node
// @ts-check

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { requireEnv } from './lib.mjs';

const SEMVER_RE = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;

const isPlainObject = v => typeof v === 'object' && v !== null && !Array.isArray(v);
const isNonEmptyString = v => typeof v === 'string' && v.trim().length > 0;
const isSemver = v => typeof v === 'string' && SEMVER_RE.test(v);

function requiredStringFields(m) {
  const errors = [];
  for (const field of ['game', 'version', 'minDesktopVersion', 'mainWindow']) {
    if (!isNonEmptyString(m[field])) errors.push(`"${field}" must be a non-empty string`);
  }
  return errors;
}

function gameIdsAreIntegers(m) {
  const ok = Array.isArray(m.gameIds) && m.gameIds.length > 0 && m.gameIds.every(Number.isInteger);
  return ok ? [] : ['"gameIds" must be a non-empty array of integers'];
}

function windowsIsNonEmptyObject(m) {
  const ok = isPlainObject(m.windows) && Object.keys(m.windows).length > 0;
  return ok ? [] : ['"windows" must be a non-empty object'];
}

function hotkeysIsObject(m) {
  return isPlainObject(m.hotkeys) ? [] : ['"hotkeys" must be an object'];
}

function versionFieldsAreSemver(m) {
  const errors = [];
  for (const field of ['version', 'minDesktopVersion']) {
    if (isNonEmptyString(m[field]) && !isSemver(m[field])) {
      errors.push(`"${field}" must be valid semver (got "${m[field]}")`);
    }
  }
  return errors;
}

function mainWindowExistsInWindows(m) {
  if (!isNonEmptyString(m.mainWindow) || !isPlainObject(m.windows)) return [];
  if (m.mainWindow in m.windows) return [];
  return [`"mainWindow" ("${m.mainWindow}") is not one of windows keys [${Object.keys(m.windows).join(', ')}]`];
}

export const ENTRY_RULES = [
  requiredStringFields,
  gameIdsAreIntegers,
  windowsIsNonEmptyObject,
  hotkeysIsObject,
  versionFieldsAreSemver,
  mainWindowExistsInWindows,
];

// --- cross-game rules per env: (entries: {file, manifest}[]) => string[] ---

/** `game` must be unique within an environment. */
function gameNamesAreUnique(entries) {
  const errors = [];
  const seen = new Map(); // game -> file
  for (const { file, manifest } of entries) {
    const game = manifest?.game;
    if (!isNonEmptyString(game)) continue;
    if (seen.has(game)) errors.push(`duplicate game "${game}": ${file} and ${seen.get(game)}`);
    else seen.set(game, file);
  }
  return errors;
}

/** `gameIds` must not be shared between different games in an environment. */
function gameIdsDoNotOverlap(entries) {
  const errors = [];
  const owner = new Map(); // gameId -> {game, file}
  for (const { file, manifest } of entries) {
    if (!Array.isArray(manifest?.gameIds)) continue;
    for (const id of manifest.gameIds) {
      const prev = owner.get(id);
      if (prev && prev.game !== manifest.game) {
        errors.push(`gameId ${id} used by "${prev.game}" (${prev.file}) and "${manifest.game}" (${file})`);
      } else if (!prev) {
        owner.set(id, { game: manifest.game, file });
      }
    }
  }
  return errors;
}

export const COLLECTION_RULES = [gameNamesAreUnique, gameIdsDoNotOverlap];

/**
 * Canonical shape of a valid manifest (documentation only — validators accept untrusted input).
 * @typedef {Object} IManifest
 * @property {number[]} gameIds
 * @property {string} game
 * @property {string} version
 * @property {string} minDesktopVersion
 * @property {string} mainWindow
 * @property {Record<string, unknown>} windows
 * @property {Record<string, unknown>} hotkeys
 */

/**
 * Problems with a single game manifest object (input is untrusted parsed JSON).
 * @param {*} manifest
 * @returns {string[]}
 */
export function validateManifestObject(manifest) {
  if (!isPlainObject(manifest)) return ['manifest must be a single JSON object'];
  return ENTRY_RULES.flatMap(rule => rule(manifest));
}

/** Validate one env's entries. Returns { perFile: [{file, problems}], cross: string[] }. */
export function validateEnvEntries(entries) {
  const perFile = [];
  for (const { file, manifest } of entries) {
    const problems = validateManifestObject(manifest);
    if (problems.length) perFile.push({ file, problems });
  }
  const cross = COLLECTION_RULES.flatMap(rule => rule(entries));
  return { perFile, cross };
}

export function listGames(gamesDir) {
  if (!existsSync(gamesDir)) return [];
  return readdirSync(gamesDir, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name)
    .sort();
}

function run(gamesDir, env) {
  let total = 0;
  const entries = [];
  for (const game of listGames(gamesDir)) {
    const file = path.join(gamesDir, game, env, 'desktop', 'manifest.json');
    if (!existsSync(file)) continue; // a game need not have a desktop manifest in this env
    try {
      entries.push({ file, manifest: JSON.parse(readFileSync(file, 'utf8')) });
    } catch (e) {
      console.error(`✗ ${file}\n    - invalid JSON: ${e instanceof Error ? e.message : String(e)}`);
      total++;
    }
  }
  const { perFile, cross } = validateEnvEntries(entries);
  for (const { file, problems } of perFile) {
    console.error(`✗ ${file}`);
    for (const p of problems) console.error(`    - ${p}`);
    total += problems.length;
  }
  if (cross.length) {
    console.error(`✗ [env ${env}] cross-game`);
    for (const p of cross) console.error(`    - ${p}`);
    total += cross.length;
  }
  if (total === 0) console.log(`✓ ${env}: ${entries.length} game(s) ok`);
  return total;
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isMain) {
  const gamesDir = requireEnv('GAMES_DIR');
  const env = requireEnv('DESKTOP_ENV');
  const total = run(gamesDir, env);
  if (total > 0) {
    console.error(`\n${total} problem(s) found.`);
    process.exit(1);
  }
  console.log('\nAll desktop manifests valid.');
}
