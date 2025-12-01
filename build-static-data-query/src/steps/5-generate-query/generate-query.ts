import { runCursorGeneration } from '@shared/cursor-cli/run-cursor-generation';
import path from 'path';

export interface GenerateQueryOptions {
  timeoutMs: number;
}

export async function generateQuery(options: GenerateQueryOptions): Promise<void> {
  const { timeoutMs } = options;
  const promptFilePath = path.resolve(__dirname, 'generate-query.md');
  return await runCursorGeneration({
    timeoutMs,
    prompt: `"Implement instructions in the file ${promptFilePath}"`,
  });
}
