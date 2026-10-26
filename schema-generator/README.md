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

## Merging with an existing schema

- Field types and `refTo` from the existing schema win over the ones inferred from data, so regeneration never changes the type of an existing field. Group `wiki` configs and the `filter`, `required`, `translatable` and `refFilters` annotations are carried over too.
- A reference that neither the data nor the ref-config resolves is written as `String` and logged. To make a new field a `Ref`, map it in the ref-config before the field is first generated: `{ "refs": [{ "from": "<group>.<field>", "to": "<target group>" }] }` (fields of nested objects use the group name too).
