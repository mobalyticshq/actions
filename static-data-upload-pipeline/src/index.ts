import * as core from '@actions/core'
import * as github from '@actions/github'
import { readdirSync,readFileSync,existsSync, writeFileSync } from 'fs';
import * as path from 'path'
import { mergeStaticData, replaceAssets } from './merge';
import { mergeWithSpreadsheets, updateSpreadsheets } from './spreadsheets';
import {  ReportMessages, validate } from './validation';
import { createReport } from './report';
import { StaticData, StaticDataConfig, ValidationReport } from './types';
import { initSlugify } from './utils';
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

initSlugify();

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

function showReports(reports:Array<ValidationReport>){
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
}

async function runPipeline(versions:Array<string>,  
  staticDataPath:string,
  overrideSpreadsheetId:string,
  reportSpreadsheetId:string,
  tmpAssetFolder:string,
  prodAssetFolder:string,
  testsDir:string){
    
  console.log(`## Newest version is ${versions[versions.length-1]}`);
  console.log(`## Oldest version is ${versions[0]}`);
  console.log(`## Spreadsheest ID for override ${overrideSpreadsheetId} `);
  console.log(`## Spreadsheest ID for report ${overrideSpreadsheetId} `);

  const tmpAssetPrefix = tmpAssetFolder.replace("gs://","https://");
  const prodAssetPrefix = prodAssetFolder.replace("gs://","https://");
  try{
    let configDir = path.dirname(versions[0]);
    let gameConfig = "";
    let config = {} as StaticDataConfig;

    for(let i=0;i<3;++i){
      if(await existsSync(path.join(configDir,"config.json"))){
        gameConfig = path.join(configDir,"config.json");
        break;
      }
      configDir = path.join(configDir,"../");
    }
    if(gameConfig.length==0){
      console.log(`Can't find game config for ${versions[0]}`)
    }else{
      console.log(`## Game config  ${gameConfig}`);
      config = JSON.parse(readFileSync(gameConfig, 'utf8'));
    }

    console.log('');
    console.log('## Merge static data files ## ');  
    let  staticData = {} as StaticData,oldData = {} as StaticData;
    for(let i=0;i<versions.length;++i){
      console.log(`## Merge ${versions[i]}`);
      const data = JSON.parse(readFileSync(versions[i], 'utf8'));    
      const {mergedData,mergeReport} = mergeStaticData(data,staticData);
      staticData = mergedData;
      if(i==versions.length-2)
        oldData = structuredClone(staticData);
    }

    console.log('');
    console.log('## Override static data by spreadsheets ## ');  
    const {overridedData,spreadsheetReport,spreadsheetData} = await mergeWithSpreadsheets(overrideSpreadsheetId,staticData);

    console.log('');
    console.log('## Validate final static data ## ');
    const reports = new Array<ValidationReport>();
    const commonReport = await validate(overridedData,oldData,config,tmpAssetPrefix);
    reports.push(commonReport);
    reports.push(...await runValidationExtensions(testsDir,overridedData,oldData));
      
    showReports(reports);

    console.log('');
    console.log(`## Create spreadsheet report: https://docs.google.com/spreadsheets/d/${reportSpreadsheetId} ##`);   
    await createReport(  
      reports,
      reportSpreadsheetId    
    );
    console.log('##Spreadsheet report done ##');   


    console.log('');
    if(isValidReport(reports)){
      console.log('## Static data is valid! ##');  


      console.log('## Update assets URLs! ##')
      replaceAssets(overridedData,
        tmpAssetPrefix,
        prodAssetPrefix);      


      console.log(`## Update static data file ${versions[versions.length-1]}`);              
      writeFileSync(versions[versions.length-1],JSON.stringify(overridedData),'utf8')

      if(spreadsheetData){
       console.log(`## Update override spreadsheet https://docs.google.com/spreadsheets/d/${overrideSpreadsheetId}`);  
       await updateSpreadsheets(overrideSpreadsheetId,overridedData,staticData,spreadsheetData,tmpAssetPrefix);
       console.log(`## spreadsheet updated`);
      }
      console.log('## Sync static data file with bucket ##');  
      const dst = `gs://${process.env.GCP_BUCKET_NAME}/${staticDataPath}/`;
      const src = `${path.dirname(versions[versions.length-1])}`
      const { stdout, stderr } = await execAsync(
       `gsutil -m rsync -r -d -c -x "README.md|.gitignore|.github|.git|gha-creds-.*\.json$" ${src} ${dst} `
      );
      console.log('stdout:', stdout);
      if (stderr) console.error('stderr:', stderr);
      console.log('## Bucket synced ##');  

      console.log('## Sync tmp assets bucket with prod bucket ##');  
      const { stdoutAssets, stderrAssets } = await execAsync(
       `gsutil -m rsync -r -d -c ${tmpAssetFolder} ${prodAssetFolder} `
      );
      console.log('stdout:', stdoutAssets);
      if (stderr) console.error('stderr:', stderrAssets);
      console.log('## Assets synced ##');  

    }else{
      console.log('## Static data is not valid!##');   
    }

  }catch(error){
    console.log(`## Error during pipeline ${error}`);   
  }

}

