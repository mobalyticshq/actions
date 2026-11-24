import { runClaudeGeneration } from '@shared/claude-cli/run-claude-generation';
import path from 'path';
import { LlmGenerationStepType } from '@shared/types/llm-generation-step.types';

export async function generateFragmentsWithLlm(options: LlmGenerationStepType): Promise<void> {
  const { timeoutMs, model } = options;
  const promptFilePath = path.resolve(__dirname, 'generate-fragments.md');
  return await runClaudeGeneration({
    timeoutMs,
    prompt: `"Implement instructions in the file ${promptFilePath}"`,
    model,
    expectedOutputs: { nonEmptyDirs: ['build/gql'] },
  });
}
