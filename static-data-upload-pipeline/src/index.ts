import * as dotenv from 'dotenv';
dotenv.config();

import * as core from '@actions/core';
import { existsSync } from 'fs';
import * as path from 'path';
import {
  addedFiles,
  describeError,
  describeGameEnv,
  docsLink,
  initSlugify,
  isScopedAssetsFolder,
  readSchema,
  selectVersionFiles,
  staleAddedVersion,
} from './utils/common.utils';
import { exec } from 'child_process';
import { promisify } from 'util';
import { logger } from './utils/logger.utils';
import { ApiSchema } from './pipeline-steps/schema-validation/types';
import { runPipeline } from './run-pipeline';
import { SlackMessageManagerV2 } from './utils/slack-manager-v2.utils';
import { discoverSpreadsheetIds } from './utils/spreadsheets-discovery.utils';

const execAsync = promisify(exec);

initSlugify();

async function run() {
  // Collectd data from action inputs
  const staticDataPath = core.getInput('static_data_path');
  const gameEnvSlug = core.getInput('game_env_slug');
  const spreadsheetsFolderUrl = core.getInput('spreadsheets_folder_url');
  const tmpAssetFolder = core.getInput('tmp_assets_folder');
  const prodAssetFolder = core.getInput('prod_assets_folder');
  const dryRun = core.getInput('dry_run')?.toLowerCase() === 'true';
  const skipSchemaValidation = core.getInput('skip_schema_validation')?.toLowerCase() === 'true';
  const tests = core.getInput('game_specific_tests');
  const chanelId = core.getInput('slack_channel_id');

  if (!gameEnvSlug) {
    core.setFailed('Required input "game_env_slug" is not set.');
    return;
  }
  if (!spreadsheetsFolderUrl) {
    core.setFailed('Required input "spreadsheets_folder_url" is not set.');
    return;
  }

  // Create Slack message manager for this run
  // const slackManager = new SlackMessageManager();
  const slackManager = new SlackMessageManagerV2(chanelId);

  // A folder without its game segment (gs://cdn.mobalytics.gg/assets/) makes asset validation
  // list the whole CDN (OOM), lets any game's assets pass the "lives in this game's folder"
  // check, and a root tmp with a scoped prod would rsync the CDN into one game's folder.
  const unscoped = [tmpAssetFolder, prodAssetFolder].filter(folder => !isScopedAssetsFolder(folder));
  if (unscoped.length > 0) {
    // No angle brackets - Slack reads <...> as a link or mention.
    const message = `Assets folder must look like gs://BUCKET/assets/GAME, got: ${unscoped.map(f => `\`${f || '(empty)'}\``).join(', ')}`;
    console.log(`❌ ${message}`);
    await slackManager.sendMessage([
      { id: 'header', content: `Invalid assets folder for ${describeGameEnv(staticDataPath)}. ${message}. ${docsLink('action-inputs')}`, emoji: ':x:' },
    ]);
    core.setFailed(message);
    return;
  }

  logger.group(`🚀🚀 Run static data upload pipeline for ${staticDataPath} `);

  //log header
  console.log('ℹ️ bucket for static data:', process.env.GCP_BUCKET_NAME);
  console.log(`ℹ️ gameEnvSlug: ${gameEnvSlug}`);
  console.log(`ℹ️ spreadsheets folder: ${spreadsheetsFolderUrl}`);
  console.log('ℹ️ folder with game specific tests:', tests);
  console.log('ℹ️ folder for tmp assets:', tmpAssetFolder);
  console.log('ℹ️ folder for prod assets:', prodAssetFolder);
  console.log('ℹ️ Dry run mode enabled:', dryRun);

  const { versions: sortedFiles, malformed: malformedFiles } = selectVersionFiles(staticDataPath);

  // A static_data_v* file that doesn't parse as a version is almost always the one meant
  // to ship. Skipping it would quietly ship the previous version and report success, so
  // stop here - before spreadsheet discovery, merge and validation spend anything.
  if (malformedFiles.length > 0) {
    const names = malformedFiles.join(', ');
    // No angle brackets - Slack reads <...> as a link or mention.
    const expected = 'expected static_data_vMAJOR.MINOR.PATCH.json';
    console.log(`❌ Not a valid version file name: ${names} - ${expected}`);
    logger.endGroup();
    await slackManager.sendMessage([
      {
        id: 'header',
        content: `Invalid static data file name for ${describeGameEnv(staticDataPath)}: \`${names}\` - ${expected}. ${docsLink('static-data-file-naming')}`,
        emoji: ':x:',
      },
    ]);
    core.setFailed(`Not a valid version file name: ${names} - ${expected}`);
    return;
  }

  // Versions are numbered by hand. A new file that sorts below an existing one is merged as
  // history, so the run would go green and ship without it. The check fails open: a GitHub API
  // hiccup must not block a release.
  try {
    const stale = staleAddedVersion((await addedFiles(core.getInput('token'))) ?? [], staticDataPath, sortedFiles);
    if (stale) {
      const message = `${stale.added} was added, but ${stale.newest} is newer, so the new file would be merged as history and not ship. Give it a version above ${stale.newest}`;
      console.log(`❌ ${message}`);
      logger.endGroup();
      await slackManager.sendMessage([
        { id: 'header', content: `Static data version is not the newest for ${describeGameEnv(staticDataPath)}: ${message}. ${docsLink('static-data-file-naming')}`, emoji: ':x:' },
      ]);
      core.setFailed(message);
      return;
    }
  } catch (error) {
    console.log(`⚠️ Could not check which version file this change adds: ${describeError(error)}`);
  }

  const apiSchemaPath = path.join(staticDataPath, 'schema.json');
  let apiSchema: ApiSchema | null = null;

  // Read schema.json from the staticDataPath if it exists
  if (existsSync(apiSchemaPath)) {
    apiSchema = readSchema(apiSchemaPath);
    console.log(`ℹ️ Found schema.json at: ${apiSchemaPath}`);
  } else {
    console.log(`⚠️ schema.json not found in ${staticDataPath}`);
  }

  logger.endGroup();

  let overrideSpreadsheetId: string;
  let reportSpreadsheetId: string;
  try {
    ({ overrideSpreadsheetId, reportSpreadsheetId } = await discoverSpreadsheetIds(
      gameEnvSlug,
      spreadsheetsFolderUrl,
    ));
  } catch (error) {
    core.setFailed(`Spreadsheet discovery failed: ${error}`);
    return;
  }

  await runPipeline({
    versions: sortedFiles,
    staticDataPath,
    overrideSpreadsheetId,
    reportSpreadsheetId,
    tmpAssetFolder,
    prodAssetFolder,
    testsDir: tests,
    dryRun,
    slackManager,
    apiSchema,
    apiSchemaPath,
    skipSchemaValidation,
  });
}

run();
