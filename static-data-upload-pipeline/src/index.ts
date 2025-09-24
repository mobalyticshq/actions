import * as core from '@actions/core';
import { readdirSync, readFileSync, existsSync } from 'fs';
import * as path from 'path';
import { StaticDataConfig } from './types';
import { gameIconsMap, gameNamesMap, initSlugify } from './utils';
import { exec } from 'child_process';
import { promisify } from 'util';
import { logColors, logger } from './logger';
import { SlackMessageManager } from './utils/slack-manager.utils';
import { mergeStaticDataStep } from './steps/merge-static-data';
import { overrideStaticData } from './steps/override-static-data';
import { validateStaticData } from './steps/validate-static-data';
import { createReportStep } from './steps/create-report';
import { syncStaticData } from './steps/sync-static-data';
import { schemaValidationStep } from './steps/schema-validation';

const execAsync = promisify(exec);

initSlugify();

async function runPipeline(
  versions: Array<string>,
  staticDataPath: string,
  overrideSpreadsheetId: string,
  reportSpreadsheetId: string,
  tmpAssetFolder: string,
  prodAssetFolder: string,
  testsDir: string,
  dryRun: Boolean,
  slackManager: SlackMessageManager,
  schemaPath: string,
) {
  logger.group(`🚀 Run pipeline for:\n ${logColors.green}${versions}${logColors.reset}`);

  console.log(`ℹ️ Newest version is ${versions[versions.length - 1]}`);
  console.log(`ℹ️ Oldest version is ${versions[0]}`);
  console.log(`ℹ️ Spreadsheest ID for override ${overrideSpreadsheetId} `);
  console.log(`ℹ️ Spreadsheest ID for report ${overrideSpreadsheetId} `);

  const repo = process.env.GITHUB_REPOSITORY;
  const runId = process.env.GITHUB_RUN_ID;

  const actionsUrl = `https://github.com/${repo}/actions/runs/${runId}`;
  const gameSlug = versions[versions.length - 1].split('/')[0];
  const environment = versions[versions.length - 1].split('/')[1].toUpperCase();
  const version = versions[versions.length - 1].split('/').at(-1);

  // Reset Slack message manager for new pipeline run
  slackManager.reset();

  if (!dryRun) {
    await slackManager.sendOrUpdate(
      `RUN pipeline for ${version} ${gameNamesMap[gameSlug]} ${gameIconsMap[gameSlug]} ${environment}`,
      ':rocket:',
    );
    await slackManager.sendOrUpdate(`<${actionsUrl}|View action Details>\n`, ':information_source:', true);
  } else {
    await slackManager.sendOrUpdate(
      `DRY RUN pipeline for ${version} ${gameIconsMap[gameSlug]} ${environment}`,
      ':test_tube:',
    );
    await slackManager.sendOrUpdate(`<${actionsUrl}|View action Details>\n`, ':information_source:', true);
  }

  const tmpAssetPrefix = tmpAssetFolder.replace('gs://', 'https://');
  const prodAssetPrefix = prodAssetFolder.replace('gs://', 'https://');

  try {
    // Schema validation step
    if (schemaPath) {
      const schemaValidationResult = await schemaValidationStep(slackManager, schemaPath, staticDataPath);
      if (!schemaValidationResult.success) {
        throw new Error(`Schema validation failed: ${schemaValidationResult.error}`);
      }
      console.log('');
    }

    let configDir = path.dirname(versions[0]);
    let gameConfig = '';
    let scheme = '';
    let config = {} as StaticDataConfig;

    if (await existsSync(path.join(configDir, 'schema.json'))) {
      scheme = path.join(configDir, 'schema.json');
    }

    for (let i = 0; i < 3; ++i) {
      if (await existsSync(path.join(configDir, 'config.json'))) {
        gameConfig = path.join(configDir, 'config.json');
        break;
      }
      configDir = path.join(configDir, '../');
    }
    if (gameConfig.length == 0) {
      console.log(`❌ Can't find game config for ${versions[0]}`);
    } else {
      console.log(`ℹ️ Game config  ${gameConfig}`);
      config = JSON.parse(readFileSync(gameConfig, 'utf8'));
    }
    logger.endGroup();
    console.log('');

    // Merge static data files step
    let { staticData, oldData } = await mergeStaticDataStep(slackManager, versions);
    console.log('');

    // Override static data by spreadsheets step
    let { overridedData, spreadsheetData, spreadsheetReport } = await overrideStaticData(
      slackManager,
      overrideSpreadsheetId,
      staticData,
    );
    console.log('');

    // Validate static data step
    const { errors, warnings, infos, reports } = await validateStaticData(
      slackManager,
      overridedData,
      oldData,
      config,
      testsDir,
      tmpAssetPrefix,
    );

    // If errors or warnings or infos - create report
    if (errors > 0 || warnings > 0 || infos > 0) {
      await createReportStep(slackManager, reports, reportSpreadsheetId, errors, warnings, infos);
    } else {
      await slackManager.sendOrUpdate(`WOW!!! No errors, warnings or infos in static data`, ':gandalf:', true, true);
    }

    console.log('');
    if (errors == 0) {
      await syncStaticData(
        slackManager,
        versions,
        overridedData,
        spreadsheetData,
        tmpAssetFolder,
        tmpAssetPrefix,
        prodAssetFolder,
        prodAssetPrefix,
        overrideSpreadsheetId,
        staticData,
        gameConfig,
        scheme,
      );
    }
  } catch (error) {
    console.log(`⚠️ Error during pipeline ${error}`);
    await slackManager.sendOrUpdate(
      `Error during static data update pipeline for ${versions[versions.length - 1]} error:${error} `,
      ':warning:',
      true,
    );
  }
}

