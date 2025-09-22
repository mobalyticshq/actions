import { Storage } from '@google-cloud/storage';
import { ValidationEntityReport } from '../types';
import { ReportMessages } from '../validation';

interface GCSValidationOptions {
  bucketName: string;
  prefix?: string; // Directory prefix to filter files (e.g., "assets/poe-1/images/")
  credentials?: {
    client_email: string;
    private_key: string;
  };
}

// Process URLs using GCS validation (single API call + synchronous validation)
export async function processUrlsInChunks(
  entries: [string, { report: ValidationEntityReport; path: string }[]][],
  assetSizeLimit: number,
  tmpBucket: string,
): Promise<void> {
  console.log(`🔄 Processing ${entries.length} URLs using GCS validation...`);

  const prefix = new URL(tmpBucket).pathname; // Extract prefix from tmpBucket URL
  const gcsOptions: GCSValidationOptions = {
    bucketName: process.env.GCP_ASSETS_BUCKET_NAME || 'cdn.mobalytics.gg', // Default to mobalytics CDN bucket
    prefix: prefix.slice(1) || 'assets/example-game', // Default to example-game images directory
    credentials:
      process.env.GOOGLE_CLIENT_EMAIL && process.env.GOOGLE_PRIVATE_KEY
        ? {
            client_email: process.env.GOOGLE_CLIENT_EMAIL,
            private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
          }
        : undefined,
  };

  // Initialize GCS client
  const storage = new Storage({
    credentials: gcsOptions.credentials,
  });

  const bucket = storage.bucket(gcsOptions.bucketName);

  // Get all existing files from GCS bucket (single API call with prefix filter)
  console.log(`🔍 Fetching file list from GCS bucket: ${gcsOptions.bucketName} with prefix: ${gcsOptions.prefix}`);
  const existingFiles = await getAllFilesInBucket(bucket, gcsOptions.prefix);
  console.log(`📁 Found ${existingFiles.size} files in GCS bucket with prefix ${gcsOptions.prefix}`);

  // Process all URLs synchronously
  console.log(`⚡ Validating ${entries.length} URLs synchronously...`);

  for (const [url, reports] of entries) {
    if (reports.length > 0) {
      validateAssetWithGCS(url, reports, assetSizeLimit, existingFiles);
    }
  }

  console.log(`✅ Finished processing all ${entries.length} URLs using GCS validation`);
}

// Get all files in the GCS bucket with optional prefix filter
async function getAllFilesInBucket(bucket: any, prefix: string = ''): Promise<Set<string>> {
  const files = new Set<string>();

  try {
    // Use prefix to filter files by directory
    const options = prefix ? { prefix } : {};
    const [fileList] = await bucket.getFiles(options);

    for (const file of fileList) {
      files.add(`/${file.name}`);
    }

    return files;
  } catch (error) {
    console.error('❌ Error fetching files from GCS bucket:', error);
    throw error;
  }
}

// Validate asset using GCS instead of CDN
function validateAssetWithGCS(
  url: string,
  reports: {
    report: ValidationEntityReport;
    path: string;
  }[],
  assetSizeLimit: number,
  existingFiles: Set<string>,
) {
  try {
    // Extract asset path from URL
    const urlObj = new URL(url);
    const assetPath = urlObj.pathname;

    // Check if file exists in GCS
    const fileExists = existingFiles.has(assetPath);

    if (fileExists) {
      // File exists in GCS - validation passed
      // Note: We skip size validation for GCS files for now
      // In the future, we could add metadata fetching for size validation
    } else {
      // File doesn't exist in GCS
      reports.forEach(report => report.report.errors[ReportMessages.assetURLNotAvailable].add(report.path));
    }
  } catch (err) {
    // Invalid URL or other error
    reports.forEach(report => report.report.errors[ReportMessages.assetURLNotAvailable].add(report.path));
  }
}
