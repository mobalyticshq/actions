import * as fs from 'fs';
import * as path from 'path';

// Types and interfaces
interface FieldConfig {
    type: string;
    array?: boolean;
    filter?: boolean;
    required?: boolean;
    objName?: string;
    refTo?: string;
}

interface ObjectConfig {
    fields: Record<string, FieldConfig>;
}

interface GroupConfig {
    fields: Record<string, FieldConfig>;
    objects?: Record<string, ObjectConfig>;
}

interface Schema {
    namespace: string;
    typePrefix: string;
    groups: Record<string, GroupConfig>;
}

interface RefConfig {
    refs: Array<{
        from: string;
        to: string;
    }>;
}

interface GroupConfBuilder {
    source: any;
    groupName: string;
    fields: Record<string, FieldConfig>;
    objects: Record<string, ObjectConfig>;
}

interface ArrayTypeResult {
    type: string;
    valid: boolean;
}

interface FieldConfigResult {
    config: FieldConfig;
    valid: boolean;
}

interface ObjectConfigResult {
    config: ObjectConfig;
    valid: boolean;
}

// Constants
const FIELD_TYPES = {
    STRING: 'String',
    BOOLEAN: 'Boolean',
    OBJECT: 'Object',
    REF: 'Ref',
} as const;

const FIELD_NAMES = {
    ID: 'id',
    SLUG: 'slug',
} as const;

const MANUAL_FILL_PLACEHOLDER = '@@@ TO BE FILLED MANUALLY @@@';
const REFERENCE_SUFFIX = 'Ref';
const REF_FIELD_NAME_SUFFIX = 'Ref';

// Utility functions
const capitalize = (s: string): string => {
    if (!s) return s;
    return s.charAt(0).toUpperCase() + s.slice(1);
};

const buildObjectName = (parentPath: string, objFieldName: string): string => {
    if (!parentPath) {
        return objFieldName;
    }
    return parentPath + capitalize(objFieldName);
};

const detectArrayType = (arr: any[]): ArrayTypeResult => {
    if (arr.length === 0) {
        return { type: FIELD_TYPES.STRING, valid: false };
    }
    const firstItem = arr[0];
    if (firstItem === null || firstItem === undefined) {
        return { type: FIELD_TYPES.STRING, valid: false };
    }
    switch (typeof firstItem) {
        case 'boolean':
            return { type: FIELD_TYPES.BOOLEAN, valid: true };
        case 'string':
            return { type: FIELD_TYPES.STRING, valid: true };
        case 'object':
            if (firstItem !== null && !Array.isArray(firstItem)) {
                return { type: FIELD_TYPES.OBJECT, valid: true };
            }
            return { type: FIELD_TYPES.STRING, valid: false };
        default:
            return { type: FIELD_TYPES.STRING, valid: false };
    }
};

const mergeObjectConfigs = (existing: ObjectConfig, newConfig: ObjectConfig): ObjectConfig => {
    const result: ObjectConfig = {
        fields: { ...existing.fields },
    };
    for (const [fieldName, fieldConfig] of Object.entries(newConfig.fields)) {
        if (!(fieldName in result.fields)) {
            result.fields[fieldName] = fieldConfig;
        }
    }
    return result;
};

const createGroupConfBuilder = (source: any, groupName: string): GroupConfBuilder => ({
    source,
    groupName,
    fields: {},
    objects: {},
});

// Simple pluralize implementation (since we can't use external libraries in Node.js)
const pluralize = {
    isSingular: (word: string): boolean => {
        return !word.endsWith('s') || word.endsWith('ss') || word.endsWith('us') || word.endsWith('is');
    },
    plural: (word: string): string => {
        if (word.endsWith('y') && !word.endsWith('ay') && !word.endsWith('ey') && !word.endsWith('oy') && !word.endsWith('uy')) {
            return word.slice(0, -1) + 'ies';
        }
        if (word.endsWith('s') || word.endsWith('sh') || word.endsWith('ch') || word.endsWith('x') || word.endsWith('z')) {
            return word + 'es';
        }
        return word + 's';
    }
};

