# Schema Generator CLI

A TypeScript-based command-line tool for generating JSON schemas from static data files. This tool analyzes JSON data structures and automatically generates comprehensive schemas with field types, validation rules, and object relationships.

## Features

- **Automatic Schema Generation**: Analyzes JSON data and generates schemas with proper field types
- **Schema Merging**: Merge new schemas with existing ones to preserve manual configurations
- **Reference Configuration**: Apply reference mappings for complex object relationships
- **TypeScript Support**: Fully typed with comprehensive error handling
- **CI/CD Ready**: Designed for use in automated pipelines

## Installation

### Prerequisites

- Node.js (v14 or higher)
- TypeScript (for compilation)

### Setup

1. Navigate to the project directory:
```bash
cd static-data-upload-pipeline
```

2. Install dependencies:
```bash
npm install
```

3. Compile the TypeScript file:
```bash
npx tsc src/schema-generator/schema-generator.ts --outDir dist --target es2020 --module commonjs --esModuleInterop --allowSyntheticDefaultImports
```

## Usage

### Basic Syntax

```bash
node dist/schema-generator.js <static-data-path> [options]
```

### Arguments

- `<static-data-path>` - **Required**. Path to the directory containing versioned static data files (e.g., `static_data_v0.0.1.json`, `static_data_v0.0.2.json`). The script will automatically find and use the latest version.

### Options

| Option | Short | Description | Default |
|--------|-------|-------------|---------|
| `--output` | `-o` | Output file path | `static_data_latest_schema.json` |
| `--existing` | `-e` | Path to existing schema file to merge with | None |
| `--ref-config` | `-r` | Path to ref-config file for reference mappings | None |
| `--help` | `-h` | Show help message | - |

## Examples

### 1. Basic Schema Generation

Generate a schema from the latest version in a directory:

```bash
node dist/schema-generator.js data/static_data/
```

This automatically finds the latest versioned file (e.g., `static_data_v0.0.7.json`) and creates `static_data_latest_schema.json` with the generated schema.

### 2. Custom Output Path

Specify a custom output file:

```bash
node dist/schema-generator.js data/static_data/ --output schemas/latest_schema.json
```

### 3. Merge with Existing Schema

Merge new schema with an existing one to preserve manual configurations:

```bash
node dist/schema-generator.js data/static_data/ --existing schemas/existing_schema.json
```

### 4. Apply Reference Configuration

Use a ref-config file to map reference relationships:

```bash
node dist/schema-generator.js data/static_data/ --ref-config config/refs.json
```

### 5. Full Configuration

Combine all options for complete schema generation:

```bash
node dist/schema-generator.js data/static_data/ \
  --output schemas/latest_schema.json \
  --existing schemas/base_schema.json \
  --ref-config config/refs.json
```

## File Paths

### Static Data Directory

The static data directory should contain versioned JSON files following the naming pattern `static_data_v{major}.{minor}.{patch}.json`. The script will automatically find and use the latest version. Example files:

```
data/static_data/
├── static_data_v0.0.1.json
├── static_data_v0.0.2.json
├── static_data_v0.0.7.json
└── static_data_v1.0.0.json  ← Latest version (will be used)
```

Each JSON file should contain your static data organized by groups:

```json
{
  "items": [
    {
      "id": "sword_001",
      "name": "Iron Sword",
      "type": "weapon",
      "stats": {
        "damage": 100,
        "durability": 80
      }
    }
  ],
  "characters": [
    {
      "id": "char_001",
      "name": "Warrior",
      "level": 1
    }
  ]
}
```

### Output File

The generated schema will have the following structure:

```json
{
  "namespace": "@@@ TO BE FILLED MANUALLY @@@",
  "typePrefix": "@@@ TO BE FILLED MANUALLY @@@",
  "groups": {
    "items": {
      "fields": {
        "id": { "type": "String", "filter": true, "required": true },
        "name": { "type": "String", "filter": true, "required": true },
        "type": { "type": "String" }
      },
      "objects": {
        "stats": {
          "fields": {
            "damage": { "type": "String" },
            "durability": { "type": "String" }
          }
        }
      }
    }
  }
}
```

### Existing Schema File

When merging with an existing schema, the tool preserves:
- `namespace` and `typePrefix` values
- Existing field configurations
- Manual object definitions

### Ref-Config File

Reference configuration file format:

```json
{
  "refs": [
    {
      "from": "items.stats.weaponTypeRef",
      "to": "weaponTypes"
    },
    {
      "from": "characters.classRef",
      "to": "classes"
    }
  ]
}
```

## Path Resolution

### Relative Paths

All directory paths can be relative to the current working directory:

```bash
# From project root
node dist/schema-generator.js src/data/static_data/

# From any subdirectory
cd src/data
node ../../dist/schema-generator.js static_data/
```

### Absolute Paths

You can also use absolute paths:

```bash
node dist/schema-generator.js /full/path/to/static_data/
```

### Path Examples

```bash
# Different directory structures
node dist/schema-generator.js ./data/static_data/
node dist/schema-generator.js ../data/static_data/
node dist/schema-generator.js ../../data/static_data/
node dist/schema-generator.js /Users/username/project/data/static_data/
```

## Error Handling

The tool provides clear error messages for common issues:

- **Directory not found**: `Error: Static data path 'path/to/directory' does not exist`
- **No versioned files**: `Error: No versioned static data files found in: path/to/directory`
- **Invalid JSON**: `Error reading file path/to/file.json: Unexpected token...`
- **Missing required options**: `Error: --output requires a file path`
- **Invalid schema format**: `Error: Existing schema must contain "groups" object`

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Generate Schema
on: [push, pull_request]

jobs:
  generate-schema:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm install
        
      - name: Compile TypeScript
        run: npx tsc src/schema-generator/schema-generator.ts --outDir dist --target es2020 --module commonjs --esModuleInterop --allowSyntheticDefaultImports
        
      - name: Generate Schema
        run: |
          node dist/schema-generator.js \
            data/static_data/ \
            --output schemas/generated_schema.json \
            --existing schemas/base_schema.json \
            --ref-config config/refs.json
            
      - name: Upload Schema
        uses: actions/upload-artifact@v3
        with:
          name: generated-schema
          path: schemas/generated_schema.json
```

### Local Development

For local development, you can create a simple npm script in `package.json`:

```json
{
  "scripts": {
    "generate-schema": "node dist/schema-generator.js data/static_data/ --output schemas/latest_schema.json",
    "build-schema": "npx tsc src/schema-generator/schema-generator.ts --outDir dist --target es2020 --module commonjs --esModuleInterop --allowSyntheticDefaultImports"
  }
}
```

Then run:

```bash
npm run build-schema
npm run generate-schema
```

## Troubleshooting

### Common Issues

1. **"Cannot find module" error**: Make sure you've compiled the TypeScript file first
2. **"Input file does not exist"**: Check the file path and ensure the file exists
3. **"Invalid JSON" error**: Validate your input JSON file format
4. **Permission denied**: Ensure you have read/write permissions for the specified directories

### Debug Mode

For debugging, you can add console.log statements or use Node.js debugger:

```bash
node --inspect dist/schema-generator.js data/items.json
```

## Support

For issues or questions, please check the project documentation or create an issue in the repository.
