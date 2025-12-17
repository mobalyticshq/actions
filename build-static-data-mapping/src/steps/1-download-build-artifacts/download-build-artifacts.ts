import { Bucket } from '@google-cloud/storage';
import * as core from '@actions/core';
import * as fs from 'fs';
import * as path from 'path';
import { downloadConfigFromBucket, downloadFolderFromBucket } from '@shared/utils/bucket.utils';
import { generateModulePath } from '@shared/utils/dynamic-module.utils';
import { DynamicModuleSlug } from '@shared/types/dynamic-modules.types';

export interface DownloadBuildArtifactsOptions {
  bucket: Bucket;
  env: string;
  gameUrlSlug: string;
}

const filterTypesFiles = (fileName: string) =>
  fileName.endsWith('fragment.gql.generated.ts') || fileName === 'types.ts';

export async function downloadBuildArtifacts(options: DownloadBuildArtifactsOptions): Promise<void> {
  try {
    const { bucket, env, gameUrlSlug } = options;
    const bucketName = bucket.name;

    // Step 1: Download config.json
    const config = await downloadConfigFromBucket(bucket, env, gameUrlSlug, DynamicModuleSlug.STATIC_DATA_QUERY);

    if (!config) {
      const errorMessage = `Config file not found for game: ${gameUrlSlug}`;
      core.setFailed(errorMessage);
      throw new Error(errorMessage);
    }

    // Step 2: Extract moduleFolder from config
    if (!config.moduleFolder) {
      const errorMessage = `Config file does not contain moduleFolder field for game: ${gameUrlSlug}`;
      core.setFailed(errorMessage);
      throw new Error(errorMessage);
    }

    const moduleFolder = config.moduleFolder.endsWith('/') ? config.moduleFolder : `${config.moduleFolder}/`;
    core.info(`Module folder: ${moduleFolder}`);

    // Step 3: Build bucket path
    const baseModulePath = generateModulePath(env, gameUrlSlug, DynamicModuleSlug.STATIC_DATA_QUERY);
    const baseBucketPath = `${baseModulePath}/${moduleFolder}`;

    core.info(`Base bucket path: gs://${bucketName}/${baseBucketPath}`);

    // Step 4: Create local build folder
    const buildPath = path.resolve(process.cwd(), 'build', 'downloaded');
    if (!fs.existsSync(buildPath)) {
      fs.mkdirSync(buildPath, { recursive: true });
      core.info(`Created build directory: ${buildPath}`);
    } else {
      core.info(`Build directory already exists: ${buildPath}`);
    }

    // Step 5: Download required folders
    const requiredFolders = ['cleaned-schema', 'fragments', 'types'];

    for (const folderName of requiredFolders) {
      const bucketFolderPath = `${baseBucketPath}${folderName}`;
      const localFolderPath = path.join(buildPath, folderName);

      const filterFiles = folderName === 'types' ? filterTypesFiles : undefined;

      await downloadFolderFromBucket(bucket, bucketFolderPath, localFolderPath, folderName, filterFiles);
    }

    core.info(`✓ Successfully downloaded all build artifacts for game: ${gameUrlSlug}`);
  } catch (error) {
    // errors should fail the pipeline
    core.setFailed(`Error in downloadBuildArtifacts: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}
