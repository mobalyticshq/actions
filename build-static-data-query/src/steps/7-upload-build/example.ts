import { Storage } from '@google-cloud/storage';
import { uploadBuild } from './upload-build';

async function main() {
  console.log('Starting build upload to GCS...');

  // Initialize Storage and Bucket
  const storage = new Storage({ projectId: 'mobalytics-1242' });
  const bucket = storage.bucket('festatic.mobalytics.gg');

  await uploadBuild({
    bucket,
    env: 'dev',
    game: 'riftbound',
    schemaVersion: '1.0.0',
  });

  console.log('✓ Build upload completed');
}

// Run the example
main().catch(console.error);
