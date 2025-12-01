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
exports.cleanSchema = cleanSchema;
const cli_1 = require("@graphql-codegen/cli");
const clean_schema_by_game_js_1 = require("../../../codegen/utils/clean-schema-by-game.js");
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const core = __importStar(require("@actions/core"));
const OUTPUT_PATH = '_generated/cleaned-schema.graphql';
async function cleanSchema(options) {
    try {
        const { schemaPath, gameField, staticDataFieldName } = options;
        core.info(`Cleaning schema from: ${schemaPath}`);
        core.info(`Game field: ${gameField}`);
        core.info(`Static data field: ${staticDataFieldName}`);
        // Verify input schema exists
        if (!fs.existsSync(schemaPath)) {
            const errorMessage = `Input schema file not found: ${schemaPath}`;
            core.setFailed(errorMessage);
            throw new Error(errorMessage);
        }
        // Resolve the absolute path for the output
        const absoluteOutputPath = path.resolve(process.cwd(), OUTPUT_PATH);
        const outputDir = path.dirname(absoluteOutputPath);
        // Ensure output directory exists
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
            core.info(`Created output directory: ${outputDir}`);
        }
        // Configure graphql-codegen with getCleanedSchemaByGame loader
        const config = {
            schema: {
                [schemaPath]: {
                    loader: (0, clean_schema_by_game_js_1.getCleanedSchemaByGame)({
                        includedScopes: [gameField],
                        staticDataFieldName,
                    }),
                },
            },
            generates: {
                [absoluteOutputPath]: {
                    plugins: ['schema-ast'],
                    config: {
                        includeDirectives: true,
                        commentDescriptions: true,
                    },
                },
            },
        };
        // Execute the code generation
        core.info('Running schema cleanup...');
        try {
            await (0, cli_1.generate)(config, true);
        }
        catch (error) {
            const errorMessage = `Failed to clean schema: ${error instanceof Error ? error.message : String(error)}`;
            core.setFailed(errorMessage);
            throw new Error(errorMessage);
        }
        // Verify the file was created
        if (!fs.existsSync(absoluteOutputPath)) {
            const errorMessage = `Cleaned schema file was not created at expected path: ${absoluteOutputPath}`;
            core.setFailed(errorMessage);
            throw new Error(errorMessage);
        }
        core.info(`✓ Schema successfully cleaned and saved to: ${absoluteOutputPath}`);
        return absoluteOutputPath;
    }
    catch (error) {
        const errorMessage = `Unexpected error in cleanSchema: ${error instanceof Error ? error.message : String(error)}`;
        core.setFailed(errorMessage);
        throw error instanceof Error ? error : new Error(errorMessage);
    }
}
//# sourceMappingURL=clean-schema.js.map