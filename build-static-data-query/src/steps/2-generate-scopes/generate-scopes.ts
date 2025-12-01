import * as fs from 'fs';
import { buildSchema, isObjectType } from 'graphql';
import * as core from '@actions/core';

export interface GenerateScopesOptions {
  schemaPath: string;
  gameField: string;
}

export interface ScopesData {
  queryNamespaces: string[];
  mutationNamespaces: string[];
  subscriptionNamespaces: string[];
  targetGameQueryFields: string[];
  targetGameQueryTypeName: string | undefined;
}

export function generateScopes(options: GenerateScopesOptions): ScopesData {
  try {
    const { schemaPath, gameField } = options;

    core.info(`Reading schema from: ${schemaPath}`);

    // Step 1: Read the schema file
    if (!fs.existsSync(schemaPath)) {
      const errorMessage = `Schema file not found: ${schemaPath}`;
      core.setFailed(errorMessage);
      throw new Error(errorMessage);
    }

    const schemaContent = fs.readFileSync(schemaPath, 'utf-8');

    // Step 2: Parse the schema
    let schema;
    try {
      schema = buildSchema(schemaContent);
    } catch (error) {
      const errorMessage = `Failed to parse schema: ${error instanceof Error ? error.message : String(error)}`;
      core.setFailed(errorMessage);
      throw new Error(errorMessage);
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

    core.info(`✓ Successfully generated scopes`);
    if (targetGameQueryFields.length > 0) {
      core.info(`  Target game (${gameField}) fields: ${targetGameQueryFields.length}`);
      core.info(`  Target game type name: ${targetGameQueryTypeName}`);
    }

    return {
      queryNamespaces,
      mutationNamespaces,
      subscriptionNamespaces,
      targetGameQueryFields,
      targetGameQueryTypeName,
    };
  } catch (error) {
    const errorMessage = `Unexpected error in generateScopes: ${error instanceof Error ? error.message : String(error)}`;
    core.setFailed(errorMessage);
    throw error instanceof Error ? error : new Error(errorMessage);
  }
}
