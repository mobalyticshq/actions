import { type Bucket } from '@google-cloud/storage';
import { DynamicModuleConfig, DynamicModuleSlug } from '../types/dynamic-modules.types';
export declare function uploadFileToBucket(bucket: Bucket, sourcePath: string, destination: string, bucketName: string, description?: string): Promise<boolean>;
export declare function downloadConfigFromBucket(bucket: Bucket, env: string, game: string, dynamicModuleSlug: DynamicModuleSlug): Promise<DynamicModuleConfig | null>;
export declare function isFolderExists(bucket: Bucket, folderPath: string): Promise<boolean>;
//# sourceMappingURL=bucket.utils.d.ts.map