import { Bucket, SaveOptions } from '@google-cloud/storage';
import * as fs from 'fs';
import * as path from 'path';
import * as core from '@actions/core';
import { uploadFileToBucket } from '@shared/utils/bucket.utils';
import {
  checkStaticDataQueryModuleFolderExists,
  buildStaticDataQueryModuleFolderPath,
  generateStaticDataQueryModuleFolderName,
} from '../../utils/module-folder.utils';
import { DynamicModuleConfig, DynamicModuleSlug } from '@shared/types/dynamic-modules.types';
import { generateModulePath } from '@shared/utils/dynamic-module.utils';

export interface UploadBuildOptions {
  bucket: Bucket;
  env: string;
  game: string;
  schemaVersion: string;
}

const buildPath = './build';

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
    const { bucket, env, game, schemaVersion } = options;
    const bucketName = bucket.name;

    core.info(`Starting upload of build files to GCS bucket: ${bucketName}`);

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

    // Step 2: Build GCS paths
    const fullVersionPath = buildStaticDataQueryModuleFolderPath(env, game, schemaVersion);

    core.info(`Target path: gs://${bucketName}/${fullVersionPath}`);

    // Step 3: Check if version folder already exists
    const versionFolderExists = await checkStaticDataQueryModuleFolderExists(bucket, env, game, schemaVersion);
    if (versionFolderExists) {
      const errorMessage = `Folder ${fullVersionPath} already exists in bucket ${bucketName}. Cannot overwrite existing version.`;
      core.setFailed(errorMessage);
      throw new Error(errorMessage);
    }

    const versionFolder = generateStaticDataQueryModuleFolderName(schemaVersion);
    core.info(`✓ Version folder ${versionFolder} does not exist, proceeding with upload`);

    // Step 4: Resolve build directory paths
    const buildQueryPath = path.resolve(process.cwd(), buildPath, 'gql', 'query');
    const buildFragmentsPath = path.resolve(process.cwd(), buildPath, 'gql', 'fragments');
    const buildTypesPath = path.resolve(process.cwd(), buildPath, 'gql', 'gql-types');
    const buildFragmentsTypesPath = path.resolve(process.cwd(), buildPath, 'gql', 'fragments', 'gql-types');
    const buildQueryTypesPath = path.resolve(process.cwd(), buildPath, 'gql', 'query', 'gql-types');

    // Step 5: Upload files according to new structure
    let uploadedCount = 0;
    let failedCount = 0;

    // 6.1: Upload compiled query to root
    const compiledQueryFile = path.join(buildQueryPath, `${game}-static-data-query-compiled.gql.ts`);
    if (fs.existsSync(compiledQueryFile)) {
      const destination = `${fullVersionPath}/${game}-static-data-query-compiled.gql.ts`;
      const success = await uploadFileToBucket(bucket, compiledQueryFile, destination, bucketName, 'compiled query');
      if (success) {
        uploadedCount++;
      } else {
        failedCount++;
      }
    } else {
      core.warning(`Compiled query file not found: ${compiledQueryFile}`);
    }

    // 6.2: Upload fragments to fragments/ folder
    const fragmentFiles = getFilesInDirectory(buildFragmentsPath, '.gql.ts');
    if (fragmentFiles.length > 0) {
      for (const fragmentFile of fragmentFiles) {
        const fileName = path.basename(fragmentFile);
        const destination = `${fullVersionPath}/fragments/${fileName}`;
        const success = await uploadFileToBucket(
          bucket,
          fragmentFile,
          destination,
          bucketName,
          `fragment: ${fileName}`,
        );
        if (success) {
          uploadedCount++;
        } else {
          failedCount++;
        }
      }
    } else {
      core.warning(`No fragment files found in ${buildFragmentsPath}`);
    }

    // 6.3: Upload query file (without -compiled suffix) to query/ folder
    const queryFile = path.join(buildQueryPath, `${game}-static-data-query.gql.ts`);
    if (fs.existsSync(queryFile)) {
      const destination = `${fullVersionPath}/query/${game}-static-data-query.gql.ts`;
      const success = await uploadFileToBucket(bucket, queryFile, destination, bucketName, 'query file');
      if (success) {
        uploadedCount++;
      } else {
        failedCount++;
      }
    } else {
      core.warning(`Query file not found: ${queryFile}`);
    }

    // 6.4: Upload all files from gql-types folders to types/ folder
    const typeSourcePaths = [
      { path: buildTypesPath, name: 'gql-types' },
      { path: buildFragmentsTypesPath, name: 'fragments/gql-types' },
      { path: buildQueryTypesPath, name: 'query/gql-types' },
    ];

    let hasTypeFiles = false;
    for (const sourcePath of typeSourcePaths) {
      const typeFiles = getAllFilesRecursive(sourcePath.path);
      if (typeFiles.length > 0) {
        hasTypeFiles = true;
        for (const typeFile of typeFiles) {
          const relativePath = path.relative(sourcePath.path, typeFile);
          const gcsPath = relativePath.split(path.sep).join('/');
          const destination = `${fullVersionPath}/types/${gcsPath}`;
          const description = `type file from ${sourcePath.name}: ${relativePath}`;
          const success = await uploadFileToBucket(bucket, typeFile, destination, bucketName, description);
          if (success) {
            uploadedCount++;
          } else {
            failedCount++;
          }
        }
      }
    }

    if (!hasTypeFiles) {
      core.warning(`No type files found in any of the gql-types directories`);
    }

    // 6.5: Upload cleaned schema to cleaned-schema/ folder
    const cleanedSchemaFile = path.resolve(process.cwd(), '_generated/cleaned-schema.graphql');
    if (fs.existsSync(cleanedSchemaFile)) {
      const destination = `${fullVersionPath}/cleaned-schema/cleaned-schema.graphql`;
      const success = await uploadFileToBucket(bucket, cleanedSchemaFile, destination, bucketName, 'cleaned schema');
      if (success) {
        uploadedCount++;
      } else {
        failedCount++;
      }
    } else {
      core.warning(`Cleaned schema file not found: ${cleanedSchemaFile}`);
    }

    // Step 6: Report results
    core.info(`✓ Upload completed: ${uploadedCount} files uploaded, ${failedCount} files failed`);

    if (failedCount > 0) {
      const errorMessage = `Failed to upload ${failedCount} file(s)`;
      core.setFailed(errorMessage);
      throw new Error(errorMessage);
    }

    core.info(`✓ All files successfully uploaded to gs://${bucketName}/${fullVersionPath}/`);

    // Step 7: Upload config.json
    try {
      const config: DynamicModuleConfig = {
        moduleFolder: `${versionFolder}/`,
        name: `${versionFolder}/${game}-static-data-query-compiled.gql.ts`,
        version: schemaVersion,
      };

      const basePath = generateModulePath(env, game, DynamicModuleSlug.STATIC_DATA_QUERY);
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
