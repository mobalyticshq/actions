import { Bucket } from '@google-cloud/storage';
import { DynamicModuleSlug } from '@shared/types/dynamic-modules.types';
export interface UploadBuildOptions {
    bucket: Bucket;
    env: string;
    gameUrlSlug: string;
    schemaVersion: string;
    moduleSlug: DynamicModuleSlug;
}
export declare function uploadBuild(options: UploadBuildOptions): Promise<void>;
//# sourceMappingURL=upload-build.d.ts.map