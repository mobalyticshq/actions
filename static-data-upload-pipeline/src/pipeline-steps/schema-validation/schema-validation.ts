import { ApiSchema, ValidationError } from './types';
import { downloadReferenceSchema, validateSchemaCompatibility, validateSchemaStructure } from './utils';
import { SlackMessageManagerV2 } from '../../utils/slack-manager-v2.utils';

export async function schemaValidationStep(
  actionUrl: string,
  slackManager: SlackMessageManagerV2,
  apiSchema: ApiSchema,
  staticDataPath: string,
  skipBackwardCompatibilityValidation = false,
) {
  await slackManager.appendNewLine({
    id: 'schema-validation',
    content: `Validating schema.json...`,
    emoji: ':clipboard:',
  });

  try {
    let structureErrors: ValidationError[] = [];
    let compatibilityErrors: ValidationError[] = [];

    // Always perform structure validation first
    structureErrors = validateSchemaStructure(apiSchema);

    if (!skipBackwardCompatibilityValidation) {
      // Download reference schema from GCS
      const referenceSchema = await downloadReferenceSchema(staticDataPath);

      if (!referenceSchema) {
        console.log(`⚠️ No reference schema found, skipping backward compatibility validation`);
      } else {
        // Perform compatibility validation
        compatibilityErrors = validateSchemaCompatibility(apiSchema, referenceSchema);
      }
    }

    // Combine all validation errors
    const validationErrors = [...structureErrors, ...compatibilityErrors];

    if (validationErrors.length === 0) {
      console.log(`✅ Schema validation passed`);
      await slackManager.updateMessage(
        'schema-validation',
        `Schema validation passed`,
        ':white_check_mark:',
      )
    } else {
      console.log(`❌ Schema validation failed:`);

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

      // If there are critical errors, return them instead of throwing
      if (errorCount > 0) {
        await slackManager.updateMessage(
          'schema-validation',
          `Schema validation failed`,
          ':x:',
        )
        return { success: false, errors: validationErrors };
      }
    }

    return { success: true, errors: validationErrors };
  } catch (error) {
    console.log(`❌ Schema validation error: ${error}`);

    await slackManager.appendNewLine({
      id: 'schema-validation-catch-error',
      content: `Something went wrong during schema validation! Please contact any engineer. <${actionUrl}|See pipeline logs>`,
      emoji: ':mild-panic:',
    });

    throw error;
  }
}
