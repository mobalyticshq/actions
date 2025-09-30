# Schema Generator

A TypeScript tool for generating schemas from static data files.

## Features

- Automatically generates schemas from versioned static data files
- Supports merging with existing schemas
- Handles reference configurations
- Type-safe field detection and validation

## Installation

```bash
npm install
```

## Usage

### CLI

```bash
# Generate schema from static data directory
node dist/index.js <static-data-path> [options]

# Options:
#   --output, -o <file>       Output file path
#   --existing, -e <file>     Path to existing schema file to merge with
#   --ref-config, -r <file>   Path to ref-config file
```

### Programmatic

```typescript
import { processSchemaGeneration } from './src/schema-generator';

const schema = processSchemaGeneration('/path/to/static/data');
```

## Development

### Running Tests

```bash
npm test
npm run test:watch
npm run test:coverage
```

### Building

```bash
npm run build
```

## File Structure

- `src/schema-generator.ts` - Main schema generator logic
- `src/schema-generator.test.ts` - Unit tests
- `test/` - Test data files
- `dist/` - Compiled output