async function run() {
  // Create Slack message manager for this run
  const slackManager = new SlackMessageManager();

  const staticDataPath = core.getInput('static_data_path');
  const overrideSpreadsheetId = core.getInput('override_spreadsheet_id');
  const reportSpreadsheetId = core.getInput('report_spreadsheet_id');
  const tmpAssetFolder = core.getInput('tmp_assets_folder');
  const prodAssetFolder = core.getInput('prod_assets_folder');
  const dryRun = core.getInput('dry_run')?.toLowerCase() === 'true';

  const tests = core.getInput('game_specific_tests');

  logger.group(`🚀🚀 Run static data upload pipeline for ${staticDataPath} `);

  //log header
  console.log('ℹ️ bucket for static data:', process.env.GCP_BUCKET_NAME);
  console.log('ℹ️ spreadsheetId for override:', overrideSpreadsheetId);
  console.log('ℹ️ spreadsheetId for report:', reportSpreadsheetId);
  console.log('ℹ️ folder with game specific tests:', tests);
  console.log('ℹ️ folder for tmp assets:', tmpAssetFolder);
  console.log('ℹ️ folder for prod assets:', prodAssetFolder);
  console.log('ℹ️ Dry run:', dryRun);

  const pattern = /static_data_v\d+.\d+.\d+.json/;

  logger.endGroup();

  const files = readdirSync(staticDataPath);
  const versionedFiles = new Array<string>();
  files.forEach(filename => {
    if (!pattern.test(filename)) return null;
    versionedFiles.push(path.join(staticDataPath, filename));
  });

  const sortedFiles = versionedFiles
    .map(a => a.replace(/\d+/g, n => '' + (Number(n) + 10000)))
    .sort()
    .map(a => a.replace(/\d+/g, n => '' + (Number(n) - 10000)));

  if (sortedFiles.length > 0) {
    //newest version added

    // Читаем schema.json файл из staticDataPath
    const schemaPath = path.join(staticDataPath, 'schema.json');
    let schemaFilePath = '';
    
    if (existsSync(schemaPath)) {
      schemaFilePath = schemaPath;
      console.log(`ℹ️ Found schema.json at: ${schemaPath}`);
    } else {
      console.log(`⚠️ schema.json not found in ${staticDataPath}`);
    }

    if (sortedFiles.length > 0) {
      await runPipeline(
        sortedFiles,
        staticDataPath,
        overrideSpreadsheetId,
        reportSpreadsheetId,
        tmpAssetFolder,
        prodAssetFolder,
        tests,
        dryRun,
        slackManager,
        schemaFilePath,
      );
    }
  } else {
    console.log(`❌ There is no static data files in ${staticDataPath}`);
  }
}

run();
