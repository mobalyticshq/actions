import { generateModuleFolderName, generateModulePath } from '@shared/utils/dynamic-module.utils';
import { DynamicModuleSlug } from '@shared/types/dynamic-modules.types';
import * as core from '@actions/core';

export function buildStaticDataMappingModulePath(env: string, game: string, version: string): string {
  const basePath = generateModulePath(env, game, DynamicModuleSlug.STATIC_DATA_MAPPING);
  return `${basePath}/${version}`;
}

export function incrementVersion(currentVersion: string | null | undefined): string {
  const defaultFolderName = generateModuleFolderName('1');

  if (!currentVersion) {
    return defaultFolderName;
  }

  // Extract number from version string (e.g., "v1" -> 1, "v2" -> 2)
  const match = currentVersion.match(/^v(\d+)$/);
  if (!match) {
    core.warning(`Invalid version format: ${currentVersion}. Starting with v1`);
    return defaultFolderName;
  }

  const versionNumber = parseInt(match[1], 10);
  const nextVersion = `${versionNumber + 1}`;
  return generateModuleFolderName(nextVersion);
}
