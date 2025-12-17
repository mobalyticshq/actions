import { type Bucket } from '@google-cloud/storage';
import { DynamicModuleConfig, DynamicModuleSlug } from '../types/dynamic-modules.types';
export declare function uploadFileToBucket(bucket: Bucket, sourcePath: string, destination: string, bucketName: string, description?: string): Promise<boolean>;
export declare function downloadConfigFromBucket(bucket: Bucket, env: string, game: string, dynamicModuleSlug: DynamicModuleSlug): Promise<DynamicModuleConfig | null>;
export declare function downloadFolderFromBucket(bucket: Bucket, bucketFolderPath: string, localFolderPath: string, folderName: string, filterFiles?: (fileName: string) => boolean): Promise<void>;
interface UploadFolderResult {
    uploadedCount: number;
    failedCount: number;
}
export declare function uploadFolderToBucket(bucket: Bucket, bucketName: string, sourcePath: string, destinationPrefix: string, fileTypeDescription: string, requireExists?: boolean): Promise<UploadFolderResult>;
export declare function isFolderExists(bucket: Bucket, folderPath: string): Promise<boolean>;
export {};
//# sourceMappingURL=bucket.utils.d.ts.map