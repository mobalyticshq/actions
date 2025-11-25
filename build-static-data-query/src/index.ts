import * as core from '@actions/core';
import { downloadSchema } from './steps/download-schema';
import { generateScopes } from './steps/generate-scopes';
import { cleanSchema } from './steps/clean-schema';

/**
 * Main function for the GitHub Action
 */
export async function run(): Promise<void> {
  try {
    // Get inputs
    const game = core.getInput('game', { required: true });
    const graphqlEndpoint = core.getInput('graphql-endpoint', { required: true });
    const staticDataFieldName = core.getInput('static-data-field-name') || 'staticData';

    core.info(`🚀 Starting build static data query pipeline for game: ${game}`);

    // Step 1: Download GraphQL schema
    core.startGroup('📥 Step 1: Downloading GraphQL schema');
    const downloadedSchemaPath = await downloadSchema({ endpoint: graphqlEndpoint });
    core.info(`✓ Schema downloaded to: ${downloadedSchemaPath}`);
    core.endGroup();

    // Step 2: Generate scopes
    core.startGroup('🔧 Step 2: Generating scopes');
    const scopesPath = generateScopes({
      schemaPath: downloadedSchemaPath,
      gameField: game,
    });
    core.info(`✓ Scopes generated: ${scopesPath}`);
    core.endGroup();

    // Step 3: Clean schema
    core.startGroup('🧹 Step 3: Cleaning schema');
    const cleanedSchemaPath = await cleanSchema({
      schemaPath: downloadedSchemaPath,
      gameField: game,
      staticDataFieldName,
    });
    core.info(`✓ Schema cleaned: ${cleanedSchemaPath}`);
    core.endGroup();

    core.info(`✓ Pipeline completed successfully`);
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message);
    } else {
      core.setFailed('An unknown error occurred');
    }
  }
}

// Run the action if this file is executed directly
if (require.main === module) {
  run();
}
