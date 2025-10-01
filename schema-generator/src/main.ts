#!/usr/bin/env node
/**
 * Schema Generator - Main entry point
 * 
 * This file serves as the main entry point and re-exports all functionality
 * from the refactored modules for backward compatibility.
 * It also provides CLI functionality when executed directly.
 */

import * as fs from 'fs';
import * as path from 'path';

// Re-export types and schema operations from schema.ts
export {
    FieldConfig,
    ObjectConfig,
    GroupConfig,
    Schema,
    RefConfig,
    VersionInfo,
    SchemaGenerationConfig,
    FIELD_TYPES,
    REQUIRED_FIELD_NAMES,
    MANUAL_FILL_PLACEHOLDER,
    REFERENCE_SUFFIX,
    REF_FIELD_NAME_SUFFIX,
    applyRefConfig
} from './schema';

// Re-export merge functions from merge.ts
export {
    mergeFieldConfig,
    mergeFields,
    mergeGroupObjects,
    mergeWithExistingSchema
} from './merge';

// Re-export serialization functions from serialization.ts
export { serializeToJson } from './serialization';

// Re-export schema building functions from build.ts
export { generateSchemaFromData } from './build';

// Re-export generator functions from generator.ts
export {
    readJsonFile,
    writeJsonFile,
    parseVersionFromFilename,
    findLatestStaticDataFile,
    processSchemaGeneration
} from './generator';

// Import for CLI functionality
import { SchemaGenerationConfig } from './schema';
import { processSchemaGeneration } from './generator';

// CLI functionality
const runCLI = (): void => {
    const args = process.argv.slice(2);
    
    if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
        console.log(`
Schema Generator - TypeScript Version

Usage: node schema-generator.js <static-data-path> [options]

Arguments:
  <static-data-path>        Path to the directory containing versioned static data files
                            (e.g., static_data_v0.0.1.json, static_data_v0.0.2.json)
                            The script will automatically find and use the latest version.

Options:
  --output, -o <file>       Output file path (default: static_data_latest_schema.json)
  --existing, -e <file>     Path to existing schema file to merge with
  --ref-config, -r <file>   Path to ref-config file
  --ignore-deleted          Ignore deleted fields/groups from existing schema (keeps metadata & refTo)
  --help, -h                Show this help message

Examples:
  node schema-generator.js ./data/static_data/
  node schema-generator.js ./data/static_data/ --output schema.json
  node schema-generator.js ./data/static_data/ --existing existing.json --ref-config refs.json
  node schema-generator.js /full/path/to/static_data/
        `);
        process.exit(0);
    }
    
    const staticDataPath = args[0];
    
    if (!fs.existsSync(staticDataPath)) {
        console.error(`Error: Static data path '${staticDataPath}' does not exist`);
        process.exit(1);
    }
    
    // Parse command line options
    let outputFile: string | undefined;
    let existingSchemaFile: string | undefined;
    let refConfigFile: string | undefined;
    let ignoreDeleted = false;
    
    for (let i = 1; i < args.length; i++) {
        const arg = args[i];
        const nextArg = args[i + 1];
        
        switch (arg) {
            case '--output':
            case '-o':
                if (nextArg && !nextArg.startsWith('-')) {
                    outputFile = nextArg;
                    i++; // Skip next argument
                } else {
                    console.error('Error: --output requires a file path');
                    process.exit(1);
                }
                break;
            case '--existing':
            case '-e':
                if (nextArg && !nextArg.startsWith('-')) {
                    existingSchemaFile = nextArg;
                    i++; // Skip next argument
                } else {
                    console.error('Error: --existing requires a file path');
                    process.exit(1);
                }
                break;
            case '--ref-config':
            case '-r':
                if (nextArg && !nextArg.startsWith('-')) {
                    refConfigFile = nextArg;
                    i++; // Skip next argument
                } else {
                    console.error('Error: --ref-config requires a file path');
                    process.exit(1);
                }
                break;
            case '--ignore-deleted':
                ignoreDeleted = true;
                break;
        }
    }
    
    // Set default output file if not specified
    if (!outputFile) {
        const staticDataDir = path.dirname(staticDataPath);
        outputFile = path.join(staticDataDir, 'schema.json');
    }
    
    try {
        const config: SchemaGenerationConfig = {
            staticDataPath,
            outputFilePath: outputFile,
            existingSchemaPath: existingSchemaFile,
            refConfigPath: refConfigFile,
            ignoreDeleted: ignoreDeleted
        };
        
        const result = processSchemaGeneration(config);
        console.log('Schema generation completed successfully!');
        console.log(`Output written to: ${outputFile}`);
    } catch (error) {
        console.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        process.exit(1);
    }
};

// Execute CLI when file is run directly
runCLI();
