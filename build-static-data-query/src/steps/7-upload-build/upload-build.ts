import { Storage } from '@google-cloud/storage';
import * as fs from 'fs';
import * as path from 'path';
import * as core from '@actions/core';

export interface UploadBuildOptions {
  bucketName: string;
  gcsProjectId: string;
}

/**
 * Recursively get all files in a directory
 */
function getAllFiles(dirPath: string, arrayOfFiles: string[] = []): string[] {
  const files = fs.readdirSync(dirPath);

  files.forEach(file => {
    const filePath = path.join(dirPath, file);
    if (fs.statSync(filePath).isDirectory()) {
      arrayOfFiles = getAllFiles(filePath, arrayOfFiles);
    } else {
      arrayOfFiles.push(filePath);
    }
  });

  return arrayOfFiles;
}

const buildPath = './build';

export async function uploadBuild(options: UploadBuildOptions): Promise<void> {
  try {
    const { bucketName, gcsProjectId } = options;

    core.info(`Starting upload of build directory to GCS bucket: ${bucketName}`);

    // Step 1: Create Storage client
    const storage = new Storage({ projectId: gcsProjectId });
    const bucket = storage.bucket(bucketName);

    // Step 2: Verify bucket exists
    try {
      const [exists] = await bucket.exists();
      if (!exists) {
        core.setFailed(`Bucket ${bucketName} does not exist`);
        process.exit(1);
      }
      core.info(`✓ Bucket ${bucketName} verified`);
    } catch (error) {
      core.setFailed(`Failed to verify bucket: ${error instanceof Error ? error.message : String(error)}`);
      process.exit(1);
    }

    // Step 3: Resolve build directory path
    const absoluteBuildPath = path.resolve(process.cwd(), buildPath);

    if (!fs.existsSync(absoluteBuildPath)) {
      core.setFailed(`Build directory does not exist: ${absoluteBuildPath}`);
      process.exit(1);
    }

    if (!fs.statSync(absoluteBuildPath).isDirectory()) {
      core.setFailed(`Build path is not a directory: ${absoluteBuildPath}`);
      process.exit(1);
    }

    core.info(`Build directory: ${absoluteBuildPath}`);

    // Step 4: Get all files recursively
    const allFiles = getAllFiles(absoluteBuildPath);
    core.info(`Found ${allFiles.length} files to upload`);

    if (allFiles.length === 0) {
      core.warning('No files found in build directory');
      return;
    }

    // Step 5: Upload each file
    let uploadedCount = 0;
    let failedCount = 0;

    for (const filePath of allFiles) {
      try {
        // Get relative path from build directory
        const relativePath = path.relative(absoluteBuildPath, filePath);
        // Normalize path separators for GCS (use forward slashes)
        const gcsPath = relativePath.split(path.sep).join('/');
        // Preserve directory structure: build/gql/... -> bucket/build/gql/...
        const destinationPath = path.join('build', gcsPath).split(path.sep).join('/');

        core.info(`Uploading: ${relativePath} -> gs://${bucketName}/${destinationPath}`);

        await bucket.upload(filePath, {
          destination: destinationPath,
        });

        uploadedCount++;
        core.info(`✓ Uploaded: ${relativePath}`);
      } catch (error) {
        failedCount++;
        const relativePath = path.relative(absoluteBuildPath, filePath);
        core.error(`Failed to upload ${relativePath}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    // Step 7: Report results
    core.info(`✓ Upload completed: ${uploadedCount} files uploaded, ${failedCount} files failed`);

    if (failedCount > 0) {
      core.setFailed(`Failed to upload ${failedCount} file(s)`);
      process.exit(1);
    }

    core.info(`✓ All files successfully uploaded to gs://${bucketName}/build/`);
  } catch (error) {
    core.setFailed(`Unexpected error in uploadBuild: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}
