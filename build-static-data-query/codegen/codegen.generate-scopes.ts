import * as fs from 'fs';
import * as path from 'path';
import { buildSchema, GraphQLObjectType } from 'graphql';

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

    // Generate the output file content
    const output = `// Top level nodes available in graphql api
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

    // Write to output file
    fs.writeFileSync(OUTPUT_PATH, output, 'utf-8');

    console.log('✅ Successfully generated scopes.js');
    console.log(`   Query fields: ${queryNamespaces.length}`);
    console.log(`   Mutation fields: ${mutationNamespaces.length}`);
    console.log(`   Subscription fields: ${subscriptionNamespaces.length}`);
  } catch (error) {
    console.error('❌ Error generating scopes:', error);
    process.exit(1);
  }
}

generateScopes();
