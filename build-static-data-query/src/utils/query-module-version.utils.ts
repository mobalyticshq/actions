import { DynamicModuleSlug } from '@shared/types/dynamic-modules.types';

export interface QueryModuleVersion {
  moduleSlug: DynamicModuleSlug;
  deterministicFragments: boolean;
}

const QUERY_MODULE_VERSIONS: Record<string, QueryModuleVersion> = {
  v2: { moduleSlug: DynamicModuleSlug.STATIC_DATA_QUERY_V2, deterministicFragments: false },
  v3: { moduleSlug: DynamicModuleSlug.STATIC_DATA_QUERY_V3, deterministicFragments: true },
};

export function resolveQueryModuleVersion(version: string): QueryModuleVersion {
  const resolved = QUERY_MODULE_VERSIONS[version || 'v2'];
  if (!resolved) {
    throw new Error(
      `Unknown query-module-version '${version}', expected one of: ${Object.keys(QUERY_MODULE_VERSIONS).join(', ')}`,
    );
  }

  return resolved;
}
