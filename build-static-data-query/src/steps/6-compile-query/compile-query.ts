import { compileCode } from '../../utils/compile.utils';

const queryDir = 'build/gql';
const outputDir = 'build/dist';

const entryFileName = 'entrypoint.ts';
const outputFileName = 'entrypoint.js';

export async function compileQueries(): Promise<void> {
  await compileCode(queryDir, outputDir, entryFileName, outputFileName);
}
