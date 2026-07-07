import { Bucket } from '@google-cloud/storage';
import { DynamicModuleSlug } from '@shared/types/dynamic-modules.types';
export declare function buildStaticDataQueryModuleFolderPath(env: string, game: string, schemaVersion: string, slug: DynamicModuleSlug): string;
export declare function checkStaticDataQueryModuleFolderExists(bucket: Bucket, env: string, game: string, schemaVersion: string, slug: DynamicModuleSlug): Promise<boolean>;
//# sourceMappingURL=module-folder.utils.d.ts.map