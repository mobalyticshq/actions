import * as core from '@actions/core'
import * as github from '@actions/github'
import { readdirSync,readFileSync } from 'fs';
import * as path from 'path'
import { mergeStaticData } from './merge';
import { mergeWithSpreadsheets } from './spreadsheets';
import {  validate } from './validation';
import { createReport } from './report';
import { StaticData, ValidationReport } from './types';


function isValidReport(reports:ValidationReport[]){  
  for(const report of reports){
    for(const error of Object.keys(report.errors)){
      if(report.errors[error].size>0)
        return false;
    }

    for(const group of Object.keys(report.byGroup)){
      for( const ent of report.byGroup[group]){
        for(const error of Object.keys(ent.errors)){
          if(ent.errors[error].size>0)
            return false;
        }
      }
    }
  }
  return true;
}

async function runPipeline(newVersion:string,
  oldVersion:string,
  gameConfig:string,
  overrideSpreadsheetId:string,
  reportSpreadsheetId:string,extensionsDir:string){
  
  const tmpBucket = "https://cdn.mobalytics.gg";

  console.log(`## Run static data upload pipeline for`);
  console.log(`## New version is ${newVersion}`);
  console.log(`## Old version is ${oldVersion}`);
  console.log(`## Spreadsheest ID for override ${overrideSpreadsheetId} `);
  console.log(`## Spreadsheest ID for report ${overrideSpreadsheetId} `);

  console.log('');
  console.log('## Merge new static data file with old ## ');
  const config = JSON.parse(readFileSync(gameConfig, 'utf8'));
  const oldData = JSON.parse(readFileSync(oldVersion, 'utf8'));
  const newData = JSON.parse(readFileSync(newVersion, 'utf8'));
  const {mergedData,mergeReport} = mergeStaticData(newData,oldData);  
  
  console.log('');
  console.log('## Merge static data with spreadsheets ## ');  
  const {overridedData,spreadsheetReport} = await mergeWithSpreadsheets(overrideSpreadsheetId,mergedData);
  
  console.log('');
  console.log('## Validate final static data ## ');
  const reports = new Array<ValidationReport>();
  const commonReport = await validate(overridedData,config,tmpBucket);
  reports.push(commonReport);
  reports.push(...await runValidationExtensions(extensionsDir,mergedData));

    
  for(const report of reports){    
    //all report generators 
    for(const error of Object.keys(report.errors)){
      if(report.errors[error].size>0)
        console.log(`## ${error} ${Array.from(report.errors[error])}`)
    }

    for(const group of Object.keys(report.byGroup)){      
      //all groups
      const errors = new Set<string>();
      const fields = new Set<string>();
      for(const entReport of report.byGroup[group]){        
        //all entities
        for(const error of Object.keys(entReport.errors)) 
          //kind of errors
          if(entReport.errors[error].size>0){                        
            errors.add(error);
            for(const field of entReport.errors[error])
              fields.add(field)
          }
      }
      if(errors.size>0){
        console.log(`## For group ${group} errors:\n[${Array.from(errors)}]\n in fields:\n[${Array.from(fields)}}]`);
      }
    }
  }

  console.log('');
  if(isValidReport(reports)){
    console.log('## Static data is valid! Uploading! ##');   
  }else{
    console.log('## Static data is not valid!##');   
  }

  console.log('');
  console.log('## Create spreadsheet report: ##');   
  createReport(  
    reports,
    reportSpreadsheetId    
  );
  


}
async function runValidationExtensions(extensionsDir:string,data:StaticData){    
  const reports = new Array<ValidationReport>();
  try{
    const files = readdirSync(extensionsDir).filter(f => f.endsWith('.js'));
    
    for (const file of files) {
      const test = require(path.join(extensionsDir, file));
      reports.push( await test(data));       
    }
  }catch(error){
    console.log(`## unable execute game specific test:${error}`);
  }
  return reports;
}

async function run() {
  console.log('## Run static data upload pipeline: ## ');
  const root = process.cwd();    

  const context = github.context;
  const overrideSpreadsheetId = core.getInput('override_spreadsheet_id');
  const reportSpreadsheetId = core.getInput('report_spreadsheet_id');
  const gameConfig = core.getInput('game_config');
  const extensions = core.getInput('game_specific_tests');

  console.log('spreadsheetId for override:',overrideSpreadsheetId);
  console.log('spreadsheetId for report:',reportSpreadsheetId);
  console.log('folder with game specific tests:',extensions);
  
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

  const files = response.data.files?.map((file) => file.filename);
  if(files)
    for(const file of files){
      const files = readdirSync( path.dirname(file));
      const versionedFiles = new Array<string>();
      files.forEach(filename => {    
          if (!pattern.test(filename)) return null;                
          versionedFiles.push(filename)
        });

      const sortedFiles = versionedFiles.map( a => a.replace(/\d+/g, n => ''+(Number(n)+10000) ) ).sort()
          .map( a => a.replace(/\d+/g, n => ''+(Number(n)-10000) ) ) ;
      
      if(sortedFiles.length>0 && file === sortedFiles[sortedFiles.length-1]){
        //newest version added
        console.log(" run pipeline for ",file);
        if(sortedFiles.length>1)
          await runPipeline(file,sortedFiles[sortedFiles.length-2],gameConfig,overrideSpreadsheetId,reportSpreadsheetId,extensions);
      }      
    }
 
}

run();
// runPipeline("static_data_v0.0.2.json",
//   "static_data_v0.0.1.json",
//   "config.json",
//   "1rblvygSifo5VG-okyjO5Qt0zvnVpcHjHOqBcT51BWzM",
//   '1NgdIJP2Cc5LsZqy3fkg9vKIHFxlLy5Fv510dS7CY6Gs',
//   path.join(__dirname, 'tests')
// );
