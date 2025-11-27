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
exports.downloadSchema = downloadSchema;
const cli_1 = require("@graphql-codegen/cli");
const rimraf_1 = require("rimraf");
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const core = __importStar(require("@actions/core"));
const outputPath = '_generated/schema.graphql';
const headers = {
    'xmoba-no-cache': '1',
};
async function downloadSchema(options) {
    try {
        const { endpoint } = options;
        // Resolve the absolute path for the output
        const absoluteOutputPath = path.resolve(process.cwd(), outputPath);
        const outputDir = path.dirname(absoluteOutputPath);
        // Step 1: Clean up old schema files in the output directory
        // This mimics the behavior of: rimraf ./src/**/*schema.graphql
        try {
            const schemaPattern = path.join(outputDir, '**/*schema.graphql');
            await (0, rimraf_1.rimraf)(schemaPattern);
            core.info('Cleaned up old schema files');
        }
        catch (error) {
            // If cleanup fails, log but continue - directory might not exist yet
            core.warning(`Could not clean up old schema files: ${error instanceof Error ? error.message : String(error)}`);
        }
        // Step 2: Ensure output directory exists
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
            core.info(`Created output directory: ${outputDir}`);
        }
        // Step 3: Configure and execute graphql-codegen
        const config = {
            schema: [
                {
                    [endpoint]: {
                        headers,
                    },
                },
            ],
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
        // Step 4: Execute the code generation
        core.info(`Downloading schema from: ${endpoint}`);
        try {
            await (0, cli_1.generate)(config, true);
        }
        catch (error) {
            core.setFailed(`Failed to download schema from ${endpoint}: ${error instanceof Error ? error.message : String(error)}`);
            process.exit(1);
        }
        // Verify the file was created
        if (!fs.existsSync(absoluteOutputPath)) {
            core.setFailed(`Schema file was not created at expected path: ${absoluteOutputPath}`);
            process.exit(1);
        }
        core.info(`✓ Schema successfully saved to: ${absoluteOutputPath}`);
        return absoluteOutputPath;
    }
    catch (error) {
        // Catch any unexpected errors
        core.setFailed(`Unexpected error in downloadSchema: ${error instanceof Error ? error.message : String(error)}`);
        process.exit(1);
    }
}
//# sourceMappingURL=download-schema.js.map