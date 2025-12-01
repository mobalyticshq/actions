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
exports.run = run;
const core = __importStar(require("@actions/core"));
const storage_1 = require("@google-cloud/storage");
const _0_check_schema_version_1 = require("./steps/0-check-schema-version");
const _1_download_schema_1 = require("./steps/1-download-schema");
const _2_generate_scopes_1 = require("./steps/2-generate-scopes");
const _3_clean_schema_1 = require("./steps/3-clean-schema");
const _4_generate_fragments_1 = require("./steps/4-generate-fragments");
const _5_generate_query_1 = require("./steps/5-generate-query");
const _7_generate_gql_types_1 = require("./steps/7-generate-gql-types");
const _8_upload_build_1 = require("./steps/8-upload-build");
const _6_compile_query_1 = require("./steps/6-compile-query");
/**
 * Main function for the GitHub Action
 */
async function run() {
    try {
        // Get inputs
        const game = core.getInput('game', { required: true });
        const graphqlEndpoint = core.getInput('graphql-endpoint', { required: true });
        const staticDataFieldName = core.getInput('static-data-field-name') || 'staticData';
        const timeoutMs = parseInt(core.getInput('timeout') || '600000', 10);
        const gcsBucketName = core.getInput('gcs-bucket-name', { required: true });
        const gcsProjectId = core.getInput('gcs-project-id', { required: true });
        const dynamicModulesEnv = core.getInput('dynamic-modules-env', { required: true });
        core.info(`🚀 Starting build static data query pipeline for game: ${game}`);
        // Initialize Storage and Bucket
        const storage = new storage_1.Storage({ projectId: gcsProjectId });
        const bucket = storage.bucket(gcsBucketName);
        // Step 0: Check schema version
        core.startGroup('🔍 Step 0: Checking schema version');
        const schemaVersionCheck = await (0, _0_check_schema_version_1.checkSchemaVersion)({
            graphqlEndpoint,
            bucket,
            env: dynamicModulesEnv,
            game,
        });
        core.endGroup();
        if (!schemaVersionCheck.shouldContinue) {
            core.info(`✓ Schema version has not changed (${schemaVersionCheck.currentSchemaVersion}). Pipeline skipped.`);
            return;
        }
        if (!schemaVersionCheck.currentSchemaVersion) {
            core.setFailed('Schema version is not found, pipeline will be skipped');
            return;
        }
        // Step 1: Download GraphQL schema
        core.startGroup('📥 Step 1: Downloading GraphQL schema');
        const downloadedSchemaPath = await (0, _1_download_schema_1.downloadSchema)({ endpoint: graphqlEndpoint });
        core.info(`✓ Schema downloaded to: ${downloadedSchemaPath}`);
        core.endGroup();
        // Step 2: Generate scopes
        core.startGroup('🔧 Step 2: Generating scopes');
        const scopesPath = (0, _2_generate_scopes_1.generateScopes)({
            schemaPath: downloadedSchemaPath,
            gameField: game,
        });
        core.info(`✓ Scopes generated: ${scopesPath}`);
        core.endGroup();
        // Step 3: Clean schema
        core.startGroup('🧹 Step 3: Cleaning schema');
        const cleanedSchemaPath = await (0, _3_clean_schema_1.cleanSchema)({
            schemaPath: downloadedSchemaPath,
            gameField: game,
            staticDataFieldName,
        });
        core.info(`✓ Schema cleaned: ${cleanedSchemaPath}`);
        core.endGroup();
        // Step 4: Generate fragments
        core.startGroup('🔨 Step 4: Generating fragments');
        await (0, _4_generate_fragments_1.generateFragments)({
            timeoutMs,
        });
        core.info(`✓ Fragments generation completed`);
        core.endGroup();
        // Step 5: Generate query
        core.startGroup('🔨 Step 5: Generating query');
        await (0, _5_generate_query_1.generateQuery)({
            timeoutMs,
        });
        core.info(`✓ Query generation completed`);
        core.endGroup();
        // Step 6: Compile query
        core.startGroup('🔨 Step 6: Compiling query');
        await (0, _6_compile_query_1.compileQuery)();
        core.info(`✓ Query Compiling completed`);
        core.endGroup();
        // Step 7: Generate GraphQL types
        core.startGroup('📝 Step 7: Generating GraphQL types');
        await (0, _7_generate_gql_types_1.generateGqlTypes)();
        core.info(`✓ GraphQL types generation completed`);
        core.endGroup();
        // Step 8: Upload build to GCS
        core.startGroup('☁️ Step 8: Uploading build to GCS');
        await (0, _8_upload_build_1.uploadBuild)({
            bucket,
            env: dynamicModulesEnv,
            game: game,
            schemaVersion: schemaVersionCheck.currentSchemaVersion,
        });
        core.info(`✓ Build upload completed`);
        core.endGroup();
        core.info(`✓ Pipeline completed successfully`);
    }
    catch (error) {
        if (error instanceof Error) {
            core.setFailed(error.message);
        }
        else {
            core.setFailed('An unknown error occurred');
        }
    }
}
// Run the action if this file is executed directly
if (require.main === module) {
    run();
}
//# sourceMappingURL=index.js.map