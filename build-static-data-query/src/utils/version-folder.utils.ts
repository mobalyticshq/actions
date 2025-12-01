import { Bucket } from '@google-cloud/storage';

export function generateBasePath(env: string, game: string) {
  return `dynamic-modules/${env}/${game}/static-data-query`;
}

export function generateVersionFolderName(schemaVersion: string) {
  return `v-${schemaVersion}-query`;
}

export function buildVersionFolderPath(env: string, game: string, schemaVersion: string): string {
  const basePath = generateBasePath(env, game);
  const versionFolder = generateVersionFolderName(schemaVersion);
  return `${basePath}/${versionFolder}`;
}

export async function folderExists(bucket: Bucket, folderPath: string): Promise<boolean> {
  const prefix = folderPath.endsWith('/') ? folderPath : `${folderPath}/`;
  const [files] = await bucket.getFiles({ prefix, maxResults: 1 });
  return files.length > 0;
}

export async function checkVersionFolderExists(
  bucket: Bucket,
  env: string,
  game: string,
  schemaVersion: string,
): Promise<boolean> {
  const versionFolderPath = buildVersionFolderPath(env, game, schemaVersion);
  return folderExists(bucket, versionFolderPath);
}
