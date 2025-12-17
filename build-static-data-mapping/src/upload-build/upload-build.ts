import { Bucket } from '@google-cloud/storage';
import * as fs from 'fs';
import * as path from 'path';
import * as core from '@actions/core';
import { downloadConfigFromBucket, uploadFileToBucket, isFolderExists } from '@shared/utils/bucket.utils';
import { buildStaticDataMappingModulePath, incrementVersion } from '../utils/module-folder.utils';
import { DynamicModuleSlug } from '@shared/types/dynamic-modules.types';
import { generateModulePath } from '@shared/utils/dynamic-module.utils';
import { getAllFilesRecursive } from '@shared/utils/fs.utils';

export interface UploadBuildOptions {
  bucket: Bucket;
  env: string;
  gameUrlSlug: string;
}

const buildMappingPath = './build/mapping';
const buildTypesPath = './build/types';
const buildDistPath = './build/dist';

interface UploadFolderResult {
  uploadedCount: number;
  failedCount: number;
}

async function uploadFolder(
  bucket: Bucket,
  bucketName: string,
  sourcePath: string,
  destinationPrefix: string,
  fileTypeDescription: string,
  requireExists: boolean = true,
): Promise<UploadFolderResult> {
  if (!fs.existsSync(sourcePath)) {
    if (requireExists) {
      const errorMessage = `Directory does not exist: ${sourcePath}`;
      core.setFailed(errorMessage);
      throw new Error(errorMessage);
    } else {
      core.warning(`Directory does not exist: ${sourcePath}, skipping`);
      return { uploadedCount: 0, failedCount: 0 };
    }
  }

  const files = getAllFilesRecursive(sourcePath);

  if (files.length === 0) {
    core.warning(`No files found in ${sourcePath}`);
    return { uploadedCount: 0, failedCount: 0 };
  }

  core.info(
    `Uploading ${files.length} file(s) from ${path.relative(process.cwd(), sourcePath)} to ${destinationPrefix}`,
  );

  let resultUploadedCount = 0;
  let resultFailedCount = 0;

  for (const filePath of files) {
    const relativePath = path.relative(sourcePath, filePath);
    const gcsPath = relativePath.split(path.sep).join('/');
    const destination = `${destinationPrefix}${gcsPath}`;
    const description = `${fileTypeDescription}: ${relativePath}`;

    const success = await uploadFileToBucket(bucket, filePath, destination, bucketName, description);
    if (success) {
      resultUploadedCount++;
    } else {
      resultFailedCount++;
    }
  }

  return {
    uploadedCount: resultUploadedCount,
    failedCount: resultFailedCount,
  };
}

export async function uploadBuild(options: UploadBuildOptions): Promise<void> {
  try {
    const { bucket, env, gameUrlSlug } = options;
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
    const existingConfig = await downloadConfigFromBucket(
      bucket,
      env,
      gameUrlSlug,
      DynamicModuleSlug.STATIC_DATA_MAPPING,
    );
    const currentVersion = existingConfig?.version || null;
    const newVersion = incrementVersion(currentVersion);

    core.info(`Current version: ${currentVersion || 'none'}, new version: ${newVersion}`);

    // Step 3: Build GCS paths
    const moduleFolderPath = buildStaticDataMappingModulePath(env, gameUrlSlug, newVersion);

    core.info(`Target path: gs://${bucketName}/${moduleFolderPath}`);

    // Step 4: Check if module folder already exists
    const moduleFolderExists = await isFolderExists(bucket, moduleFolderPath);
    if (moduleFolderExists) {
      const errorMessage = `Folder ${moduleFolderPath} already exists in bucket ${bucketName}. Cannot overwrite existing version.`;
      core.setFailed(errorMessage);
      throw new Error(errorMessage);
    }

    core.info(`✓ Module folder ${newVersion} does not exist, proceeding with upload`);

    // Step 5: Resolve build directory paths
    const buildMappingFullPath = path.resolve(process.cwd(), buildMappingPath);
    const buildTypesFullPath = path.resolve(process.cwd(), buildTypesPath);
    const buildDistFullPath = path.resolve(process.cwd(), buildDistPath);

    // Step 6: Upload files from build/mapping to src/ subfolder
    const mappingResult = await uploadFolder(
      bucket,
      bucketName,
      buildMappingFullPath,
      `${moduleFolderPath}/src/`,
      'mapping files',
      true,
    );

    // Step 7: Upload files from build/types to types/ subfolder
    const typesResult = await uploadFolder(
      bucket,
      bucketName,
      buildTypesFullPath,
      `${moduleFolderPath}/types/`,
      'types files',
      true,
    );

    // Step 8: Upload files from build/dist to root of moduleFolder
    const distResult = await uploadFolder(
      bucket,
      bucketName,
      buildDistFullPath,
      `${moduleFolderPath}/`,
      'dist file',
      true,
    );

    const uploadedCount = mappingResult.uploadedCount + distResult.uploadedCount;
    const failedCount = mappingResult.failedCount + distResult.failedCount;

    // Step 9: Report results
    core.info(`✓ Upload completed: ${uploadedCount} files uploaded, ${failedCount} files failed`);

    if (failedCount > 0) {
      const errorMessage = `Failed to upload ${failedCount} file(s)`;
      core.setFailed(errorMessage);
      throw new Error(errorMessage);
    }

    core.info(`✓ All files successfully uploaded to gs://${bucketName}/${moduleFolderPath}/`);

    // Step 10: Upload config.json
    try {
      const config = {
        moduleFolder: `${newVersion}/`,
        name: `${newVersion}/index.js`,
        version: newVersion,
      };

      const basePath = generateModulePath(env, gameUrlSlug, DynamicModuleSlug.STATIC_DATA_MAPPING);
      const configDestination = `${basePath}/config.json`;
      const configFile = bucket.file(configDestination);
      const configJson = JSON.stringify(config, null, 2);

      core.info(`Uploading config.json to gs://${bucketName}/${configDestination}`);
      await configFile.save(configJson);
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
