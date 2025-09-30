/**
 * Schema Generator - Main entry point
 * 
 * This file serves as the main entry point and re-exports all functionality
 * from the refactored modules for backward compatibility.
 */

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

// Run CLI if this file is executed directly
if (require.main === module) {
    // Import and run the CLI
    require('./generator');
}
