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
    /**
     * Selected in the live fragments, missing from the new ones, and deeper than one level of linked
     * entities - fields an over-expanded live query fetched that the generator is not meant to.
     */
    beyondOneLevel: DroppedField[];
    /**
     * Live fragments on embedded (non-entity) types with no new counterpart. The generator is asked
     * for entity fragments only; their fields are covered through the entity fragments.
     */
    droppedHelperFragments: string[];
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
 * The entity types: the item type of each group's `data` field under `<Game>StaticDataQuery.groups`.
 * Empty when the schema has no such query type.
 */
export declare function entityTypeNames(schema: GraphQLSchema): Set<string>;
/**
 * Whether `path` stays within one level of linked entities, as the generator is told to: a linked
 * entity contributes its scalar fields only, never its own object-type fields.
 */
export declare function pathWithinOneLevel(schema: GraphQLSchema, typeName: string, path: string, entities: Set<string>): boolean;
/**
 * Compares freshly generated fragments with the ones that are live. A field the live fragments
 * select that the new ones do not is a regression if the schema still has it - the generator
 * dropped it - and an acceptable removal if the schema no longer has it, or if it sits deeper than
 * one level of linked entities.
 */
export declare function compareFragments(live: FragmentInfo[], fresh: FragmentInfo[], schema: GraphQLSchema): FragmentComparison;
export interface FragmentStats {
    /** Total selected fields across all fragments. */
    fields: number;
    /** Deepest selection, counted in path segments ("effects.spell.name" is 3). */
    maxDepth: number;
}
export declare function fragmentStats(fragments: FragmentInfo[]): FragmentStats;
export interface GrowthLimits {
    /** Fail when the new fragments select more than this many times the live field count. */
    maxFieldRatio: number;
    /** Fail when the new fragments nest more than this many levels deeper than the live ones. */
    maxDepthIncrease: number;
}
export interface GrowthCheck {
    live: FragmentStats;
    fresh: FragmentStats;
    tooManyFields: boolean;
    tooDeep: boolean;
}
/**
 * The opposite failure to a regression: the generator expanding linked types far deeper than the
 * live query does, producing a query too large for the GraphQL server to accept.
 */
export declare function checkGrowth(live: FragmentInfo[], fresh: FragmentInfo[], limits: GrowthLimits): GrowthCheck;
/**
 * One line per fragment listing its dropped paths. When a whole sub-object was dropped, only the
 * sub-object is listed - "grid.talent", not also "grid.talent.iconUrl", "grid.talent.name", ...
 */
export declare function summariseDropped(dropped: DroppedField[]): string[];
//# sourceMappingURL=fragment-paths.d.ts.map