const resolveRefTarget = (builder: GroupConfBuilder, fieldName: string, array: boolean): string => {
    let refGroup = fieldName.replace(new RegExp(REF_FIELD_NAME_SUFFIX + '$'), '');
    if (!array) {
        if (pluralize.isSingular(refGroup)) {
            refGroup = pluralize.plural(refGroup);
        }
    }
    if (!(refGroup in builder.source)) {
        return MANUAL_FILL_PLACEHOLDER;
    }
    return refGroup;
};

const detectFieldConfig = (builder: GroupConfBuilder, fieldName: string, value: any): FieldConfigResult => {
    const fieldConfig: FieldConfig = { type: FIELD_TYPES.STRING };
    if (fieldName === FIELD_NAMES.ID) {
        fieldConfig.filter = true;
        fieldConfig.required = true;
    }
    switch (typeof value) {
        case 'boolean':
            fieldConfig.type = FIELD_TYPES.BOOLEAN;
            break;
        case 'string':
            fieldConfig.type = FIELD_TYPES.STRING;
            break;
        case 'object':
            if (value === null) {
                return { config: fieldConfig, valid: false };
            }
            if (Array.isArray(value)) {
                fieldConfig.array = true;
                if (value.length === 0) {
                    return { config: fieldConfig, valid: false };
                }
                const arrayTypeResult = detectArrayType(value);
                if (!arrayTypeResult.valid) {
                    return { config: fieldConfig, valid: false };
                }
                fieldConfig.type = arrayTypeResult.type;
                if (arrayTypeResult.type === FIELD_TYPES.OBJECT) {
                    fieldConfig.objName = fieldName;
                }
            }
            else {
                fieldConfig.type = FIELD_TYPES.OBJECT;
                fieldConfig.objName = fieldName;
            }
            break;
        default:
            return { config: fieldConfig, valid: false };
    }
    if (fieldName.endsWith(REFERENCE_SUFFIX)) {
        fieldConfig.type = FIELD_TYPES.REF;
        fieldConfig.refTo = resolveRefTarget(builder, fieldName, fieldConfig.array || false);
    }
    return { config: fieldConfig, valid: true };
};

const detectGroupFields = (builder: GroupConfBuilder, fieldName: string, value: any): void => {
    const result = detectFieldConfig(builder, fieldName, value);
    if (!result.valid) {
        return;
    }
    if (fieldName in builder.fields) {
        return;
    }
    
    // Add required and filter for slug field (only in group fields, not in objects)
    if (fieldName === FIELD_NAMES.SLUG) {
        result.config.required = true;
        result.config.filter = true;
    }
    
    builder.fields[fieldName] = result.config;
};

const analyzeObjectStructure = (builder: GroupConfBuilder, objFieldName: string, obj: any, parentPath: string): ObjectConfig => {
    const objConfig: ObjectConfig = {
        fields: {},
    };
    for (const [fieldName, value] of Object.entries(obj)) {
        if (value === null || value === undefined) {
            continue;
        }
        const result = detectFieldConfig(builder, fieldName, value);
        if (!result.valid) {
            continue;
        }
        const detected = result.config;
        if (detected.type === FIELD_TYPES.OBJECT) {
            const nestedObjectParentPath = buildObjectName(parentPath, objFieldName);
            detected.objName = buildObjectName(nestedObjectParentPath, fieldName);
        }
        objConfig.fields[fieldName] = detected;
    }
    return objConfig;
};

const analyzeObjectStructureFromArray = (builder: GroupConfBuilder, fieldName: string, arr: any[], parentPath: string): ObjectConfig => {
    let accumulated: ObjectConfig = { fields: {} };
    for (const item of arr) {
        if (typeof item !== 'object' || item === null || Array.isArray(item)) {
            continue;
        }
        const objStruct = analyzeObjectStructure(builder, fieldName, item, parentPath);
        accumulated = mergeObjectConfigs(accumulated, objStruct);
    }
    return accumulated;
};

