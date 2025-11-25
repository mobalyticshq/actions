import { generate } from '@graphql-codegen/cli';
import { rimraf } from 'rimraf';
import * as path from 'path';
import * as fs from 'fs';

export interface DownloadSchemaOptions {
  endpoint: string;
  outputPath: string;
  headers?: Record<string, string>;
}

export async function downloadSchema(
  options: DownloadSchemaOptions
): Promise<string> {
  const { endpoint, outputPath, headers = {} } = options;

  // Resolve the absolute path for the output
  const absoluteOutputPath = path.resolve(process.cwd(), outputPath);
  const outputDir = path.dirname(absoluteOutputPath);

  // Step 1: Clean up old schema files in the output directory
  // This mimics the behavior of: rimraf ./src/**/*schema.graphql
  try {
    const schemaPattern = path.join(outputDir, '**/*schema.graphql');
    await rimraf(schemaPattern);
  } catch (error) {
    // If cleanup fails, log but continue - directory might not exist yet
    console.warn(`Warning: Could not clean up old schema files: ${error}`);
  }

  // Step 2: Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Step 3: Configure and execute graphql-codegen
  const config = {
    schema: [
      {
        [endpoint]: {
          headers,
        },
      },
    ],
    generates: {
      [absoluteOutputPath]: {
        plugins: ['schema-ast'],
        config: {
          includeDirectives: true,
          commentDescriptions: true,
        },
      },
    },
  };

  // Step 4: Execute the code generation
  try {
    await generate(config, true);
  } catch (error) {
    throw new Error(
      `Failed to download schema from ${endpoint}: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }

  // Verify the file was created
  if (!fs.existsSync(absoluteOutputPath)) {
    throw new Error(
      `Schema file was not created at expected path: ${absoluteOutputPath}`
    );
  }

  return absoluteOutputPath;
}

