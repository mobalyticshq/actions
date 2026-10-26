import * as path from 'path';
import { readFileSync } from 'fs';
import { StaticData } from '../types';
import { isValidDataForMerge, mergeStaticData, replaceAssets } from '../utils/merge.utils';
import { applySpreadsheetsDataV2 } from '../utils/spreadsheets-apply-v2.utils';
import { emptySpreadsheetReport } from '../utils/spreadsheets.utils';
import { compareVersions, describeError, versionOf } from '../utils/common.utils';
import { buildStorage } from '../utils/google-auth.utils';
import { SlackMessageManagerV2 } from '../utils/slack-manager-v2.utils';

/**
 * Shadow run of the planned bucket-based merge.
 *
 * Today every run re-merges the whole git history to learn which entities are retired. The newest
 * file in the bucket already *is* that merged state (the sync step writes it there), so the plan is
 * to use it as the base and merge only the version files git has on top of it. This step computes
 * that result next to the real one and reports the difference. It reads the bucket, writes nothing,
 * and never changes what the run ships.
 */

export type Version = [number, number, number];

// Highest-version static_data_v*.json among the names, or null
export function pickBucketBase(names: string[]): string | null {
  let best: { name: string; v: Version } | null = null;
  for (const name of names) {
    const v = versionOf(name);
    if (v && (!best || compareVersions(v, best.v) > 0)) best = { name, v };
  }
  return best?.name ?? null;
}

// Every pipeline-written entity carries `deprecated`; a raw extractor file copied into the bucket by hand does not
export function isPipelineProduced(data: StaticData): boolean {
  const entities = Object.values(data).flatMap(group => (Array.isArray(group) ? group : []));
  return entities.length > 0 && entities.every(e => e != null && typeof e === 'object' && 'deprecated' in e);
}

// Git version files not yet in the base: version >= base (>=, so an in-place edit of the newest file still counts)
export function selectIncoming(versions: string[], baseName: string): string[] {
  const base = versionOf(baseName)!;
  return versions
    .map(p => ({ p, v: versionOf(path.basename(p)) }))
    .filter((x): x is { p: string; v: Version } => x.v !== null && compareVersions(x.v, base) >= 0)
    .sort((a, b) => compareVersions(a.v, b.v))
    .map(x => x.p);
}

// Same fold as mergeStaticDataStep, starting from the base instead of from nothing
export function shadowMerge(base: StaticData, incoming: StaticData[]): StaticData {
  let data = base;
  incoming.forEach((file, i) => {
    if (!isValidDataForMerge(file)) {
      if (i < incoming.length - 1) return;
      throw new Error('the newest git file is not valid for merge');
    }
    data = mergeStaticData(file, data);
  });
  return data;
}

// The override step's pure half, on the sheet rows the real override step already fetched
export function applySheet(data: StaticData, spreadsheetData: { [group: string]: string[][] } | null): StaticData {
  if (!spreadsheetData) return data;
  const processed = applySpreadsheetsDataV2(spreadsheetData, data, emptySpreadsheetReport());
  return mergeStaticData(processed, data, false);
}

export type ShadowDiff = {
  onlyInShipped: string[];
  onlyInShadow: string[];
  liveToDeprecated: string[];
  deprecatedToLive: string[];
  fieldDiffs: string[];
};

export function diffStaticData(shipped: StaticData, shadow: StaticData, tmpAssetPrefix = '', prodAssetPrefix = ''): ShadowDiff {
  // The bucket file carries prod asset URLs; the run's data still has tmp ones until the sync rewrites them
  const a = structuredClone(shipped);
  const b = structuredClone(shadow);
  if (tmpAssetPrefix && tmpAssetPrefix !== prodAssetPrefix) {
    replaceAssets(a, tmpAssetPrefix, prodAssetPrefix);
    replaceAssets(b, tmpAssetPrefix, prodAssetPrefix);
  }
  const d: ShadowDiff = { onlyInShipped: [], onlyInShadow: [], liveToDeprecated: [], deprecatedToLive: [], fieldDiffs: [] };
  const strip = (e: any) => JSON.stringify({ ...e, deprecated: undefined });
  for (const group of new Set([...Object.keys(a), ...Object.keys(b)])) {
    const am = new Map((Array.isArray(a[group]) ? a[group] : []).map(e => [String(e.id), e]));
    const bm = new Map((Array.isArray(b[group]) ? b[group] : []).map(e => [String(e.id), e]));
    for (const [id, ae] of am) {
      const be = bm.get(id);
      const key = `${group}/${id}`;
      if (!be) d.onlyInShipped.push(key);
      else if (!ae.deprecated && be.deprecated) d.liveToDeprecated.push(key);
      else if (ae.deprecated && !be.deprecated) d.deprecatedToLive.push(key);
      else if (strip(ae) !== strip(be)) d.fieldDiffs.push(key);
    }
    for (const id of bm.keys()) if (!am.has(id)) d.onlyInShadow.push(`${group}/${id}`);
  }
  return d;
}

