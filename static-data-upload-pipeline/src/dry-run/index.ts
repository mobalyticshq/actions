import * as core from '@actions/core';
import * as github from '@actions/github';
import { readdirSync, readFileSync, existsSync } from 'fs';
import * as path from 'path';
import { StaticDataConfig } from '../types';
import { gameIconsMap, gameNamesMap, initSlugify } from '../utils';
import { logColors, logger } from '../logger';
import { SlackMessageManager } from '../utils/slack-manager.utils';
import { mergeStaticDataStep } from '../steps/merge-static-data';
import { overrideStaticData } from '../steps/override-static-data';
import { validateStaticData } from '../steps/validate-static-data';
import { createReportStep } from '../steps/create-report';

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
      `Start game static data update pipeline for ${versions[versions.length - 1]}\nℹ️ Action:${actionsUrl}`,
    );
  } else {
    await slackManager.sendOrUpdate(
      `DRY RUN pipeline for ${version} ${gameNamesMap[gameSlug]} ${gameIconsMap[gameSlug]} ${environment}`,
      ':test_tube:',
    );
    await slackManager.sendOrUpdate(`<${actionsUrl}|View action Details>\n`, ':information_source:', true);
  }

  const tmpAssetPrefix = tmpAssetFolder.replace('gs://', 'https://');
  const prodAssetPrefix = prodAssetFolder.replace('gs://', 'https://');

  try {
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
    let { overridedData } = await overrideStaticData(slackManager, overrideSpreadsheetId, staticData);
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

    if (errors == 0) {
      if (dryRun) {
        logger.group('✅ Static data is valid!');
        await slackManager.sendOrUpdate(
          `Static data is valid! Dry run completed. <${actionsUrl}|View Details>`,
          ':white_check_mark:',
          true,
        );
        return;
      }
    } else {
      console.log('❌ Static data is not valid!');
      await slackManager.sendOrUpdate(
        `Static data ${versions[versions.length - 1]} is not valid. Static data dry run failed. <${actionsUrl}|View Details>`,
        ':x:',
        true,
      );
    }
  } catch (error) {
    console.log(`⚠️ Error during pipeline ${error}`);
    await slackManager.sendOrUpdate(
      `Error during static data pipeline dry run for ${versions[versions.length - 1]} error:${error} <${actionsUrl}|View Details>`,
      ':warning:',
      true,
    );
  }
}

async function run() {
  // Create Slack message manager for this run
  const slackManager = new SlackMessageManager();

  const context = github.context;
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

  const token = core.getInput('token');
  const octokit = github.getOctokit(token);

  const sha = context.sha;
  const { owner, repo } = context.repo;

  const response = await octokit.rest.repos.getCommit({
    owner,
    repo,
    ref: sha,
  });

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

    if (sortedFiles.length > 0) {
      await runPipeline(
        sortedFiles,
        staticDataPath,
        overrideSpreadsheetId,
        reportSpreadsheetId,
        tmpAssetFolder,
        prodAssetFolder,
        tests,
        true,
        slackManager,
      );
    }
  } else {
    console.log(`❌ There is no static data files in ${staticDataPath}`);
  }
}

run();
