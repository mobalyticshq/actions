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
exports.checkSchemaVersion = checkSchemaVersion;
const core = __importStar(require("@actions/core"));
const version_folder_utils_1 = require("../../utils/version-folder.utils");
const headers = {
    'xmoba-no-cache': '1',
    'Content-Type': 'application/json',
};
async function fetchSchemaVersionFromGraphQL(endpoint, game) {
    const query = `
    query {
      ${game} {
        staticData {
          metadata {
            schemaVersion
          }
        }
      }
    }
  `;
    core.info(`Fetching schema version from GraphQL endpoint: ${endpoint}`);
    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                query,
                variables: {},
            }),
        });
        if (!response.ok) {
            throw new Error(`GraphQL request failed with status ${response.status}: ${response.statusText}`);
        }
        const result = (await response.json());
        if (result.errors) {
            throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
        }
        const schemaVersion = result.data?.[game]?.staticData?.metadata?.schemaVersion;
        if (!schemaVersion) {
            throw new Error(`Schema version not found in GraphQL response: ${JSON.stringify(result.data)}`);
        }
        core.info(`✓ Current schema version from GraphQL: ${schemaVersion}`);
        return schemaVersion;
    }
    catch (error) {
        core.setFailed(`Failed to fetch schema version from GraphQL: ${error instanceof Error ? error.message : String(error)}`);
        throw error;
    }
}
async function downloadConfigFromBucket(bucket, env, game) {
    const configPath = `dynamic-modules/${env}/${game}/static-data-query/config.json`;
    const bucketName = bucket.name;
    core.info(`Downloading config.json from gs://${bucketName}/${configPath}`);
    try {
        const file = bucket.file(configPath);
        // Download file
        const [fileContents] = await file.download();
        const configJson = JSON.parse(fileContents.toString('utf-8'));
        if (!configJson.schemaVersion) {
            core.warning(`Config file exists but does not contain schemaVersion field`);
            return null;
        }
        core.info(`✓ Existing schema version from config.json: ${configJson.schemaVersion}`);
        return { schemaVersion: configJson.schemaVersion };
    }
    catch (error) {
        // Handle 404 (file not found) as a normal case
        if (error?.code === 404 || error?.message?.includes('No such object')) {
            core.info(`Config file not found at gs://${bucketName}/${configPath}, continuing pipeline`);
            return null;
        }
        // For other errors, log warning but continue
        core.warning(`Failed to download config.json: ${error instanceof Error ? error.message : String(error)}`);
        return null;
    }
}
async function checkSchemaVersion(options) {
    try {
        const { graphqlEndpoint, bucket, env, game } = options;
        core.info(`Checking schema version for game: ${game}`);
        // Execute GraphQL query and GCS download in parallel
        const [currentSchemaVersion, existingConfig] = await Promise.all([
            fetchSchemaVersionFromGraphQL(graphqlEndpoint, game),
            downloadConfigFromBucket(bucket, env, game),
        ]);
        // Check if version folder already exists
        if (currentSchemaVersion) {
            const versionFolderExists = await (0, version_folder_utils_1.checkVersionFolderExists)(bucket, env, game, currentSchemaVersion);
            if (versionFolderExists) {
                const bucketName = bucket.name;
                const versionFolderPath = (0, version_folder_utils_1.buildVersionFolderPath)(env, game, currentSchemaVersion);
                core.info(`✓ Version folder already exists at gs://${bucketName}/${versionFolderPath}. Pipeline will be skipped.`);
                return {
                    shouldContinue: false,
                    currentSchemaVersion,
                    existingSchemaVersion: existingConfig?.schemaVersion,
                };
            }
        }
        // If config file doesn't exist, continue pipeline
        if (!existingConfig) {
            core.info(`No existing config found, continuing pipeline`);
            return {
                shouldContinue: true,
                currentSchemaVersion,
            };
        }
        const existingSchemaVersion = existingConfig.schemaVersion;
        // If we can't get schema version from the endpoint, pipeline should be stopped
        if (!currentSchemaVersion) {
            core.info(`Schema versions can't be fetched. Pipeline will be skipped.`);
            return {
                shouldContinue: false,
                currentSchemaVersion,
                existingSchemaVersion,
            };
        }
        // Compare versions
        if (currentSchemaVersion === existingSchemaVersion) {
            core.info(`✓ Schema versions match (${currentSchemaVersion}). Pipeline will be skipped.`);
            return {
                shouldContinue: false,
                currentSchemaVersion,
                existingSchemaVersion,
            };
        }
        core.info(`Schema versions differ: current=${currentSchemaVersion}, existing=${existingSchemaVersion}. Continuing pipeline.`);
        return {
            shouldContinue: true,
            currentSchemaVersion,
            existingSchemaVersion,
        };
    }
    catch (error) {
        // GraphQL errors should fail the pipeline
        core.setFailed(`Error in checkSchemaVersion: ${error instanceof Error ? error.message : String(error)}`);
        throw error;
    }
}
//# sourceMappingURL=check-schema-version.js.map