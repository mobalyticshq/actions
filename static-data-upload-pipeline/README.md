# Static Data Upload Pipeline

## Example workflow

```yaml
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
      GCP_BUCKET_NAME: ${{ vars.GCP_BUCKET_NAME }}
      CF_AUTH_TOKEN: ${{ secrets.CF_AUTH_TOKEN }}
      CF_CLIENT_ID: ${{ secrets.CF_CLIENT_ID }}
      SLACK_BOT_TOKEN_V2: ${{ secrets.SLACK_BOT_TOKEN_V2 }}
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
            game_env_slug: example-game_prod

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
        game_env_slug: ${{ matrix.game_env_slug }}
        spreadsheets_folder_url: ${{ vars.SPREADSHEETS_FOLDER_URL }}
        dry_run: ${{ github.ref_name != env.DEPLOY_BRANCH && 'true' || 'false' }}
```

## Action inputs

| Input | Required | Description |
|---|---|---|
| `static_data_path` | Yes | Path to folder containing versioned `static_data_vX.Y.Z.json` files |
| `game_env_slug` | Yes | Game + environment identifier used to name spreadsheets (e.g. `lol_prod`, `ovw_dev`) |
| `spreadsheets_folder_url` | Yes | Google Drive folder URL where override/report spreadsheets are stored or will be created |
| `tmp_assets_folder` | Yes | GCS path for temporary assets (e.g. `gs://cdn.mobalytics.gg/tmpAssets/example-game`) |
| `prod_assets_folder` | Yes | GCS path for production assets (e.g. `gs://cdn.mobalytics.gg/prodAssets/example-game`) |
| `game_specific_tests` | Yes | Path to folder containing game-specific `.js` validation test files |
| `dry_run` | No | If `true`, runs all validation but skips upload to GCS. Default: `false` |
| `skip_schema_validation` | No | If `true`, skips backward-compatibility schema checks. Default: `false` |
| `slack_channel_id` | No | Slack channel ID for pipeline notifications. Defaults to `C0932450HEF` |
| `token` | No | GitHub token. Defaults to `${{ github.token }}` |

## Environment variables

### Required

| Variable | Description | How to obtain |
|---|---|---|
| `GOOGLE_CLIENT_EMAIL` | Service account email for Google Sheets and GCS access | GCP Console → IAM & Admin → Service Accounts → your SA → Details |
| `GOOGLE_PRIVATE_KEY` | Private key for the service account | GCP Console → IAM & Admin → Service Accounts → your SA → Keys → Add Key → JSON, then copy `private_key` field |
| `GCP_BUCKET_NAME` | GCS bucket where final static data JSON files are uploaded | GCP Console → Cloud Storage → bucket name (without `gs://`) |
| `CF_AUTH_TOKEN` | Cloudflare API token for cache purge after asset sync | Cloudflare Dashboard → My Profile → API Tokens |
| `CF_CLIENT_ID` | Cloudflare client/zone ID | Cloudflare Dashboard → Manage Account |

### Optional

| Variable | Description | Default |
|---|---|---|
| `SLACK_BOT_TOKEN_V2` | Slack bot token for pipeline status notifications | — (notifications disabled if unset) |
| `SLACK_CHANNEL_ID` | Slack channel ID to post notifications to | `C0932450HEF` |
| `GCP_ASSETS_BUCKET_NAME` | GCS bucket for asset URL validation. Uses the faster GCS listing strategy instead of CDN HEAD requests | `cdn.mobalytics.gg` |
| `REPORT_DOC_URL` | Full URL to the report spreadsheet, included as a link in Slack notifications | — |

## Add a new game

Add an entry to the `matrix.include` list in your workflow file:

```yaml
- name: my-game
  static_data_path: my-game/prod/static_data
  game_specific_tests: ./tests
  tmp_assets_folder: gs://cdn.mobalytics.gg/tmpAssets/my-game
  prod_assets_folder: gs://cdn.mobalytics.gg/prodAssets/my-game
  game_env_slug: my-game_prod
```

The pipeline will automatically discover or create the required spreadsheets in the shared Drive folder on first run:
- `my-game_prod/my-game_prod overrides sheet`
- `my-game_prod/my-game_prod report sheet`

Make sure the service account (`GOOGLE_CLIENT_EMAIL`) has **Contributor** access to the shared Drive folder.

## Testing locally

Copy `.env.example` to `.env` and fill in `GOOGLE_CLIENT_EMAIL` and `GOOGLE_PRIVATE_KEY` from the service account JSON key file downloaded from GCP Console.

```bash
cp .env.example .env
# edit .env with your values
```

Then run the pipeline directly with `ts-node`, passing action inputs as environment variables via `INPUT_*` prefix (the same convention GitHub Actions uses internally):

```bash
npx ts-node src/index.ts
```

Set `INPUT_DRY_RUN=true` while testing locally — this runs all validation and spreadsheet discovery but skips any writes to GCS or Cloudflare cache purges.

## Static data file naming

Files must match: `static_data_vX.Y.Z.json` where X, Y, Z are numbers in range `[0, 9999]`.

## Validation report messages

| Message | Level | Description |
|---|---|---|
| asset URL not available | ERROR | Unable to download image by URL |
| asset too big | ERROR | Asset size > 100MB |
| invalid asset URL | ERROR | Asset URL must start with `tmp_assets_folder` and have an allowed extension |
| group is not array | ERROR | All root fields must be arrays of entity objects |
| id is absent | ERROR | Entity must have an `id` field |
| id is not unique | ERROR | Two or more objects in a group share the same `id` |
| id!=gameId\|\|id!=slugify(name) | ERROR | If entity has `gameId` then `id` must equal `gameId`, else if it has `name` then `id` must equal `slugify(name)` |
| slug is not unique | ERROR | Two or more objects in a group share the same `slug` |
| gameId is not unique | ERROR | Two or more objects in a group share the same `gameId` |
| slug!=slugify(name) | ERROR | `slug` must equal `slugify(name)` |
| not in camel case | ERROR | Field name must be in camelCase |
| can't find ref in config file | ERROR | Config file has no ref with `from` for this field |
| can't find group for ref | ERROR | No group in the JSON file matches the ref `to` for this field |
| wrong field type for ref | ERROR | Reference field must be a string or array of strings |
| can't find entity in referenced group | ERROR | No entity in the referenced group matches this reference field value |
| invalid asset value | ERROR | Asset must be in `tmp_assets_folder` and have an allowed extension (`.jpeg`, `.jpg`, `.png`, `.gif`, `.webp`, `.svg`, `.avif`, `.webm`, `.mp4`) |
| can't find data for substitution | ERROR | Text field substitution must be in format `{{index:group.id:default_value:opt}}` — entity not found |
| number is not allowed | ERROR | All numbers must be strings (e.g. `"value": "5"` not `"value": 5`) to avoid float32/float64/int32/int64 issues |
| entity deprecated | WARNING | Entity `id` not found in the latest version of static data |
| slug changed | WARNING | Slug was changed in the latest version of static data |
| name changed | WARNING | Name was changed in the latest version of static data |
| field disappeared | WARNING | Field not present in the latest version of static data |
| asset changed | WARNING | Asset URL was changed in the latest version of static data |
| new entity | INFO | New `id` found in the latest version of static data |