const detectObjectConfig = (builder: GroupConfBuilder, fieldName: string, value: any, parentPath: string): ObjectConfigResult => {
    if (typeof value !== 'object' || value === null) {
        return { config: { fields: {} }, valid: false };
    }
    if (Array.isArray(value)) {
        if (value.length === 0) {
            return { config: { fields: {} }, valid: false };
        }
        if (typeof value[0] !== 'object' || value[0] === null || Array.isArray(value[0])) {
            return { config: { fields: {} }, valid: false };
        }
        return {
            config: analyzeObjectStructureFromArray(builder, fieldName, value, parentPath),
            valid: true,
        };
    }
    else {
        return {
            config: analyzeObjectStructure(builder, fieldName, value, parentPath),
            valid: true,
        };
    }
};

const detectGroupObjects = (builder: GroupConfBuilder, fieldName: string, value: any, parentPath: string): void => {
    if (value === null || value === undefined) {
        return;
    }
    const result = detectObjectConfig(builder, fieldName, value, parentPath);
    if (!result.valid || Object.keys(result.config.fields).length === 0) {
        return;
    }
    const fullObjName = buildObjectName(parentPath, fieldName);
    if (fullObjName in builder.objects) {
        const existing = builder.objects[fullObjName];
        builder.objects[fullObjName] = mergeObjectConfigs(existing, result.config);
    }
    else {
        builder.objects[fullObjName] = result.config;
    }
    
    if (typeof value === 'object' && value !== null) {
        if (Array.isArray(value)) {
            for (const item of value) {
                if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
                    for (const [k, vv] of Object.entries(item)) {
                        detectGroupObjects(builder, k, vv, fullObjName);
                    }
                }
            }
        }
        else {
            for (const [k, vv] of Object.entries(value)) {
                detectGroupObjects(builder, k, vv, fullObjName);
            }
        }
    }
};

const buildGroupConfig = (builder: GroupConfBuilder, groupEntries: any[]): boolean => {
    if (groupEntries.length === 0) {
        return false;
    }
    for (const gEntry of groupEntries) {
        if (Object.keys(gEntry).length === 0) {
            continue;
        }
        for (const [fieldName, value] of Object.entries(gEntry)) {
            if (value === null || value === undefined) {
                continue;
            }
            detectGroupFields(builder, fieldName, value);
            detectGroupObjects(builder, fieldName, value, '');
        }
    }
    
    // Post-process: add required and filter for name field if slug exists
    if (builder.fields.name && builder.fields.slug) {
        builder.fields.name.required = true;
        builder.fields.name.filter = true;
    }
    
    return true;
};

const generateSchemaFromData = (source: any): Schema => {
    const schema: Schema = {
        namespace: MANUAL_FILL_PLACEHOLDER,
        typePrefix: MANUAL_FILL_PLACEHOLDER,
        groups: {},
    };
    for (const [groupName, groupEntries] of Object.entries(source)) {
        if (!Array.isArray(groupEntries) || groupEntries.length === 0) {
            continue;
        }
        const builder = createGroupConfBuilder(source, groupName);
        const success = buildGroupConfig(builder, groupEntries);
        if (!success) {
            continue;
        }
        const groupConfig: GroupConfig = {
            fields: builder.fields,
        };
        if (Object.keys(builder.objects).length > 0) {
            groupConfig.objects = builder.objects;
        }
        schema.groups[groupName] = groupConfig;
    }
    return schema;
};

const writeFieldConfigInline = (fieldConfig: FieldConfig): string => {
    const parts = [`"type": "${fieldConfig.type}"`];
    if (fieldConfig.array) {
        parts.push('"array": true');
    }
    if (fieldConfig.filter) {
        parts.push('"filter": true');
    }
    if (fieldConfig.required) {
        parts.push('"required": true');
    }
    if (fieldConfig.objName) {
        parts.push(`"objName": "${fieldConfig.objName}"`);
    }
    if (fieldConfig.refTo) {
        parts.push(`"refTo": "${fieldConfig.refTo}"`);
    }
    return `{ ${parts.join(', ')} }`;
};

