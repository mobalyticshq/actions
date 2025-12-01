import { Bucket, Storage } from '@google-cloud/storage';
import * as fs from 'fs';
import * as path from 'path';
import * as core from '@actions/core';

export interface UploadBuildOptions {
  bucketName: string;
  gcsProjectId: string;
  env: string;
  game: string;
  schemaVersion: string;
}

const buildPath = './build';

/**
 * Check if a folder exists in GCS bucket
 */
async function folderExists(bucket: Bucket, folderPath: string): Promise<boolean> {
  const prefix = folderPath.endsWith('/') ? folderPath : `${folderPath}/`;
  const [files] = await bucket.getFiles({ prefix, maxResults: 1 });
  return files.length > 0;
}

/**
 * Get all files with specific extension in a directory (non-recursive)
 */
function getFilesInDirectory(dirPath: string, extension: string): string[] {
  if (!fs.existsSync(dirPath) || !fs.statSync(dirPath).isDirectory()) {
    return [];
  }

  const files: string[] = [];
  const entries = fs.readdirSync(dirPath);

  for (const entry of entries) {
    const filePath = path.join(dirPath, entry);
    if (fs.statSync(filePath).isFile() && entry.endsWith(extension)) {
      files.push(filePath);
    }
  }

  return files;
}

/**
 * Get all files recursively in a directory
 */
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
    const { bucketName, gcsProjectId, env, game, schemaVersion } = options;

    core.info(`Starting upload of build files to GCS bucket: ${bucketName}`);

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

    // Step 3: Build GCS paths
    const basePath = `dynamic-modules/${env}/${game}/static-data-query`;
    const versionFolder = `v-${schemaVersion}-query`;
    const fullVersionPath = `${basePath}/${versionFolder}`;

    core.info(`Target path: gs://${bucketName}/${fullVersionPath}`);

    // Step 4: Check if version folder already exists
    const versionFolderExists = await folderExists(bucket, fullVersionPath);
    if (versionFolderExists) {
      core.setFailed(
        `Folder ${fullVersionPath} already exists in bucket ${bucketName}. Cannot overwrite existing version.`,
      );
      process.exit(1);
    }

    core.info(`✓ Version folder ${versionFolder} does not exist, proceeding with upload`);

    // Step 5: Resolve build directory paths
    const buildQueryPath = path.resolve(process.cwd(), buildPath, 'gql', 'query');
    const buildFragmentsPath = path.resolve(process.cwd(), buildPath, 'gql', 'fragments');
    const buildTypesPath = path.resolve(process.cwd(), buildPath, 'gql', 'gql-types');

    // Step 6: Upload files according to new structure
    let uploadedCount = 0;
    let failedCount = 0;

    // 6.1: Upload compiled query to root
    const compiledQueryFile = path.join(buildQueryPath, `${game}-static-data-query-compiled.gql.ts`);
    if (fs.existsSync(compiledQueryFile)) {
      try {
        const destination = `${fullVersionPath}/${game}-static-data-query-compiled.gql.ts`;
        core.info(`Uploading: ${compiledQueryFile} -> gs://${bucketName}/${destination}`);
        await bucket.upload(compiledQueryFile, { destination });
        uploadedCount++;
        core.info(`✓ Uploaded compiled query`);
      } catch (error) {
        failedCount++;
        core.error(`Failed to upload compiled query: ${error instanceof Error ? error.message : String(error)}`);
      }
    } else {
      core.warning(`Compiled query file not found: ${compiledQueryFile}`);
    }

    // 6.2: Upload fragments to fragments/ folder
    const fragmentFiles = getFilesInDirectory(buildFragmentsPath, '.gql.ts');
    if (fragmentFiles.length > 0) {
      for (const fragmentFile of fragmentFiles) {
        try {
          const fileName = path.basename(fragmentFile);
          const destination = `${fullVersionPath}/fragments/${fileName}`;
          core.info(`Uploading: ${fragmentFile} -> gs://${bucketName}/${destination}`);
          await bucket.upload(fragmentFile, { destination });
          uploadedCount++;
          core.info(`✓ Uploaded fragment: ${fileName}`);
        } catch (error) {
          failedCount++;
          const fileName = path.basename(fragmentFile);
          core.error(
            `Failed to upload fragment ${fileName}: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      }
    } else {
      core.warning(`No fragment files found in ${buildFragmentsPath}`);
    }

    // 6.3: Upload query file (without -compiled suffix) to query/ folder
    const queryFile = path.join(buildQueryPath, `${game}-static-data-query.gql.ts`);
    if (fs.existsSync(queryFile)) {
      try {
        const destination = `${fullVersionPath}/query/${game}-static-data-query.gql.ts`;
        core.info(`Uploading: ${queryFile} -> gs://${bucketName}/${destination}`);
        await bucket.upload(queryFile, { destination });
        uploadedCount++;
        core.info(`✓ Uploaded query file`);
      } catch (error) {
        failedCount++;
        core.error(`Failed to upload query file: ${error instanceof Error ? error.message : String(error)}`);
      }
    } else {
      core.warning(`Query file not found: ${queryFile}`);
    }

    // 6.4: Upload all files from gql-types to types/ folder
    const typeFiles = getAllFilesRecursive(buildTypesPath);
    if (typeFiles.length > 0) {
      for (const typeFile of typeFiles) {
        try {
          const relativePath = path.relative(buildTypesPath, typeFile);
          const gcsPath = relativePath.split(path.sep).join('/');
          const destination = `${fullVersionPath}/types/${gcsPath}`;
          core.info(`Uploading: ${typeFile} -> gs://${bucketName}/${destination}`);
          await bucket.upload(typeFile, { destination });
          uploadedCount++;
          core.info(`✓ Uploaded type file: ${relativePath}`);
        } catch (error) {
          failedCount++;
          const relativePath = path.relative(buildTypesPath, typeFile);
          core.error(
            `Failed to upload type file ${relativePath}: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      }
    } else {
      core.warning(`No type files found in ${buildTypesPath}`);
    }

    // Step 7: Report results
    core.info(`✓ Upload completed: ${uploadedCount} files uploaded, ${failedCount} files failed`);

    if (failedCount > 0) {
      core.setFailed(`Failed to upload ${failedCount} file(s)`);
      process.exit(1);
    }

    core.info(`✓ All files successfully uploaded to gs://${bucketName}/${fullVersionPath}/`);
  } catch (error) {
    core.setFailed(`Unexpected error in uploadBuild: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}
