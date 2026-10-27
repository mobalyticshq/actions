import { type GraphQLObjectType, type GraphQLSchema } from 'graphql';
export interface GenerateFragmentsOptions {
    gameField: string;
    staticDataFieldName: string;
}
export interface GeneratedFragment {
    fileName: string;
    content: string;
}
export declare function getEntityTypes(schema: GraphQLSchema, options: GenerateFragmentsOptions): GraphQLObjectType[];
export declare function buildFragments(schema: GraphQLSchema, options: GenerateFragmentsOptions): GeneratedFragment[];
export declare function generateFragments(options: GenerateFragmentsOptions): Promise<void>;
//# sourceMappingURL=generate-fragments.d.ts.map