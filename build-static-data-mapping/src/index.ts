import * as core from '@actions/core';
import { Storage } from '@google-cloud/storage';
import { downloadBuildArtifacts } from './steps/1-download-build-artifacts';
import { extractEntitiesEnum } from './steps/2-extract-entities-enum';
import { copyUserPrompts } from './steps/3-copy-user-prompts';
import { generateMapping } from './steps/4-generate-mapping';

/**
 * Main function for the GitHub Action
 */
export async function run(): Promise<void> {
  try {
    // Get inputs
    const game = core.getInput('game', { required: true });
    const gameUrlSlug = core.getInput('game-url-slug', { required: false }) || game;
    const configurationGameSlug = core.getInput('configuration-game-slug', { required: false }) || game;
    const timeoutMs = parseInt(core.getInput('timeout') || '600000', 10);
    const model = core.getInput('model-version', { required: false });
    const gcsBucketName = core.getInput('gcs-bucket-name', { required: true });
    const gcsProjectId = core.getInput('gcs-project-id', { required: true });
    const dynamicModulesEnv = core.getInput('dynamic-modules-env', { required: true });

    core.info(`🚀 Starting build static data mapping pipeline for game: ${game}`);

    // Initialize Storage and Bucket
    const storage = new Storage({ projectId: gcsProjectId });
    const bucket = storage.bucket(gcsBucketName);

    // Step 1: Check schema version
    core.startGroup('🔍 Step 1: Checking schema version');
    await downloadBuildArtifacts({
      bucket,
      env: dynamicModulesEnv,
      gameUrlSlug,
    });
    core.endGroup();

    // Step 2: Extract entities enum
    core.startGroup('🔍 Step 2: Extracting entities enum');
    await extractEntitiesEnum();
    core.endGroup();

    // Step 3: Copy user prompts from repository
    core.startGroup('📋 Step 3: Copying user prompts from repository');
    await copyUserPrompts({
      game: configurationGameSlug,
      dynamicModulesEnv,
    });
    core.endGroup();

    // Step 4: Generate mapping
    core.startGroup('🔨 Step 4: Generating mapping');
    await generateMapping({
      timeoutMs,
      model,
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
