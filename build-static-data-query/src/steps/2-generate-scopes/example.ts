import { generateScopes } from './generate-scopes';

function main() {
  console.log('Starting scopes generation...');

  const scopesData = generateScopes({
    schemaPath: '_generated/schema.graphql',
    gameField: 'riftbound',
  });

  console.log(`Result:`, scopesData);
  console.log(`Query namespaces: ${scopesData.queryNamespaces.length}`);
  console.log(`Mutation namespaces: ${scopesData.mutationNamespaces.length}`);
  console.log(`Subscription namespaces: ${scopesData.subscriptionNamespaces.length}`);
  if (scopesData.targetGameQueryTypeName) {
    console.log(`Target game type: ${scopesData.targetGameQueryTypeName}`);
    console.log(`Target game fields: ${scopesData.targetGameQueryFields.length}`);
  }
}

main();
