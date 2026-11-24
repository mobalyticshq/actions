import { runClaudeGeneration } from '@shared/claude-cli/run-claude-generation';
import path from 'path';
import { LlmGenerationStepType } from '@shared/types/llm-generation-step.types';

export async function generateWorkerOutputTypes(options: LlmGenerationStepType): Promise<void> {
  const { timeoutMs, model } = options;
  const promptFilePath = path.resolve(__dirname, 'generate-worker-output-types.md');
  return await runClaudeGeneration({
    timeoutMs,
    prompt: `"Implement instructions in the file ${promptFilePath}"`,
    model,
    expectedOutputs: { files: ['build/gql/gql-types/worker-output.types.ts'] },
  });
}
