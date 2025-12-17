import * as core from '@actions/core';
import * as fs from 'fs';
import * as path from 'path';
import { type Bucket, type UploadOptions } from '@google-cloud/storage';
import { DynamicModuleConfig, DynamicModuleSlug } from '../types/dynamic-modules.types';
import { generateModulePath } from './dynamic-module.utils';
import { getAllFilesRecursive } from './fs.utils';

export async function uploadFileToBucket(
  bucket: Bucket,
  sourcePath: string,
  destination: string,
  bucketName: string,
  description?: string,
): Promise<boolean> {
  try {
    const logPrefix = description ? `${description}: ` : '';
    core.info(`Uploading: ${logPrefix}${sourcePath} -> gs://${bucketName}/${destination}`);
    const options = { destination } as UploadOptions;
    await bucket.upload(sourcePath, options);
    const successMessage = description ? `✓ Uploaded ${description}` : `✓ Uploaded file`;
    core.info(successMessage);
    return true;
  } catch (error) {
    const errorMessage = description
      ? `Failed to upload ${description}: ${error instanceof Error ? error.message : String(error)}`
      : `Failed to upload file: ${error instanceof Error ? error.message : String(error)}`;
    core.error(errorMessage);
    return false;
  }
}

export async function downloadConfigFromBucket(
  bucket: Bucket,
  env: string,
  game: string,
  dynamicModuleSlug: DynamicModuleSlug,
): Promise<DynamicModuleConfig | null> {
  const configPath = `${generateModulePath(env, game, dynamicModuleSlug)}/config.json`;
  const bucketName = bucket.name;

  core.info(`Downloading config.json from gs://${bucketName}/${configPath}`);

  try {
    const file = bucket.file(configPath);

    // Download file
    const [fileContents] = await file.download();
    const configJson = JSON.parse(fileContents.toString('utf-8')) as DynamicModuleConfig;

    core.info(`✓ Config.json downloaded: ${configJson.version}`);
    return configJson;
  } catch (error: any) {
    // Handle 404 (file not found) as a normal case
    if (error?.code === 404 || error?.message?.includes('No such object')) {
      core.info(`Config file not found at gs://${bucketName}/${configPath}, continuing pipeline`);
      return null;
    }

    // For other errors, log warning but continue
    core.warning(`Failed to download config.json: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}

export async function downloadFolderFromBucket(
  bucket: Bucket,
  bucketFolderPath: string,
  localFolderPath: string,
  folderName: string,
  filterFiles?: (fileName: string) => boolean,
): Promise<void> {
  const prefix = bucketFolderPath.endsWith('/') ? bucketFolderPath : `${bucketFolderPath}/`;

  core.info(`Checking folder: ${folderName} at gs://${bucket.name}/${prefix}`);

  // Get all files in the folder
  const [files] = await bucket.getFiles({ prefix });

  // Filter out files that are exactly the prefix (folder markers)
  let actualFiles = files.filter(file => file.name !== prefix);

  // Apply file filter if provided
  if (filterFiles) {
    actualFiles = actualFiles.filter(file => {
      const relativePath = file.name.replace(prefix, '');
      const fileName = path.basename(relativePath);
      return filterFiles(fileName);
    });
  }

  if (actualFiles.length === 0) {
    const errorMessage = `Folder ${folderName} is empty or does not exist at gs://${bucket.name}/${prefix}`;
    core.setFailed(errorMessage);
    throw new Error(errorMessage);
  }

  core.info(`Found ${actualFiles.length} file(s) in folder ${folderName}`);

  // Download each file
  for (const file of actualFiles) {
    // Get relative path from the folder prefix
    const relativePath = file.name.replace(prefix, '');
    const localFilePath = path.join(localFolderPath, relativePath);
    const localFileDir = path.dirname(localFilePath);

    // Create directory if it doesn't exist
    if (!fs.existsSync(localFileDir)) {
      fs.mkdirSync(localFileDir, { recursive: true });
    }

    // Download file
    await file.download({ destination: localFilePath });
    core.info(`Downloaded: ${relativePath}`);
  }

  core.info(`✓ Successfully downloaded folder ${folderName}`);
}

interface UploadFolderResult {
  uploadedCount: number;
  failedCount: number;
}

export async function uploadFolderToBucket(
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

export async function isFolderExists(bucket: Bucket, folderPath: string): Promise<boolean> {
  const prefix = folderPath.endsWith('/') ? folderPath : `${folderPath}/`;
  const [files] = await bucket.getFiles({ prefix, maxResults: 1 });
  return files.length > 0;
}
