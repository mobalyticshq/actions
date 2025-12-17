import { runCursorGeneration } from '@shared/cursor-cli/run-cursor-generation';
import path from 'path';

export interface GenerateWorkerOutputTypesOptions {
  timeoutMs: number;
}

export async function generateWorkerOutputTypes(options: GenerateWorkerOutputTypesOptions): Promise<void> {
  const { timeoutMs } = options;
  const promptFilePath = path.resolve(__dirname, 'generate-worker-output-types.md');
  return await runCursorGeneration({
    timeoutMs,
    prompt: `"Implement instructions in the file ${promptFilePath}"`,
  });
}
