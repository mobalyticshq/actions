import { generateGqlTypes } from './generate-gql-types';

async function main() {
  console.log('Starting GraphQL types generation...');

  await generateGqlTypes();

  console.log('✓ GraphQL types generation completed');
}

// Run the example
main();

