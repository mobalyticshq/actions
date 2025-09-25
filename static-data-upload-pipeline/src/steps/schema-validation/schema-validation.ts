import { SlackMessageManager } from '../../utils/slack-manager.utils';
import { logger } from '../../utils/logger.utils';
import { readFileSync } from 'fs';
import { Schema } from './types';
import { downloadReferenceSchema, validateSchemaCompatibility, validateSchemaStructure } from './utils';

export async function schemaValidationStep(
  slackManager: SlackMessageManager,
  schemaPath: string,
  staticDataPath: string,
) {
  logger.group('📋 Validate schema.json');
  await slackManager.sendOrUpdate(`Validating schema.json...`, ':clipboard:', true);

  try {
    // Read new schema
    const schemaFilePath = `${schemaPath}/schema.json`;
    console.log(`ℹ️ Schema validation for: ${schemaFilePath}`);
    const newSchemaContent = readFileSync(schemaFilePath, 'utf8');
    const newSchema = JSON.parse(newSchemaContent) as Schema;

    // Always perform structure validation first
    const structureErrors = validateSchemaStructure(newSchema);

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

        // Log all errors
        for (const error of structureErrors) {
          console.log(`   ${error.type.toUpperCase()}: ${error.message}`);
          if (error.path) {
            console.log(`     Path: ${error.path}`);
          }
        }

        // Send notification to Slack
        const errorSummary = structureErrors
          .slice(0, 5) // Show only first 5 errors
          .map(e => `• ${e.message}`)
          .join('\n');

        const moreErrors = structureErrors.length > 5 ? `\n... and ${structureErrors.length - 5} more errors` : '';

        await slackManager.sendOrUpdate(
          `Schema structure validation failed ❌\n\n${errorSummary}${moreErrors}`,
          ':warning:',
          true,
        );

        // If there are critical errors, stop execution
        if (errorCount > 0) {
          throw new Error(`Schema structure validation failed with ${errorCount} errors`);
        }

        logger.endGroup();
        return { success: true };
      }
    }

    // Perform compatibility validation
    const compatibilityErrors = validateSchemaCompatibility(newSchema, referenceSchema);

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

      // Send notification to Slack
      const errorSummary = validationErrors
        .slice(0, 5) // Show only first 5 errors
        .map(e => `• ${e.message}`)
        .join('\n');

      const moreErrors = validationErrors.length > 5 ? `\n... and ${validationErrors.length - 5} more errors` : '';

      await slackManager.sendOrUpdate(`Schema validation failed ❌\n\n${errorSummary}${moreErrors}`, ':warning:', true);

      // If there are critical errors, stop execution
      if (errorCount > 0) {
        throw new Error(`Schema validation failed with ${errorCount} errors`);
      }
    }

    logger.endGroup();
    return { success: true };
  } catch (error) {
    console.log(`❌ Schema validation error: ${error}`);
    await slackManager.sendOrUpdate(`Schema validation failed: ${error}`, ':warning:', true);
    logger.endGroup();

    return { success: false, error };
  }
}
