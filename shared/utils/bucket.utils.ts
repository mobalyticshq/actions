import * as core from '@actions/core';
import { type Bucket, type UploadOptions } from '@google-cloud/storage';
import { DynamicModuleConfig, DynamicModuleSlug } from '../types/dynamic-modules.types';
import { generateModulePath } from './dynamic-module.utils';

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

export async function isFolderExists(bucket: Bucket, folderPath: string): Promise<boolean> {
  const prefix = folderPath.endsWith('/') ? folderPath : `${folderPath}/`;
  const [files] = await bucket.getFiles({ prefix, maxResults: 1 });
  return files.length > 0;
}
