import * as core from '@actions/core';

interface Bucket {
  upload(sourcePath: string, options: { destination: string }): Promise<unknown>;
}

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
    await bucket.upload(sourcePath, { destination });
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
