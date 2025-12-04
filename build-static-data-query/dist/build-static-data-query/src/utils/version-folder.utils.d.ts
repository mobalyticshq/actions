import { Bucket } from '@google-cloud/storage';
export declare function generateBasePath(env: string, game: string): string;
export declare function generateVersionFolderName(schemaVersion: string): string;
export declare function buildVersionFolderPath(env: string, game: string, schemaVersion: string): string;
export declare function folderExists(bucket: Bucket, folderPath: string): Promise<boolean>;
export declare function checkVersionFolderExists(bucket: Bucket, env: string, game: string, schemaVersion: string): Promise<boolean>;
//# sourceMappingURL=version-folder.utils.d.ts.map