import * as fs from 'fs';
import * as path from 'path';
import * as core from '@actions/core';
import { Bucket } from '@google-cloud/storage';
import { buildSchema } from 'graphql';
import { DynamicModuleSlug } from '@shared/types/dynamic-modules.types';
import { buildStaticDataQueryModuleFolderPath } from '../../utils/module-folder.utils';
import {
  collectFragmentPaths,
  compareFragments,
  extractGqlFromFragmentFile,
  summariseDropped,
  type FragmentComparison,
  type FragmentInfo,
} from './fragment-paths';

export interface GuardFragmentRegressionOptions {
  bucket: Bucket;
  env: string;
  gameUrlSlug: string;
  /** Version the live config.json points to. When absent there is nothing to compare against. */
  liveSchemaVersion?: string;
  disableQueryAst: boolean;
  /** How many times to regenerate the fragments when a regression is found. */
  retries: number;
  /** Publish anyway when the regression persists after the retries. */
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

function report(comparison: FragmentComparison): void {
  const { regressions, schemaRemovals, addedCount } = comparison;
  core.info(`Fields added: ${addedCount}`);
  if (schemaRemovals.length > 0) {
    core.info(`Fields dropped because the schema no longer has them (allowed): ${schemaRemovals.length}`);
    summariseDropped(schemaRemovals).forEach(line => core.info(`  ${line}`));
  }
  if (regressions.length > 0) {
    core.warning(`Fields dropped that the schema still has: ${regressions.length}`);
    summariseDropped(regressions).forEach(line => core.warning(`  ${line}`));
  }
}

/**
 * Compares the fragments step 4 just generated with the fragments that are live. If the new ones
 * drop fields the schema still has - the generator selecting less from a linked type than it did
 * before - regenerate up to `retries` times, then fail before anything is uploaded, so the live
 * query (and every tooltip built on it) is never replaced by a narrower one.
 */
export async function guardFragmentRegression(options: GuardFragmentRegressionOptions): Promise<void> {
  const { bucket, env, gameUrlSlug, liveSchemaVersion, disableQueryAst, retries, allowRegression, regenerate } =
    options;

  if (!liveSchemaVersion) {
    core.info('No live query to compare against - skipping the regression check');
    return;
  }

  const live = await loadLiveFragments(bucket, env, gameUrlSlug, liveSchemaVersion, disableQueryAst);
  if (live.length === 0) {
    core.info(`No live fragments found for version ${liveSchemaVersion} - skipping the regression check`);
    return;
  }

  const schema = buildSchema(fs.readFileSync(cleanedSchemaPath, 'utf8'), { assumeValidSDL: true });
  core.info(`Comparing against ${live.length} live fragments (version ${liveSchemaVersion})`);

  for (let attempt = 0; ; attempt++) {
    const comparison = compareFragments(live, loadGeneratedFragments(), schema);
    report(comparison);

    if (comparison.regressions.length === 0) {
      core.info('✓ No fragment regressions');
      return;
    }

    if (attempt < retries) {
      core.warning(`Regenerating fragments (retry ${attempt + 1}/${retries})`);
      removeGeneratedFragments();
      await regenerate();
      continue;
    }

    const message =
      `Generated fragments drop ${comparison.regressions.length} field(s) that the schema still has, ` +
      `after ${retries} retr${retries === 1 ? 'y' : 'ies'}.`;
    if (allowRegression) {
      core.warning(`${message} Publishing anyway because allow-fragment-regression is set.`);
      return;
    }
    throw new Error(`${message} Not publishing - the live query stays in place.`);
  }
}
