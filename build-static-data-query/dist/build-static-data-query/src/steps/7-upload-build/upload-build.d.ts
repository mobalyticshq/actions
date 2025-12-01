export interface UploadBuildOptions {
    bucketName: string;
    gcsProjectId: string;
    env: string;
    game: string;
    schemaVersion: string;
}
export declare function uploadBuild(options: UploadBuildOptions): Promise<void>;
//# sourceMappingURL=upload-build.d.ts.map