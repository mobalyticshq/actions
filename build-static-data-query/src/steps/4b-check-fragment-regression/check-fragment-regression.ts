import * as fs from 'fs';
import * as path from 'path';
import * as core from '@actions/core';
import { Bucket } from '@google-cloud/storage';
import { buildSchema } from 'graphql';
import { DynamicModuleSlug } from '@shared/types/dynamic-modules.types';
import { buildStaticDataQueryModuleFolderPath } from '../../utils/module-folder.utils';
import {
  checkGrowth,
  collectFragmentPaths,
  compareFragments,
  extractGqlFromFragmentFile,
  summariseDropped,
  type FragmentComparison,
  type FragmentInfo,
  type GrowthCheck,
  type GrowthLimits,
} from './fragment-paths';

export interface GuardFragmentRegressionOptions {
  bucket: Bucket;
  env: string;
  gameUrlSlug: string;
  /** Version the live config.json points to. When absent there is nothing to compare against. */
  liveSchemaVersion?: string;
  disableQueryAst: boolean;
  /** How many times to regenerate the fragments when a regression or over-growth is found. */
  retries: number;
  /** How much larger and deeper than the live fragments the new ones may be. */
  growthLimits: GrowthLimits;
  /** Publish anyway when the problem persists after the retries. */
  allowRegression: boolean;
  /** Regenerates the fragments into build/gql (step 4). */
  regenerate: () => Promise<void>;
}

const FRAGMENT_SUFFIX = '-fragment.gql.ts';
const buildGqlPath = path.resolve(process.cwd(), 'build', 'gql');
const cleanedSchemaPath = path.resolve(process.cwd(), '_generated', 'cleaned-schema.graphql');

