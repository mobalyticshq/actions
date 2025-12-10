import { Bucket } from '@google-cloud/storage';
import * as fs from 'fs';
import * as path from 'path';
import * as core from '@actions/core';
import { downloadConfigFromBucket, uploadFileToBucket, isFolderExists } from '@shared/utils/bucket.utils';
import {
  buildStaticDataMappingModulePath,
  incrementVersion,
} from '../utils/module-folder.utils';
import { DynamicModuleSlug } from '@shared/types/dynamic-modules.types';
import { generateModulePath } from '@shared/utils/dynamic-module.utils';

export interface UploadBuildOptions {
  bucket: Bucket;
  env: string;
  game: string;
}

const buildPath = './build/mapping';

function getAllFilesRecursive(dirPath: string): string[] {
  const files: string[] = [];

  if (!fs.existsSync(dirPath) || !fs.statSync(dirPath).isDirectory()) {
    return files;
  }

  const entries = fs.readdirSync(dirPath);

  for (const entry of entries) {
    const filePath = path.join(dirPath, entry);
    if (fs.statSync(filePath).isDirectory()) {
      files.push(...getAllFilesRecursive(filePath));
    } else {
      files.push(filePath);
    }
  }

  return files;
}

export async function uploadBuild(options: UploadBuildOptions): Promise<void> {
  try {
    const { bucket, env, game } = options;
    const bucketName = bucket.name;

    core.info(`Starting upload of mapping files to GCS bucket: ${bucketName}`);

    // Step 1: Verify bucket exists
    try {
      const [exists] = await bucket.exists();
      if (!exists) {
        const errorMessage = `Bucket ${bucketName} does not exist`;
        core.setFailed(errorMessage);
        throw new Error(errorMessage);
      }
      core.info(`✓ Bucket ${bucketName} verified`);
    } catch (error) {
      const errorMessage = `Failed to verify bucket: ${error instanceof Error ? error.message : String(error)}`;
      core.setFailed(errorMessage);
      throw error instanceof Error ? error : new Error(errorMessage);
    }

    // Step 2: Get current version and increment
    const existingConfig = await downloadConfigFromBucket(bucket, env, game, DynamicModuleSlug.STATIC_DATA_MAPPING);
    const currentVersion = existingConfig?.version || null;
    const newVersion = incrementVersion(currentVersion);

    core.info(`Current version: ${currentVersion || 'none'}, new version: ${newVersion}`);

    // Step 3: Build GCS paths
    const moduleFolderPath = buildStaticDataMappingModulePath(env, game, newVersion);

    core.info(`Target path: gs://${bucketName}/${moduleFolderPath}`);

    // Step 4: Check if module folder already exists
    const moduleFolderExists = await isFolderExists(bucket, moduleFolderPath);
    if (moduleFolderExists) {
      const errorMessage = `Folder ${moduleFolderPath} already exists in bucket ${bucketName}. Cannot overwrite existing version.`;
      core.setFailed(errorMessage);
      throw new Error(errorMessage);
    }

    core.info(`✓ Module folder ${newVersion} does not exist, proceeding with upload`);

    // Step 5: Resolve build directory path
    const buildMappingPath = path.resolve(process.cwd(), buildPath);

    if (!fs.existsSync(buildMappingPath)) {
      const errorMessage = `Build directory does not exist: ${buildMappingPath}`;
      core.setFailed(errorMessage);
      throw new Error(errorMessage);
    }

    // Step 6: Upload all files from build/mapping recursively
    const mappingFiles = getAllFilesRecursive(buildMappingPath);

    if (mappingFiles.length === 0) {
      const errorMessage = `No files found in ${buildMappingPath}`;
      core.setFailed(errorMessage);
      throw new Error(errorMessage);
    }

    let uploadedCount = 0;
    let failedCount = 0;

    for (const filePath of mappingFiles) {
      const relativePath = path.relative(buildMappingPath, filePath);
      const gcsPath = relativePath.split(path.sep).join('/');
      const destination = `${moduleFolderPath}/${gcsPath}`;
      const description = `mapping file: ${relativePath}`;

      const success = await uploadFileToBucket(bucket, filePath, destination, bucketName, description);
      if (success) {
        uploadedCount++;
      } else {
        failedCount++;
      }
    }

    // Step 7: Report results
    core.info(`✓ Upload completed: ${uploadedCount} files uploaded, ${failedCount} files failed`);

    if (failedCount > 0) {
      const errorMessage = `Failed to upload ${failedCount} file(s)`;
      core.setFailed(errorMessage);
      throw new Error(errorMessage);
    }

    core.info(`✓ All files successfully uploaded to gs://${bucketName}/${moduleFolderPath}/`);

    // Step 8: Upload config.json
    try {
      const config = {
        moduleFolder: `${newVersion}/`,
        name: `${newVersion}/index.ts`,
        version: newVersion,
      };

      const basePath = generateModulePath(env, game, DynamicModuleSlug.STATIC_DATA_MAPPING);
      const configDestination = `${basePath}/config.json`;
      const configFile = bucket.file(configDestination);
      const configJson = JSON.stringify(config, null, 2);

      core.info(`Uploading config.json to gs://${bucketName}/${configDestination}`);
      await configFile.save(configJson, {
        contentType: 'application/json',
      });
      core.info(`✓ Config.json successfully uploaded`);
    } catch (error) {
      const errorMessage = `Failed to upload config.json: ${error instanceof Error ? error.message : String(error)}`;
      core.setFailed(errorMessage);
      throw error instanceof Error ? error : new Error(errorMessage);
    }
  } catch (error) {
    const errorMessage = `Unexpected error in uploadBuild: ${error instanceof Error ? error.message : String(error)}`;
    core.setFailed(errorMessage);
    throw error instanceof Error ? error : new Error(errorMessage);
  }
}

