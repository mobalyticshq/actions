// Helper function to validate string format (letters and digits only)
import { Schema, SchemaField, SchemaGroup, SchemaObject, ValidationError } from './types';
import { readFileSync } from 'fs';
import { promisify } from 'util';
import { exec } from 'child_process';

const execAsync = promisify(exec);

function isValidString(str: string): boolean {
  return /^[a-zA-Z0-9]+$/.test(str);
}

// Helper function to validate string format for objects (letters only)
function isValidObjectString(str: string): boolean {
  return /^[a-zA-Z]+$/.test(str);
}

// Function to download reference schema from GCS
export async function downloadReferenceSchema(schemaPath: string): Promise<Schema | null> {
  try {
    const bucketName = process.env.GCP_BUCKET_NAME;
    if (!bucketName) {
      throw new Error('GCP_BUCKET_NAME environment variable is not set');
    }

    // Create path to file in bucket (remove local path and add bucket path)
    const schemaFileName = 'schema.json';
    const gcsPath = `gs://${bucketName}/${schemaPath}/${schemaFileName}`;

    console.log(`📥 Downloading reference schema from: ${gcsPath}`);

    // Download file from GCS
    const cmd = `gsutil cp ${gcsPath} /tmp/reference_schema.json`;
    await execAsync(cmd);

    // Read downloaded file
    const referenceSchemaContent = readFileSync('/tmp/reference_schema.json', 'utf8');
    const referenceSchema = JSON.parse(referenceSchemaContent) as Schema;

    console.log(`✅ Reference schema downloaded successfully`);
    return referenceSchema;
  } catch (error) {
    console.log(`⚠️ Could not download reference schema: ${error}`);
    return null;
  }
}

// Function to validate namespace and typePrefix
function validateNamespaceAndTypePrefix(newSchema: Schema, referenceSchema: Schema): ValidationError[] {
  const errors: ValidationError[] = [];

  if (newSchema.namespace !== referenceSchema.namespace) {
    errors.push({
      type: 'error',
      message: `Namespace changed from "${referenceSchema.namespace}" to "${newSchema.namespace}"`,
      path: 'namespace',
    });
  }

  if (newSchema.typePrefix !== referenceSchema.typePrefix) {
    errors.push({
      type: 'error',
      message: `TypePrefix changed from "${referenceSchema.typePrefix}" to "${newSchema.typePrefix}"`,
      path: 'typePrefix',
    });
  }

  return errors;
}

// Function to validate groups
function validateGroups(newSchema: Schema, referenceSchema: Schema): ValidationError[] {
  const errors: ValidationError[] = [];

  // Check that all groups from reference schema are present in new schema
  for (const groupName of Object.keys(referenceSchema.groups)) {
    if (!newSchema.groups[groupName]) {
      errors.push({
        type: 'error',
        message: `Group "${groupName}" was deleted`,
        path: `groups.${groupName}`,
      });
    }
  }

  return errors;
}

// Function to validate group fields
function validateGroupFields(newGroup: SchemaGroup, referenceGroup: SchemaGroup, groupName: string): ValidationError[] {
  const errors: ValidationError[] = [];

  // Check that all fields from reference group are present in new group
  for (const fieldName of Object.keys(referenceGroup.fields)) {
    if (!newGroup.fields[fieldName]) {
      errors.push({
        type: 'error',
        message: `Field "${fieldName}" was deleted from group "${groupName}"`,
        path: `groups.${groupName}.fields.${fieldName}`,
      });
      continue;
    }

    const newField = newGroup.fields[fieldName];
    const referenceField = referenceGroup.fields[fieldName];

    // Check field type
    if (newField.type !== referenceField.type) {
      errors.push({
        type: 'error',
        message: `Field type changed for "${fieldName}" in group "${groupName}" from "${referenceField.type}" to "${newField.type}"`,
        path: `groups.${groupName}.fields.${fieldName}.type`,
      });
    }

    // Check modifiers
    if (referenceField.required === true && newField.required !== true) {
      errors.push({
        type: 'error',
        message: `Field "${fieldName}" in group "${groupName}" lost required modifier`,
        path: `groups.${groupName}.fields.${fieldName}.required`,
      });
    }

    if (referenceField.filter === true && newField.filter !== true) {
      errors.push({
        type: 'error',
        message: `Field "${fieldName}" in group "${groupName}" lost filter modifier`,
        path: `groups.${groupName}.fields.${fieldName}.filter`,
      });
    }

    if (referenceField.array === true && newField.array !== true) {
      errors.push({
        type: 'error',
        message: `Field "${fieldName}" in group "${groupName}" lost array modifier`,
        path: `groups.${groupName}.fields.${fieldName}.array`,
      });
    }
  }

  return errors;
}

