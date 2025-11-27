"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const download_schema_1 = require("./download-schema");
async function main() {
    console.log('Starting schema download...');
    const schemaPath = await (0, download_schema_1.downloadSchema)({
        endpoint: 'https://stg.mobalytics.gg/api/riftbound/v1/graphql/query',
    });
    console.log(`Result: ${schemaPath}`);
}
// Run the example
main();
//# sourceMappingURL=example.js.map