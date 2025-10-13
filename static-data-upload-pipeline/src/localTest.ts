import { readdirSync, readFileSync, existsSync, writeFileSync } from 'fs';
import * as path from 'path';
import { StaticData, StaticDataConfig, ValidationReport } from './types';
import { logColors } from './utils/logger.utils';
import { mergeStaticData } from './utils/merge.utils';
import { mergeWithSpreadsheets, updateSpreadsheets } from './utils/spreadsheets.utils';

import { validate } from './pipeline-steps/validate-static-data/utils';
import { validateStaticDataStep } from './pipeline-steps/validate-static-data/validate-static-data-step';
import { isValidReport } from './utils/is-valid-report.utils';
import { readSchema } from './utils/common.utils';
import { ApiSchema } from './pipeline-steps/schema-validation/types';
import { MessageLine, SlackMessageManagerV2 } from './utils/slack-manager-v2.utils';

async function run() {
  const overrideSpreadsheetId = '1I76ZyGFHA9JCr5lSMBK2zJaPpqZ1xb4F5M_wQxKAvSI';
  const tmpBucket = 'https://cdn.mobalytics.gg/assets/the-bazaar';
  const dirName = '/Users/alexmittsel/WORK/ngf-configuration/the-bazaar/dev/static_data_v2';
  const schemaPath = '/Users/alexmittsel/WORK/ngf-configuration/the-bazaar/dev/static_data_v2/schema.json';
  const apiSchema = readSchema(schemaPath);

  const pattern = /static_data_v\d+.\d+.\d+.json/;

  const slackManager = new SlackMessageManagerV2();



  const files = readdirSync(dirName);
  const versionedFiles = new Array<string>();
  files.forEach(filename => {
    if (!pattern.test(filename)) return null;
    versionedFiles.push(path.join(dirName, filename));
  });
  const sortedFiles = versionedFiles
    .map(a => a.replace(/\d+/g, n => '' + (Number(n) + 10000)))
    .sort()
    .map(a => a.replace(/\d+/g, n => '' + (Number(n) - 10000)));

  console.log(sortedFiles);

  console.log(`[Override Spreadsheet](https://docs.google.com/spreadsheets/d/${overrideSpreadsheetId}/edit)`);

  let configDir = path.dirname(sortedFiles[0]);
  let gameConfig = '';
  let config = {} as StaticDataConfig;

  for (let i = 0; i < 3; ++i) {
    if (await existsSync(path.join(configDir, 'config.json'))) {
      gameConfig = path.join(configDir, 'config.json');
      break;
    }
    configDir = path.join(configDir, '../');
  }

  if (gameConfig.length == 0) {
    console.log(`❌ Can't find game config for ${sortedFiles[0]}`);
  } else {
    console.log(`ℹ️ Game config  ${gameConfig}`);
    config = JSON.parse(readFileSync(gameConfig, 'utf8'));
  }

  let staticData = {} as StaticData,
    oldData = {} as StaticData;

  for (let i = 0; i < sortedFiles.length; ++i) {
    console.log(`✍ Merge ${logColors.green} ${sortedFiles[i]} ${logColors.reset}`);
    const data = JSON.parse(readFileSync(sortedFiles[i], 'utf8'));
    staticData = mergeStaticData(data, staticData);
    if (i == sortedFiles.length - 2) oldData = structuredClone(staticData);
  }

  const { overridedData, spreadsheetData } = await mergeWithSpreadsheets('', slackManager, overrideSpreadsheetId, staticData);

  const reports = new Array<ValidationReport>();


  const commonReport = await validate(
    overridedData,
    oldData,
    config,
    tmpBucket,
    apiSchema as ApiSchema,
    false
  );

  if(spreadsheetData) {
    await updateSpreadsheets(overrideSpreadsheetId, overridedData, staticData, spreadsheetData, apiSchema);
  }

  reports.push(commonReport);

  const { errors, warnings, infos } = isValidReport(reports);

  console.log(`⚠️ Errors:${errors}`);
  console.log(`❗ Warnings:${warnings}`);
  console.log(`ℹ️ Infos:${infos}`);

  writeFileSync('staticData.json', JSON.stringify(overridedData), 'utf8');
}

run();