// Function to validate objects
function validateObjects(newGroup: SchemaGroup, referenceGroup: SchemaGroup, groupName: string): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!referenceGroup.objects) {
    return errors; // If reference group has no objects, everything is OK
  }

  if (!newGroup.objects) {
    errors.push({
      type: 'error',
      message: `All objects were deleted from group "${groupName}"`,
      path: `groups.${groupName}.objects`,
    });
    return errors;
  }

  // Check that all objects from reference group are present in new group
  for (const objectName of Object.keys(referenceGroup.objects)) {
    if (!newGroup.objects[objectName]) {
      errors.push({
        type: 'error',
        message: `Object "${objectName}" was deleted from group "${groupName}"`,
        path: `groups.${groupName}.objects.${objectName}`,
      });
      continue;
    }

    // Validate object fields
    const objectFieldErrors = validateGroupFields(
      { fields: newGroup.objects[objectName].fields },
      { fields: referenceGroup.objects[objectName].fields },
      `${groupName}.objects.${objectName}`,
    );
    errors.push(...objectFieldErrors);
  }

  return errors;
}

// Function to validate schema structure and format rules
export function validateSchemaStructure(schema: Schema): ValidationError[] {
  const errors: ValidationError[] = [];

  // 1. Validate namespace and typePrefix format
  if (!schema.namespace || !isValidString(schema.namespace)) {
    errors.push({
      type: 'error',
      message: `Namespace must be defined and contain only letters and digits, got: "${schema.namespace}"`,
      path: 'namespace',
    });
  }

  if (!schema.typePrefix || !isValidString(schema.typePrefix)) {
    errors.push({
      type: 'error',
      message: `TypePrefix must be defined and contain only letters and digits, got: "${schema.typePrefix}"`,
      path: 'typePrefix',
    });
  }

  // 2. Validate groups
  const groupNames = Object.keys(schema.groups);
  if (groupNames.length === 0) {
    errors.push({
      type: 'error',
      message: 'Groups cannot be empty',
      path: 'groups',
    });
  }

  // Check for unique group names and valid format
  const uniqueGroupNames = new Set<string>();
  for (const groupName of groupNames) {
    if (!isValidString(groupName)) {
      errors.push({
        type: 'error',
        message: `Group name must contain only letters and digits, got: "${groupName}"`,
        path: `groups.${groupName}`,
      });
    }

    if (uniqueGroupNames.has(groupName)) {
      errors.push({
        type: 'error',
        message: `Group name must be unique, duplicate found: "${groupName}"`,
        path: `groups.${groupName}`,
      });
    }
    uniqueGroupNames.add(groupName);
  }

  // 3. Validate each group
  for (const [groupName, group] of Object.entries(schema.groups)) {
    const groupErrors = validateGroupStructure(group, groupName, schema);
    errors.push(...groupErrors);
  }

  return errors;
}

// Function to validate group structure
export function validateGroupStructure(group: SchemaGroup, groupName: string, schema: Schema): ValidationError[] {
  const errors: ValidationError[] = [];

  // Check if group has at least one field (id)
  const fieldNames = Object.keys(group.fields);
  if (fieldNames.length === 0) {
    errors.push({
      type: 'error',
      message: `Group "${groupName}" must include at least one field`,
      path: `groups.${groupName}.fields`,
    });
  }

  // Check for id field
  if (!group.fields.id) {
    errors.push({
      type: 'error',
      message: `Group "${groupName}" must include an "id" field`,
      path: `groups.${groupName}.fields.id`,
    });
  }

  // Check for unique field names and valid format
  const uniqueFieldNames = new Set<string>();
  for (const fieldName of fieldNames) {
    if (!isValidString(fieldName)) {
      errors.push({
        type: 'error',
        message: `Field name must contain only letters and digits, got: "${fieldName}"`,
        path: `groups.${groupName}.fields.${fieldName}`,
      });
    }

    if (uniqueFieldNames.has(fieldName)) {
      errors.push({
        type: 'error',
        message: `Field name must be unique within group, duplicate found: "${fieldName}"`,
        path: `groups.${groupName}.fields.${fieldName}`,
      });
    }
    uniqueFieldNames.add(fieldName);
  }

  // Validate each field
  for (const [fieldName, field] of Object.entries(group.fields)) {
    const fieldErrors = validateFieldStructure(field, fieldName, groupName, group, schema);
    errors.push(...fieldErrors);
  }

  // Validate objects if they exist
  if (group.objects) {
    const objectErrors = validateObjectsStructure(group.objects, groupName, group, schema);
    errors.push(...objectErrors);
  }

  return errors;
}