function parseFragmentFile(fileName: string, source: string): FragmentInfo[] {
  try {
    return collectFragmentPaths(extractGqlFromFragmentFile(source));
  } catch (error) {
    throw new Error(`Cannot parse fragment file ${fileName}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function loadLiveFragments(
  bucket: Bucket,
  env: string,
  gameUrlSlug: string,
  liveSchemaVersion: string,
  disableQueryAst: boolean,
): Promise<FragmentInfo[]> {
  const slug = disableQueryAst ? DynamicModuleSlug.STATIC_DATA_QUERY_V2 : DynamicModuleSlug.STATIC_DATA_QUERY;
  const prefix = `${buildStaticDataQueryModuleFolderPath(env, gameUrlSlug, liveSchemaVersion, slug)}/fragments/`;
  core.info(`Live fragments: gs://${bucket.name}/${prefix}`);

  const [files] = await bucket.getFiles({ prefix });
  const fragments: FragmentInfo[] = [];
  for (const file of files.filter(f => f.name.endsWith(FRAGMENT_SUFFIX))) {
    const [contents] = await file.download();
    fragments.push(...parseFragmentFile(path.basename(file.name), contents.toString('utf8')));
  }
  return fragments;
}

function loadGeneratedFragments(): FragmentInfo[] {
  if (!fs.existsSync(buildGqlPath)) {
    return [];
  }
  return fs
    .readdirSync(buildGqlPath)
    .filter(name => name.endsWith(FRAGMENT_SUFFIX))
    .flatMap(name => parseFragmentFile(name, fs.readFileSync(path.join(buildGqlPath, name), 'utf8')));
}

function removeGeneratedFragments(): void {
  if (!fs.existsSync(buildGqlPath)) {
    return;
  }
  for (const name of fs.readdirSync(buildGqlPath).filter(n => n.endsWith(FRAGMENT_SUFFIX))) {
    fs.unlinkSync(path.join(buildGqlPath, name));
  }
}

function report(comparison: FragmentComparison, growth: GrowthCheck): void {
  const { regressions, schemaRemovals, beyondOneLevel, droppedHelperFragments, addedCount } = comparison;
  core.info(
    `Fields: live ${growth.live.fields}, new ${growth.fresh.fields} (${addedCount} added) - max depth: live ${growth.live.maxDepth}, new ${growth.fresh.maxDepth}`,
  );
  if (schemaRemovals.length > 0) {
    core.info(`Fields dropped because the schema no longer has them (allowed): ${schemaRemovals.length}`);
    summariseDropped(schemaRemovals).forEach(line => core.info(`  ${line}`));
  }
  if (beyondOneLevel.length > 0) {
    core.info(`Fields dropped from deeper than one level of linked entities (allowed): ${beyondOneLevel.length}`);
    summariseDropped(beyondOneLevel).forEach(line => core.info(`  ${line}`));
  }
  if (droppedHelperFragments.length > 0) {
    core.info(`Fragments on embedded types not regenerated (allowed): ${droppedHelperFragments.sort().join(', ')}`);
  }
  if (regressions.length > 0) {
    core.warning(`Fields dropped that the schema still has: ${regressions.length}`);
    summariseDropped(regressions).forEach(line => core.warning(`  ${line}`));
  }
  if (growth.tooManyFields) {
    core.warning(`New fragments select ${growth.fresh.fields} fields, more than the allowed multiple of the live ${growth.live.fields}`);
  }
  if (growth.tooDeep) {
    core.warning(`New fragments nest ${growth.fresh.maxDepth} levels deep, against ${growth.live.maxDepth} live`);
  }
}

function describeProblems(comparison: FragmentComparison, growth: GrowthCheck): string[] {
  const problems: string[] = [];
  if (comparison.regressions.length > 0) {
    problems.push(`drop ${comparison.regressions.length} field(s) that the schema still has`);
  }
  if (growth.tooManyFields) {
    problems.push(`select ${growth.fresh.fields} fields against ${growth.live.fields} live`);
  }
  if (growth.tooDeep) {
    problems.push(`nest ${growth.fresh.maxDepth} levels deep against ${growth.live.maxDepth} live`);
  }
  return problems;
}

/**
 * Compares the fragments step 4 just generated with the fragments that are live, and catches the
 * generator going wrong in either direction:
 *   - narrower: dropping fields the schema still has (a linked type cut down to slug/id/name)
 *   - larger:   expanding linked types far deeper, into a query the GraphQL server rejects
 * Either way, regenerate up to `retries` times, then fail before anything is uploaded, so the live
 * query (and every tooltip built on it) is never replaced by a broken one.
 */
export async function guardFragmentRegression(options: GuardFragmentRegressionOptions): Promise<void> {
  const {
    bucket,
    env,
    gameUrlSlug,
    liveSchemaVersion,
    disableQueryAst,
    retries,
    growthLimits,
    allowRegression,
    regenerate,
  } = options;

  if (!liveSchemaVersion) {
    core.info('No live query to compare against - skipping the fragment check');
    return;
  }

  const live = await loadLiveFragments(bucket, env, gameUrlSlug, liveSchemaVersion, disableQueryAst);
  if (live.length === 0) {
    core.info(`No live fragments found for version ${liveSchemaVersion} - skipping the fragment check`);
    return;
  }

  const schema = buildSchema(fs.readFileSync(cleanedSchemaPath, 'utf8'), { assumeValidSDL: true });
  core.info(`Comparing against ${live.length} live fragments (version ${liveSchemaVersion})`);

  for (let attempt = 0; ; attempt++) {
    const fresh = loadGeneratedFragments();
    const comparison = compareFragments(live, fresh, schema);
    const growth = checkGrowth(live, fresh, growthLimits);
    report(comparison, growth);

    const problems = describeProblems(comparison, growth);
    if (problems.length === 0) {
      core.info('✓ Fragments are neither narrower nor much larger than the live ones');
      return;
    }

    if (attempt < retries) {
      core.warning(`Regenerating fragments (retry ${attempt + 1}/${retries})`);
      removeGeneratedFragments();
      await regenerate();
      continue;
    }

    const message = `Generated fragments ${problems.join(' and ')}, after ${retries} retr${retries === 1 ? 'y' : 'ies'}.`;
    if (allowRegression) {
      core.warning(`${message} Publishing anyway because allow-fragment-regression is set.`);
      return;
    }
    throw new Error(`${message} Not publishing - the live query stays in place.`);
  }
}
