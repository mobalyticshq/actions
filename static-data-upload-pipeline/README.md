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

## Global variables 
- secrets.ACTION_ACCESS_TOKEN - can be created in https://github.com/settings/tokens
- secrets.GOOGLE_CLIENT_EMAIL - email for **spreadsheets-sync**  service account
- secrets.GOOGLE_PRIVATE_KEY - private key for **spreadsheets-sync**  service account
- secrets.GOOGLE_SPREADSHEET_REPORT_EMAIL - email for **spreadsheets-sync-report**  service account
- secrets.GOOGLE_SPREADSHEET_REPORT_KEY - private key for **spreadsheets-sync-report**  service account
- secrets.GCP_BUCKET_NAME - bucket name ex: ngf
- secrets.CF_AUTH_TOKEN - token for reset **Cloudflare**
- secrets.CF_CLIENT_ID - client ID for reset **Cloudflare**
- secrets.SLACK_BOT_TOKEN - web hook for **Slack** format xxx/yyy/zzz
- DEPLOY_BRANCH - branch name for deploy static data in prod, other branches for dry run 

## Add new game 

Need to add code block in workflow file 
```
- name: name of the game 
  static_data_path: path to the folder in repository with static_data_vX.Y.Z.json 
  game_specific_tests: path to the folder in repository with js files for game specific tests 
  tmp_assets_folder: path to the folder in gs://cdn.mobalytics.gg backet for extracted game assets.
  prod_assets_folder: path to the folder in gs://cdn.mobalytics.gg backet where assets will be copy after validation
  override_spreadsheet_id: spreadsheet id which represent static data and used for overriding fields
  report_spreadsheet_id:  spreadsheet id for validation reports. Contains errors,warnings and information about validated static data
```
- Add email of  "spreadsheets-sync-report" service to spreadsheet for report as editor
- Add email of  "spreadsheets-sync" service to spreadsheet for override as editor

## Static data requirements 
 Static data file name static_data_vX.Y.Z.json X,Y,Z- numbers [0,9999]


## Static data report messages
| Message    | Level | Description |
| -------- | ------- | ------- |
| asset URL not available | ERROR | unable to download image by URL |
| asset too big | ERROR | size of asset >100MB|
| invalid asset URL | ERROR | asset url MUST starts with tmp_assets_folder and has allowed extension|
| group is not array | ERROR | all fields (groups) in root MUST be arrays of entities (objects)|
| id is abscent | ERROR | entity(object) MUST have field **id**|
| id is not uniq | ERROR | two or more objects in group have same **id**|
| id!=gameId\|\|id!=slugify(name) | ERROR | if object has **gameId** then id MUST equal **gameId** else if object has **name** then id MUST equal slugify(**name**)|
| slug is not uniq | ERROR | two or more objects in group have same **slug**|
| gameId is not uniq | ERROR | two or more objects in group have same **gameId**|
| slug!=slugify(name) | ERROR | slug MUST be equal slugify(**name**)|
| not in camel case | ERROR | field must be in **camel case** |
| can't find ref in config file | ERROR |  config file doesn't contains ref with **from** for this field|
| can't find group for ref | ERROR | there are no group in JSON file for ref with **to** for this field|
| wrong field type for ref | ERROR | reference field MUST be string or array of strings|
| can't find entity in referenced group | ERROR | there are no entity in referenced group for this reference field  |
| invalid asset value | ERROR | asset MUST be placed in **tmp_assets_folder** and has one of allowed extensions **(".jpeg" ,".jpg", ".png", ".gif", ".webp", ".svg", ".avif",".webm", ".mp4")**|
| can't find data for substitution | ERROR | substitution in text field MUST be in format {{index:group.id:default_value:opt}}  entity in JSON for **group.id** not found|
| number is not allowed | ERROR | In order to avoid errors during processing float32/float64/int32/int64 all numbers MUST be as strings e.g. `"value: "5` is wrong, `"value": "5"` is correct|
| entity deprecated | WARNING | **id**  for this group in latest version of static data not found |
| slug changed | WARNING | slug was changed in latest  version of static data|
| name changed | WARNING | name was changed in latest  version of static data|
| field disappear | WARNING | there are no field in latest  version of static data|
| asset changed | WARNING | URL for asset was changed in latest  version of static data|
| new entity | INFO | new **id**  for this group in latest version of static data found|
