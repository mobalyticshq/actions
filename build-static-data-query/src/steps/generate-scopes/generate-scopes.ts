import * as fs from 'fs';
import * as path from 'path';
import { buildSchema, isObjectType } from 'graphql';
import * as core from '@actions/core';

export interface GenerateScopesOptions {
  schemaPath: string;
  gameField: string;
}

const OUTPUT_PATH = 'dist/generated/scopes.ts';

export function generateScopes(options: GenerateScopesOptions): string {
  try {
    const { schemaPath, gameField } = options;

    core.info(`Reading schema from: ${schemaPath}`);

    // Step 1: Read the schema file
    if (!fs.existsSync(schemaPath)) {
      core.setFailed(`Schema file not found: ${schemaPath}`);
      process.exit(1);
    }

    const schemaContent = fs.readFileSync(schemaPath, 'utf-8');

    // Step 2: Parse the schema
    let schema;
    try {
      schema = buildSchema(schemaContent);
    } catch (error) {
      core.setFailed(`Failed to parse schema: ${error instanceof Error ? error.message : String(error)}`);
      process.exit(1);
    }

    // Step 3: Extract root types
    const queryType = schema.getQueryType();
    const mutationType = schema.getMutationType();
    const subscriptionType = schema.getSubscriptionType();

    // Get field names from each type
    const queryNamespaces: string[] = [];
    const mutationNamespaces: string[] = [];
    const subscriptionNamespaces: string[] = [];

    if (queryType) {
      const fields = queryType.getFields();
      queryNamespaces.push(...Object.keys(fields).sort());
    }

    if (mutationType) {
      const fields = mutationType.getFields();
      mutationNamespaces.push(...Object.keys(fields).sort());
    }

    if (subscriptionType) {
      const fields = subscriptionType.getFields();
      subscriptionNamespaces.push(...Object.keys(fields).sort());
    }

    core.info(`Extracted ${queryNamespaces.length} query fields`);
    core.info(`Extracted ${mutationNamespaces.length} mutation fields`);
    core.info(`Extracted ${subscriptionNamespaces.length} subscription fields`);

    // Step 4: Extract game-specific fields if gameField is provided
    let targetGameQueryFields: string[] = [];
    let targetGameQueryTypeName: string | undefined;

    if (gameField && queryType) {
      const fields = queryType.getFields();
      const gameFieldObj = fields[gameField];

      if (gameFieldObj) {
        // Get the type of this field (unwrap NonNull and List wrappers)
        let fieldType = gameFieldObj.type;

        // Unwrap NonNull and List types to get to the named type
        while ('ofType' in fieldType && fieldType.ofType) {
          fieldType = fieldType.ofType;
        }

        // Check if it's an object type and get its fields
        if (isObjectType(fieldType)) {
          const gameTypeFields = fieldType.getFields();
          targetGameQueryFields = Object.keys(gameTypeFields).sort();
          targetGameQueryTypeName = fieldType.name;
          core.info(
            `✓ Extracted ${targetGameQueryFields.length} fields from ${gameField} type (${targetGameQueryTypeName})`,
          );
        } else {
          core.warning(`Field '${gameField}' is not an object type`);
        }
      } else {
        core.warning(`Field '${gameField}' not found in Query type`);
      }
    }

    // Step 5: Generate TypeScript output file content
    let output = `// Top level nodes available in graphql api
export const QueryNamespaces: readonly string[] = [
${queryNamespaces.map(name => `  '${name}',`).join('\n')}
] as const;

export const MutationNamespaces: readonly string[] = [
${mutationNamespaces.map(name => `  '${name}',`).join('\n')}
] as const;

export const SubscriptionNamespaces: readonly string[] = [
${subscriptionNamespaces.map(name => `  '${name}',`).join('\n')}
] as const;
`;

    // Add TargetGameQueryFields and TargetGameQueryTypeName if we have game-specific fields
    if (targetGameQueryFields.length > 0 && targetGameQueryTypeName) {
      output += `
export const TargetGameQueryFields: readonly string[] = [
${targetGameQueryFields.map(name => `  '${name}',`).join('\n')}
] as const;

export const TargetGameQueryTypeName = '${targetGameQueryTypeName}' as const;
`;
    }

    // Step 6: Ensure output directory exists and write file
    const absoluteOutputPath = path.resolve(process.cwd(), OUTPUT_PATH);
    const outputDir = path.dirname(absoluteOutputPath);

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
      core.info(`Created output directory: ${outputDir}`);
    }

    fs.writeFileSync(absoluteOutputPath, output, 'utf-8');

    core.info(`✓ Successfully generated scopes file: ${absoluteOutputPath}`);
    if (targetGameQueryFields.length > 0) {
      core.info(`  Target game (${gameField}) fields: ${targetGameQueryFields.length}`);
      core.info(`  Target game type name: ${targetGameQueryTypeName}`);
    }

    return absoluteOutputPath;
  } catch (error) {
    core.setFailed(`Unexpected error in generateScopes: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}
