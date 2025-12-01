"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const storage_1 = require("@google-cloud/storage");
const check_schema_version_1 = require("./check-schema-version");
async function main() {
    console.log('Starting schema version check...');
    // Initialize Storage and Bucket
    const storage = new storage_1.Storage({ projectId: 'mobalytics-1242' });
    const bucket = storage.bucket('festatic.mobalytics.gg');
    const result = await (0, check_schema_version_1.checkSchemaVersion)({
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
//# sourceMappingURL=example.js.map