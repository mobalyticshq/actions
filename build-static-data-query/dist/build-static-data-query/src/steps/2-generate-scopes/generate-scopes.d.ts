export interface GenerateScopesOptions {
    schemaPath: string;
    gameField: string;
}
export interface ScopesData {
    queryNamespaces: string[];
    mutationNamespaces: string[];
    subscriptionNamespaces: string[];
    targetGameQueryFields: string[];
    targetGameQueryTypeName: string | undefined;
}
export declare function generateScopes(options: GenerateScopesOptions): ScopesData;
//# sourceMappingURL=generate-scopes.d.ts.map