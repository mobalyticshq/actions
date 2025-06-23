import * as core from '@actions/core'
import * as github from '@actions/github'
import { readFileSync,writeFileSync } from 'fs';
import * as path from 'path'
import { mergeStaticData } from './merge';
import { mergeWithSpreadsheets } from './spreadsheets';
import { validate } from './validation';
import { createReport } from './report';

async function run() {
  console.log('## Run static data upload pipeline: ## ');
  const root = process.cwd();  
  // const oldData = JSON.parse(readFileSync(path.join(root,'old_static_data.json'), 'utf8'));
  // const newData = JSON.parse(readFileSync(path.join(root,'new_static_data.json'), 'utf8'));
  // const config = JSON.parse(readFileSync(path.join(root,'config.json'), 'utf8'));

  const context = github.context;
  const token = core.getInput('token');
  const octokit = github.getOctokit(token);

  const sha = context.sha;
  const { owner, repo } = context.repo;

  const response = await octokit.rest.repos.getCommit({
    owner,
    repo,
    ref: sha,
  });

  const files = response.data.files?.map((file) => file.filename);
  core.info(`Files:\n${files?.join('\n')}`);


  // const spreadsheetId = '1rblvygSifo5VG-okyjO5Qt0zvnVpcHjHOqBcT51BWzM';
  // const reportSpreadsheetId = '1rblvygSifo5VG-okyjO5Qt0zvnVpcHjHOqBcT51BWzM';

  // const clientEmail = 'spreadsheets-sync@mobalytics-1242.iam.gserviceaccount.com';
  // const tmpBucket = "https://cdn.mobalytics.gg";

  // console.log('## Merge new static data file with old ## ');
  // const {mergedData,mergeReport} = mergeStaticData(newData,oldData);  
    
  // console.log('## Merge static data with spreadsheets ## ');  
  // const {overridedData,spreadsheetReport} = await mergeWithSpreadsheets(spreadsheetId,mergedData);


  // console.log('## Validate final static data ## ');
  // const {valid,validationReport} =await validate(newData,config,tmpBucket)

  // console.log('## Create final report: ##');   
  // console.log(`## Group is not array of enities: ${Array.from(  validationReport.groupNotArray)}`)
  // console.log(`## Asset URLs are not available: ${Array.from(  validationReport.unavailableURLs)}`)
  
  // for(const group of Object.keys(validationReport.groupReport)){
  //   const report = validationReport.groupReport[group];
  //   for(const prop of Object.keys(report))
  //     console.log(`## ${prop}: ${Array.from(report[prop])}`);
  // }
 
 //createReport(  
 //  mergedData,    
 //  mergeReport,
 //  spreadsheetReport,    
 //  validationReport,
 //  reportSpreadsheetId
 //);

}

run();