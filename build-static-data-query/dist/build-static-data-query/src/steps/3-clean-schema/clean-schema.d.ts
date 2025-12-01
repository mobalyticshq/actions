import type { ScopesData } from '../2-generate-scopes';
export interface CleanSchemaOptions {
    schemaPath: string;
    gameField: string;
    staticDataFieldName: string;
    scopesData: ScopesData;
}
export declare function cleanSchema(options: CleanSchemaOptions): Promise<string>;
//# sourceMappingURL=clean-schema.d.ts.map