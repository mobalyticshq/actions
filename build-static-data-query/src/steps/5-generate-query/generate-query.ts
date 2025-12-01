import { runCursorGeneration } from '@shared/cursor-cli/run-cursor-generation';
import path from 'path';

export interface GenerateQueryOptions {
  timeoutMs: number;
}

export async function generateQuery(options: GenerateQueryOptions): Promise<void> {
  const { timeoutMs } = options;
  const promptFilePath = path.resolve(process.cwd(), 'src/steps/5-generate-query/generate-query.md');
  return await runCursorGeneration({
    timeoutMs,
    prompt: `"Implement instructions in the file ${promptFilePath}"`,
  });
}