// Function to validate field structure
export function validateFieldStructure(
  field: SchemaField,
  fieldName: string,
  groupName: string,
  group: SchemaGroup,
  schema: Schema,
): ValidationError[] {
  const errors: ValidationError[] = [];

  // 5. Validate field definitions (valid strings and allowed types)
  if (!isValidString(field.type)) {
    errors.push({
      type: 'error',
      message: `Field type must contain only letters and digits, got: "${field.type}"`,
      path: `groups.${groupName}.fields.${fieldName}.type`,
    });
  }

  // Validate that field type is one of the allowed types
  const allowedTypes = ['String', 'Boolean', 'Ref', 'Object'];
  if (!allowedTypes.includes(field.type)) {
    errors.push({
      type: 'error',
      message: `Field type must be one of: ${allowedTypes.join(', ')}, got: "${field.type}"`,
      path: `groups.${groupName}.fields.${fieldName}.type`,
    });
  }

  // 6. Validate objName values exist in objects
  if (field.objName) {
    if (!group.objects || !group.objects[field.objName]) {
      errors.push({
        type: 'error',
        message: `objName "${field.objName}" must exist in objects field within group "${groupName}"`,
        path: `groups.${groupName}.fields.${fieldName}.objName`,
      });
    }
  }

  // 7. Validate refTo values exist in groups
  if (field.refTo) {
    if (!schema.groups[field.refTo]) {
      errors.push({
        type: 'error',
        message: `refTo "${field.refTo}" must exist in groups keys in the schema`,
        path: `groups.${groupName}.fields.${fieldName}.refTo`,
      });
    }
  }

  // 8. Validate filters (only String type fields)
  if (field.filter === true && field.type !== 'String') {
    errors.push({
      type: 'error',
      message: `Filter modifier is only acceptable for fields with type String, got: "${field.type}"`,
      path: `groups.${groupName}.fields.${fieldName}.filter`,
    });
  }

  // 9. Validate Ref field name conflicts
  if (fieldName.endsWith('Ref')) {
    const baseFieldName = fieldName.slice(0, -3); // Remove "Ref" suffix
    if (group.fields[baseFieldName]) {
      errors.push({
        type: 'error',
        message: `Ref field name "${fieldName}" conflicts with field "${baseFieldName}" after trimming "Ref" suffix`,
        path: `groups.${groupName}.fields.${fieldName}`,
      });
    }
  }

  return errors;
}

// Function to validate objects structure
export function validateObjectsStructure(
  objects: Record<string, SchemaObject>,
  groupName: string,
  group: SchemaGroup,
  schema: Schema,
): ValidationError[] {
  const errors: ValidationError[] = [];

  // 4. Validate object names (unique, valid strings)
  const objectNames = Object.keys(objects);
  const uniqueObjectNames = new Set<string>();

  for (const objectName of objectNames) {
    if (!isValidObjectString(objectName)) {
      errors.push({
        type: 'error',
        message: `Object name must contain only letters, got: "${objectName}"`,
        path: `groups.${groupName}.objects.${objectName}`,
      });
    }

    if (uniqueObjectNames.has(objectName)) {
      errors.push({
        type: 'error',
        message: `Object name must be unique, duplicate found: "${objectName}"`,
        path: `groups.${groupName}.objects.${objectName}`,
      });
    }
    uniqueObjectNames.add(objectName);
  }

  // 5. Validate each object
  for (const [objectName, object] of Object.entries(objects)) {
    const objectErrors = validateObjectStructure(object, objectName, groupName, group, schema);
    errors.push(...objectErrors);
  }

  return errors;
}

