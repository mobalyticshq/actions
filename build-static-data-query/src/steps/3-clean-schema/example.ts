import { cleanSchema } from './clean-schema';

async function main() {
  console.log('Starting schema cleanup...');

  const cleanedPath = await cleanSchema({
    schemaPath: 'dist/generated/schema.graphql',
    gameField: 'riftbound',
    staticDataFieldName: 'staticData',
  });

  console.log(`Result: ${cleanedPath}`);
}

main();

