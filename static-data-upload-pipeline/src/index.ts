import * as core from '@actions/core';
import { existsSync, readdirSync } from 'fs';
import * as path from 'path';
import { initSlugify, readSchema } from './utils/common.utils';
import { exec } from 'child_process';
import { promisify } from 'util';
import { logger } from './utils/logger.utils';
import { ApiSchema } from './pipeline-steps/schema-validation/types';
import { runPipeline } from './run-pipeline';
import { SlackMessageManagerV2 } from './utils/slack-manager-v2.utils';

const execAsync = promisify(exec);

initSlugify();

async function run() {
  // Create Slack message manager for this run
  // const slackManager = new SlackMessageManager();
  const slackManager = new SlackMessageManagerV2();

  // Collectd data from action inputs
  const staticDataPath = core.getInput('static_data_path');
  const overrideSpreadsheetId = core.getInput('override_spreadsheet_id');
  const reportSpreadsheetId = core.getInput('report_spreadsheet_id');
  const tmpAssetFolder = core.getInput('tmp_assets_folder');
  const prodAssetFolder = core.getInput('prod_assets_folder');
  const dryRun = core.getInput('dry_run')?.toLowerCase() === 'true';
  const skipSchemaValidation = core.getInput('skip_schema_validation')?.toLowerCase() === 'true';
  const tests = core.getInput('game_specific_tests');

  logger.group(`🚀🚀 Run static data upload pipeline for ${staticDataPath} `);

  //log header
  console.log('ℹ️ bucket for static data:', process.env.GCP_BUCKET_NAME);
  console.log(`ℹ️ [Override Spreadsheet](https://docs.google.com/spreadsheets/d/${overrideSpreadsheetId}/edit)`);
  // console.log('ℹ️ spreadsheetId for override:', overrideSpreadsheetId);
  console.log(`ℹ️ [Spreadsheet for report](https://docs.google.com/spreadsheets/d/${reportSpreadsheetId}/edit)`);
  // console.log('ℹ️ spreadsheetId for report:', reportSpreadsheetId);
  console.log('ℹ️ folder with game specific tests:', tests);
  console.log('ℹ️ folder for tmp assets:', tmpAssetFolder);
  console.log('ℹ️ folder for prod assets:', prodAssetFolder);
  console.log('ℹ️ Dry run mode enabled:', dryRun);

  const pattern = /static_data_v\d+.\d+.\d+.json/;
  const versionedFiles = new Array<string>();
  // Read all files from staticDataPath that match the pattern
  const files = readdirSync(staticDataPath);
  files.forEach(filename => {
    if (!pattern.test(filename)) return null;
    versionedFiles.push(path.join(staticDataPath, filename));
  });

  const sortedFiles = versionedFiles
    .map(a => a.replace(/\d+/g, n => '' + (Number(n) + 10000)))
    .sort()
    .map(a => a.replace(/\d+/g, n => '' + (Number(n) - 10000)));


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
