import { Bucket } from '@google-cloud/storage';
export interface DownloadBuildArtifactsOptions {
    bucket: Bucket;
    env: string;
    game: string;
}
export declare function downloadBuildArtifacts(options: DownloadBuildArtifactsOptions): Promise<void>;
//# sourceMappingURL=download-build-artifacts.d.ts.map