async function runValidationExtensions(extensionsDir:string,data:StaticData,oldData:StaticData){    
  const reports = new Array<ValidationReport>();
  try{
    const files = readdirSync(extensionsDir).filter(f => f.endsWith('.js'));
    
    for (const file of files) {
      const test = require(path.join(extensionsDir, file));
      reports.push( await test(data,oldData));       
    }
  }catch(error){
    console.log(`## unable execute game specific test:${error}`);
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

  const tests = core.getInput('game_specific_tests');


  console.log(`## Run static data upload pipeline for ${staticDataPath}`);

  console.log('bucket for static data:',process.env.GCP_BUCKET_NAME);
  console.log('spreadsheetId for override:',overrideSpreadsheetId);
  console.log('spreadsheetId for report:',reportSpreadsheetId);
  console.log('folder with game specific tests:',tests);
  console.log('folder for tmp assets:',tmpAssetFolder);
  console.log('folder for prod assets:',prodAssetFolder);


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
  console.log(`## All commited files: ${files}`);  

  if(files)
    for(const file of files){
      if(!pattern.test(file))
        continue;
      const dirName = path.dirname(file);
      if(dirName !=staticDataPath)
        continue;

      console.log(`## Get all versions for: ${file} in ${dirName}`);  
      const files = readdirSync( dirName);
      const versionedFiles = new Array<string>();
      files.forEach(filename => {    
          if (!pattern.test(filename)) return null;                
          versionedFiles.push(path.join(dirName,filename));
        });

      const sortedFiles = versionedFiles.map( a => a.replace(/\d+/g, n => ''+(Number(n)+10000) ) ).sort()
          .map( a => a.replace(/\d+/g, n => ''+(Number(n)-10000) ) ) ;
      
      console.log(`## Versioned files:${sortedFiles}`);  
      if(sortedFiles.length>0 && file === sortedFiles[sortedFiles.length-1]){
        //newest version added
        
        if(sortedFiles.length>0){          
          console.log(`## Run pipeline for ${sortedFiles}`);  
          await runPipeline(sortedFiles,
            staticDataPath,
            overrideSpreadsheetId,
            reportSpreadsheetId,
            tmpAssetFolder,
            prodAssetFolder,
            tests);
        }
      }      
    }
 
}


run();
// runPipeline(["example-game/prod/static_data/static_data_v0.0.71.json"],
//   "1rblvygSifo5VG-okyjO5Qt0zvnVpcHjHOqBcT51BWzM",
//   '1NgdIJP2Cc5LsZqy3fkg9vKIHFxlLy5Fv510dS7CY6Gs',
//   "https://cdn.mobalytics.gg","https://cdn.mobalytics11111.gg",
//   path.join(__dirname, 'tests')
// );