export const isIdentical = (d: ShadowDiff) => Object.values(d).every(list => list.length === 0);

export function formatShadowLine(d: ShadowDiff, baseName: string, incomingCount: number): string {
  const scope = `base ${baseName} + ${incomingCount} git file${incomingCount === 1 ? '' : 's'}`;
  if (isIdentical(d)) return `Shadow bucket-base merge: identical to the pipeline result (${scope})`;
  return (
    `Shadow bucket-base merge differs from the pipeline result: ` +
    `${d.liveToDeprecated.length} live→deprecated, ${d.deprecatedToLive.length} deprecated→live, ` +
    `${d.onlyInShipped.length} only in the pipeline result, ${d.onlyInShadow.length} only in the shadow, ` +
    `${d.fieldDiffs.length} field diffs (${scope})`
  );
}

export async function shadowBucketBaseStep(args: {
  actionUrl: string;
  slackManager: SlackMessageManagerV2;
  staticDataPath: string;
  versions: string[];
  shipped: StaticData;
  spreadsheetData: { [group: string]: string[][] } | null;
  tmpAssetPrefix: string;
  prodAssetPrefix: string;
}): Promise<ShadowDiff | null> {
  const { actionUrl, slackManager, staticDataPath, versions, shipped, spreadsheetData, tmpAssetPrefix, prodAssetPrefix } = args;
  const skip = async (reason: string) => {
    console.log(`🔎 Shadow bucket-base merge skipped: ${reason}`);
    await slackManager.appendNewLine({ id: 'shadow-bucket-base', content: `Shadow bucket-base merge: skipped - ${reason}`, emoji: ':mag:' });
    return null;
  };
  try {
    const bucketName = process.env.GCP_BUCKET_NAME;
    if (!bucketName) return skip('GCP_BUCKET_NAME is not set');
    const bucket = buildStorage().bucket(bucketName);
    const prefix = staticDataPath.replace(/\/+$/, '') + '/';
    const [files] = await bucket.getFiles({ prefix });
    const baseName = pickBucketBase(files.map(f => f.name.slice(prefix.length)).filter(n => !n.includes('/')));
    if (!baseName) return skip('no version file in the bucket yet');

    const [buf] = await bucket.file(prefix + baseName).download();
    const base: StaticData = JSON.parse(buf.toString('utf8'));
    if (!isPipelineProduced(base)) return skip(`${baseName} in the bucket was not written by the pipeline (no deprecated keys)`);

    const incomingPaths = selectIncoming(versions, baseName);
    const incoming = incomingPaths.map(p => JSON.parse(readFileSync(p, 'utf8')) as StaticData);
    const shadow = applySheet(shadowMerge(base, incoming), spreadsheetData);
    const diff = diffStaticData(shipped, shadow, tmpAssetPrefix, prodAssetPrefix);

    const line = formatShadowLine(diff, baseName, incomingPaths.length);
    console.log(`🔎 ${line}`);
    if (!isIdentical(diff)) {
      for (const [kind, list] of Object.entries(diff)) {
        if (list.length === 0) continue;
        console.log(`   ${kind} (${list.length}): ${list.slice(0, 50).join(', ')}${list.length > 50 ? ', ...' : ''}`);
      }
    }
    await slackManager.appendNewLine({
      id: 'shadow-bucket-base',
      content: isIdentical(diff) ? line : `${line}. <${actionUrl}|Details in the log>`,
      emoji: isIdentical(diff) ? ':mag:' : ':warning:',
    });
    return diff;
  } catch (error) {
    console.log('⚠️ Shadow bucket-base merge failed:', error);
    return skip(`bucket read failed: ${describeError(error)}`);
  }
}
