import { uploadBuild } from './upload-build';

async function main() {
  console.log('Starting build upload to GCS...');

  // todo Stas move to env vars
  await uploadBuild({
    bucketName: 'festatic.mobalytics.gg',
    gcsProjectId: 'mobalytics-1242',
    env: 'dev',
    game: 'example-game',
    schemaVersion: '1.0.0',
  });

  console.log('✓ Build upload completed');
}

// Run the example
main().catch(console.error);
