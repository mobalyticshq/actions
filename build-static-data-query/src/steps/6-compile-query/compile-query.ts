import * as babel from '@babel/core';
import * as fs from 'fs';
import * as path from 'path';
import * as core from '@actions/core';

const graphqlTagPlugin = require('babel-plugin-graphql-tag');

const queryDir = 'build/gql/query';

export async function compileQuery(): Promise<void> {
  const absoluteQueryDir = path.resolve(process.cwd(), queryDir);

  if (!fs.existsSync(absoluteQueryDir)) {
    throw new Error(`Query directory does not exist: ${absoluteQueryDir}`);
  }

  // Find all .gql.ts files
  const queryFiles = findGqlFiles(absoluteQueryDir);
  core.info(`Found ${queryFiles.length} GraphQL query files to compile`);

  if (queryFiles.length === 0) {
    const errorMessage = 'No GraphQL query files found';
    core.setFailed(errorMessage);
    throw new Error(errorMessage);
  }

  // Compile each file
  for (const filePath of queryFiles) {
    try {
      core.info(`Compiling: ${path.relative(process.cwd(), filePath)}`);

      const sourceCode = fs.readFileSync(filePath, 'utf-8');

      const result = await babel.transformAsync(sourceCode, {
        filename: filePath,
        plugins: [[graphqlTagPlugin]],
        presets: [
          [
            '@babel/preset-typescript',
            {
              isTSX: false,
              allExtensions: false,
            },
          ],
        ],
      });

      const compiledCode = result?.code;

      if (!compiledCode) {
        const errorMessage = 'Babel transformation returned no code';
        core.setFailed(errorMessage);
        throw new Error(errorMessage);
      }

      // Create compiled file path with -compiled postfix
      const parsedPath = path.parse(filePath);
      const compiledFilePath = path.join(
        parsedPath.dir,
        `${parsedPath.name.replace('.gql', '-compiled.gql')}${parsedPath.ext}`,
      );

      // Write compiled code to new file
      fs.writeFileSync(compiledFilePath, compiledCode, 'utf-8');
      core.info(`✓ Compiled: ${path.relative(process.cwd(), compiledFilePath)}`);
    } catch (error) {
      const relativePath = path.relative(process.cwd(), filePath);
      const errorMessage = `Failed to compile ${relativePath}: ${error instanceof Error ? error.message : String(error)}`;
      core.setFailed(errorMessage);
      throw error instanceof Error ? error : new Error(errorMessage);
    }
  }

  core.info(`✓ Successfully compiled ${queryFiles.length} GraphQL query files`);
}

/**
 * Recursively find all .gql.ts files
 */
function findGqlFiles(dirPath: string, files: string[] = []): string[] {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      findGqlFiles(fullPath, files);
    } else if (entry.isFile() && entry.name.endsWith('.gql.ts')) {
      files.push(fullPath);
    }
  }

  return files;
}
