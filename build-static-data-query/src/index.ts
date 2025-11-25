import * as core from '@actions/core';
import { downloadSchema } from './steps/download-schema';

/**
 * Main function for the GitHub Action
 */
export async function run(): Promise<void> {
  try {
    // Get inputs
    const game = core.getInput('game', { required: true });
    const graphqlEndpoint = core.getInput('graphql-endpoint', { required: true });

    core.info(`🚀 Starting build static data query pipeline for game: ${game}`);

    // Step 1: Download GraphQL schema
    core.startGroup('📥 Step 1: Downloading GraphQL schema');
    const downloadedSchemaPath = await downloadSchema({ endpoint: graphqlEndpoint });
    core.info(`✓ Schema downloaded to: ${downloadedSchemaPath}`);
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
