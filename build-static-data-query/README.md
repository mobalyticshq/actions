# Build Static Data Query

GitHub Action for automated building and processing of GraphQL queries for game static data.

## Description

This GitHub Action automates the process of creating optimized GraphQL queries for fetching game static data. The pipeline performs the following tasks:

1. **Schema version check** — determines if the GraphQL schema has changed to avoid unnecessary rebuilds
2. **Schema download** — downloads the current GraphQL schema from the specified endpoint
3. **Scope generation** — analyzes the schema and determines data scopes for a specific game
4. **Schema cleaning** — removes unused types and fields, keeping only those necessary for static data
5. **Fragment generation** — uses an AI agent (cursor-cli) to automatically generate GraphQL fragments for all entity types
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
