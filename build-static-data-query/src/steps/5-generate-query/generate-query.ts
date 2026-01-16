import { runCursorGeneration } from '@shared/cursor-cli/run-cursor-generation';
import path from 'path';
import { writeFile } from 'fs/promises';
import { CursorGenerationStepType } from '@shared/types/cursor-generation-step.types';

const entrypointFileTemplate = `
import staticDataQuery from './static-data-query.gql.ts';
import staticDataMetaQuery from './static-data-meta-query.gql.ts';

export default {
  staticDataQuery,
  staticDataMetaQuery,
}
`;

const outputDir = 'build/gql';

export async function generateQuery(options: CursorGenerationStepType): Promise<void> {
  const { timeoutMs, model } = options;
  const promptFilePath = path.resolve(__dirname, 'generate-query.md');
  await runCursorGeneration({
    timeoutMs,
    prompt: `"Implement instructions in the file ${promptFilePath}"`,
    model,
  });
  await writeFile(path.join(outputDir, 'entrypoint.ts'), entrypointFileTemplate);
}
