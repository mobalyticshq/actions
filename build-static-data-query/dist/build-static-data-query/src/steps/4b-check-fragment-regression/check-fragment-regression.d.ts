import { Bucket } from '@google-cloud/storage';
import { type GrowthLimits } from './fragment-paths';
export interface GuardFragmentRegressionOptions {
    bucket: Bucket;
    env: string;
    gameUrlSlug: string;
    /** Version the live config.json points to. When absent there is nothing to compare against. */
    liveSchemaVersion?: string;
    disableQueryAst: boolean;
    /** How many times to regenerate the fragments when a regression or over-growth is found. */
    retries: number;
    /** How much larger and deeper than the live fragments the new ones may be. */
    growthLimits: GrowthLimits;
    /** Publish anyway when the problem persists after the retries. */
    allowRegression: boolean;
    /** Regenerates the fragments into build/gql (step 4). */
    regenerate: () => Promise<void>;
}
/**
 * Compares the fragments step 4 just generated with the fragments that are live, and catches the
 * generator going wrong in either direction:
 *   - narrower: dropping fields the schema still has (a linked type cut down to slug/id/name)
 *   - larger:   expanding linked types far deeper, into a query the GraphQL server rejects
 * Either way, regenerate up to `retries` times, then fail before anything is uploaded, so the live
 * query (and every tooltip built on it) is never replaced by a broken one.
 */
export declare function guardFragmentRegression(options: GuardFragmentRegressionOptions): Promise<void>;
//# sourceMappingURL=check-fragment-regression.d.ts.map