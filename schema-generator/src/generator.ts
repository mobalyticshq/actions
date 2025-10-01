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
