"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const compile_query_1 = require("./compile-query");
async function main() {
    console.log('Starting query compilation...');
    await (0, compile_query_1.compileQuery)();
    console.log('Fragments query compilation');
}
main();
//# sourceMappingURL=example.js.map