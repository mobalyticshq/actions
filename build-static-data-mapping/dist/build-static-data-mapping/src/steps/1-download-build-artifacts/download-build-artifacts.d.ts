import { Bucket } from '@google-cloud/storage';
export interface DownloadBuildArtifactsOptions {
    bucket: Bucket;
    env: string;
    gameUrlSlug: string;
}
export declare function downloadBuildArtifacts(options: DownloadBuildArtifactsOptions): Promise<void>;
//# sourceMappingURL=download-build-artifacts.d.ts.map