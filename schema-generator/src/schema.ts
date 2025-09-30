// Types and interfaces
export interface FieldConfig {
    type: string;
    array?: boolean;
    filter?: boolean;
    required?: boolean;
    objName?: string;
    refTo?: string;
}

export interface ObjectConfig {
    fields: Record<string, FieldConfig>;
}

export interface GroupConfig {
    fields: Record<string, FieldConfig>;
    objects?: Record<string, ObjectConfig>;
}

export interface Schema {
    namespace: string;
    typePrefix: string;
    gqlTypesOverrides?: Record<string, string>;
    groups: Record<string, GroupConfig>;
}

export interface RefConfig {
    refs: Array<{
        from: string;
        to: string;
    }>;
}

export interface VersionInfo {
    file: string;
    version: string;
    major: number;
    minor: number;
    patch: number;
}

export interface SchemaGenerationConfig {
    staticDataPath: string;
    outputFilePath?: string;
    existingSchemaPath?: string;
    refConfigPath?: string;
    ignoreDeleted?: boolean;
}

// Constants
export const FIELD_TYPES = {
    STRING: 'String',
    BOOLEAN: 'Boolean',
    OBJECT: 'Object',
    REF: 'Ref',
} as const;

export const REQUIRED_FIELD_NAMES = ['id', 'slug', 'name'];
export const MANUAL_FILL_PLACEHOLDER = '@@@ TO BE FILLED MANUALLY @@@';
export const REFERENCE_SUFFIX = 'Ref';
export const REF_FIELD_NAME_SUFFIX = 'Ref';

// Function to apply ref-config mappings
export const applyRefConfig = (schema: Schema, refConfig: RefConfig): Schema => {
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
