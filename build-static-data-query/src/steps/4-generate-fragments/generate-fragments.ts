import { runCursorGeneration } from '@shared/cursor-cli/run-cursor-generation';
import path from 'path';

export interface GenerateFragmentsOptions {
  timeoutMs: number;
}

export async function generateFragments(options: GenerateFragmentsOptions): Promise<void> {
  const { timeoutMs } = options;
  const promptFilePath = path.resolve(process.cwd(), './generate-fragments.md');
  return await runCursorGeneration({
    timeoutMs,
    prompt: `"Implement instructions in the file ${promptFilePath}"`,
  });
}
