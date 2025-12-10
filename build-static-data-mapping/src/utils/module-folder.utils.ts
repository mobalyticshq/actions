import { Bucket } from '@google-cloud/storage';
import { generateModulePath } from '@shared/utils/dynamic-module.utils';
import { DynamicModuleSlug } from '@shared/types/dynamic-modules.types';
import * as core from '@actions/core';

export function buildStaticDataMappingModulePath(env: string, game: string, version: string): string {
  const basePath = generateModulePath(env, game, DynamicModuleSlug.STATIC_DATA_MAPPING);
  return `${basePath}/${version}`;
}

export function incrementVersion(currentVersion: string | null | undefined): string {
  if (!currentVersion) {
    return 'v1';
  }

  // Extract number from version string (e.g., "v1" -> 1, "v2" -> 2)
  const match = currentVersion.match(/^v(\d+)$/);
  if (!match) {
    core.warning(`Invalid version format: ${currentVersion}. Starting with v1`);
    return 'v1';
  }

  const versionNumber = parseInt(match[1], 10);
  const nextVersion = versionNumber + 1;
  return `v${nextVersion}`;
}
