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
exports.generateGqlTypes = generateGqlTypes;
const cli_1 = require("@graphql-codegen/cli");
const rimraf_1 = require("rimraf");
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const core = __importStar(require("@actions/core"));
async function generateGqlTypes() {
    try {
        core.info('Starting GraphQL types generation...');
        // Step 1: Clean up old gql-types directories
        const buildDir = path.resolve(process.cwd(), 'build');
        const gqlTypesPattern = path.join(buildDir, '**/gql-types');
        try {
            await (0, rimraf_1.rimraf)(gqlTypesPattern);
            core.info('Cleaned up old gql-types directories');
        }
        catch (error) {
            // If cleanup fails, log but continue - directories might not exist yet
            core.warning(`Could not clean up old gql-types directories: ${error instanceof Error ? error.message : String(error)}`);
        }
        // Step 2: Construct the codegen configuration
        core.info('Constructing codegen configuration...');
        const scalars = {
            NgfDateTime: 'string',
            Diablo4DateTime: 'string',
            NgfDocumentRichTextContentJson: 'any',
            NgfDocumentBase64Json: 'string',
            NgfDocumentContentBase64Json: 'string',
            TagsScalar: 'string[] | null',
        };
        const schemaFilePath = path.resolve(process.cwd(), '_generated/cleaned-schema.graphql');
        const documents = path.resolve(process.cwd(), 'build/gql/**/*.gql.ts');
        const typesFilePath = path.resolve(process.cwd(), 'build/gql/gql-types/types.ts');
        const typesDirPath = path.resolve(process.cwd(), 'build/gql/gql-types');
        // Config for the main types file
        const fileConfig = {
            schema: schemaFilePath,
            plugins: [
                {
                    add: {
                        content: '/* @ts-ignore */',
                    },
                },
                'typescript',
                'fragment-matcher',
            ],
            config: {
                namingConvention: 'keep',
                avoidOptionals: {
                    field: true,
                    inputValue: false,
                    object: true,
                    defaultValue: true,
                },
                skipTypename: false,
                scalars,
                enumsAsTypes: true,
            },
        };
        // Config for the directory (near-operation-file preset)
        const dirConfig = {
            schema: schemaFilePath,
            documents,
            preset: 'near-operation-file',
            presetConfig: {
                extension: '.generated.ts',
                folder: 'gql-types',
                baseTypesPath: `./types.ts`,
            },
            plugins: [
                {
                    add: {
                        content: '/* @ts-ignore */',
                    },
                },
                'typescript-operations',
                'typescript-react-apollo',
            ],
            config: {
                avoidOptionals: true,
                dedupeFragments: true,
                documentMode: 'documentNode',
                namingConvention: 'keep',
                skipTypename: false,
                dedupeOperationSuffix: true,
                omitOperationSuffix: false,
                withComponent: false,
                withHooks: true,
                withHOC: false,
                preResolveTypes: true,
                scalars,
                enumsAsTypes: true,
            },
        };
        // Config for possible-types.json
        const possibleTypesConfig = {
            schema: schemaFilePath,
            documents,
            plugins: ['fragment-matcher'],
            config: {
                module: 'commonjs',
            },
        };
        const config = {
            generates: {
                [typesFilePath]: fileConfig,
                [typesDirPath]: dirConfig,
                [`${typesDirPath}/possible-types.json`]: possibleTypesConfig,
            },
        };
        // Step 3: Execute the code generation
        core.info('Running GraphQL codegen...');
        try {
            await (0, cli_1.generate)(config, true);
        }
        catch (error) {
            const errorMessage = `Failed to generate GraphQL types: ${error instanceof Error ? error.message : String(error)}`;
            core.setFailed(errorMessage);
            throw new Error(errorMessage);
        }
        // Step 4: Verify that types were generated
        const expectedTypesFile = path.resolve(process.cwd(), 'build/gql/gql-types/types.ts');
        if (!fs.existsSync(expectedTypesFile)) {
            core.warning(`Types file was not created at expected path: ${expectedTypesFile}`);
        }
        else {
            core.info(`✓ Types file generated: ${expectedTypesFile}`);
        }
        core.info(`✓ GraphQL types generation completed successfully`);
    }
    catch (error) {
        const errorMessage = `Unexpected error in generateGqlTypes: ${error instanceof Error ? error.message : String(error)}`;
        core.setFailed(errorMessage);
        throw error instanceof Error ? error : new Error(errorMessage);
    }
}
//# sourceMappingURL=generate-gql-types.js.map