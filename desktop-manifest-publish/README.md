# desktop-manifest-publish

Composite action that builds, validates, and publishes **one** environment of the desktop game
manifest to the CDN.

Pipeline (operates on the **consumer repo's** checked-out files):

1. **Build** — merge the per-game manifests `<games-dir>/<game>/<env>/desktop/manifest.json` into a
   single array for that env (`build-manifest.mjs`).
2. **Validate** — per-file (required fields, semver, `mainWindow ∈ windows`) + per-env cross-game
   checks (unique `game`, no `gameId` overlap); a failure names the exact source file
   (`validate-manifest.mjs`).
3. **Deploy** — `gsutil cp` the built `<env>/manifest.json` to `<bucket>/<env>/` and purge that
   file's URL `https://<cf-purge-prefix><env>/manifest.json` from Cloudflare (`publish-manifest.mjs`).

The runtime scripts are zero-dependency Node (only `node` + `gsutil`) and share one helper
(`lib.mjs` → `requireEnv`). They take **no defaults**: every value arrives in an env var and the
script exits 1 if any is missing. The sources are plain JS with `// @ts-check`, type-checked by
`tsc --noEmit` (dev deps `typescript` + `@types/node`) — no compile step, no `dist/`. `jest` (also
dev-only) unit-tests the validation rules (`desktop-manifests.test.mjs`); validating the live configs
is the Validate step above.

## Inputs (all required)

| Input | Description |
|-------|-------------|
| `environment` | `dev` \| `stg` \| `prod` |
| `games-dir` | Path (relative to the workspace) to the games tree |
| `bucket` | GCS bucket base (gsutil URL, without `/<env>`) |
| `cf-zone-id` | Cloudflare zone id |
| `cf-purge-prefix` | CDN host/path base for the manifest URL to purge (without `<env>/`) |
| `cf-token` | Cloudflare API token (`purge_cache`) |
| `gcp-service-account-json` | GCP SA JSON key for `gsutil` |

The action bakes in no defaults. The consumer keeps only the manifest **data**
(`<games-dir>/<game>/<env>/desktop/manifest.json`) and supplies its own bucket / zone / paths in the
workflow — the pipeline logic lives in the action, the config lives in the consumer, nothing is
hard-coded in the action.

## Usage

```yaml
- uses: actions/checkout@v5
- uses: mobalyticshq/actions/desktop-manifest-publish@main
  with:
    environment: dev
    games-dir: games
    bucket: 'gs://<your-bucket>/desktop'
    cf-zone-id: '<your-cloudflare-zone-id>'
    cf-purge-prefix: '<your-cdn-host>/desktop/'
    cf-token: ${{ secrets.CF_AUTH_TOKEN }}
    gcp-service-account-json: ${{ secrets.GCP_SERVICE_ACCOUNT_JSON_TOKEN }}
```

## Local development

```bash
npm install          # once — pulls in jest + typescript
npm run typecheck    # tsc --noEmit  (// @ts-check on the .mjs sources)
npm test             # run the rule unit-tests

# Build + validate a games tree exactly as the action does (no gsutil / Cloudflare needed):
DESKTOP_ENV=dev GAMES_DIR=/path/to/games DIST_DIR=/tmp/desktop-dist node build-manifest.mjs
DESKTOP_ENV=dev GAMES_DIR=/path/to/games                              node validate-manifest.mjs
```
