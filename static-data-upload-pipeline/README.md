# Static Data Upload Pipeline

## Example of workflow

```
name: CI
on:
  push:
    branches:
      - '**'  

jobs:  
  run:    
    runs-on: ubuntu-latest    
    env:
      GOOGLE_CLIENT_EMAIL: ${{ secrets.GOOGLE_CLIENT_EMAIL }}
      GOOGLE_PRIVATE_KEY: ${{ secrets.GOOGLE_PRIVATE_KEY }}    
      GOOGLE_SPREADSHEET_REPORT_EMAIL: ${{ secrets.GOOGLE_SPREADSHEET_REPORT_EMAIL }}
      GOOGLE_SPREADSHEET_REPORT_KEY: ${{ secrets.GOOGLE_SPREADSHEET_REPORT_KEY }}        
      GCP_BUCKET_NAME: ${{ vars.GCP_BUCKET_NAME }}     
      CF_AUTH_TOKEN: ${{ secrets.CF_AUTH_TOKEN }}     
      CF_CLIENT_ID: ${{ secrets.CF_CLIENT_ID }}  
      SLACK_BOT_TOKEN: ${{ secrets.SLACK_BOT_TOKEN }}     
      DEPLOY_BRANCH: "main"

    strategy:
      max-parallel: 4
      matrix:
        include:        
          - name: example-game
            static_data_path: example-game/prod/static_data
            game_specific_tests: ./tests        
            tmp_assets_folder: gs://cdn.mobalytics.gg/tmpAssets/example-game
            prod_assets_folder: gs://cdn.mobalytics.gg/prodAssets/example-game 
            override_spreadsheet_id: 1rblvygSifo5VG-okyjO5Qt0zvnVpcHjHOqBcT51BWzM
            report_spreadsheet_id: 1NgdIJP2Cc5LsZqy3fkg9vKIHFxlLy5Fv510dS7CY6Gs

    steps:
    - id: "checkout"
      uses: "actions/checkout@v4"
      with:
        fetch-depth: 2

    - uses: actions/checkout@v4
      with:
        repository: mobalyticshq/actions
        token: ${{ secrets.ACTION_ACCESS_TOKEN }}
        path: .github/actions/action
          
    - id: 'auth'
      uses: 'google-github-actions/auth@v2'
      with:
        credentials_json: ${{ secrets.GCP_SERVICE_ACCOUNT_JSON_TOKEN }}

    - id: 'setup-gcloud'
      name: 'Set up Google Cloud SDK'
      uses: 'google-github-actions/setup-gcloud@v2'


    - uses: ./.github/actions/action/static-data-upload-pipeline
      name: ${{ matrix.name }}
      with:
        static_data_path: ${{ matrix.static_data_path }}
        game_specific_tests: ${{ matrix.game_specific_tests }}
        tmp_assets_folder: ${{ matrix.tmp_assets_folder }}
        prod_assets_folder: ${{ matrix.prod_assets_folder }}
        override_spreadsheet_id: ${{ matrix.override_spreadsheet_id }}
        report_spreadsheet_id: ${{ matrix.report_spreadsheet_id }}    
        dry_run: ${{ github.ref_name != env.DEPLOY_BRANCH && 'true' || 'false' }}

```
## Add new game 

Need to add code block in workflow file 

```
- name: name of the game 
  static_data_path: path to the folder with static_data_vX.Y.Z.json 
  game_specific_tests: path to the folder with js files for game specific tests 
  tmp_assets_folder: path to the folder in gs://cdn.mobalytics.gg backet for extracted game assets.
  prod_assets_folder: path to the folder in gs://cdn.mobalytics.gg backet where assets will be copy after validation
  override_spreadsheet_id: spreadsheet id which represent static data and used for overriding fields
  report_spreadsheet_id:  spreadsheet id for validation reports. Contains errors,warnings and information about validated static data
```

## Static data requirements 
 Static data file name static_data_vX.Y.Z.json X,Y,Z- numbers [0,9999]


## Static data report messages

#### asset URL not available
#### asset too big
#### group is not array
#### id is abscent
#### id is not uniq
#### id!=gameId||id!=slugify(name)
#### slug is not uniq
#### gameId is not uniq
#### slug!=slugify(name)
#### not in camel case
#### can't find ref in config file
#### can't find group for ref
#### wrong field type for ref
#### can't find entity in referenced group
#### invalid assert value
#### can't find data for substitution
#### number is not allowed
#### new entity
#### entity deprecated
#### slug changed
#### name changed
#### url changed
#### field disappear
#### asset changed
 
