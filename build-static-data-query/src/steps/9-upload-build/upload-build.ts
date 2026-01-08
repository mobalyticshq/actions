import { Bucket } from '@google-cloud/storage';
import * as fs from 'fs';
import * as path from 'path';
import * as core from '@actions/core';
import { uploadFileToBucket } from '@shared/utils/bucket.utils';
import {
  checkStaticDataQueryModuleFolderExists,
  buildStaticDataQueryModuleFolderPath,
} from '../../utils/module-folder.utils';
import { DynamicModuleConfig, DynamicModuleSlug } from '@shared/types/dynamic-modules.types';
import { generateModuleFolderName, generateModulePath } from '@shared/utils/dynamic-module.utils';
import { getAllFilesRecursive } from '@shared/utils/fs.utils';
import { computeMd5Hash } from '@shared/utils/hash.utils';

export interface UploadBuildOptions {
  bucket: Bucket;
  env: string;
  gameUrlSlug: string;
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

function makeModuleEntrypointName(hash: string): string {
  return `static-data-query.${hash}.js`;
}

export async function uploadBuild(options: UploadBuildOptions): Promise<void> {
  try {
    const { bucket, env, gameUrlSlug, schemaVersion } = options;
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
    const fullVersionPath = buildStaticDataQueryModuleFolderPath(env, gameUrlSlug, schemaVersion);

    core.info(`Target path: gs://${bucketName}/${fullVersionPath}`);

    // Step 3: Check if version folder already exists
    const moduleFolderExists = await checkStaticDataQueryModuleFolderExists(bucket, env, gameUrlSlug, schemaVersion);
    if (moduleFolderExists) {
      const errorMessage = `Folder ${fullVersionPath} already exists in bucket ${bucketName}. Cannot overwrite existing version.`;
      core.setFailed(errorMessage);
      throw new Error(errorMessage);
    }

    const moduleFolder = generateModuleFolderName(schemaVersion);
    core.info(`✓ Version folder does not exist, proceeding with upload`);

    // Step 4: Resolve build directory paths]
    const distPath = path.resolve(process.cwd(), buildPath, 'dist');
    const buildGqlPath = path.resolve(process.cwd(), buildPath, 'gql');
    const buildTypesPath = path.resolve(process.cwd(), buildPath, 'gql', 'gql-types');

    // Step 5: Upload files according to new structure
    let uploadedCount = 0;
    let entrypointName = '';

    // 6.1: Upload compiled query to root
    const compiledQueryFile = path.join(distPath, `static-data-query.js`);
    if (fs.existsSync(compiledQueryFile)) {
      const compiledQueryHash = computeMd5Hash(compiledQueryFile);
      entrypointName = makeModuleEntrypointName(compiledQueryHash);
      const destination = `${fullVersionPath}/${entrypointName}`;
      const success = await uploadFileToBucket(bucket, compiledQueryFile, destination, bucketName, 'compiled query');
      if (success) {
        uploadedCount++;
      } else {
        const errorMessage = `Compiled query file hasn't been uploaded`;
        core.setFailed(errorMessage);
        throw new Error(errorMessage);
      }
    } else {
      const errorMessage = `Compiled query file not found: ${compiledQueryFile}`;
      core.setFailed(errorMessage);
      throw new Error(errorMessage);
    }

    // 6.2: Upload fragments to fragments/ folder
    const fragmentFiles = getFilesInDirectory(buildGqlPath, '-fragment.gql.ts');
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
          const errorMessage = `Fragment file ${fileName} hasn't been uploaded`;
          core.setFailed(errorMessage);
          throw new Error(errorMessage);
        }
      }
    } else {
      core.warning(`No fragment files found in ${buildGqlPath}`);
    }

    // 6.3: Upload ts query file to query/ folder
    const queryFile = path.join(buildGqlPath, `static-data-query.gql.ts`);
    if (fs.existsSync(queryFile)) {
      const destination = `${fullVersionPath}/query/static-data-query.gql.ts`;
      const success = await uploadFileToBucket(bucket, queryFile, destination, bucketName, 'query file');
      if (success) {
        uploadedCount++;
      } else {
        const errorMessage = `Query file hasn't been uploaded`;
        core.setFailed(errorMessage);
        throw new Error(errorMessage);
      }
    } else {
      core.warning(`Query file not found: ${queryFile}`);
    }

    // 6.4: Upload all files from gql-types folders to types/ folder
    const typeSourcePaths = [{ path: buildTypesPath, name: 'gql-types' }];

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
            const errorMessage = `Type file ${relativePath} hasn't been uploaded`;
            core.setFailed(errorMessage);
            throw new Error(errorMessage);
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
        const errorMessage = `Cleaned schema file hasn't been uploaded`;
        core.setFailed(errorMessage);
        throw new Error(errorMessage);
      }
    } else {
      core.warning(`Cleaned schema file not found: ${cleanedSchemaFile}`);
    }

    // Step 6: Report results
    core.info(`✓ Upload completed: ${uploadedCount} files uploaded`);

    core.info(`✓ All files successfully uploaded to gs://${bucketName}/${fullVersionPath}/`);

    // Step 7: Upload config.json
    try {
      const config: DynamicModuleConfig = {
        moduleFolder: `${moduleFolder}/`,
        name: `${moduleFolder}/${entrypointName}`,
        version: schemaVersion,
      };

      const basePath = generateModulePath(env, gameUrlSlug, DynamicModuleSlug.STATIC_DATA_QUERY);
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
