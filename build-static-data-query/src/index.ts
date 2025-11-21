import * as core from '@actions/core';
import { buildStaticDataQuery } from './build-static-data-query';

/**
 * Main function for the GitHub Action
 */
export async function run(): Promise<void> {
  try {
    // Get inputs
    const workingDirectory = core.getInput('working-directory');
    const configPath = core.getInput('config-path');

    core.info(`Starting build static data query...`);
    core.info(`Working directory: ${workingDirectory}`);
    core.info(`Config path: ${configPath}`);

    // Mock functionality
    const result = await buildStaticDataQuery(workingDirectory, configPath);

    // Set outputs
    core.setOutput('result', result.data);
    core.setOutput('status', result.status);

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

