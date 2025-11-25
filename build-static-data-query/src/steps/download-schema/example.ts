import { downloadSchema } from './download-schema';

async function main() {
  try {
    console.log('Starting schema download...');

    const schemaPath = await downloadSchema({
      endpoint: 'https://stg.mobalytics.gg/api/riftbound/v1/graphql/query',
      outputPath: 'dist/temp/schema.graphql',
      headers: {
        'xmoba-no-cache': '1',
      },
    });

    console.log(`✓ Schema successfully downloaded to: ${schemaPath}`);
  } catch (error) {
    console.error('Failed to download schema:', error);
    process.exit(1);
  }
}

// Run the example
main();

