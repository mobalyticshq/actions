import * as core from '@actions/core';
import { Storage } from '@google-cloud/storage';
import { checkSchemaVersion } from './steps/0-check-schema-version';
import { downloadSchema } from './steps/1-download-schema';
import { generateScopes } from './steps/2-generate-scopes';
import { cleanSchema } from './steps/3-clean-schema';
import { generateFragments } from './steps/4-generate-fragments';
import { generateQuery } from './steps/5-generate-query';
import { generateGqlTypes } from './steps/7-generate-gql-types';
import { uploadBuild } from './steps/8-upload-build';
import { compileQuery } from './steps/6-compile-query';

/**
 * Main function for the GitHub Action
 */
export async function run(): Promise<void> {
  try {
    // Get inputs
    const game = core.getInput('game', { required: true });
    const graphqlEndpoint = core.getInput('graphql-endpoint', { required: true });
    const staticDataFieldName = core.getInput('static-data-field-name') || 'staticData';
    const cacheVersion = core.getInput('cache-version') || '';
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
    const schemaVersionCheck = await checkSchemaVersion({
      graphqlEndpoint,
      bucket,
      env: dynamicModulesEnv,
      game,
    });
    core.endGroup();

    if (!schemaVersionCheck.shouldContinue) {
      core.info(`✓ Schema version has not changed (${schemaVersionCheck.currentSchemaVersion}). Pipeline skipped.`);
      return;
    }

    if (!schemaVersionCheck.currentSchemaVersion) {
      core.setFailed('Schema version is not found, pipeline will be skipped');
      return;
    }

    // Step 1: Download GraphQL schema
    core.startGroup('📥 Step 1: Downloading GraphQL schema');
    const downloadedSchemaPath = await downloadSchema({ endpoint: graphqlEndpoint });
    core.info(`✓ Schema downloaded to: ${downloadedSchemaPath}`);
    core.endGroup();

    // Step 2: Generate scopes
    core.startGroup('🔧 Step 2: Generating scopes');
    const scopesData = generateScopes({
      schemaPath: downloadedSchemaPath,
      gameField: game,
    });
    core.info(`✓ Scopes generated`);
    core.endGroup();

    // Step 3: Clean schema
    core.startGroup('🧹 Step 3: Cleaning schema');
    const cleanedSchemaPath = await cleanSchema({
      schemaPath: downloadedSchemaPath,
      gameField: game,
      staticDataFieldName,
      scopesData,
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
    await generateQuery({
      timeoutMs,
    });
    core.info(`✓ Query generation completed`);
    core.endGroup();

    // Step 6: Compile query
    core.startGroup('🔨 Step 6: Compiling query');
    await compileQuery();
    core.info(`✓ Query Compiling completed`);
    core.endGroup();

    // Step 7: Generate GraphQL types
    core.startGroup('📝 Step 7: Generating GraphQL types');
    await generateGqlTypes();
    core.info(`✓ GraphQL types generation completed`);
    core.endGroup();

    // Step 8: Upload build to GCS
    core.startGroup('☁️ Step 8: Uploading build to GCS');
    await uploadBuild({
      bucket,
      env: dynamicModulesEnv,
      game: game,
      schemaVersion: schemaVersionCheck.currentSchemaVersion,
      cacheVersion,
    });
    core.info(`✓ Build upload completed`);
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
