import { Bucket } from '@google-cloud/storage';
import { DynamicModuleSlug } from '@shared/types/dynamic-modules.types';
export interface DownloadBuildArtifactsOptions {
    bucket: Bucket;
    env: string;
    gameUrlSlug: string;
    moduleSlug: DynamicModuleSlug;
}
export declare function downloadBuildArtifacts(options: DownloadBuildArtifactsOptions): Promise<void>;
//# sourceMappingURL=download-build-artifacts.d.ts.map