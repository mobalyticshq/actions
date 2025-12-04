import { generate } from '@graphql-codegen/cli';
import { rimraf } from 'rimraf';
import * as path from 'path';
import * as fs from 'fs';
import * as core from '@actions/core';

export interface DownloadSchemaOptions {
  endpoint: string;
}

const outputPath = '_generated/schema.graphql';
const headers = {
  'xmoba-no-cache': '1',
};

export async function downloadSchema(options: DownloadSchemaOptions): Promise<string> {
  try {
    const { endpoint } = options;

    // Resolve the absolute path for the output
    const absoluteOutputPath = path.resolve(process.cwd(), outputPath);
    const outputDir = path.dirname(absoluteOutputPath);

    // Step 1: Clean up old schema files in the output directory
    // This mimics the behavior of: rimraf ./src/**/*schema.graphql
    try {
      const schemaPattern = path.join(outputDir, '**/*schema.graphql');
      await rimraf(schemaPattern);
      core.info('Cleaned up old schema files');
    } catch (error) {
      // If cleanup fails, log but continue - directory might not exist yet
      core.warning(`Could not clean up old schema files: ${error instanceof Error ? error.message : String(error)}`);
    }

    // Step 2: Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
      core.info(`Created output directory: ${outputDir}`);
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
    core.info(`Downloading schema from: ${endpoint}`);
    try {
      await generate(config, true);
    } catch (error) {
      const errorMessage = `Failed to download schema from ${endpoint}: ${error instanceof Error ? error.message : String(error)}`;
      core.setFailed(errorMessage);
      throw new Error(errorMessage);
    }

    // Verify the file was created
    if (!fs.existsSync(absoluteOutputPath)) {
      const errorMessage = `Schema file was not created at expected path: ${absoluteOutputPath}`;
      core.setFailed(errorMessage);
      throw new Error(errorMessage);
    }

    core.info(`✓ Schema successfully saved to: ${absoluteOutputPath}`);
    return absoluteOutputPath;
  } catch (error) {
    // Catch any unexpected errors
    const errorMessage = `Unexpected error in downloadSchema: ${error instanceof Error ? error.message : String(error)}`;
    core.setFailed(errorMessage);
    throw error instanceof Error ? error : new Error(errorMessage);
  }
}
