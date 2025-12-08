import * as core from '@actions/core';
import { Storage } from '@google-cloud/storage';
import { downloadBuildArtifacts } from './steps/1-download-build-artifacts';

/**
 * Main function for the GitHub Action
 */
export async function run(): Promise<void> {
  try {
    // Get inputs
    const game = core.getInput('game', { required: true });
    const timeoutMs = parseInt(core.getInput('timeout') || '600000', 10);
    const gcsBucketName = core.getInput('gcs-bucket-name', { required: true });
    const gcsProjectId = core.getInput('gcs-project-id', { required: true });
    const dynamicModulesEnv = core.getInput('dynamic-modules-env', { required: true });

    core.info(`🚀 Starting build static data query pipeline for game: ${game}`);

    // Initialize Storage and Bucket
    const storage = new Storage({ projectId: gcsProjectId });
    const bucket = storage.bucket(gcsBucketName);

    // Step 0: Check schema version
    core.startGroup('🔍 Step 0: Checking schema version');
    await downloadBuildArtifacts({
      bucket,
      env: dynamicModulesEnv,
      game,
    });
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

run();
