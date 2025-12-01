import { Storage } from '@google-cloud/storage';
import { checkSchemaVersion } from './check-schema-version';

async function main() {
  console.log('Starting schema version check...');

  // Initialize Storage and Bucket
  const storage = new Storage({ projectId: 'mobalytics-1242' });
  const bucket = storage.bucket('festatic.mobalytics.gg');

  const result = await checkSchemaVersion({
    graphqlEndpoint: 'https://stg.mobalytics.gg/api/riftbound/v1/graphql/query',
    bucket,
    env: 'dev',
    game: 'riftbound',
  });

  console.log(`Result:`, result);
  console.log(`Should continue: ${result.shouldContinue}`);
}

// Run the example
main().catch(console.error);

