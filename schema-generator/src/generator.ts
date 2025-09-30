import * as fs from 'fs';
import * as path from 'path';
import { Schema, RefConfig, SchemaGenerationConfig, VersionInfo, applyRefConfig } from './schema';
import { generateSchemaFromData } from './build';
import { mergeWithExistingSchema } from './merge';
import { serializeToJson } from './serialization';

// File system operations
export const readJsonFile = (filePath: string): any => {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(content);
    } catch (error) {
        throw new Error(`Error reading file ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};

export const writeJsonFile = (filePath: string, data: any): void => {
    try {
        const content = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
        fs.writeFileSync(filePath, content, 'utf8');
    } catch (error) {
        throw new Error(`Error writing file ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};

// Version parsing and file finding utilities
export const parseVersionFromFilename = (filename: string): VersionInfo | null => {
    // Match patterns like: static_data_v0.0.2.json, static_data_v1.2.3.json
    const versionMatch = filename.match(/static_data_v(\d+)\.(\d+)\.(\d+)\.json$/);
    if (!versionMatch) {
        return null;
    }
    
    const major = parseInt(versionMatch[1], 10);
    const minor = parseInt(versionMatch[2], 10);
    const patch = parseInt(versionMatch[3], 10);
    
    return {
        file: filename,
        version: versionMatch[0].replace(/\.json$/, ''),
        major,
        minor,
        patch
    };
};

export const findLatestStaticDataFile = (staticDataPath: string): string => {
    if (!fs.existsSync(staticDataPath)) {
        throw new Error(`Static data path does not exist: ${staticDataPath}`);
    }
    
    if (!fs.statSync(staticDataPath).isDirectory()) {
        throw new Error(`Static data path is not a directory: ${staticDataPath}`);
    }
    
    const files = fs.readdirSync(staticDataPath);
    const versionFiles: VersionInfo[] = [];
    
    // Find all files matching the version pattern
    for (const file of files) {
        const versionInfo = parseVersionFromFilename(file);
        if (versionInfo) {
            versionFiles.push(versionInfo);
        }
    }
    
    if (versionFiles.length === 0) {
        throw new Error(`No versioned static data files found in: ${staticDataPath}`);
    }
    
    // Sort by version (latest first)
    versionFiles.sort((a, b) => {
        if (a.major !== b.major) return b.major - a.major;
        if (a.minor !== b.minor) return b.minor - a.minor;
        return b.patch - a.patch;
    });
    
    const latestFile = path.join(staticDataPath, versionFiles[0].file);
    console.log(`Found latest static data file: ${versionFiles[0].file} (v${versionFiles[0].major}.${versionFiles[0].minor}.${versionFiles[0].patch})`);
    
    return latestFile;
};

// Main processing function
export const processSchemaGeneration = (config: SchemaGenerationConfig): string => {
    console.log(`Processing static data from path: ${config.staticDataPath}`);
    
    // Find the latest static data file
    const inputFilePath = findLatestStaticDataFile(config.staticDataPath);
    
    // Read input data
    const jsonData = readJsonFile(inputFilePath);
    
    // Generate schema
    let schema = generateSchemaFromData(jsonData);
    
    // Merge with existing schema if available
    if (config.existingSchemaPath && fs.existsSync(config.existingSchemaPath)) {
        console.log(`Merging with existing schema: ${config.existingSchemaPath}`);
        const existingSchemaData = readJsonFile(config.existingSchemaPath);
        schema = mergeWithExistingSchema(schema, existingSchemaData, config.ignoreDeleted || false);
    }
    
    // Apply ref-config if available
    if (config.refConfigPath && fs.existsSync(config.refConfigPath)) {
        console.log(`Applying ref-config: ${config.refConfigPath}`);
        const refConfigData = readJsonFile(config.refConfigPath);
        schema = applyRefConfig(schema, refConfigData);
    }
    
    // Serialize to JSON
    const processedSchema = serializeToJson(schema);
    
    // Write output file if specified
    if (config.outputFilePath) {
        writeJsonFile(config.outputFilePath, processedSchema);
        console.log(`Schema written to: ${config.outputFilePath}`);
    }
    
    return processedSchema;
};

// CLI interface
const main = (): void => {
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

// Run CLI if this file is executed directly
if (require.main === module) {
    main();
}
