import { runClaudeGeneration } from '@shared/claude-cli/run-claude-generation';
import path from 'path';
import { LlmGenerationStepType } from '@shared/types/llm-generation-step.types';

export async function generateMapping(options: LlmGenerationStepType): Promise<void> {
  const { timeoutMs, model } = options;
  const promptFilePath = path.resolve(__dirname, 'generate-mapping.md');
  return await runClaudeGeneration({
    timeoutMs,
    prompt: `"Implement instructions in the file ${promptFilePath}"`,
    model,
    expectedOutputs: {
      files: ['build/mapping/index.ts', 'build/types/mapping.types.ts'],
    },
  });
}
