import { runCursorGeneration } from '@shared/cursor-cli/run-cursor-generation';
import path from 'path';

export interface GenerateMappingOptions {
  timeoutMs: number;
}

export async function generateMapping(options: GenerateMappingOptions): Promise<void> {
  const { timeoutMs } = options;
  const promptFilePath = path.resolve(__dirname, 'generate-mapping.md');
  return await runCursorGeneration({
    timeoutMs,
    prompt: `"Implement instructions in the file ${promptFilePath}"`,
  });
}
