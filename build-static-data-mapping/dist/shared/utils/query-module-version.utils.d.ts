import { DynamicModuleSlug } from '@shared/types/dynamic-modules.types';
export interface QueryModuleVersion {
    moduleSlug: DynamicModuleSlug;
    deterministicFragments: boolean;
}
export declare function resolveQueryModuleVersion(version: string): QueryModuleVersion;
//# sourceMappingURL=query-module-version.utils.d.ts.map