import * as core from '@actions/core'
import * as github from '@actions/github'
import { readdirSync,readFileSync } from 'fs';
import * as path from 'path'
import { mergeStaticData } from './merge';
import { mergeWithSpreadsheets } from './spreadsheets';
import { ReportMessages, validate } from './validation';
import { createReport } from './report';
import { StaticData, ValidationReport } from './types';
import { report } from 'process';


async function runPipeline(newVersion:string,oldVersion:string,gameConfig:string,spreadsheetId:string,extensionsDir:string){

  console.log('gameConfig',gameConfig);

  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const tmpBucket = "https://cdn.mobalytics.gg";

  console.log(`pipeline`,newVersion,oldVersion,spreadsheetId,clientEmail);
  console.log('## Merge new static data file with old ## ');
  const config = JSON.parse(readFileSync(gameConfig, 'utf8'));
  const oldData = JSON.parse(readFileSync(oldVersion, 'utf8'));
  const newData = JSON.parse(readFileSync(newVersion, 'utf8'));
  const {mergedData,mergeReport} = mergeStaticData(newData,oldData);  
  
  console.log('');
  console.log('## Merge static data with spreadsheets ## ');  
  // const {overridedData,spreadsheetReport} = await mergeWithSpreadsheets(spreadsheetId,mergedData);
  
  console.log('');
  console.log('## Validate final static data ## ');
  const reports = new Array<ValidationReport>();
  const commonReport = await validate(mergedData,config,tmpBucket);
  reports.push(commonReport);
  reports.push(...await runValidationExtensions(extensionsDir,mergedData));


  console.log(reports);
  console.log('');

  // console.log('## Create final report: ##');   
  
  console.log(`## Group is not array of enities: ${Array.from(  commonReport.errors[ReportMessages.groupNotArray])}`)
  console.log(`## Asset URLs are not available: ${Array.from(  commonReport.errors[ReportMessages.assertURLNotAvailable])}`)

  
  for(const report of reports){    
    //all report generators 
    for(const group of Object.keys(report.byGroup)){      
      //all groups
      for(const entReport of report.byGroup[group]){        
        //all entities
        for(const error of Object.keys(entReport.errors)) 
          //kind of errors
          if(entReport.errors[error].size>0){            
            console.log(`## Error in entity ${entReport.entity}`);
            console.log(`## ${error} ${Array.from(entReport.errors[error])}`);
          }
      }
    }
  }
 
 //createReport(  
 //  mergedData,    
 //  mergeReport,
 //  spreadsheetReport,    
 //  validationReport,
 //  reportSpreadsheetId
 //);

}
async function runValidationExtensions(extensionsDir:string,data:StaticData){    
  const files = readdirSync(extensionsDir).filter(f => f.endsWith('.js'));
  const reports = new Array<ValidationReport>();
  for (const file of files) {
    const test = require(path.join(extensionsDir, file));
    reports.push( await test(data));       
  }
  return reports;
}

async function run() {
  console.log('## Run static data upload pipeline: ## ');
  const root = process.cwd();    

  const context = github.context;
  const googleSpreadsheetId = core.getInput('google_spreadsheet_id');
  const gameConfig = core.getInput('game_config');
  console.log('googleSpreadsheetId',googleSpreadsheetId);
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
          await runPipeline(file,sortedFiles[sortedFiles.length-2],gameConfig,googleSpreadsheetId,"extensions");
      }      
    }
 
}

// run();
runPipeline("static_data_v0.0.2.json",
  "static_data_v0.0.1.json",
  "config.json",
  "1rblvygSifo5VG-okyjO5Qt0zvnVpcHjHOqBcT51BWzM",
  path.join(__dirname, 'extensions')
);
