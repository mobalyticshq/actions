import { Bucket } from '@google-cloud/storage';
export declare function generateStaticDataQueryModulePath(env: string, game: string): string;
export declare function generateVersionFolderName(schemaVersion: string): string;
export declare function buildVersionFolderPath(env: string, game: string, schemaVersion: string): string;
export declare function checkVersionFolderExists(bucket: Bucket, env: string, game: string, schemaVersion: string): Promise<boolean>;
//# sourceMappingURL=module-folder.utils.d.ts.map