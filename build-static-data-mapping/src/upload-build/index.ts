import * as core from '@actions/core';
import { createStorage } from '@shared/utils/storage.utils';
import { uploadBuild } from './upload-build';

/**
 * Entry point for upload-build script
 * This script is called separately from the main action
 */
async function run(): Promise<void> {
  try {
    const game = core.getInput('game', { required: true });
    const gameUrlSlug = core.getInput('game-url-slug', { required: false }) || game;
    const gcsBucketName = core.getInput('gcs-bucket-name', { required: true });
    const gcsProjectId = core.getInput('gcs-project-id', { required: true });
    const dynamicModulesEnv = core.getInput('dynamic-modules-env', { required: true });
    const disableQueryAst = core.getBooleanInput('disable-query-ast-compilation');

    core.info(`🚀 Starting upload build for static data mapping - game: ${game}`);

    // Initialize Storage and Bucket
    const storage = createStorage(gcsProjectId);
    const bucket = storage.bucket(gcsBucketName);

    // Upload build
    await uploadBuild({
      bucket,
      env: dynamicModulesEnv,
      gameUrlSlug,
      disableQueryAst,
    });

    core.info(`✓ Upload build completed successfully`);
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message);
    } else {
      core.setFailed('An unknown error occurred');
    }
  }
}

run();
