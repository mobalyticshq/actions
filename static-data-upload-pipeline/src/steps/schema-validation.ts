import { logger } from '../logger';
import { SlackMessageManager } from '../utils/slack-manager.utils';
import { readFileSync, writeFileSync } from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Types for schema
interface SchemaField {
  type: string;
  array?: boolean;
  required?: boolean;
  filter?: boolean;
  refTo?: string;
  objName?: string;
}

interface SchemaObject {
  fields: Record<string, SchemaField>;
}

interface SchemaGroup {
  fields: Record<string, SchemaField>;
  objects?: Record<string, SchemaObject>;
}

interface Schema {
  namespace: string;
  typePrefix: string;
  groups: Record<string, SchemaGroup>;
}

interface ValidationError {
  type: 'error' | 'warning';
  message: string;
  path?: string;
}

// Function to download reference schema from GCS
async function downloadReferenceSchema(schemaPath: string): Promise<Schema | null> {
  try {
    const bucketName = process.env.GCP_BUCKET_NAME;
    if (!bucketName) {
      throw new Error('GCP_BUCKET_NAME environment variable is not set');
    }

    // Create path to file in bucket (remove local path and add bucket path)
    const schemaFileName = 'schema.json';
    const gcsPath = `gs://${bucketName}/${schemaFileName}`;
    
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
      path: 'namespace'
    });
  }
  
  if (newSchema.typePrefix !== referenceSchema.typePrefix) {
    errors.push({
      type: 'error',
      message: `TypePrefix changed from "${referenceSchema.typePrefix}" to "${newSchema.typePrefix}"`,
      path: 'typePrefix'
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
        path: `groups.${groupName}`
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
        path: `groups.${groupName}.fields.${fieldName}`
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
        path: `groups.${groupName}.fields.${fieldName}.type`
      });
    }
    
    // Check modifiers
    if (referenceField.required === true && newField.required !== true) {
      errors.push({
        type: 'error',
        message: `Field "${fieldName}" in group "${groupName}" lost required modifier`,
        path: `groups.${groupName}.fields.${fieldName}.required`
      });
    }
    
    if (referenceField.filter === true && newField.filter !== true) {
      errors.push({
        type: 'error',
        message: `Field "${fieldName}" in group "${groupName}" lost filter modifier`,
        path: `groups.${groupName}.fields.${fieldName}.filter`
      });
    }
    
    if (referenceField.array === true && newField.array !== true) {
      errors.push({
        type: 'error',
        message: `Field "${fieldName}" in group "${groupName}" lost array modifier`,
        path: `groups.${groupName}.fields.${fieldName}.array`
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
      path: `groups.${groupName}.objects`
    });
    return errors;
  }
  
  // Check that all objects from reference group are present in new group
  for (const objectName of Object.keys(referenceGroup.objects)) {
    if (!newGroup.objects[objectName]) {
      errors.push({
        type: 'error',
        message: `Object "${objectName}" was deleted from group "${groupName}"`,
        path: `groups.${groupName}.objects.${objectName}`
      });
      continue;
    }
    
    // Validate object fields
    const objectFieldErrors = validateGroupFields(
      { fields: newGroup.objects[objectName].fields },
      { fields: referenceGroup.objects[objectName].fields },
      `${groupName}.objects.${objectName}`
    );
    errors.push(...objectFieldErrors);
  }
  
  return errors;
}

// Main validation function
function validateSchemaCompatibility(newSchema: Schema, referenceSchema: Schema): ValidationError[] {
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

export async function schemaValidationStep(
  slackManager: SlackMessageManager,
  schemaPath: string,
) {
  logger.group('📋 Validate schema.json');
  await slackManager.sendOrUpdate(`Validating schema.json...`, ':clipboard:', true);

  try {
    console.log(`ℹ️ Schema validation for: ${schemaPath}`);
    
    // Read new schema
    const newSchemaContent = readFileSync(schemaPath, 'utf8');
    const newSchema = JSON.parse(newSchemaContent) as Schema;
    
    // Download reference schema from GCS
    const referenceSchema = await downloadReferenceSchema(schemaPath);
    
    if (!referenceSchema) {
      console.log(`⚠️ No reference schema found, skipping backward compatibility validation`);
      console.log(`✅ Schema file found and ready for validation`);
      logger.endGroup();
      return { success: true };
    }
    
    // Perform compatibility validation
    const validationErrors = validateSchemaCompatibility(newSchema, referenceSchema);
    
    if (validationErrors.length === 0) {
      console.log(`✅ Schema backward compatibility validation passed`);
      await slackManager.sendOrUpdate(
        `Schema backward compatibility validation passed`,
        ':white_check_mark:',
        true,
      );
    } else {
      console.log(`❌ Schema backward compatibility validation failed:`);
      
      const errorCount = validationErrors.filter(e => e.type === 'error').length;
      const warningCount = validationErrors.filter(e => e.type === 'warning').length;
      
      console.log(`   Errors: ${errorCount}, Warnings: ${warningCount}`);
      
      // Log all errors
      for (const error of validationErrors) {
        console.log(`   ${error.type.toUpperCase()}: ${error.message}`);
        if (error.path) {
          console.log(`     Path: ${error.path}`);
        }
      }
      
      // Send notification to Slack
      const errorSummary = validationErrors
        .slice(0, 5) // Show only first 5 errors
        .map(e => `• ${e.message}`)
        .join('\n');
      
      const moreErrors = validationErrors.length > 5 ? `\n... and ${validationErrors.length - 5} more errors` : '';
      
      await slackManager.sendOrUpdate(
        `Schema backward compatibility validation failed ❌\n\n${errorSummary}${moreErrors}`,
        ':warning:',
        true,
      );
      
      // If there are critical errors, stop execution
      if (errorCount > 0) {
        throw new Error(`Schema backward compatibility validation failed with ${errorCount} errors`);
      }
    }
    
    logger.endGroup();
    return { success: true };
  } catch (error) {
    console.log(`❌ Schema validation error: ${error}`);
    await slackManager.sendOrUpdate(
      `Schema validation failed: ${error}`,
      ':warning:',
      true,
    );
    logger.endGroup();
    
    return { success: false, error };
  }
}
