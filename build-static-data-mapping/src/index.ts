import * as core from '@actions/core';
import { Storage } from '@google-cloud/storage';
import { downloadBuildArtifacts } from './steps/1-download-build-artifacts';
import { copyUserPrompts } from './steps/1.5-copy-user-prompts';
import { generateMapping } from './steps/2-generate-mapping';

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

    core.info(`🚀 Starting build static data mapping pipeline for game: ${game}`);

    // Initialize Storage and Bucket
    const storage = new Storage({ projectId: gcsProjectId });
    const bucket = storage.bucket(gcsBucketName);

    // Step 1: Check schema version
    core.startGroup('🔍 Step 0: Checking schema version');
    await downloadBuildArtifacts({
      bucket,
      env: dynamicModulesEnv,
      game,
    });
    core.endGroup();

    // Step 1.5: Copy user prompts from repository
    core.startGroup('📋 Step 1.5: Copying user prompts from repository');
    await copyUserPrompts({
      game,
      dynamicModulesEnv,
    });
    core.endGroup();

    // Step 2: Generate mapping
    core.startGroup('🔨 Step 2: Generating mapping');
    await generateMapping({
      timeoutMs,
    });
    core.info(`✓ Mapping generation completed`);
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
