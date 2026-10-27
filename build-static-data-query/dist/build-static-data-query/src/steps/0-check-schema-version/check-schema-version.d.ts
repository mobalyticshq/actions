import { Bucket } from '@google-cloud/storage';
import { DynamicModuleSlug } from '@shared/types/dynamic-modules.types';
export interface CheckSchemaVersionOptions {
    graphqlEndpoint: string;
    bucket: Bucket;
    env: string;
    game: string;
    gameUrlSlug: string;
    moduleSlug: DynamicModuleSlug;
}
export interface CheckSchemaVersionResult {
    shouldContinue: boolean;
    currentSchemaVersion?: string;
    existingSchemaVersion?: string;
}
export declare function checkSchemaVersion(options: CheckSchemaVersionOptions): Promise<CheckSchemaVersionResult>;
//# sourceMappingURL=check-schema-version.d.ts.map