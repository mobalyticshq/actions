import { Bucket } from '@google-cloud/storage';
export interface UploadBuildOptions {
    bucket: Bucket;
    env: string;
    game: string;
    schemaVersion: string;
    cacheVersion: string;
}
export declare function uploadBuild(options: UploadBuildOptions): Promise<void>;
//# sourceMappingURL=upload-build.d.ts.map