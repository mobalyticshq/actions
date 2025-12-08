export declare const TimeoutError: "TIMEOUT_ERROR";
interface SpawnWithTimeoutInActionArgs {
    command: string;
    args: string[];
    timeoutMs: number;
    env?: NodeJS.ProcessEnv;
    extraConditionPromise?: Promise<string>;
}
export declare function spawnWithTimeout(input: SpawnWithTimeoutInActionArgs): Promise<string>;
export {};
//# sourceMappingURL=exec.utils.d.ts.map