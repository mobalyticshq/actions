"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const generate_query_1 = require("./generate-query");
async function main() {
    console.log('Starting query generation...');
    await (0, generate_query_1.generateQuery)({
        timeoutMs: 240000, // 4 minutes
    });
    console.log('Fragments query completed');
}
main();
//# sourceMappingURL=example.js.map