import * as core from '@actions/core';
import { type Bucket, type UploadOptions } from '@google-cloud/storage';
import { DynamicModuleConfig } from '../types/dynamic-modules.types';

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
): Promise<DynamicModuleConfig | null> {
  const configPath = `dynamic-modules/${env}/${game}/static-data-query/config.json`;
  const bucketName = bucket.name;

  core.info(`Downloading config.json from gs://${bucketName}/${configPath}`);

  try {
    const file = bucket.file(configPath);

    // Download file
    const [fileContents] = await file.download();
    const configJson = JSON.parse(fileContents.toString('utf-8')) as DynamicModuleConfig;

    if (!configJson.schemaVersion) {
      core.warning(`Config file exists but does not contain schemaVersion field`);
      return null;
    }

    core.info(`✓ Existing schema version from config.json: ${configJson.schemaVersion}`);
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
