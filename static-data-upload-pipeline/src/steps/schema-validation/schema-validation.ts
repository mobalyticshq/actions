import { SlackMessageManager } from '../../utils/slack-manager.utils';
import { logger } from '../../utils/logger.utils';
import { ApiSchema } from './types';
import { downloadReferenceSchema, validateSchemaCompatibility, validateSchemaStructure } from './utils';

export async function schemaValidationStep(
  slackManager: SlackMessageManager,
  apiSchema: ApiSchema,
  staticDataPath: string,
) {
  logger.group('📋 Validate schema.json');
  await slackManager.sendOrUpdate(`Validating schema.json...`, ':clipboard:', true);

  try {
    // Always perform structure validation first
    const structureErrors = validateSchemaStructure(apiSchema);

    // Download reference schema from GCS
    const referenceSchema = await downloadReferenceSchema(staticDataPath);

    if (!referenceSchema) {
      console.log(`⚠️ No reference schema found, skipping backward compatibility validation`);

      if (structureErrors.length === 0) {
        console.log(`✅ Schema structure validation passed`);
        logger.endGroup();
        return { success: true };
      } else {
        console.log(`❌ Schema structure validation failed:`);

        const errorCount = structureErrors.filter(e => e.type === 'error').length;
        const warningCount = structureErrors.filter(e => e.type === 'warning').length;
        console.log(`   Errors: ${errorCount}, Warnings: ${warningCount}`);

        

        

        // If there are critical errors, return them instead of throwing
        if (errorCount > 0) {
          logger.endGroup();
          return { success: false, errors: structureErrors };
        }

        logger.endGroup();
        return { success: true, errors: structureErrors };
      }
    }

    // Perform compatibility validation
    const compatibilityErrors = validateSchemaCompatibility(apiSchema, referenceSchema);

    // Combine all validation errors
    const validationErrors = [...structureErrors, ...compatibilityErrors];

    if (validationErrors.length === 0) {
      console.log(`✅ Schema validation passed (structure and backward compatibility)`);
      await slackManager.sendOrUpdate(
        `Schema validation passed (structure and backward compatibility)`,
        ':white_check_mark:',
        true,
        true,
      );
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

      
      

      await slackManager.sendOrUpdate('Schema validation failed ❌\n', ':warning:', true);

      // If there are critical errors, return them instead of throwing
      if (errorCount > 0) {
        logger.endGroup();
        return { success: false, errors: validationErrors };
      }
    }

    logger.endGroup();
    return { success: true, errors: validationErrors };
  } catch (error) {
    console.log(`❌ Schema validation error: ${error}`);
    await slackManager.sendOrUpdate(`Schema validation failed: ${error}`, ':warning:', true);
    logger.endGroup();

    return { success: false, error };
  }
}
