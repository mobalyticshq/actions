# Asset Validation Strategies

This module provides two strategies for validating asset URLs:

## Strategy A: GCS Validation (Recommended)

**Most efficient approach** - validates files directly on Google Cloud Storage instead of CDN.

### How it works:
1. **Single GCS API call** - `storage.objects.list()` to get all files in bucket
2. **Local set lookup** - check if expected files exist in memory
3. **No rate limits** - single API call vs thousands of HEAD requests
4. **Faster & cheaper** - no CDN egress costs

### Benefits:
- ✅ **10x faster** - one API call vs thousands
- ✅ **No rate limits** - CDN rate limits avoided
- ✅ **Cheaper** - no CDN egress costs
- ✅ **More reliable** - direct source validation

### Requirements:
```bash
# Environment variables
GCP_BUCKET_NAME=cdn.mobalytics.gg
GCS_ASSETS_PREFIX=assets/poe-1/images/  # Optional: defaults to assets/poe-1/images/
GOOGLE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
```

### Directory Filtering:
The GCS validation can filter files by directory prefix to avoid scanning the entire bucket:

```typescript
// Example: Only check files in assets/poe-1/images/ directory
const gcsOptions = {
  bucketName: 'cdn.mobalytics.gg',
  prefix: 'assets/poe-1/images/',
  credentials: { ... }
};
```

This is much more efficient for large buckets with many directories.

## Strategy B: CDN Validation (Fallback)

**Legacy approach** - validates files via CDN HEAD requests.

### How it works:
1. **Chunked processing** - 20 URLs at a time
2. **Rate limiting** - 1 second delay between chunks
3. **Caching** - avoid duplicate requests
4. **HEAD requests** - check file existence and size

### When to use:
- When GCS credentials are not available
- For external CDN validation
- As fallback when GCS validation fails

## Usage

The system automatically chooses the best strategy:

```typescript
// GCS validation (preferred)
if (gcsCredentialsAvailable) {
  await processUrlsWithGCS(entries, chunkSize, assetSizeLimit, gcsOptions);
} else {
  // CDN validation (fallback)
  await processUrlsWithCDN(entries, chunkSize, assetSizeLimit);
}
```

## Performance Comparison

| Strategy | API Calls | Time | Cost | Rate Limits |
|----------|-----------|------|------|-------------|
| GCS      | 1         | ~1s  | Low  | None        |
| CDN      | 1000+     | ~60s | High | Yes         |

**Recommendation**: Always use GCS validation when possible.