const serializeToJson = (cfg: Schema): string => {
    const indent = (n: number): string => '  '.repeat(n);
    const lines: string[] = [];
    lines.push('{');
    lines.push(`${indent(1)}"namespace": "${cfg.namespace}",`);
    lines.push(`${indent(1)}"typePrefix": "${cfg.typePrefix}",`);
    lines.push(`${indent(1)}"groups": {`);
    const groupNames = Object.keys(cfg.groups).sort();
    groupNames.forEach((groupName, groupIdx) => {
        const group = cfg.groups[groupName];
        if (groupIdx > 0) {
            lines.push(',');
        }
        lines.push(`${indent(2)}"${groupName}": {`);
        lines.push(`${indent(3)}"fields": {`);
        const fieldNames = Object.keys(group.fields).sort();
        if (fieldNames.length > 0) {
            fieldNames.forEach((fieldName, fieldIdx) => {
                const fieldConfig = group.fields[fieldName];
                const comma = fieldIdx < fieldNames.length - 1 ? ',' : '';
                lines.push(`${indent(4)}"${fieldName}": ${writeFieldConfigInline(fieldConfig)}${comma}`);
            });
        }
        lines.push(`${indent(3)}}`);
        if (group.objects && Object.keys(group.objects).length > 0) {
            lines.push(',');
            lines.push(`${indent(3)}"objects": {`);
            const objNames = Object.keys(group.objects).sort();
            objNames.forEach((objName, objIdx) => {
                const obj = group.objects![objName];
                if (objIdx > 0) {
                    lines.push(',');
                }
                lines.push(`${indent(4)}"${objName}": {`);
                lines.push(`${indent(5)}"fields": {`);
                const objFieldNames = Object.keys(obj.fields).sort();
                if (objFieldNames.length > 0) {
                    objFieldNames.forEach((fieldName, fieldIdx) => {
                        const fieldConfig = obj.fields[fieldName];
                        const comma = fieldIdx < objFieldNames.length - 1 ? ',' : '';
                        lines.push(`${indent(6)}"${fieldName}": ${writeFieldConfigInline(fieldConfig)}${comma}`);
                    });
                }
                lines.push(`${indent(5)}}`);
                lines.push(`${indent(4)}}`);
            });
            lines.push(`${indent(3)}}`);
        }
        lines.push(`${indent(2)}}`);
    });
    if (groupNames.length > 0) {
        lines.push('');
    }
    lines.push(`${indent(1)}}`);
    lines.push('}');
    return lines.join('\n');
};

// Function to apply ref-config mappings
const applyRefConfig = (schema: Schema, refConfig: RefConfig): Schema => {
    if (!refConfig || !refConfig.refs) return schema;

    const refMap: Record<string, string> = {};
    refConfig.refs.forEach(ref => {
        refMap[ref.from] = ref.to;
    });

    // Create a deep copy of the schema
    const result = JSON.parse(JSON.stringify(schema)) as Schema;

    // Iterate through groups
    Object.keys(result.groups).forEach(groupName => {
        const group = result.groups[groupName];
        
        // Check fields in the group
        if (group.fields) {
            Object.keys(group.fields).forEach(fieldName => {
                const field = group.fields[fieldName];
                const fullPath = `${groupName}.${fieldName}`;
                
                if (field.type === 'Ref' && field.refTo === MANUAL_FILL_PLACEHOLDER) {
                    if (refMap[fullPath]) {
                        field.refTo = refMap[fullPath];
                    }
                }
            });
        }
        
        // Check fields in nested objects
        if (group.objects) {
            Object.keys(group.objects).forEach(objName => {
                const obj = group.objects![objName];
                if (obj.fields) {
                    Object.keys(obj.fields).forEach(fieldName => {
                        const field = obj.fields[fieldName];
                        // For nested objects, we need to construct the path differently
                        // The path should be groupName.fieldName for the original data structure
                        const fullPath = `${groupName}.${fieldName}`;
                        
                        if (field.type === 'Ref' && field.refTo === MANUAL_FILL_PLACEHOLDER) {
                            if (refMap[fullPath]) {
                                field.refTo = refMap[fullPath];
                            }
                        }
                    });
                }
            });
        }
    });

    return result;
};

