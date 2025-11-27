"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const generate_gql_types_1 = require("./generate-gql-types");
async function main() {
    console.log('Starting GraphQL types generation...');
    await (0, generate_gql_types_1.generateGqlTypes)();
    console.log('✓ GraphQL types generation completed');
}
// Run the example
main();
//# sourceMappingURL=example.js.map