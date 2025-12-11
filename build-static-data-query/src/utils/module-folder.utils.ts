import { Bucket } from '@google-cloud/storage';
import { generateModuleFolderName, generateModulePath } from '@shared/utils/dynamic-module.utils';
import { DynamicModuleSlug } from '@shared/types/dynamic-modules.types';
import { isFolderExists } from '@shared/utils/bucket.utils';

export function buildStaticDataQueryModuleFolderPath(env: string, game: string, schemaVersion: string): string {
  const basePath = generateModulePath(env, game, DynamicModuleSlug.STATIC_DATA_QUERY);
  const versionFolder = generateModuleFolderName(schemaVersion);
  return `${basePath}/${versionFolder}`;
}

export async function checkStaticDataQueryModuleFolderExists(
  bucket: Bucket,
  env: string,
  game: string,
  schemaVersion: string,
): Promise<boolean> {
  const versionFolderPath = buildStaticDataQueryModuleFolderPath(env, game, schemaVersion);
  return isFolderExists(bucket, versionFolderPath);
}
