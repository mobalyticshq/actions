import { downloadSchema } from './download-schema';

async function main() {
  console.log('Starting schema download...');

  const schemaPath = await downloadSchema({
    endpoint: 'https://stg.mobalytics.gg/api/riftbound/v1/graphql/query',
  });

  console.log(`Result: ${schemaPath}`);
}

// Run the example
main();
