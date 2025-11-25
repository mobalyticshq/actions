import { generate } from '@graphql-codegen/cli';
import { getCleanedSchemaByGame } from '../../../codegen/utils/clean-schema-by-game.js';
import * as path from 'path';
import * as fs from 'fs';
import * as core from '@actions/core';

export interface CleanSchemaOptions {
  schemaPath: string;
  gameField: string;
  staticDataFieldName: string;
}

const OUTPUT_PATH = 'dist/generated/cleaned-schema.graphql';

export async function cleanSchema(options: CleanSchemaOptions): Promise<string> {
  try {
    const { schemaPath, gameField, staticDataFieldName } = options;

    core.info(`Cleaning schema from: ${schemaPath}`);
    core.info(`Game field: ${gameField}`);
    core.info(`Static data field: ${staticDataFieldName}`);

    // Verify input schema exists
    if (!fs.existsSync(schemaPath)) {
      core.setFailed(`Input schema file not found: ${schemaPath}`);
      process.exit(1);
    }

    // Resolve the absolute path for the output
    const absoluteOutputPath = path.resolve(process.cwd(), OUTPUT_PATH);
    const outputDir = path.dirname(absoluteOutputPath);

    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
      core.info(`Created output directory: ${outputDir}`);
    }

    // Configure graphql-codegen with getCleanedSchemaByGame loader
    const config = {
      schema: {
        [schemaPath]: {
          loader: getCleanedSchemaByGame({
            includedScopes: [gameField],
            staticDataFieldName,
          }),
        },
      },
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

    // Execute the code generation
    core.info('Running schema cleanup...');
    try {
      await generate(config, true);
    } catch (error) {
      core.setFailed(
        `Failed to clean schema: ${error instanceof Error ? error.message : String(error)}`
      );
      process.exit(1);
    }

    // Verify the file was created
    if (!fs.existsSync(absoluteOutputPath)) {
      core.setFailed(`Cleaned schema file was not created at expected path: ${absoluteOutputPath}`);
      process.exit(1);
    }

    core.info(`✓ Schema successfully cleaned and saved to: ${absoluteOutputPath}`);
    return absoluteOutputPath;
  } catch (error) {
    core.setFailed(
      `Unexpected error in cleanSchema: ${error instanceof Error ? error.message : String(error)}`
    );
    process.exit(1);
  }
}

