import { Bucket } from '@google-cloud/storage';
import { isFolderExists } from './bucket.utils';
import { generateModulePath } from '@shared/utils/dynamic-module.utils';
import { DynamicModuleSlug } from '@shared/types/dynamic-modules.types';

export function generateStaticDataQueryModulePath(env: string, game: string) {
  return generateModulePath(env, game, DynamicModuleSlug.STATIC_DATA_QUERY);
}

export function generateVersionFolderName(schemaVersion: string) {
  return `v-${schemaVersion}-query`;
}

export function buildVersionFolderPath(env: string, game: string, schemaVersion: string): string {
  const basePath = generateStaticDataQueryModulePath(env, game);
  const versionFolder = generateVersionFolderName(schemaVersion);
  return `${basePath}/${versionFolder}`;
}

export async function checkVersionFolderExists(
  bucket: Bucket,
  env: string,
  game: string,
  schemaVersion: string,
): Promise<boolean> {
  const versionFolderPath = buildVersionFolderPath(env, game, schemaVersion);
  return isFolderExists(bucket, versionFolderPath);
}
