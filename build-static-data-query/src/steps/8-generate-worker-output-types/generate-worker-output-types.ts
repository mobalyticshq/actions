import { runCursorGeneration } from '@shared/cursor-cli/run-cursor-generation';
import path from 'path';
import { CursorGenerationStepType } from '@shared/types/cursor-generation-step.types';

export async function generateWorkerOutputTypes(options: CursorGenerationStepType): Promise<void> {
  const { timeoutMs, model } = options;
  const promptFilePath = path.resolve(__dirname, 'generate-worker-output-types.md');
  return await runCursorGeneration({
    timeoutMs,
    prompt: `"Implement instructions in the file ${promptFilePath}"`,
    model,
  });
}
