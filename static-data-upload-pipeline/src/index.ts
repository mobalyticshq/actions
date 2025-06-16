import * as core from '@actions/core'

async function run() {
  try {    
    console.log('Run static data upload pipeline');

    const game_config = core.getInput('game_config');
    const game_specific_tests = core.getInput('game_specific_tests');
    const credentials_json = core.getInput('credentials_json');
    const tmp_assets_folder = core.getInput('tmp_assets_folder');
    const prod_assets_folder = core.getInput('prod_assets_folder');
    const google_spreadsheet_id = core.getInput('google_spreadsheet_id');

    console.log(game_config,game_specific_tests,credentials_json,tmp_assets_folder,prod_assets_folder,google_spreadsheet_id);    
  } catch (error: any) {
    core.setFailed(error.message)
  }
}

run()