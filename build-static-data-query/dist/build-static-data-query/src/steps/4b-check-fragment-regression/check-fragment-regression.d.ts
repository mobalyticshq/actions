import { Bucket } from '@google-cloud/storage';
export interface GuardFragmentRegressionOptions {
    bucket: Bucket;
    env: string;
    gameUrlSlug: string;
    /** Version the live config.json points to. When absent there is nothing to compare against. */
    liveSchemaVersion?: string;
    disableQueryAst: boolean;
    /** How many times to regenerate the fragments when a regression is found. */
    retries: number;
    /** Publish anyway when the regression persists after the retries. */
    allowRegression: boolean;
    /** Regenerates the fragments into build/gql (step 4). */
    regenerate: () => Promise<void>;
}
/**
 * Compares the fragments step 4 just generated with the fragments that are live. If the new ones
 * drop fields the schema still has - the generator selecting less from a linked type than it did
 * before - regenerate up to `retries` times, then fail before anything is uploaded, so the live
 * query (and every tooltip built on it) is never replaced by a narrower one.
 */
export declare function guardFragmentRegression(options: GuardFragmentRegressionOptions): Promise<void>;
//# sourceMappingURL=check-fragment-regression.d.ts.map