import * as core from '@actions/core'
import * as github from '@actions/github'
import { readFileSync,readdirSync,statSync } from 'fs';
import * as path from 'path'

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

    const context = github.context
    const token = core.getInput('token')  // GitHub Token как input
    const octokit = github.getOctokit(token)

    const sha = context.sha
    const { owner, repo } = context.repo

    const response = await octokit.rest.repos.getCommit({
      owner,
      repo,
      ref: sha,
    })

    const files = response.data.files?.map((file) => file.filename)
    core.info(`Files:\n${files?.join('\n')}`)

  } catch (error: any) {
    core.setFailed(error.message)
  }
}
function mergeJSON(){
  console.log('##Merge new static data file with old##');
  // console.log(__dirname,__filename);

  ///home/runner/work/game-static-data-extractors/game-static-data-extractors/old_static_data.json
   const data = readFileSync('/home/runner/work/game-static-data-extractors/game-static-data-extractors/old_static_data.json', 'utf8');
   console.log('length:',data.length);
}

async function run() {
  console.log('##Run static data upload pipeline:##');
  await bootstrapPipeline();
  mergeJSON();
}

run()