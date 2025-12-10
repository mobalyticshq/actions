import { Bucket } from '@google-cloud/storage';
export declare function generateStaticDataQueryModuleFolderName(schemaVersion: string): string;
export declare function buildStaticDataQueryModuleFolderPath(env: string, game: string, schemaVersion: string): string;
export declare function checkStaticDataQueryModuleFolderExists(bucket: Bucket, env: string, game: string, schemaVersion: string): Promise<boolean>;
//# sourceMappingURL=module-folder.utils.d.ts.map