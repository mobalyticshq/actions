import { Bucket } from '@google-cloud/storage';
import { generateModuleFolderName, generateModulePath } from '@shared/utils/dynamic-module.utils';
import { DynamicModuleSlug } from '@shared/types/dynamic-modules.types';
import { isFolderExists } from '@shared/utils/bucket.utils';

export function buildStaticDataQueryModuleFolderPath(
  env: string,
  game: string,
  schemaVersion: string,
  slug: DynamicModuleSlug,
): string {
  const basePath = generateModulePath(env, game, slug);
  const versionFolder = generateModuleFolderName(schemaVersion);
  return `${basePath}/${versionFolder}`;
}

export async function checkStaticDataQueryModuleFolderExists(
  bucket: Bucket,
  env: string,
  game: string,
  schemaVersion: string,
  slug: DynamicModuleSlug,
): Promise<boolean> {
  const versionFolderPath = buildStaticDataQueryModuleFolderPath(env, game, schemaVersion, slug);
  return isFolderExists(bucket, versionFolderPath);
}
