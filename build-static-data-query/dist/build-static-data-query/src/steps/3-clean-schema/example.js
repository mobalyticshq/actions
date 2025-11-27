"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const clean_schema_1 = require("./clean-schema");
async function main() {
    console.log('Starting schema cleanup...');
    const cleanedPath = await (0, clean_schema_1.cleanSchema)({
        schemaPath: '_generated/schema.graphql',
        gameField: 'riftbound',
        staticDataFieldName: 'staticData',
    });
    console.log(`Result: ${cleanedPath}`);
}
main();
//# sourceMappingURL=example.js.map