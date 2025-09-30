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
    REF_FIELD_NAME_SUFFIX
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

interface FieldConfigResult {
    config: FieldConfig;
    valid: boolean;
}

interface ObjectConfigResult {
    config: ObjectConfig;
    valid: boolean;
}

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
    
    // Add required and filter for mandatory fields
    if (REQUIRED_FIELD_NAMES.includes(fieldName)) {
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
    
    return true;
};

export const generateSchemaFromData = (source: any): Schema => {
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
