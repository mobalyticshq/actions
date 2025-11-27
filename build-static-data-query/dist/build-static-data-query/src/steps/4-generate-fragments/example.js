"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const generate_fragments_1 = require("./generate-fragments");
async function main() {
    console.log('Starting fragments generation...');
    await (0, generate_fragments_1.generateFragments)({
        timeoutMs: 240000, // 4 minutes
    });
    console.log('Fragments generation completed');
}
main();
//# sourceMappingURL=example.js.map