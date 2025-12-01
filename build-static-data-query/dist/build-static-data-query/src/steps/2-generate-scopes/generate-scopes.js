"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateScopes = generateScopes;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const graphql_1 = require("graphql");
const core = __importStar(require("@actions/core"));
const OUTPUT_PATH = '_generated/scopes.ts';
function generateScopes(options) {
    try {
        const { schemaPath, gameField } = options;
        core.info(`Reading schema from: ${schemaPath}`);
        // Step 1: Read the schema file
        if (!fs.existsSync(schemaPath)) {
            const errorMessage = `Schema file not found: ${schemaPath}`;
            core.setFailed(errorMessage);
            throw new Error(errorMessage);
        }
        const schemaContent = fs.readFileSync(schemaPath, 'utf-8');
        // Step 2: Parse the schema
        let schema;
        try {
            schema = (0, graphql_1.buildSchema)(schemaContent);
        }
        catch (error) {
            const errorMessage = `Failed to parse schema: ${error instanceof Error ? error.message : String(error)}`;
            core.setFailed(errorMessage);
            throw new Error(errorMessage);
        }
        // Step 3: Extract root types
        const queryType = schema.getQueryType();
        const mutationType = schema.getMutationType();
        const subscriptionType = schema.getSubscriptionType();
        // Get field names from each type
        const queryNamespaces = [];
        const mutationNamespaces = [];
        const subscriptionNamespaces = [];
        if (queryType) {
            const fields = queryType.getFields();
            queryNamespaces.push(...Object.keys(fields).sort());
        }
        if (mutationType) {
            const fields = mutationType.getFields();
            mutationNamespaces.push(...Object.keys(fields).sort());
        }
        if (subscriptionType) {
            const fields = subscriptionType.getFields();
            subscriptionNamespaces.push(...Object.keys(fields).sort());
        }
        core.info(`Extracted ${queryNamespaces.length} query fields`);
        core.info(`Extracted ${mutationNamespaces.length} mutation fields`);
        core.info(`Extracted ${subscriptionNamespaces.length} subscription fields`);
        // Step 4: Extract game-specific fields if gameField is provided
        let targetGameQueryFields = [];
        let targetGameQueryTypeName;
        if (gameField && queryType) {
            const fields = queryType.getFields();
            const gameFieldObj = fields[gameField];
            if (gameFieldObj) {
                // Get the type of this field (unwrap NonNull and List wrappers)
                let fieldType = gameFieldObj.type;
                // Unwrap NonNull and List types to get to the named type
                while ('ofType' in fieldType && fieldType.ofType) {
                    fieldType = fieldType.ofType;
                }
                // Check if it's an object type and get its fields
                if ((0, graphql_1.isObjectType)(fieldType)) {
                    const gameTypeFields = fieldType.getFields();
                    targetGameQueryFields = Object.keys(gameTypeFields).sort();
                    targetGameQueryTypeName = fieldType.name;
                    core.info(`✓ Extracted ${targetGameQueryFields.length} fields from ${gameField} type (${targetGameQueryTypeName})`);
                }
                else {
                    core.warning(`Field '${gameField}' is not an object type`);
                }
            }
            else {
                core.warning(`Field '${gameField}' not found in Query type`);
            }
        }
        // Step 5: Generate TypeScript output file content
        let output = `// Top level nodes available in graphql api
export const QueryNamespaces: readonly string[] = [
${queryNamespaces.map(name => `  '${name}',`).join('\n')}
] as const;

export const MutationNamespaces: readonly string[] = [
${mutationNamespaces.map(name => `  '${name}',`).join('\n')}
] as const;

export const SubscriptionNamespaces: readonly string[] = [
${subscriptionNamespaces.map(name => `  '${name}',`).join('\n')}
] as const;
`;
        // Add TargetGameQueryFields and TargetGameQueryTypeName if we have game-specific fields
        if (targetGameQueryFields.length > 0 && targetGameQueryTypeName) {
            output += `
export const TargetGameQueryFields: readonly string[] = [
${targetGameQueryFields.map(name => `  '${name}',`).join('\n')}
] as const;

export const TargetGameQueryTypeName = '${targetGameQueryTypeName}' as const;
`;
        }
        // Step 6: Ensure output directory exists and write file
        const absoluteOutputPath = path.resolve(process.cwd(), OUTPUT_PATH);
        const outputDir = path.dirname(absoluteOutputPath);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
            core.info(`Created output directory: ${outputDir}`);
        }
        fs.writeFileSync(absoluteOutputPath, output, 'utf-8');
        core.info(`✓ Successfully generated scopes file: ${absoluteOutputPath}`);
        if (targetGameQueryFields.length > 0) {
            core.info(`  Target game (${gameField}) fields: ${targetGameQueryFields.length}`);
            core.info(`  Target game type name: ${targetGameQueryTypeName}`);
        }
        return absoluteOutputPath;
    }
    catch (error) {
        const errorMessage = `Unexpected error in generateScopes: ${error instanceof Error ? error.message : String(error)}`;
        core.setFailed(errorMessage);
        throw error instanceof Error ? error : new Error(errorMessage);
    }
}
//# sourceMappingURL=generate-scopes.js.map