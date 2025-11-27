import { runCursorGeneration } from '@shared/cursor-cli/run-cursor-generation';

export interface GenerateFragmentsOptions {
  timeoutMs: number;
}

export async function generateFragments(options: GenerateFragmentsOptions): Promise<void> {
  const { timeoutMs } = options;
  return await runCursorGeneration({
    timeoutMs,
    prompt:
      '"Implement instructions in the file build-static-data-query/src/steps/4-generate-fragments/generate-fragments.md"',
  });
}
