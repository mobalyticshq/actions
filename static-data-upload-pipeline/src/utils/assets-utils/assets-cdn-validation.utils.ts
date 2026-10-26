import { buildStorage } from '../google-auth.utils';
import { ValidationEntityReport } from '../../types';

import { ReportMessages } from '../../pipeline-steps/validate-static-data/utils';

interface GCSValidationOptions {
  bucketName: string;
  prefix?: string; // Directory prefix to filter files (e.g., "assets/poe-1/images/")
}

// Process URLs using GCS validation (one streamed listing + synchronous validation)
export async function processUrlsInChunks(
  entries: [string, { report: ValidationEntityReport; path: string }[]][],
  assetSizeLimit: number,
  tmpBucket: string,
): Promise<void> {
  console.log(`🔄 Processing ${entries.length} URLs using GCS validation...`);
  if (entries.length === 0) return;

  const prefix = new URL(tmpBucket).pathname; // Extract prefix from tmpBucket URL
  const gcsOptions: GCSValidationOptions = {
    bucketName: process.env.GCP_ASSETS_BUCKET_NAME || 'cdn.mobalytics.gg', // Default to mobalytics CDN bucket
    prefix: prefix.slice(1) || 'assets/example-game', // Default to example-game images directory
  };

  const bucket = buildStorage().bucket(gcsOptions.bucketName);

  // List the configured prefix, keeping only the files the static data references
  console.log(`🔍 Fetching file list from GCS bucket: ${gcsOptions.bucketName} with prefix: ${gcsOptions.prefix}`);
  const wanted = new Set(entries.map(([url]) => assetPathOf(url)).filter((p): p is string => p !== null));
  const existingFiles = await getAllFilesInBucket(bucket, gcsOptions.prefix ?? '', wanted);
  console.log(`📁 Found ${existingFiles.size} of ${wanted.size} referenced files in GCS bucket with prefix ${gcsOptions.prefix}`);

  // Process all URLs synchronously
  console.log(`⚡ Validating ${entries.length} URLs synchronously...`);

  const missing: string[] = [];
  for (const [url, reports] of entries) {
    if (reports.length > 0 && !validateAssetWithGCS(url, reports, assetSizeLimit, existingFiles)) {
      missing.push(url);
    }
  }
  // The report only names the field path, so this is the one place the URL itself shows up
  if (missing.length > 0) {
    console.log(`❌ ${missing.length} asset URL(s) not found in the bucket:`);
    missing.slice(0, 50).forEach(url => console.log(`  ${url}`));
    if (missing.length > 50) console.log(`  ...and ${missing.length - 50} more`);
  }

  console.log(`✅ Finished processing all ${entries.length} URLs using GCS validation`);
}

// URL.pathname is percent-encoded (a space becomes %20) while GCS lists raw object names
function assetPathOf(url: string): string | null {
  try {
    return decodeURIComponent(new URL(url).pathname);
  } catch {
    return null; // malformed URL or escape - validateAssetWithGCS reports it
  }
}

// Which of the wanted paths exist under the prefix. The listing is streamed and only matches are
// kept: getFiles() buffered every object with its metadata, so a wide prefix ran out of memory.
export async function getAllFilesInBucket(bucket: any, prefix: string, wanted: Set<string>): Promise<Set<string>> {
  const files = new Set<string>();

  try {
    for await (const file of bucket.getFilesStream(prefix ? { prefix } : {})) {
      const name = `/${file.name}`;
      if (wanted.has(name)) files.add(name);
    }

    return files;
  } catch (error) {
    console.error('❌ Error fetching files from GCS bucket:', error);
    throw error;
  }
}

// Validate asset using GCS instead of CDN; returns whether the asset exists
export function validateAssetWithGCS(
  url: string,
  reports: {
    report: ValidationEntityReport;
    path: string;
  }[],
  assetSizeLimit: number,
  existingFiles: Set<string>,
): boolean {
  try {
    // Decoded: a file with a space or non-ASCII character in its name used to be reported missing
    const assetPath = assetPathOf(url);
    if (assetPath === null) throw new Error(`invalid asset URL ${url}`);

    // Check if file exists in GCS
    const fileExists = existingFiles.has(assetPath);

    if (fileExists) {
      // File exists in GCS - validation passed
      // Note: We skip size validation for GCS files for now
      // In the future, we could add metadata fetching for size validation
      return true;
    }
    // File doesn't exist in GCS
    reports.forEach(report => report.report.errors[ReportMessages.assetURLNotAvailable].add(report.path));
  } catch (err) {
    // Invalid URL or other error
    reports.forEach(report => report.report.errors[ReportMessages.assetURLNotAvailable].add(report.path));
  }
  return false;
}
