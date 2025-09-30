import { FieldConfig, ObjectConfig, GroupConfig, Schema, MANUAL_FILL_PLACEHOLDER } from './schema';

// Helper function to merge field configurations
export const mergeFieldConfig = (newFieldConfig: FieldConfig, existingFieldConfig: FieldConfig): FieldConfig => {
    const merged = { ...newFieldConfig };
    
    // Override refTo from existing if present
    if (!newFieldConfig.refTo || newFieldConfig.refTo === MANUAL_FILL_PLACEHOLDER) { 
        if (existingFieldConfig.refTo && existingFieldConfig.refTo !== MANUAL_FILL_PLACEHOLDER) {
            merged.refTo = existingFieldConfig.refTo;
        }
    }
    
    // Override filter from existing if it's true
    if (existingFieldConfig.filter === true) {
        merged.filter = true;
    }
    
    // Override required from existing if it's true
    if (existingFieldConfig.required === true) {
        merged.required = true;
    }
    
    return merged;
};

// Helper function to merge fields (works for both group fields and object fields)
export const mergeFields = (
    newFields: Record<string, FieldConfig>,
    existingFields: Record<string, FieldConfig>,
    ignoreDeleted: boolean
): void => {
    // First, merge fields that exist in new schema
    Object.keys(newFields).forEach(fieldName => {
        if (existingFields[fieldName]) {
            // Field exists in both - merge configurations selectively
            newFields[fieldName] = mergeFieldConfig(
                newFields[fieldName],
                existingFields[fieldName]
            );
        }
    });
    
    // Then, add fields that only exist in existing schema (if not ignoring deleted)
    if (!ignoreDeleted) {
        Object.keys(existingFields).forEach(fieldName => {
            if (!newFields[fieldName]) {
                // Field only exists in existing schema - add it completely
                newFields[fieldName] = existingFields[fieldName];
            }
        });
    }
};

// Helper function to merge group objects
export const mergeGroupObjects = (
    newGroup: GroupConfig,
    existingGroupObjects: Record<string, ObjectConfig>,
    ignoreDeleted: boolean
): void => {
    // First, merge objects that exist in new schema
    if (newGroup.objects) {
        Object.keys(newGroup.objects).forEach(objName => {
            const existingObj = existingGroupObjects[objName];
            if (existingObj?.fields) {
                // Object exists in both - merge fields
                mergeFields(newGroup.objects![objName].fields, existingObj.fields, ignoreDeleted);
            }
        });
    }
    
    // Then, add objects that only exist in existing schema (if not ignoring deleted)
    if (!ignoreDeleted) {
        Object.keys(existingGroupObjects).forEach(objName => {
            if (!newGroup.objects?.[objName]) {
                // Object only exists in existing schema - add it completely
                if (!newGroup.objects) {
                    newGroup.objects = {};
                }
                newGroup.objects[objName] = existingGroupObjects[objName];
            }
        });
    }
};

// Function to merge existing schema with new schema
export const mergeWithExistingSchema = (newSchema: Schema, existingSchema: Schema, ignoreDeleted: boolean = false): Schema => {
    if (!existingSchema || !existingSchema.groups) {
        return newSchema;
    }

    const result = JSON.parse(JSON.stringify(newSchema)) as Schema;
    
    // Always use namespace and typePrefix from existing schema if available
    if (existingSchema.namespace && existingSchema.namespace !== MANUAL_FILL_PLACEHOLDER) {
        result.namespace = existingSchema.namespace;
    }
    if (existingSchema.typePrefix && existingSchema.typePrefix !== MANUAL_FILL_PLACEHOLDER) {
        result.typePrefix = existingSchema.typePrefix;
    }
    
    // Always copy gqlTypesOverrides from existing schema if it exists
    if (existingSchema.gqlTypesOverrides) {
        result.gqlTypesOverrides = existingSchema.gqlTypesOverrides;
    }
    
    // First, merge groups that exist in new schema
    Object.keys(result.groups).forEach(groupName => {
        const existingGroup = existingSchema.groups[groupName];
        if (existingGroup) {
            const newGroup = result.groups[groupName];
            
            // Merge fields
            if (existingGroup.fields) {
                mergeFields(newGroup.fields, existingGroup.fields, ignoreDeleted);
            }
            
            // Merge objects
            if (existingGroup.objects) {
                mergeGroupObjects(newGroup, existingGroup.objects, ignoreDeleted);
            }
        }
    });
    
    // Then, add groups that only exist in existing schema (if not ignoring deleted)
    if (!ignoreDeleted) {
        Object.keys(existingSchema.groups).forEach(groupName => {
            if (!result.groups[groupName]) {
                // Group only exists in existing schema - add it completely
                result.groups[groupName] = existingSchema.groups[groupName];
            }
        });
    }
    
    return result;
};
