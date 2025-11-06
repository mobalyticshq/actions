import { readdirSync, writeFileSync } from 'fs';
import * as path from 'path';
import { readSchema } from './utils/common.utils';
import { SlackMessageManagerV2 } from './utils/slack-manager-v2.utils';
import { runPipeline } from './run-pipeline';

async function run() {

  // Variables for local testing, change it as needed
  const staticDataPath = '/Users/alexmittsel/WORK/ngf-configuration/borderlands-4/dev/static_data';
  const overrideSpreadsheetId = '184EURmpMq-m3Oy-4fuE1oNFZFDVlLU6U89A3ktvsv7k';
  const reportSpreadsheetId = '1CpvbMoAJSMo_BRCEytrkmVUE2720o366Mb6N6-MXljw';
  const tmpAssetFolder = 'gs://cdn.mobalytics.gg/assets/borderlands-4';
  const prodAssetFolder = 'gs://cdn.mobalytics.gg/assets/borderlands-4';
  const dryRun = true;
  const skipSchemaValidation = false;
  const tests = './tests';
  const chanelId = 'C09KPU88G87';
  const apiSchemaPath = '/Users/alexmittsel/WORK/ngf-configuration/borderlands-4/dev/static_data/schema.json'

  const apiSchema = readSchema(apiSchemaPath);
  const pattern = /static_data_v\d+.\d+.\d+.json/;
  const slackManager = new SlackMessageManagerV2(chanelId);



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


  const staticData = await runPipeline({
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

  if(staticData) {
    writeFileSync('staticData.json', JSON.stringify(staticData), 'utf8');
  }
}

run();
