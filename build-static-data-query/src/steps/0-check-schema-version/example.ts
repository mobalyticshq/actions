import { checkSchemaVersion } from './check-schema-version';

async function main() {
  console.log('Starting schema version check...');

  const result = await checkSchemaVersion({
    graphqlEndpoint: 'https://stg.mobalytics.gg/api/riftbound/v1/graphql/query',
    bucketName: 'festatic.mobalytics.gg',
    gcsProjectId: 'mobalytics-1242',
    env: 'dev',
    game: 'riftbound',
  });

  console.log(`Result:`, result);
  console.log(`Should continue: ${result.shouldContinue}`);
}

// Run the example
main().catch(console.error);

