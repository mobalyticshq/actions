"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const storage_1 = require("@google-cloud/storage");
const upload_build_1 = require("./upload-build");
async function main() {
    console.log('Starting build upload to GCS...');
    // Initialize Storage and Bucket
    const storage = new storage_1.Storage({ projectId: 'mobalytics-1242' });
    const bucket = storage.bucket('festatic.mobalytics.gg');
    await (0, upload_build_1.uploadBuild)({
        bucket,
        env: 'dev',
        game: 'riftbound',
        schemaVersion: '1.0.0',
    });
    console.log('✓ Build upload completed');
}
// Run the example
main().catch(console.error);
//# sourceMappingURL=example.js.map