// Function to merge existing schema with new schema
const mergeWithExistingSchema = (newSchema: Schema, existingSchema: Schema): Schema => {
    if (!existingSchema || !existingSchema.groups) {
        return newSchema;
    }

    const result = JSON.parse(JSON.stringify(newSchema)) as Schema;
    
    // Use namespace and typePrefix from existing schema if available
    if (existingSchema.namespace && existingSchema.namespace !== MANUAL_FILL_PLACEHOLDER) {
        result.namespace = existingSchema.namespace;
    }
    if (existingSchema.typePrefix && existingSchema.typePrefix !== MANUAL_FILL_PLACEHOLDER) {
        result.typePrefix = existingSchema.typePrefix;
    }
    
    // Merge groups from existing schema
    Object.keys(existingSchema.groups).forEach(groupName => {
        if (result.groups[groupName]) {
            // Group exists in both schemas - merge fields and objects
            const existingGroup = existingSchema.groups[groupName];
            const newGroup = result.groups[groupName];
            
            // Preserve existing fields
            if (existingGroup.fields) {
                Object.keys(existingGroup.fields).forEach(fieldName => {
                    if (newGroup.fields[fieldName]) {
                        // Field exists in both - preserve existing configuration
                        newGroup.fields[fieldName] = existingGroup.fields[fieldName];
                    } else {
                        // Field only exists in existing schema - add it
                        newGroup.fields[fieldName] = existingGroup.fields[fieldName];
                    }
                });
            }
            
            // Preserve existing objects
            if (existingGroup.objects) {
                if (!newGroup.objects) {
                    newGroup.objects = {};
                }
                Object.keys(existingGroup.objects).forEach(objName => {
                    if (newGroup.objects![objName]) {
                        // Object exists in both - merge fields
                        const existingObj = existingGroup.objects![objName];
                        const newObj = newGroup.objects![objName];
                        
                        if (existingObj.fields) {
                            Object.keys(existingObj.fields).forEach(fieldName => {
                                if (newObj.fields[fieldName]) {
                                    // Field exists in both - preserve existing configuration
                                    newObj.fields[fieldName] = existingObj.fields[fieldName];
                                } else {
                                    // Field only exists in existing schema - add it
                                    newObj.fields[fieldName] = existingObj.fields[fieldName];
                                }
                            });
                        }
                    } else {
                        // Object only exists in existing schema - add it
                        newGroup.objects![objName] = existingGroup.objects![objName];
                    }
                });
            }
        } else {
            // Group only exists in existing schema - add it completely
            result.groups[groupName] = existingSchema.groups[groupName];
        }
    });
    
    return result;
};

// File system operations
const readJsonFile = (filePath: string): any => {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(content);
    } catch (error) {
        throw new Error(`Error reading file ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};

const writeJsonFile = (filePath: string, data: any): void => {
    try {
        const content = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
        fs.writeFileSync(filePath, content, 'utf8');
    } catch (error) {
        throw new Error(`Error writing file ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};

// Version parsing and file finding utilities
interface VersionInfo {
    file: string;
    version: string;
    major: number;
    minor: number;
    patch: number;
}

interface SchemaGenerationConfig {
    staticDataPath: string;
    outputFilePath?: string;
    existingSchemaPath?: string;
    refConfigPath?: string;
}

const parseVersionFromFilename = (filename: string): VersionInfo | null => {
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

const findLatestStaticDataFile = (staticDataPath: string): string => {
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
const processSchemaGeneration = (config: SchemaGenerationConfig): string => {
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
        schema = mergeWithExistingSchema(schema, existingSchemaData);
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
            refConfigPath: refConfigFile
        };
        
        const result = processSchemaGeneration(config);
        console.log('Schema generation completed successfully!');
        console.log(`Output written to: ${outputFile}`);
    } catch (error) {
        console.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        process.exit(1);
    }
};

// Export functions for use as a module
export {
    generateSchemaFromData,
    applyRefConfig,
    mergeWithExistingSchema,
    processSchemaGeneration,
    readJsonFile,
    writeJsonFile,
    findLatestStaticDataFile,
    parseVersionFromFilename,
    Schema,
    FieldConfig,
    GroupConfig,
    ObjectConfig,
    RefConfig,
    VersionInfo,
    SchemaGenerationConfig
};

// Run CLI if this file is executed directly
if (require.main === module) {
    main();
}
