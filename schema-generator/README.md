# Schema Generator

A TypeScript tool for generating schemas from static data files.

## Features

- Automatically generates schemas from versioned static data files
- Supports merging with existing schemas
- Handles reference configurations
- Type-safe field detection and validation

## Building

```bash
npm install
npm run build
```

## Running Tests

```bash
npm test
```

## CLI Usage

```bash
node dist/index.js <static-data-path> [options]
```

### Options

- `--output, -o <file>` - Output file path
- `--existing, -e <file>` - Path to existing schema file to merge with
- `--ref-config, -r <file>` - Path to ref-config file
- `--ignore-deleted` - Ignore deleted fields/groups from existing schema
- `--help, -h` - Show help message
