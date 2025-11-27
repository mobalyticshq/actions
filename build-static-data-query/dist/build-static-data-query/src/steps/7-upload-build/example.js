"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const upload_build_1 = require("./upload-build");
async function main() {
    console.log('Starting build upload to GCS...');
    // todo Stas move to env vars
    await (0, upload_build_1.uploadBuild)({
        bucketName: 'festatic.mobalytics.gg',
        gcsProjectId: 'mobalytics-1242',
    });
    console.log('✓ Build upload completed');
}
// Run the example
main().catch(console.error);
//# sourceMappingURL=example.js.map