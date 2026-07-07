import { Bucket } from '@google-cloud/storage';
export interface CheckSchemaVersionOptions {
    graphqlEndpoint: string;
    bucket: Bucket;
    env: string;
    game: string;
    gameUrlSlug: string;
    disableQueryAst: boolean;
}
export interface CheckSchemaVersionResult {
    shouldContinue: boolean;
    currentSchemaVersion?: string;
    existingSchemaVersion?: string;
}
export declare function checkSchemaVersion(options: CheckSchemaVersionOptions): Promise<CheckSchemaVersionResult>;
//# sourceMappingURL=check-schema-version.d.ts.map