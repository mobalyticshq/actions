import * as core from '@actions/core';
import * as github from '@actions/github';
import { readdirSync, readFileSync, existsSync } from 'fs';
import * as path from 'path';
import { isValidDataForMerge, mergeStaticData } from '../merge';
import { mergeWithSpreadsheets } from '../spreadsheets';
import { validate } from '../validation';
import { createReport } from '../report';
import { StaticData, StaticDataConfig, ValidationReport } from '../types';
import { initSlugify, sendSlack, slugify } from '../utils';
import { logColors, logger } from '../logger';

initSlugify();

function isValidReport(reports: ValidationReport[]) {
  let errors = 0,
    warnings = 0,
    infos = 0;
  for (const report of reports) {
    for (const error of Object.keys(report.errors)) {
      if (report.errors[error].size > 0)
        console.log(
          `⚠️${logColors.yellow} ${error} ${logColors.blue} ${Array.from(report.errors[error])} ${logColors.reset}`,
        );
      errors += report.errors[error].size;
    }
    for (const warning of Object.keys(report.warnings)) {
      if (report.warnings[warning].size > 0)
        console.log(
          `❗${logColors.yellow} ${warning} ${logColors.blue} ${Array.from(report.warnings[warning])} ${logColors.reset}`,
        );
      warnings += report.warnings[warning].size;
    }
    for (const info of Object.keys(report.infos)) {
      if (report.infos[info].size > 0)
        console.log(
          `ℹ️ ${logColors.yellow} ${info} ${logColors.blue} ${Array.from(report.infos[info])} ${logColors.reset}`,
        );
      infos += report.infos[info].size;
    }

    for (const group of Object.keys(report.byGroup)) {
      const errorsSet = new Set<string>();
      const errorFields = new Set<string>();

      for (const ent of report.byGroup[group]) {
        for (const error of Object.keys(ent.errors)) {
          if (ent.errors[error].size > 0) {
            errorsSet.add(error);
            for (const field of ent.errors[error]) errorFields.add(field);
          }
          errors += ent.errors[error].size;
        }
        for (const warinig of Object.keys(ent.warnings)) warnings += ent.warnings[warinig].size;
        for (const info of Object.keys(ent.infos)) {
          infos += ent.infos[info].size;
        }
      }
      if (errorsSet.size > 0) {
        console.log(
          `⚠️For group ${logColors.green}${group}${logColors.reset} errors:\n${logColors.yellow}[${Array.from(errorsSet)}]\n in fields:\n${logColors.blue}[${Array.from(errorFields)}}]${logColors.reset}`,
        );
      }
    }
  }
  return { errors, warnings, infos };
}

