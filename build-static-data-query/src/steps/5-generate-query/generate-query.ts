import { runClaudeGeneration } from '@shared/claude-cli/run-claude-generation';
import path from 'path';
import { writeFile } from 'fs/promises';
import { LlmGenerationStepType } from '@shared/types/llm-generation-step.types';

const entrypointFileTemplate = `
import staticDataQuery from './static-data-query.gql.ts';
import staticDataMetaQuery from './static-data-meta-query.gql.ts';

export default {
  staticDataQuery,
  staticDataMetaQuery,
}
`;

const outputDir = 'build/gql';

export async function generateQuery(options: LlmGenerationStepType): Promise<void> {
  const { timeoutMs, model } = options;
  const promptFilePath = path.resolve(__dirname, 'generate-query.md');
  await runClaudeGeneration({
    timeoutMs,
    prompt: `"Implement instructions in the file ${promptFilePath}"`,
    model,
    expectedOutputs: {
      files: [path.join(outputDir, 'static-data-query.gql.ts'), path.join(outputDir, 'static-data-meta-query.gql.ts')],
    },
  });
  await writeFile(path.join(outputDir, 'entrypoint.ts'), entrypointFileTemplate);
}
