import { generateScopes } from './generate-scopes';

function main() {
  console.log('Starting scopes generation...');

  const scopesPath = generateScopes({
    schemaPath: 'dist/generated/schema.graphql',
    gameField: 'riftbound',
  });

  console.log(`Result: ${scopesPath}`);
}

main();
