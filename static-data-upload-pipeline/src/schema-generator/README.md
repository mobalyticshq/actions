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
node dist/schema-generator.js <input-file> [options]
```

### Arguments

- `<input-file>` - **Required**. Path to the input JSON file containing static data

### Options

| Option | Short | Description | Default |
|--------|-------|-------------|---------|
| `--output` | `-o` | Output file path | `{input-file}_schema.json` |
| `--existing` | `-e` | Path to existing schema file to merge with | None |
| `--ref-config` | `-r` | Path to ref-config file for reference mappings | None |
| `--help` | `-h` | Show help message | - |

## Examples

### 1. Basic Schema Generation

Generate a schema from a JSON file:

```bash
node dist/schema-generator.js data/items.json
```

This creates `data/items_schema.json` with the generated schema.

### 2. Custom Output Path

Specify a custom output file:

```bash
node dist/schema-generator.js data/items.json --output schemas/items_schema.json
```

### 3. Merge with Existing Schema

Merge new schema with an existing one to preserve manual configurations:

```bash
node dist/schema-generator.js data/items.json --existing schemas/existing_schema.json
```

### 4. Apply Reference Configuration

Use a ref-config file to map reference relationships:

```bash
node dist/schema-generator.js data/items.json --ref-config config/refs.json
```

### 5. Full Configuration

Combine all options for complete schema generation:

```bash
node dist/schema-generator.js data/items.json \
  --output schemas/items_schema.json \
  --existing schemas/base_schema.json \
  --ref-config config/refs.json
```

## File Paths

### Input File

The input file should be a valid JSON file containing your static data. The structure should be organized by groups:

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

All file paths can be relative to the current working directory:

```bash
# From project root
node dist/schema-generator.js src/data/items.json

# From any subdirectory
cd src/data
node ../../dist/schema-generator.js items.json
```

### Absolute Paths

You can also use absolute paths:

```bash
node dist/schema-generator.js /full/path/to/data/items.json
```

### Path Examples

```bash
# Different directory structures
node dist/schema-generator.js ./data/items.json
node dist/schema-generator.js ../data/items.json
node dist/schema-generator.js ../../data/items.json
node dist/schema-generator.js /Users/username/project/data/items.json
```

## Error Handling

The tool provides clear error messages for common issues:

- **File not found**: `Error: Input file 'path/to/file.json' does not exist`
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
            data/static_data.json \
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
    "generate-schema": "node dist/schema-generator.js data/items.json --output schemas/items_schema.json",
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
