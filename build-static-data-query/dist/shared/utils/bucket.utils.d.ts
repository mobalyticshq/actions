import { type Bucket } from '@google-cloud/storage';
import { DynamicModuleConfig } from '../types/dynamic-modules.types';
export declare function uploadFileToBucket(bucket: Bucket, sourcePath: string, destination: string, bucketName: string, description?: string): Promise<boolean>;
export declare function downloadConfigFromBucket(bucket: Bucket, env: string, game: string): Promise<DynamicModuleConfig | null>;
//# sourceMappingURL=bucket.utils.d.ts.map