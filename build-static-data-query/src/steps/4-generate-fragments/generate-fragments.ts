import { runCursorGeneration } from '@shared/cursor-cli/run-cursor-generation';
import path from 'path';
import { CursorGenerationStepType } from '@shared/types/cursor-generation-step.types';

export async function generateFragments(options: CursorGenerationStepType): Promise<void> {
  const { timeoutMs, model } = options;
  const promptFilePath = path.resolve(__dirname, 'generate-fragments.md');
  return await runCursorGeneration({
    timeoutMs,
    prompt: `"Implement instructions in the file ${promptFilePath}"`,
    model,
  });
}
