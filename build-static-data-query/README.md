# Build Static Data Query

GitHub Action for automated building and processing of GraphQL queries for game static data.

## Description

This GitHub Action automates the process of creating optimized GraphQL queries for fetching game static data. The pipeline performs the following tasks:

1. **Schema version check** — determines if the GraphQL schema has changed to avoid unnecessary rebuilds
2. **Schema download** — downloads the current GraphQL schema from the specified endpoint
3. **Scope generation** — analyzes the schema and determines data scopes for a specific game
4. **Schema cleaning** — removes unused types and fields, keeping only those necessary for static data
5. **Fragment generation** — uses an AI agent (cursor-cli) to automatically generate GraphQL fragments for all entity types
   - The prompt asks for one level of linked records: every field of the entity and of its embedded types, and for each linked entity (e.g. an item's `quality`) all of its scalar fields but none of its own links.
   - **Fragment check** — compares the new fragments with the live ones and catches the generator going wrong in either direction:
     - *narrower*: dropping fields the schema still has (e.g. a linked type cut down to `slug id name`). Fields the schema itself removed, fields deeper than one level of linked entities, and new fields are allowed.
     - *larger*: selecting more than `fragment-growth-max-ratio` times the live field count, or nesting more than `fragment-max-depth-increase` levels deeper - the shape of a query too big for the GraphQL server.

     Either way the fragments are regenerated up to `fragment-regression-retries` times, and the build then fails without uploading, so the live query stays in place.
6. **Query generation** — creates the main GraphQL query using the generated fragments
7. **Query compilation** — compiles the query into an AST
8. **TypeScript type generation** — creates typed TypeScript types based on the GraphQL schema
9. **GCS upload** — formats the build files as a dynamic module and uploads it to Google Cloud Storage

## Usage

### Basic Example

```yaml
- name: Build Static Data Query
  uses: ./build-static-data-query
  with:
    game: 'riftbound'
    graphql-endpoint: 'https://api.example.com/graphql'
    gcs-bucket-name: 'my-bucket'
    gcs-project-id: 'my-project-id'
    dynamic-modules-env: 'prod'
    gcp-service-account-json: ${{ secrets.GCP_SERVICE_ACCOUNT_JSON }}
```

### All Parameters

| Parameter | Description | Required | Default |
|-----------|-------------|----------|---------|
| `game` | Game slug (e.g., 'riftbound') | Yes | - |
| `graphql-endpoint` | GraphQL endpoint URL | Yes | - |
| `static-data-field-name` | Name of the static data field in the schema | No | `staticData` |
| `timeout` | Timeout for cursor-agent execution in milliseconds | No | `600000` (10 minutes) |
| `gcs-bucket-name` | Google Cloud Storage bucket name | Yes | - |
| `gcs-project-id` | Google Cloud Project ID | Yes | - |
| `dynamic-modules-env` | Environment for dynamic modules (prod, staging, dev) | Yes | - |
| `gcp-service-account-json` | GCP service account JSON credentials | Yes | - |
| `cursor-agent-version` | Cursor agent CLI version to install. Pinned so a new agent release cannot change the generated fragments unnoticed | No | `2026.10.22-27dcf5f` |
| `fragment-regression-retries` | How many times to regenerate the fragments when they are narrower or much larger than the live ones | No | `2` |
| `fragment-growth-max-ratio` | Fail when the new fragments select more than this many times the live field count | No | `3` |
| `fragment-max-depth-increase` | Fail when the new fragments nest more than this many levels deeper than the live ones | No | `1` |
| `allow-fragment-regression` | Publish even if the fragments are still narrower or larger after the retries. Only for an intended change | No | `false` |

### Output File Structure

After pipeline execution, the following structure is created:

```
build/
├── gql/
│   ├── fragments/              # GraphQL fragments for entity types
│   │   ├── *.gql.ts
│   │   └── gql-types/
│   ├── query/                  # Main GraphQL query
│   │   ├── *.gql.ts
│   │   └── gql-types/
│   └── gql-types/              # TypeScript types
│       ├── types.ts
│       └── possible-types.json
```

## Development

### Install Dependencies

```bash
npm install
```

### Build

```bash
npm run build
```

The build uses webpack to create a production-ready bundle in the `dist/` directory.

### Local Run

For local testing you need to rename .env.example to .env and specify required env vars
After that you can use:

```bash
npm run run:dev
```

This will run `test-run.js`, which allows you to test the pipeline locally.

### Clean

```bash
npm run clean
```

Removes the `dist/`, `build/`, and `_generated/` directories.

## License

MIT
