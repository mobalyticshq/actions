import * as core from '@actions/core'
import * as github from '@actions/github'
import { readFileSync,readdirSync,statSync } from 'fs';
import * as path from 'path'

type Entity = {
  id:string;
  slug?:string;
  deprecated?:boolean;
}

const report={  
  merge:{
    lostGroups:new Array<string>(),
    newGroups:new Array<string>(),
    newGroupNotArray:new Array<string>(),
    oldGroupNotArray:new Array<string>(),
    deprecatedEntities:new Map<string,Array<string>>(),
    duplicatesInNewData:new Map<string,Array<string>>(),
  }
}
const mergedJSON = new Map<String,Array<Entity> >();

function getAllFiles(dirPath: string, arrayOfFiles: string[] = []): string[] {
  const entries = readdirSync(dirPath)

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry)
    if (statSync(fullPath).isDirectory()) {
      getAllFiles(fullPath, arrayOfFiles)
    } else {
      arrayOfFiles.push(fullPath)
    }
  }

  return arrayOfFiles
}

async function bootstrapPipeline(){
  try {    

    const game_config = core.getInput('game_config');
    const game_specific_tests = core.getInput('game_specific_tests');
    const credentials_json = core.getInput('credentials_json');
    const tmp_assets_folder = core.getInput('tmp_assets_folder');
    const prod_assets_folder = core.getInput('prod_assets_folder');
    const google_spreadsheet_id = core.getInput('google_spreadsheet_id');

    console.log(`Vars:`,game_config,game_specific_tests,credentials_json,tmp_assets_folder,prod_assets_folder,google_spreadsheet_id);    

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

  } catch (error: any) {
    core.setFailed(error.message)
  }
}

function mergeGroups(newGroup:Array<Entity>,oldGroup:Array<Entity>,group:string){
  mergedJSON.set(group,new Array());

  oldGroup.forEach(oldIt => {
    const match = newGroup.filter(newIt=>newIt.id == oldIt.id);
    if(match.length == 0){
      //deprecated
      if(!report.merge.deprecatedEntities.has(group)){
        report.merge.deprecatedEntities.set(group,[oldIt.id]);
      }else{
        report.merge.deprecatedEntities.get(group)?.push(oldIt.id);
      }
      mergedJSON.get(group)?.push({...oldIt,deprecated:true});
    }else if(match.length > 1){
      if(!report.merge.duplicatesInNewData.has(group)){
        report.merge.duplicatesInNewData.set(group,[oldIt.id]);
      }else{
        report.merge.duplicatesInNewData.get(group)?.push(oldIt.id);
      }
    }else{
      //correct
      mergedJSON.get(group)?.push(match[0]);
    }
  });
}

function mergeJSON(){
  console.log('##Merge new static data file with old##');
  try{
  const root = process.cwd();  
  const oldData = JSON.parse(readFileSync(path.join(root,'old_static_data.json'), 'utf8'));
  const newData = JSON.parse(readFileSync(path.join(root,'old_static_data.json'), 'utf8'));
  

  for (const group of Object.keys(oldData)) {
    if(newData[group] === undefined){
      report.merge.lostGroups.push(group);
    }else{
      if(!Array.isArray(oldData[group])){
        report.merge.oldGroupNotArray.push(group);
        continue;
      }
      if(!Array.isArray(newData[group])){
        report.merge.newGroupNotArray.push(group);
        continue;
      }
      mergeGroups(newData[group],oldData[group],group);
    }
  }

  for (const group of Object.keys(newData)) {
    if(oldData[group] === undefined){
      report.merge.newGroups.push(group);
    }
  }

  }catch(error){
    core.setFailed(`error during the merge ${error}`)
  }
}

async function run() {
  console.log('##Run static data upload pipeline:##');
  await bootstrapPipeline();
  mergeJSON();
  console.log('##Report:##');
  console.log(report);
}

run();