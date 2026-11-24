import { ExpectedOutputs } from './find-missing-outputs';
interface RunClaudeGenerationInput {
    timeoutMs: number;
    prompt: string;
    model?: string;
    expectedOutputs: ExpectedOutputs;
}
export declare function runClaudeGeneration(input: RunClaudeGenerationInput): Promise<void>;
export {};
//# sourceMappingURL=run-claude-generation.d.ts.map