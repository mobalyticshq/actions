import { generate } from '@graphql-codegen/cli';
import { rimraf } from 'rimraf';
import * as path from 'path';
import * as fs from 'fs';
import * as core from '@actions/core';
import type { Types } from '@graphql-codegen/plugin-helpers';

export async function generateGqlTypes(): Promise<void> {
  try {
    core.info('Starting GraphQL types generation...');

    // Step 1: Clean up old gql-types directories
    const buildDir = path.resolve(process.cwd(), 'build');
    const gqlTypesPattern = path.join(buildDir, '**/gql-types');
    
    try {
      await rimraf(gqlTypesPattern);
      core.info('Cleaned up old gql-types directories');
    } catch (error) {
      // If cleanup fails, log but continue - directories might not exist yet
      core.warning(`Could not clean up old gql-types directories: ${error instanceof Error ? error.message : String(error)}`);
    }

    // Step 2: Construct the codegen configuration
    core.info('Constructing codegen configuration...');
    
    const scalars = {
      NgfDateTime: 'string',
      Diablo4DateTime: 'string',
      NgfDocumentRichTextContentJson: 'any',
      NgfDocumentBase64Json: 'string',
      NgfDocumentContentBase64Json: 'string',
      TagsScalar: 'string[] | null',
    };

    const schemaFilePath = path.resolve(process.cwd(), '_generated/cleaned-schema.graphql');
    const documents = path.resolve(process.cwd(), 'build/gql/**/*.gql.ts');
    const typesFilePath = path.resolve(process.cwd(), 'build/gql/gql-types/types.ts');
    const typesDirPath = path.resolve(process.cwd(), 'build/gql/gql-types');

    // Config for the main types file
    const fileConfig: Types.ConfiguredOutput = {
      schema: schemaFilePath,
      plugins: [
        {
          add: {
            content: '/* @ts-ignore */',
          },
        },
        'typescript',
        'fragment-matcher',
      ],
      config: {
        namingConvention: 'keep',
        avoidOptionals: {
          field: true,
          inputValue: false,
          object: true,
          defaultValue: true,
        },
        skipTypename: false,
        scalars,
        enumsAsTypes: true,
      },
    };

    // Config for the directory (near-operation-file preset)
    const dirConfig: Types.ConfiguredOutput = {
      schema: schemaFilePath,
      documents,
      preset: 'near-operation-file',
      presetConfig: {
        extension: '.generated.ts',
        folder: 'gql-types',
        baseTypesPath: `./types.ts`,
      },
      plugins: [
        {
          add: {
            content: '/* @ts-ignore */',
          },
        },
        'typescript-operations',
        'typescript-react-apollo',
      ],
      config: {
        avoidOptionals: true,
        dedupeFragments: true,
        documentMode: 'documentNode',
        namingConvention: 'keep',
        skipTypename: false,
        dedupeOperationSuffix: true,
        omitOperationSuffix: false,
        withComponent: false,
        withHooks: true,
        withHOC: false,
        preResolveTypes: true,
        scalars,
        enumsAsTypes: true,
      },
    };

    // Config for possible-types.json
    const possibleTypesConfig: Types.ConfiguredOutput = {
      schema: schemaFilePath,
      documents,
      plugins: ['fragment-matcher'],
      config: {
        module: 'commonjs',
      },
    };

    const config: Types.Config = {
      generates: {
        [typesFilePath]: fileConfig,
        [typesDirPath]: dirConfig,
        [`${typesDirPath}/possible-types.json`]: possibleTypesConfig,
      },
    };

    // Step 3: Execute the code generation
    core.info('Running GraphQL codegen...');
    try {
      await generate(config, true);
    } catch (error) {
      core.setFailed(`Failed to generate GraphQL types: ${error instanceof Error ? error.message : String(error)}`);
      process.exit(1);
    }

    // Step 4: Verify that types were generated
    const expectedTypesFile = path.resolve(process.cwd(), 'build/gql/gql-types/types.ts');
    if (!fs.existsSync(expectedTypesFile)) {
      core.warning(`Types file was not created at expected path: ${expectedTypesFile}`);
    } else {
      core.info(`✓ Types file generated: ${expectedTypesFile}`);
    }

    core.info(`✓ GraphQL types generation completed successfully`);
  } catch (error) {
    core.setFailed(`Unexpected error in generateGqlTypes: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

