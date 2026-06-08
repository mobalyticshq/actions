#!/usr/bin/env node
// @ts-check
// Assembles the per-game desktop manifests for ONE environment into a single array.
//   source: games/<game>/<env>/desktop/manifest.json   (one game object each)
//   output: <DIST_DIR>/<env>/manifest.json             (JSON array, ready to publish)

import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { requireEnv } from './lib.mjs';

const env = requireEnv('DESKTOP_ENV');
const gamesDir = requireEnv('GAMES_DIR');
const distDir = requireEnv('DIST_DIR');

if (!existsSync(gamesDir)) {
  console.error(`[build-manifest] GAMES_DIR not found: ${gamesDir}`);
  process.exit(1);
}

const games = readdirSync(gamesDir, { withFileTypes: true })
  .filter(d => d.isDirectory())
  .map(d => d.name)
  .sort();

const manifests = [];
for (const game of games) {
  const file = path.join(gamesDir, game, env, 'desktop', 'manifest.json');
  if (!existsSync(file)) continue; // a game need not have a desktop manifest in this env
  manifests.push(JSON.parse(readFileSync(file, 'utf8')));
}

if (manifests.length === 0) {
  console.error(`[build-manifest] no desktop manifests found for env "${env}" under ${gamesDir}`);
  process.exit(1);
}

const outFile = path.join(distDir, env, 'manifest.json');
mkdirSync(path.dirname(outFile), { recursive: true });
writeFileSync(outFile, JSON.stringify(manifests, null, 2) + '\n');
console.log(`[build-manifest] ${env}: ${manifests.length} game(s) -> ${outFile}`);
