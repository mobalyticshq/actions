import { type GraphQLSchema } from 'graphql';
export interface FragmentInfo {
    name: string;
    typeCondition: string;
    /** Every selected field as a dotted path from the fragment root, e.g. "quality.color". */
    paths: Set<string>;
}
export interface DroppedField {
    fragment: string;
    typeCondition: string;
    path: string;
}
export interface FragmentComparison {
    /** Selected in the live fragments, missing from the new ones, and still in the schema. */
    regressions: DroppedField[];
    /** Selected in the live fragments, missing from the new ones, and gone from the schema too. */
    schemaRemovals: DroppedField[];
    /** Paths the new fragments select that the live ones did not. */
    addedCount: number;
}
/**
 * Pulls the GraphQL document out of a generated `*-fragment.gql.ts` file, which wraps it in a
 * gql`...` template literal. Interpolations (`${...}`) are dropped; fragments are compared one by one.
 */
export declare function extractGqlFromFragmentFile(source: string): string;
export declare function collectFragmentPaths(gqlText: string): FragmentInfo[];
/** Whether `path` can still be selected from `typeName` in the given schema. */
export declare function pathExistsInSchema(schema: GraphQLSchema, typeName: string, path: string): boolean;
/**
 * Compares freshly generated fragments with the ones that are live. A field the live fragments
 * select that the new ones do not is a regression if the schema still has it - the generator
 * dropped it - and an acceptable removal if the schema no longer has it.
 */
export declare function compareFragments(live: FragmentInfo[], fresh: FragmentInfo[], schema: GraphQLSchema): FragmentComparison;
/**
 * One line per fragment listing its dropped paths. When a whole sub-object was dropped, only the
 * sub-object is listed - "grid.talent", not also "grid.talent.iconUrl", "grid.talent.name", ...
 */
export declare function summariseDropped(dropped: DroppedField[]): string[];
//# sourceMappingURL=fragment-paths.d.ts.map