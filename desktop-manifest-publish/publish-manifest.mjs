#!/usr/bin/env node
// @ts-check
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { requireEnv } from './lib.mjs';

const env = requireEnv('DESKTOP_ENV');
const distDir = requireEnv('DIST_DIR');
const bucketBase = requireEnv('DESKTOP_BUCKET');
const cfZoneId = requireEnv('CF_ZONE_ID');
const cfPurgePrefix = requireEnv('CF_PURGE_PREFIX');
const cfToken = requireEnv('CF_AUTH_TOKEN');

const manifestFile = `${distDir}/${env}/manifest.json`;
const destFile = `${bucketBase}/${env}/manifest.json`;
const purgeUrl = `https://${cfPurgePrefix}${env}/manifest.json`;

if (!existsSync(manifestFile)) {
  console.error(`[deploy] ${manifestFile} not found — run the build step first`);
  process.exit(1);
}

console.log(`[deploy] gsutil cp ${manifestFile} -> ${destFile}`);
execFileSync('gsutil', ['cp', manifestFile, destFile], { stdio: 'inherit' });

// Purge the single file URL (works on all Cloudflare plans; "prefixes" is Enterprise-only).
const res = await fetch(`https://api.cloudflare.com/client/v4/zones/${cfZoneId}/purge_cache`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${cfToken}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ files: [purgeUrl] }),
});
if (!res.ok) {
  console.error(`[deploy] Cloudflare purge failed: ${res.status} ${await res.text()}`);
  process.exit(1);
}
console.log(`[deploy] uploaded (${env}) + purged ${purgeUrl}`);