async function runPipeline(
  versions: Array<string>,
  staticDataPath: string,
  overrideSpreadsheetId: string,
  reportSpreadsheetId: string,
  tmpAssetFolder: string,
  prodAssetFolder: string,
  testsDir: string,
  dryRun: Boolean,
) {
  logger.group(`🚀 Run pipeline for:\n ${logColors.green}${versions}${logColors.reset}`);

  console.log(`ℹ️ Newest version is ${versions[versions.length - 1]}`);
  console.log(`ℹ️ Oldest version is ${versions[0]}`);
  console.log(`ℹ️ Spreadsheest ID for override ${overrideSpreadsheetId} `);
  console.log(`ℹ️ Spreadsheest ID for report ${overrideSpreadsheetId} `);

  const repo = process.env.GITHUB_REPOSITORY;
  const runId = process.env.GITHUB_RUN_ID;

  const actionsUrl = `https://github.com/${repo}/actions/runs/${runId}`;

  if (!dryRun)
    await sendSlack(
      `🚀 Start game static data update pipeline for ${versions[versions.length - 1]}\nℹ️ Action:${actionsUrl}`,
    );
  else
    await sendSlack(
      `🚀 Start game static data dry run pipeline for ${versions[versions.length - 1]}\nℹ️ Action:${actionsUrl}`,
    );

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
    logger.group(`✍ Merge static data files `);
    let staticData = {} as StaticData,
      oldData = {} as StaticData;
    for (let i = 0; i < versions.length; ++i) {
      const data = JSON.parse(readFileSync(versions[i], 'utf8'));
      //not for latest data skip invalid data files
      if (i < versions.length - 1 && !isValidDataForMerge(data)) {
        console.log(`❗Skip: ${logColors.yellow} ${versions[i]} is not valid for merge ${logColors.reset}`);
        continue;
      }
      console.log(`✍ Merge: ${logColors.green} ${versions[i]} ${logColors.reset}`);
      oldData = structuredClone(staticData);
      staticData = mergeStaticData(data, staticData);
    }
    logger.endGroup();

    console.log('');
    logger.group('📊 Override static data by spreadsheets');
    // Overrided data is the data that is overridden by spreadsheets and should be uploaded to the bucket
    const { overridedData, spreadsheetReport, spreadsheetData } = await mergeWithSpreadsheets(
      overrideSpreadsheetId,
      staticData,
    );
    logger.endGroup();

    logger.group(`🔍 Overrided charecters value \n ${JSON.stringify(overridedData['characters'][0])}`);

    console.log('');
    logger.group('🔍 Validate final static data ');
    const reports = new Array<ValidationReport>();
    const commonReport = await validate(overridedData, oldData, config, tmpAssetPrefix);
    reports.push(commonReport);
    reports.push(...(await runValidationExtensions(testsDir, overridedData, oldData)));

    const { errors, warnings, infos } = isValidReport(reports);

    console.log(`⚠️ Errors:${errors}`);
    console.log(`❗ Warnings:${warnings}`);
    console.log(`ℹ️ Infos:${infos}`);
    logger.endGroup();

    if (errors > 0 || warnings > 0 || infos > 0) {
      console.log('');
      logger.group(`📊 Create Mistakes Report: https://docs.google.com/spreadsheets/d/${reportSpreadsheetId}`);
      const reportDone = await createReport(reports, reportSpreadsheetId);

      let slackMsg = `Mistakes Report: `;
      slackMsg += `❗ - errors:${errors}  `;
      slackMsg += `⚠️ - warnings:${warnings}  `;
      slackMsg += `ℹ️ - infos:${infos}`;

      if (reportDone) {
        console.log('✅ Mistakes Report done');
        await sendSlack(`${slackMsg}\n https://docs.google.com/spreadsheets/d/${reportSpreadsheetId}`);
      } else {
        console.log('⚠️ Can`t create spreadsheetreport');
        await sendSlack(
          `⚠️ Can't create Mistakes Report https://docs.google.com/spreadsheets/d/${reportSpreadsheetId}`,
        );
      }
      logger.endGroup();
    } else {
      await sendSlack(`✅ No errors,warnings or infos in static data`);
    }

    console.log('');
    if (errors == 0) {
      if (dryRun) {
        logger.group('✅ Static data is valid!');
        return;
      }
    } else {
      console.log('❌ Static data is not valid!');
      await sendSlack(`❌ Static data ${versions[versions.length - 1]} is not valid. Static data dry run failed`);
    }
  } catch (error) {
    console.log(`⚠️ Error during pipeline ${error}`);
    await sendSlack(
      `⚠️ Error during static data pipeline dry run for ${versions[versions.length - 1]} error:${error} `,
    );
  }
}

async function runValidationExtensions(extensionsDir: string, data: StaticData, oldData: StaticData) {
  const reports = new Array<ValidationReport>();
  try {
    const files = readdirSync(extensionsDir).filter(f => f.endsWith('.js'));

    for (const file of files) {
      const test = require(path.join(extensionsDir, file));
      reports.push(await test(data, oldData));
    }
  } catch (error) {
    console.log(`⚠️ unable execute game specific test:${error}`);
  }
  return reports;
}

async function run() {
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
      );
    }
  } else {
    console.log(`❌ There is no static data files in ${staticDataPath}`);
  }
}

run();
