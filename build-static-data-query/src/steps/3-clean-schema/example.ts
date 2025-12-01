import { cleanSchema } from './clean-schema';
import { generateScopes } from '../2-generate-scopes';

async function main() {
  console.log('Starting schema cleanup...');

  // First generate scopes data
  const scopesData = generateScopes({
    schemaPath: '_generated/schema.graphql',
    gameField: 'riftbound',
  });

  const cleanedPath = await cleanSchema({
    schemaPath: '_generated/schema.graphql',
    gameField: 'riftbound',
    staticDataFieldName: 'staticData',
    scopesData,
  });

  console.log(`Result: ${cleanedPath}`);
}

main();
