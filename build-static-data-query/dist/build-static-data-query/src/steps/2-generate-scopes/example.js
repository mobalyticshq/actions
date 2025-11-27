"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const generate_scopes_1 = require("./generate-scopes");
function main() {
    console.log('Starting scopes generation...');
    const scopesPath = (0, generate_scopes_1.generateScopes)({
        schemaPath: '_generated/schema.graphql',
        gameField: 'riftbound',
    });
    console.log(`Result: ${scopesPath}`);
}
main();
//# sourceMappingURL=example.js.map