import path from 'path';
import fs from 'fs';
import { pathToFileURL } from 'url';
import { print, type DocumentNode } from 'graphql';
import * as core from '@actions/core';
import { compileCode } from '../../utils/compile.utils';

const queryDir = 'build/gql';
const outputDir = 'build/dist';

const entryFileName = 'entrypoint.ts';
const outputFileName = 'entrypoint.js';

export interface CompileQueriesOptions {
  disableQueryAst: boolean;
}

// Native ESM dynamic import that survives TS (module: commonjs) and webpack
// transpilation, which would otherwise rewrite `import()` into `require()`.
const importEsm = new Function('specifier', 'return import(specifier);') as (
  specifier: string,
) => Promise<{ default: Record<string, DocumentNode> }>;

export async function compileQueries(options: CompileQueriesOptions): Promise<void> {
  const { disableQueryAst } = options;

  if (!disableQueryAst) {
    // v1: compile the gql template literals into a DocumentNode (AST) bundle.
    await compileCode(queryDir, outputDir, entryFileName, outputFileName);
    return;
  }

  // v2: fragment stitching still runs through the AST, but we print the
  // DocumentNodes to plain strings at build time so the published artifact is a
  // dependency-free string map (no runtime `graphql` require).
  const astFileName = 'entrypoint.ast.mjs';
  await compileCode(queryDir, outputDir, entryFileName, astFileName);

  const absoluteOutputDir = path.resolve(process.cwd(), outputDir);
  const astFilePath = path.join(absoluteOutputDir, astFileName);

  const astModule = await importEsm(pathToFileURL(astFilePath).href);
  const queries = astModule.default;

  const entries = Object.entries(queries)
    .map(([key, documentNode]) => `  ${JSON.stringify(key)}: ${JSON.stringify(print(documentNode))}`)
    .join(',\n');
  const fileContents = `export default {\n${entries},\n};\n`;

  const outputFilePath = path.join(absoluteOutputDir, outputFileName);
  fs.writeFileSync(outputFilePath, fileContents, 'utf-8');
  core.info(`✓ Emitted plain-string query artifact to: ${path.relative(process.cwd(), outputFilePath)}`);

  // Remove the intermediate AST bundle so only the string artifact is published.
  fs.rmSync(astFilePath, { force: true });
}
