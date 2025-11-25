import * as fs from 'fs';
import * as path from 'path';
import { buildSchema, GraphQLObjectType, GraphQLNamedType, isObjectType } from 'graphql';

const SCHEMA_PATH = path.join(__dirname, 'temp', 'schema.graphql');
const OUTPUT_PATH = path.join(__dirname, 'temp', 'scopes.js');

function generateScopes() {
  try {
    // Read the schema file
    const schemaContent = fs.readFileSync(SCHEMA_PATH, 'utf-8');

    // Parse the schema
    const schema = buildSchema(schemaContent);

    // Extract root types
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

    // Extract game-specific fields if GAME_FIELD env variable is provided
    let targetGameQueryFields: string[] = [];
    let targetGameQueryTypeName: string | undefined;
    const gameField = process.env.GAME_FIELD;

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
          console.log(
            `✅ Extracted ${targetGameQueryFields.length} fields from ${gameField} type (${targetGameQueryTypeName})`,
          );
        } else {
          console.warn(`⚠️  Field '${gameField}' is not an object type`);
        }
      } else {
        console.warn(`⚠️  Field '${gameField}' not found in Query type`);
      }
    }

    // Generate the output file content
    let output = `// Top level nodes available in graphql api
export const QueryNamespaces = [
${queryNamespaces.map(name => `  '${name}',`).join('\n')}
];

export const MutationNamespaces = [
${mutationNamespaces.map(name => `  '${name}',`).join('\n')}
];

export const SubscriptionNamespaces = [
${subscriptionNamespaces.map(name => `  '${name}',`).join('\n')}
];
`;

    // Add TargetGameQueryFields and TargetGameQueryTypeName if we have game-specific fields
    if (targetGameQueryFields.length > 0) {
      output += `
export const TargetGameQueryFields = [
${targetGameQueryFields.map(name => `  '${name}',`).join('\n')}
];

export const TargetGameQueryTypeName = '${targetGameQueryTypeName}';
`;
    }

    // Write to output file
    fs.writeFileSync(OUTPUT_PATH, output, 'utf-8');

    console.log('✅ Successfully generated scopes.js');
    console.log(`   Query fields: ${queryNamespaces.length}`);
    console.log(`   Mutation fields: ${mutationNamespaces.length}`);
    console.log(`   Subscription fields: ${subscriptionNamespaces.length}`);
    if (targetGameQueryFields.length > 0) {
      console.log(`   Target game (${gameField}) fields: ${targetGameQueryFields.length}`);
      console.log(`   Target game type name: ${targetGameQueryTypeName}`);
    }
  } catch (error) {
    console.error('❌ Error generating scopes:', error);
    process.exit(1);
  }
}

generateScopes();