// Function to validate object structure
export function validateObjectStructure(
  object: SchemaObject,
  objectName: string,
  groupName: string,
  group: SchemaGroup,
  schema: Schema,
): ValidationError[] {
  const errors: ValidationError[] = [];

  // Object must include at least one field
  const fieldNames = Object.keys(object.fields);
  if (fieldNames.length === 0) {
    errors.push({
      type: 'error',
      message: `Object "${objectName}" must include at least one field`,
      path: `groups.${groupName}.objects.${objectName}.fields`,
    });
  }

  // Check for unique field names and valid format
  const uniqueFieldNames = new Set<string>();
  for (const fieldName of fieldNames) {
    if (!isValidString(fieldName)) {
      errors.push({
        type: 'error',
        message: `Object field name must contain only letters and digits, got: "${fieldName}"`,
        path: `groups.${groupName}.objects.${objectName}.fields.${fieldName}`,
      });
    }

    if (uniqueFieldNames.has(fieldName)) {
      errors.push({
        type: 'error',
        message: `Object field name must be unique within object, duplicate found: "${fieldName}"`,
        path: `groups.${groupName}.objects.${objectName}.fields.${fieldName}`,
      });
    }
    uniqueFieldNames.add(fieldName);
  }

  // Validate each object field
  for (const [fieldName, field] of Object.entries(object.fields)) {
    const fieldErrors = validateObjectFieldStructure(field, fieldName, objectName, groupName, group, schema);
    errors.push(...fieldErrors);
  }

  return errors;
}

// Function to validate object field structure
export function validateObjectFieldStructure(
  field: SchemaField,
  fieldName: string,
  objectName: string,
  groupName: string,
  group: SchemaGroup,
  schema: Schema,
): ValidationError[] {
  const errors: ValidationError[] = [];

  // Validate field definitions (valid strings and allowed types)
  if (!isValidString(field.type)) {
    errors.push({
      type: 'error',
      message: `Object field type must contain only letters and digits, got: "${field.type}"`,
      path: `groups.${groupName}.objects.${objectName}.fields.${fieldName}.type`,
    });
  }

  // Validate that field type is one of the allowed types
  const allowedTypes = ['String', 'Boolean', 'Ref', 'Object'];
  if (!allowedTypes.includes(field.type)) {
    errors.push({
      type: 'error',
      message: `Object field type must be one of: ${allowedTypes.join(', ')}, got: "${field.type}"`,
      path: `groups.${groupName}.objects.${objectName}.fields.${fieldName}.type`,
    });
  }

  // Validate objName values exist in objects
  if (field.objName) {
    if (!group.objects || !group.objects[field.objName]) {
      errors.push({
        type: 'error',
        message: `objName "${field.objName}" must exist in objects field within group "${groupName}"`,
        path: `groups.${groupName}.objects.${objectName}.fields.${fieldName}.objName`,
      });
    }
  }

  // Validate refTo values exist in groups
  if (field.refTo) {
    if (!schema.groups[field.refTo]) {
      errors.push({
        type: 'error',
        message: `refTo "${field.refTo}" must exist in groups keys in the schema`,
        path: `groups.${groupName}.objects.${objectName}.fields.${fieldName}.refTo`,
      });
    }
  }

  // Validate Ref field name conflicts
  if (fieldName.endsWith('Ref')) {
    const baseFieldName = fieldName.slice(0, -3); // Remove "Ref" suffix
    if (group.fields[baseFieldName]) {
      errors.push({
        type: 'error',
        message: `Ref field name "${fieldName}" conflicts with field "${baseFieldName}" after trimming "Ref" suffix`,
        path: `groups.${groupName}.objects.${objectName}.fields.${fieldName}`,
      });
    }
  }

  return errors;
}

// Main validation function
export function validateSchemaCompatibility(newSchema: Schema, referenceSchema: Schema): ValidationError[] {
  const errors: ValidationError[] = [];

  // 1. Validate namespace and typePrefix
  errors.push(...validateNamespaceAndTypePrefix(newSchema, referenceSchema));

  // 2. Validate groups
  errors.push(...validateGroups(newSchema, referenceSchema));

  // 3. Validate fields and objects in each group
  for (const groupName of Object.keys(referenceSchema.groups)) {
    if (newSchema.groups[groupName]) {
      const newGroup = newSchema.groups[groupName];
      const referenceGroup = referenceSchema.groups[groupName];

      // Validate group fields
      errors.push(...validateGroupFields(newGroup, referenceGroup, groupName));

      // Validate group objects
      errors.push(...validateObjects(newGroup, referenceGroup, groupName));
    }
  }

  return errors;
}
