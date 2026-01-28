import pluralize from 'pluralize';
import {
    FieldConfig,
    ObjectConfig,
    GroupConfig,
    Schema,
    FIELD_TYPES,
    REQUIRED_FIELD_NAMES,
    MANUAL_FILL_PLACEHOLDER,
    REFERENCE_SUFFIX,
    GECK_REFERENCE_SUFFIXES
} from './schema';

// Internal interfaces for builder
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

interface ObjectConfigResult {
    config: ObjectConfig;
    valid: boolean;
}

// Constants for excluded field names
const EXCLUDED_FIELD_NAMES = ['gameId', 'gameID'] as const;

// Helper function to check if a field should be excluded
const isExcludedField = (fieldName: string): boolean => {
    return EXCLUDED_FIELD_NAMES.includes(fieldName as any);
};

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

const detectArrayType = (arr: any[], geckMode: boolean = false): ArrayTypeResult => {
    if (arr.length === 0) {
        return { type: FIELD_TYPES.STRING, valid: false };
    }
    
    // Find first non-null, non-undefined item
    let firstValidItem = null;
    for (const item of arr) {
        if (item !== null && item !== undefined) {
            firstValidItem = item;
            break;
        }
    }
    
    if (firstValidItem === null) {
        return { type: FIELD_TYPES.STRING, valid: false };
    }
    
    switch (typeof firstValidItem) {
        case 'boolean':
            return { type: FIELD_TYPES.BOOLEAN, valid: true };
        case 'string':
            return { type: FIELD_TYPES.STRING, valid: true };
        case 'number':
            if (geckMode) {
                return { type: FIELD_TYPES.STRING, valid: false };
            }
            return { 
                  type: Number.isInteger(firstValidItem) ? FIELD_TYPES.INT : FIELD_TYPES.FLOAT,
                  valid: true,
                };
        case 'object':
            if (!Array.isArray(firstValidItem)) {
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

const resolveRefTarget = (builder: GroupConfBuilder, fieldName: string, geckMode: boolean = false): string => {
    let refGroupName: string;
    
    if (geckMode) {
        refGroupName = fieldName.replace(new RegExp(`(${GECK_REFERENCE_SUFFIXES.join('|')})$`), '');
    } else {
        refGroupName = fieldName.replace(new RegExp(REFERENCE_SUFFIX + '$'), '');
    }
    
    let refGroupNamePlural = refGroupName;
    if (pluralize.isSingular(refGroupNamePlural)) {
        refGroupNamePlural = pluralize.plural(refGroupName);
    }

    if (refGroupName in builder.source) {
        return refGroupName;
    }
    if (refGroupNamePlural in builder.source) {
        return refGroupNamePlural;
    }
    return MANUAL_FILL_PLACEHOLDER;
};

const detectFieldConfig = (builder: GroupConfBuilder, fieldName: string, value: any, parentPath: string, geckMode: boolean = false): FieldConfig => {
    const fieldConfig: FieldConfig = { type: FIELD_TYPES.STRING };
   
    switch (typeof value) {
        case 'boolean':
            fieldConfig.type = FIELD_TYPES.BOOLEAN;
            break;
        case 'string':
            fieldConfig.type = FIELD_TYPES.STRING;
            break;
        case 'number':
            if (!geckMode) {
                fieldConfig.type = MANUAL_FILL_PLACEHOLDER;
                return fieldConfig;
            }
            fieldConfig.type = Number.isInteger(value) ? FIELD_TYPES.INT : FIELD_TYPES.FLOAT;
            break;
        case 'object':
            if (value === null) {
                fieldConfig.type = MANUAL_FILL_PLACEHOLDER;
                return fieldConfig;
            }
            if (Array.isArray(value)) {
                fieldConfig.array = true;
                if (value.length === 0) {
                    fieldConfig.type = MANUAL_FILL_PLACEHOLDER;
                    return fieldConfig;
                }
                const arrayTypeResult = detectArrayType(value, geckMode);
                if (!arrayTypeResult.valid) {
                    fieldConfig.type = MANUAL_FILL_PLACEHOLDER;
                    return fieldConfig;
                }
                fieldConfig.type = arrayTypeResult.type;
                if (arrayTypeResult.type === FIELD_TYPES.OBJECT) {
                    fieldConfig.objName = buildObjectName(parentPath, fieldName);
                }
            } else {
                fieldConfig.type = FIELD_TYPES.OBJECT;
                fieldConfig.objName = buildObjectName(parentPath, fieldName);
            }
            break;
        default:
            fieldConfig.type = MANUAL_FILL_PLACEHOLDER;
            return fieldConfig;
    }
    
    // Check for ref fields
    if (geckMode) {
        if (GECK_REFERENCE_SUFFIXES.some(suffix => fieldName.endsWith(suffix))) {
            fieldConfig.type = FIELD_TYPES.REF;
            fieldConfig.refTo = resolveRefTarget(builder, fieldName, geckMode);
        }
    } else {
        if (fieldName.endsWith(REFERENCE_SUFFIX)) {
            fieldConfig.type = FIELD_TYPES.REF;
            fieldConfig.refTo = resolveRefTarget(builder, fieldName, geckMode);
        }
    }
    
    return fieldConfig;
};

const detectGroupFields = (builder: GroupConfBuilder, fieldName: string, value: any, geckMode: boolean = false): void => {
    // Exclude specified fields
    if (isExcludedField(fieldName)) {
        return;
    }
    
    // Check if field already exists with a valid type (not placeholder)
    const existingField = builder.fields[fieldName];
    const hasValidType = existingField && existingField.type !== MANUAL_FILL_PLACEHOLDER;
    
    if (hasValidType) {
        return;
    }
    
    // Skip null or undefined values - we can't detect their type
    if (value === null || value === undefined) {
        return;
    }
    
    const fieldConfig = detectFieldConfig(builder, fieldName, value, '', geckMode);
    
    // Skip fields with undetectable types (null, empty arrays, etc.)
    if (fieldConfig.type === MANUAL_FILL_PLACEHOLDER) {
        return;
    }
    
    if (REQUIRED_FIELD_NAMES.includes(fieldName)) {
        fieldConfig.required = true;
        fieldConfig.filter = true;
    }
    
    builder.fields[fieldName] = fieldConfig;
};

const addDeprecatedField = (builder: GroupConfBuilder): void => {
    builder.fields["deprecated"] = { type: FIELD_TYPES.BOOLEAN, required: true };
};

const analyzeObjectStructure = (builder: GroupConfBuilder, objFieldName: string, obj: any, parentPath: string, geckMode: boolean = false): ObjectConfig => {
    const objConfig: ObjectConfig = {
        fields: {},
    };
    const currentObjectPath = buildObjectName(parentPath, objFieldName);
    
    for (const [fieldName, value] of Object.entries(obj)) {
        // Exclude specified fields
        if (isExcludedField(fieldName)) {
            continue;
        }
        
        // Skip null or undefined values - we can't detect their type
        if (value === null || value === undefined) {
            continue;
        }
        
        const fieldConfig = detectFieldConfig(builder, fieldName, value, currentObjectPath, geckMode);
        
        // Skip fields with undetectable types (null, empty arrays, etc.)
        if (fieldConfig.type === MANUAL_FILL_PLACEHOLDER) {
            continue;
        }
        
        objConfig.fields[fieldName] = fieldConfig;
    }
    return objConfig;
};

const analyzeObjectStructureFromArray = (builder: GroupConfBuilder, fieldName: string, arr: any[], parentPath: string, geckMode: boolean = false): ObjectConfig => {
    let accumulated: ObjectConfig = { fields: {} };
    for (const item of arr) {
        if (typeof item !== 'object' || item === null || Array.isArray(item)) {
            continue;
        }
        const objStruct = analyzeObjectStructure(builder, fieldName, item, parentPath, geckMode);
        accumulated = mergeObjectConfigs(accumulated, objStruct);
    }
    return accumulated;
};

const detectObjectConfig = (builder: GroupConfBuilder, fieldName: string, value: any, parentPath: string, geckMode: boolean = false): ObjectConfigResult => {
    if (typeof value !== 'object' || value === null || value === undefined) {
        return { config: { fields: {} }, valid: false };
    }
    if (Array.isArray(value)) {
        if (value.length === 0) {
            return { config: { fields: {} }, valid: false };
        }
        
        // Find first non-null, non-undefined item to check type
        let firstValidItem = null;
        for (const item of value) {
            if (item !== null && item !== undefined) {
                firstValidItem = item;
                break;
            }
        }
        
        if (!firstValidItem || typeof firstValidItem !== 'object' || Array.isArray(firstValidItem)) {
            return { config: { fields: {} }, valid: false };
        }
        
        return {
            config: analyzeObjectStructureFromArray(builder, fieldName, value, parentPath, geckMode),
            valid: true,
        };
    }

    return {
        config: analyzeObjectStructure(builder, fieldName, value, parentPath, geckMode),
        valid: true,
    };
};

const detectGroupObjects = (builder: GroupConfBuilder, fieldName: string, value: any, parentPath: string, geckMode: boolean = false): void => {
    if (typeof value !== 'object' || value === null || value === undefined) {
        return;
    }

    const result = detectObjectConfig(builder, fieldName, value, parentPath, geckMode);
    if (!result.valid) {
        return;
    }
    // Keep objects even if they have no fields - they can be filled manually later
    const fullObjName = buildObjectName(parentPath, fieldName);
    if (fullObjName in builder.objects) {
        const existing = builder.objects[fullObjName];
        builder.objects[fullObjName] = mergeObjectConfigs(existing, result.config);
    } else {
        builder.objects[fullObjName] = result.config;
    }

    // Recursively process nested objects within the current object's fields
    if (Array.isArray(value)) {
        for (const item of value) {
            if (typeof item !== 'object' || item === null || Array.isArray(item)) {
                continue;
            }
            for (const [k, vv] of Object.entries(item)) {
                detectGroupObjects(builder, k, vv, fullObjName, geckMode);
            }
        }
        return;
    }

    for (const [k, vv] of Object.entries(value)) {
        detectGroupObjects(builder, k, vv, fullObjName, geckMode);
    }
    return;
};

const buildGroupConfig = (builder: GroupConfBuilder, groupEntries: any[], geckMode: boolean = false): boolean => {
    if (groupEntries.length === 0) {
        return false;
    }
    
    for (const gEntry of groupEntries) {
        if (gEntry === null || gEntry === undefined || typeof gEntry !== 'object') {
            continue;
        }
        
        if (Object.keys(gEntry).length === 0) {
            continue;
        }

        for (const [fieldName, value] of Object.entries(gEntry)) {
            detectGroupFields(builder, fieldName, value, geckMode);
            detectGroupObjects(builder, fieldName, value, '', geckMode);
        }

        if (!geckMode) {
            addDeprecatedField(builder);
        }
    }
    
    return true;
};

export const generateSchemaFromData = (source: any, geckMode: boolean = false): Schema => {
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
        const success = buildGroupConfig(builder, groupEntries, geckMode);
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
