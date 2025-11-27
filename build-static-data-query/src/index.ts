import * as core from '@actions/core';
import { downloadSchema } from './steps/1-download-schema';
import { generateScopes } from './steps/2-generate-scopes';
import { cleanSchema } from './steps/3-clean-schema';
import { generateFragments } from './steps/4-generate-fragments';
import { generateGqlTypes } from './steps/6-generate-gql-types';

/**
 * Main function for the GitHub Action
 */
export async function run(): Promise<void> {
  try {
    // Get inputs
    const game = core.getInput('game', { required: true });
    const graphqlEndpoint = core.getInput('graphql-endpoint', { required: true });
    const staticDataFieldName = core.getInput('static-data-field-name') || 'staticData';
    const timeoutMs = parseInt(core.getInput('timeout') || '600000', 10);

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

    // Step 4: Generate fragments
    core.startGroup('🔨 Step 4: Generating fragments');
    await generateFragments({
      timeoutMs,
    });
    core.info(`✓ Fragments generation completed`);
    core.endGroup();

    // Step 5: Generate query
    core.startGroup('🔨 Step 5: Generating query');
    await generateFragments({
      timeoutMs,
    });
    core.info(`✓ Query generation completed`);
    core.endGroup();

    // Step 6: Generate GraphQL types
    core.startGroup('📝 Step 6: Generating GraphQL types');
    await generateGqlTypes();
    core.info(`✓ GraphQL types generation completed`);
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
