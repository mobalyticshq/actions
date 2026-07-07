/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ 5:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


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
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.generateGqlTypes = generateGqlTypes;
const cli_1 = __webpack_require__(404);
const rimraf_1 = __webpack_require__(485);
const path = __importStar(__webpack_require__(928));
const fs = __importStar(__webpack_require__(896));
const core = __importStar(__webpack_require__(659));
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
        const config = {
            generates: {
                [typesFilePath]: fileConfig,
                [typesDirPath]: dirConfig,
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


/***/ }),

/***/ 16:
/***/ ((module) => {

module.exports = require("url");

/***/ }),

/***/ 17:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


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
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.downloadSchema = downloadSchema;
const cli_1 = __webpack_require__(404);
const rimraf_1 = __webpack_require__(485);
const path = __importStar(__webpack_require__(928));
const fs = __importStar(__webpack_require__(896));
const core = __importStar(__webpack_require__(659));
const user_agent_1 = __webpack_require__(998);
const outputPath = '_generated/schema.graphql';
const headers = {
    'xmoba-no-cache': '1',
    'User-Agent': user_agent_1.fetchGqlShemaUserAgent,
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
            const errorMessage = `Failed to download schema from ${endpoint}: ${error instanceof Error ? error.message : String(error)}`;
            core.setFailed(errorMessage);
            throw new Error(errorMessage);
        }
        // Verify the file was created
        if (!fs.existsSync(absoluteOutputPath)) {
            const errorMessage = `Schema file was not created at expected path: ${absoluteOutputPath}`;
            core.setFailed(errorMessage);
            throw new Error(errorMessage);
        }
        core.info(`✓ Schema successfully saved to: ${absoluteOutputPath}`);
        return absoluteOutputPath;
    }
    catch (error) {
        // Catch any unexpected errors
        const errorMessage = `Unexpected error in downloadSchema: ${error instanceof Error ? error.message : String(error)}`;
        core.setFailed(errorMessage);
        throw error instanceof Error ? error : new Error(errorMessage);
    }
}


/***/ }),

/***/ 37:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.getAllFilesRecursive = getAllFilesRecursive;
const fs_1 = __importDefault(__webpack_require__(896));
const path_1 = __importDefault(__webpack_require__(928));
function getAllFilesRecursive(dirPath) {
    const files = [];
    if (!fs_1.default.existsSync(dirPath) || !fs_1.default.statSync(dirPath).isDirectory()) {
        return files;
    }
    const entries = fs_1.default.readdirSync(dirPath);
    for (const entry of entries) {
        const filePath = path_1.default.join(dirPath, entry);
        if (fs_1.default.statSync(filePath).isDirectory()) {
            files.push(...getAllFilesRecursive(filePath));
        }
        else {
            files.push(filePath);
        }
    }
    return files;
}


/***/ }),

/***/ 39:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.generateGqlTypes = void 0;
var generate_gql_types_1 = __webpack_require__(5);
Object.defineProperty(exports, "generateGqlTypes", ({ enumerable: true, get: function () { return generate_gql_types_1.generateGqlTypes; } }));


/***/ }),

/***/ 58:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


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
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.checkSchemaVersion = checkSchemaVersion;
const core = __importStar(__webpack_require__(659));
const module_folder_utils_1 = __webpack_require__(994);
const bucket_utils_1 = __webpack_require__(328);
const dynamic_modules_types_1 = __webpack_require__(463);
const user_agent_1 = __webpack_require__(998);
const headers = {
    'xmoba-no-cache': '1',
    'Content-Type': 'application/json',
    'User-Agent': user_agent_1.fetchGqlShemaUserAgent,
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
async function checkSchemaVersion(options) {
    try {
        const { graphqlEndpoint, bucket, env, game, gameUrlSlug, disableQueryAst } = options;
        const staticDataQueryModuleSlug = disableQueryAst
            ? dynamic_modules_types_1.DynamicModuleSlug.STATIC_DATA_QUERY_V2
            : dynamic_modules_types_1.DynamicModuleSlug.STATIC_DATA_QUERY;
        core.info(`Checking schema version for game: ${game}`);
        // Execute GraphQL query and GCS download in parallel
        const [currentSchemaVersion, existingSchemaVersion] = await Promise.all([
            fetchSchemaVersionFromGraphQL(graphqlEndpoint, game),
            (0, bucket_utils_1.downloadConfigFromBucket)(bucket, env, gameUrlSlug, staticDataQueryModuleSlug).then(result => result?.version),
        ]);
        // Check if version folder already exists
        if (currentSchemaVersion) {
            const versionFolderExists = await (0, module_folder_utils_1.checkStaticDataQueryModuleFolderExists)(bucket, env, gameUrlSlug, currentSchemaVersion, staticDataQueryModuleSlug);
            if (versionFolderExists) {
                const bucketName = bucket.name;
                const versionFolderPath = (0, module_folder_utils_1.buildStaticDataQueryModuleFolderPath)(env, gameUrlSlug, currentSchemaVersion, staticDataQueryModuleSlug);
                core.info(`✓ Version folder already exists at gs://${bucketName}/${versionFolderPath}. Pipeline will be skipped.`);
                return {
                    shouldContinue: false,
                    currentSchemaVersion,
                    existingSchemaVersion: existingSchemaVersion,
                };
            }
        }
        // If config file doesn't exist, continue pipeline
        if (!existingSchemaVersion) {
            core.info(`No existing config found, continuing pipeline`);
            return {
                shouldContinue: true,
                currentSchemaVersion,
            };
        }
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


/***/ }),

/***/ 76:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


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
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.generateScopes = generateScopes;
const fs = __importStar(__webpack_require__(896));
const graphql_1 = __webpack_require__(253);
const core = __importStar(__webpack_require__(659));
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
        core.info(`✓ Successfully generated scopes`);
        if (targetGameQueryFields.length > 0) {
            core.info(`  Target game (${gameField}) fields: ${targetGameQueryFields.length}`);
            core.info(`  Target game type name: ${targetGameQueryTypeName}`);
        }
        return {
            queryNamespaces,
            mutationNamespaces,
            subscriptionNamespaces,
            targetGameQueryFields,
            targetGameQueryTypeName,
        };
    }
    catch (error) {
        const errorMessage = `Unexpected error in generateScopes: ${error instanceof Error ? error.message : String(error)}`;
        core.setFailed(errorMessage);
        throw error instanceof Error ? error : new Error(errorMessage);
    }
}


/***/ }),

/***/ 99:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


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
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.TimeoutError = void 0;
exports.spawnWithTimeout = spawnWithTimeout;
const child_process_1 = __webpack_require__(317);
const core = __importStar(__webpack_require__(659));
exports.TimeoutError = 'TIMEOUT_ERROR';
function makeSpawnPromise(input) {
    const { command, args, timeoutMs, env } = input;
    return new Promise((resolve, reject) => {
        const child = (0, child_process_1.spawn)(command, args, {
            env: { ...process.env, ...env },
            shell: true,
            stdio: 'inherit',
        });
        let stderr = '';
        child.stdout?.on('data', data => {
            core.info(data.toString());
        });
        child.stderr?.on('data', data => {
            stderr += data.toString();
            core.warning(data.toString());
        });
        const timeout = setTimeout(() => {
            core.warning(`Command timeout reached (${timeoutMs}ms), killing process...`);
            child.kill('SIGTERM');
            // Даем процессу время на корректное завершение
            setTimeout(() => {
                if (!child.killed) {
                    child.kill('SIGKILL');
                }
            }, 5000);
            reject(new Error(exports.TimeoutError));
        }, timeoutMs);
        child.on('close', (code, signal) => {
            clearTimeout(timeout);
            if (code === 0) {
                resolve('Command completed successfully');
            }
            else if (signal === 'SIGTERM') {
                reject(new Error(exports.TimeoutError));
            }
            else {
                reject(new Error(`Process exited with code ${code}. stderr: ${stderr}`));
            }
        });
        child.on('error', error => {
            clearTimeout(timeout);
            reject(error);
        });
    });
}
function spawnWithTimeout(input) {
    const { extraConditionPromise, ...restInput } = input;
    const spawnPromise = makeSpawnPromise(restInput);
    if (extraConditionPromise) {
        return Promise.race([spawnPromise, extraConditionPromise]);
    }
    return spawnPromise;
}


/***/ }),

/***/ 154:
/***/ ((module) => {

module.exports = require("google-auth-library");

/***/ }),

/***/ 156:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


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
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.run = run;
const core = __importStar(__webpack_require__(659));
const storage_utils_1 = __webpack_require__(931);
const _0_check_schema_version_1 = __webpack_require__(911);
const _1_download_schema_1 = __webpack_require__(309);
const _2_generate_scopes_1 = __webpack_require__(559);
const _3_clean_schema_1 = __webpack_require__(922);
const _4_generate_fragments_1 = __webpack_require__(985);
const _5_generate_query_1 = __webpack_require__(517);
const _7_generate_gql_types_1 = __webpack_require__(39);
const _9_upload_build_1 = __webpack_require__(420);
const _6_compile_query_1 = __webpack_require__(304);
const _8_generate_worker_output_types_1 = __webpack_require__(484);
/**
 * Main function for the GitHub Action
 */
async function run() {
    try {
        // Get inputs
        const game = core.getInput('game', { required: true });
        const gameUrlSlug = core.getInput('game-url-slug', { required: false }) || game;
        const graphqlEndpoint = core.getInput('graphql-endpoint', { required: true });
        const staticDataFieldName = core.getInput('static-data-field-name') || 'staticData';
        const timeoutMs = parseInt(core.getInput('timeout') || '600000', 10);
        const model = core.getInput('model-version', { required: false });
        const gcsBucketName = core.getInput('gcs-bucket-name', { required: true });
        const gcsProjectId = core.getInput('gcs-project-id', { required: true });
        const dynamicModulesEnv = core.getInput('dynamic-modules-env', { required: true });
        const disableQueryAst = core.getBooleanInput('disable-query-ast-compilation');
        core.info(`🚀 Starting build static data query pipeline for game: ${game}`);
        // Initialize Storage and Bucket
        const storage = (0, storage_utils_1.createStorage)(gcsProjectId);
        const bucket = storage.bucket(gcsBucketName);
        // Step 0: Check schema version
        core.startGroup('🔍 Step 0: Checking schema version');
        const schemaVersionCheck = await (0, _0_check_schema_version_1.checkSchemaVersion)({
            graphqlEndpoint,
            bucket,
            env: dynamicModulesEnv,
            game,
            gameUrlSlug,
            disableQueryAst,
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
        const scopesData = (0, _2_generate_scopes_1.generateScopes)({
            schemaPath: downloadedSchemaPath,
            gameField: game,
        });
        core.info(`✓ Scopes generated`);
        core.endGroup();
        // Step 3: Clean schema
        core.startGroup('🧹 Step 3: Cleaning schema');
        const cleanedSchemaPath = await (0, _3_clean_schema_1.cleanSchema)({
            schemaPath: downloadedSchemaPath,
            gameField: game,
            staticDataFieldName,
            scopesData,
        });
        core.info(`✓ Schema cleaned: ${cleanedSchemaPath}`);
        core.endGroup();
        // Step 4: Generate fragments
        core.startGroup('🔨 Step 4: Generating fragments');
        await (0, _4_generate_fragments_1.generateFragments)({
            timeoutMs,
            model,
        });
        core.info(`✓ Fragments generation completed`);
        core.endGroup();
        // Step 5: Generate query
        core.startGroup('🔨 Step 5: Generating query');
        await (0, _5_generate_query_1.generateQuery)({
            timeoutMs,
            model,
        });
        core.info(`✓ Query generation completed`);
        core.endGroup();
        // Step 6: Compile query
        core.startGroup('🔨 Step 6: Compiling queries');
        await (0, _6_compile_query_1.compileQueries)({ disableQueryAst });
        core.info(`✓ Queries Compiling completed`);
        core.endGroup();
        // Step 7: Generate GraphQL types
        core.startGroup('📝 Step 7: Generating GraphQL types');
        await (0, _7_generate_gql_types_1.generateGqlTypes)();
        core.info(`✓ GraphQL types generation completed`);
        core.endGroup();
        // Step 8: Generate worker output types
        core.startGroup('🔨 Step 8: Generating worker output types');
        await (0, _8_generate_worker_output_types_1.generateWorkerOutputTypes)({
            timeoutMs,
            model,
        });
        core.info(`✓ Worker output types generation completed`);
        core.endGroup();
        // Step 9: Upload build to GCS
        core.startGroup('☁️ Step 9: Uploading build to GCS');
        await (0, _9_upload_build_1.uploadBuild)({
            bucket,
            env: dynamicModulesEnv,
            gameUrlSlug,
            schemaVersion: schemaVersionCheck.currentSchemaVersion,
            disableQueryAst,
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
run();


/***/ }),

/***/ 253:
/***/ ((module) => {

module.exports = require("graphql");

/***/ }),

/***/ 258:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.generateFragments = generateFragments;
const run_cursor_generation_1 = __webpack_require__(550);
const path_1 = __importDefault(__webpack_require__(928));
async function generateFragments(options) {
    const { timeoutMs, model } = options;
    const promptFilePath = path_1.default.resolve(__dirname, 'generate-fragments.md');
    return await (0, run_cursor_generation_1.runCursorGeneration)({
        timeoutMs,
        prompt: `"Implement instructions in the file ${promptFilePath}"`,
        model,
    });
}


/***/ }),

/***/ 304:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.compileQueries = void 0;
var compile_query_1 = __webpack_require__(380);
Object.defineProperty(exports, "compileQueries", ({ enumerable: true, get: function () { return compile_query_1.compileQueries; } }));


/***/ }),

/***/ 309:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.downloadSchema = void 0;
var download_schema_1 = __webpack_require__(17);
Object.defineProperty(exports, "downloadSchema", ({ enumerable: true, get: function () { return download_schema_1.downloadSchema; } }));


/***/ }),

/***/ 317:
/***/ ((module) => {

module.exports = require("child_process");

/***/ }),

/***/ 323:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


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
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.cleanSchema = cleanSchema;
const cli_1 = __webpack_require__(404);
const clean_schema_by_game_js_1 = __webpack_require__(384);
const path = __importStar(__webpack_require__(928));
const fs = __importStar(__webpack_require__(896));
const core = __importStar(__webpack_require__(659));
const OUTPUT_PATH = '_generated/cleaned-schema.graphql';
async function cleanSchema(options) {
    try {
        const { schemaPath, gameField, staticDataFieldName, scopesData } = options;
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
                        scopesData,
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


/***/ }),

/***/ 328:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


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
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.uploadFileToBucket = uploadFileToBucket;
exports.downloadConfigFromBucket = downloadConfigFromBucket;
exports.downloadFolderFromBucket = downloadFolderFromBucket;
exports.uploadFolderToBucket = uploadFolderToBucket;
exports.isFolderExists = isFolderExists;
const core = __importStar(__webpack_require__(659));
const fs = __importStar(__webpack_require__(896));
const path = __importStar(__webpack_require__(928));
const dynamic_module_utils_1 = __webpack_require__(798);
const fs_utils_1 = __webpack_require__(37);
async function uploadFileToBucket(bucket, sourcePath, destination, bucketName, description) {
    try {
        const logPrefix = description ? `${description}: ` : '';
        core.info(`Uploading: ${logPrefix}${sourcePath} -> gs://${bucketName}/${destination}`);
        const options = { destination };
        await bucket.upload(sourcePath, options);
        const successMessage = description ? `✓ Uploaded ${description}` : `✓ Uploaded file`;
        core.info(successMessage);
        return true;
    }
    catch (error) {
        const errorMessage = description
            ? `Failed to upload ${description}: ${error instanceof Error ? error.message : String(error)}`
            : `Failed to upload file: ${error instanceof Error ? error.message : String(error)}`;
        core.error(errorMessage);
        return false;
    }
}
async function downloadConfigFromBucket(bucket, env, game, dynamicModuleSlug) {
    const configPath = `${(0, dynamic_module_utils_1.generateModulePath)(env, game, dynamicModuleSlug)}/config.json`;
    const bucketName = bucket.name;
    core.info(`Downloading config.json from gs://${bucketName}/${configPath}`);
    try {
        const file = bucket.file(configPath);
        // Download file
        const [fileContents] = await file.download();
        const configJson = JSON.parse(fileContents.toString('utf-8'));
        core.info(`✓ Config.json downloaded: ${configJson.version}`);
        return configJson;
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
async function downloadFolderFromBucket(bucket, bucketFolderPath, localFolderPath, folderName, filterFiles) {
    const prefix = bucketFolderPath.endsWith('/') ? bucketFolderPath : `${bucketFolderPath}/`;
    core.info(`Checking folder: ${folderName} at gs://${bucket.name}/${prefix}`);
    // Get all files in the folder
    const [files] = await bucket.getFiles({ prefix });
    // Filter out files that are exactly the prefix (folder markers)
    let actualFiles = files.filter(file => file.name !== prefix);
    // Apply file filter if provided
    if (filterFiles) {
        actualFiles = actualFiles.filter(file => {
            const relativePath = file.name.replace(prefix, '');
            const fileName = path.basename(relativePath);
            return filterFiles(fileName);
        });
    }
    if (actualFiles.length === 0) {
        const errorMessage = `Folder ${folderName} is empty or does not exist at gs://${bucket.name}/${prefix}`;
        core.setFailed(errorMessage);
        throw new Error(errorMessage);
    }
    core.info(`Found ${actualFiles.length} file(s) in folder ${folderName}`);
    // Create promises for all file downloads
    const downloadPromises = actualFiles.map(async (file) => {
        // Get relative path from the folder prefix
        const relativePath = file.name.replace(prefix, '');
        const localFilePath = path.join(localFolderPath, relativePath);
        const localFileDir = path.dirname(localFilePath);
        // Create directory if it doesn't exist
        if (!fs.existsSync(localFileDir)) {
            fs.mkdirSync(localFileDir, { recursive: true });
        }
        // Download file
        await file.download({ destination: localFilePath });
        core.info(`Downloaded: ${relativePath}`);
    });
    const results = await Promise.allSettled(downloadPromises);
    // Check for failures and collect error information
    const failures = [];
    for (let i = 0; i < results.length; i++) {
        const result = results[i];
        if (result.status === 'rejected') {
            const relativePath = actualFiles[i].name.replace(prefix, '');
            failures.push({
                file: relativePath,
                error: result.reason instanceof Error ? result.reason.message : String(result.reason),
            });
        }
    }
    // If there are failures, throw an error with details
    if (failures.length > 0) {
        const errorDetails = failures.map(f => `  - ${f.file}: ${f.error}`).join('\n');
        const errorMessage = `Failed to download ${failures.length} file(s) from folder ${folderName}:\n${errorDetails}`;
        core.setFailed(errorMessage);
        throw new Error(errorMessage);
    }
    core.info(`✓ Successfully downloaded folder ${folderName}`);
}
async function uploadFolderToBucket(bucket, bucketName, sourcePath, destinationPrefix, fileTypeDescription, requireExists = true) {
    if (!fs.existsSync(sourcePath)) {
        if (requireExists) {
            const errorMessage = `Directory does not exist: ${sourcePath}`;
            core.setFailed(errorMessage);
            throw new Error(errorMessage);
        }
        else {
            core.warning(`Directory does not exist: ${sourcePath}, skipping`);
            return { uploadedCount: 0, failedCount: 0 };
        }
    }
    const files = (0, fs_utils_1.getAllFilesRecursive)(sourcePath);
    if (files.length === 0) {
        core.warning(`No files found in ${sourcePath}`);
        return { uploadedCount: 0, failedCount: 0 };
    }
    core.info(`Uploading ${files.length} file(s) from ${path.relative(process.cwd(), sourcePath)} to ${destinationPrefix}`);
    // Create promises for all file uploads
    const uploadPromises = files.map(filePath => {
        const relativePath = path.relative(sourcePath, filePath);
        const gcsPath = relativePath.split(path.sep).join('/');
        const destination = `${destinationPrefix}${gcsPath}`;
        const description = `${fileTypeDescription}: ${relativePath}`;
        return uploadFileToBucket(bucket, filePath, destination, bucketName, description);
    });
    const results = await Promise.allSettled(uploadPromises);
    // Count successful and failed uploads
    let resultUploadedCount = 0;
    let resultFailedCount = 0;
    for (const result of results) {
        if (result.status === 'fulfilled' && result.value === true) {
            resultUploadedCount++;
        }
        else {
            resultFailedCount++;
        }
    }
    return {
        uploadedCount: resultUploadedCount,
        failedCount: resultFailedCount,
    };
}
async function isFolderExists(bucket, folderPath) {
    const prefix = folderPath.endsWith('/') ? folderPath : `${folderPath}/`;
    const [files] = await bucket.getFiles({ prefix, maxResults: 1 });
    return files.length > 0;
}


/***/ }),

/***/ 380:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.compileQueries = compileQueries;
const path_1 = __importDefault(__webpack_require__(928));
const fs_1 = __importDefault(__webpack_require__(896));
const url_1 = __webpack_require__(16);
const graphql_1 = __webpack_require__(253);
const core = __importStar(__webpack_require__(659));
const compile_utils_1 = __webpack_require__(756);
const queryDir = 'build/gql';
const outputDir = 'build/dist';
const entryFileName = 'entrypoint.ts';
const outputFileName = 'entrypoint.js';
// Native ESM dynamic import that survives TS (module: commonjs) and webpack
// transpilation, which would otherwise rewrite `import()` into `require()`.
const importEsm = new Function('specifier', 'return import(specifier);');
async function compileQueries(options) {
    const { disableQueryAst } = options;
    if (!disableQueryAst) {
        // v1: compile the gql template literals into a DocumentNode (AST) bundle.
        await (0, compile_utils_1.compileCode)(queryDir, outputDir, entryFileName, outputFileName);
        return;
    }
    // v2: fragment stitching still runs through the AST, but we print the
    // DocumentNodes to plain strings at build time so the published artifact is a
    // dependency-free string map (no runtime `graphql` require).
    const astFileName = 'entrypoint.ast.mjs';
    await (0, compile_utils_1.compileCode)(queryDir, outputDir, entryFileName, astFileName);
    const absoluteOutputDir = path_1.default.resolve(process.cwd(), outputDir);
    const astFilePath = path_1.default.join(absoluteOutputDir, astFileName);
    const astModule = await importEsm((0, url_1.pathToFileURL)(astFilePath).href);
    const queries = astModule.default;
    const entries = Object.entries(queries)
        .map(([key, documentNode]) => `  ${JSON.stringify(key)}: ${JSON.stringify((0, graphql_1.print)(documentNode))}`)
        .join(',\n');
    const fileContents = `export default {\n${entries},\n};\n`;
    const outputFilePath = path_1.default.join(absoluteOutputDir, outputFileName);
    fs_1.default.writeFileSync(outputFilePath, fileContents, 'utf-8');
    core.info(`✓ Emitted plain-string query artifact to: ${path_1.default.relative(process.cwd(), outputFilePath)}`);
    // Remove the intermediate AST bundle so only the string artifact is published.
    fs_1.default.rmSync(astFilePath, { force: true });
}


/***/ }),

/***/ 384:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  getCleanedSchemaByGame: () => (/* binding */ getCleanedSchemaByGame)
});

;// external "node:fs"
const external_node_fs_namespaceObject = require("node:fs");
// EXTERNAL MODULE: external "graphql"
var external_graphql_ = __webpack_require__(253);
;// external "microfiber"
const external_microfiber_namespaceObject = require("microfiber");
;// ./codegen/utils/graphql-tools/Interfaces.js
var MapperKind;
(function (MapperKind) {
  MapperKind['TYPE'] = 'MapperKind.TYPE';
  MapperKind['SCALAR_TYPE'] = 'MapperKind.SCALAR_TYPE';
  MapperKind['ENUM_TYPE'] = 'MapperKind.ENUM_TYPE';
  MapperKind['COMPOSITE_TYPE'] = 'MapperKind.COMPOSITE_TYPE';
  MapperKind['OBJECT_TYPE'] = 'MapperKind.OBJECT_TYPE';
  MapperKind['INPUT_OBJECT_TYPE'] = 'MapperKind.INPUT_OBJECT_TYPE';
  MapperKind['ABSTRACT_TYPE'] = 'MapperKind.ABSTRACT_TYPE';
  MapperKind['UNION_TYPE'] = 'MapperKind.UNION_TYPE';
  MapperKind['INTERFACE_TYPE'] = 'MapperKind.INTERFACE_TYPE';
  MapperKind['ROOT_OBJECT'] = 'MapperKind.ROOT_OBJECT';
  MapperKind['QUERY'] = 'MapperKind.QUERY';
  MapperKind['MUTATION'] = 'MapperKind.MUTATION';
  MapperKind['SUBSCRIPTION'] = 'MapperKind.SUBSCRIPTION';
  MapperKind['DIRECTIVE'] = 'MapperKind.DIRECTIVE';
  MapperKind['FIELD'] = 'MapperKind.FIELD';
  MapperKind['COMPOSITE_FIELD'] = 'MapperKind.COMPOSITE_FIELD';
  MapperKind['OBJECT_FIELD'] = 'MapperKind.OBJECT_FIELD';
  MapperKind['ROOT_FIELD'] = 'MapperKind.ROOT_FIELD';
  MapperKind['QUERY_ROOT_FIELD'] = 'MapperKind.QUERY_ROOT_FIELD';
  MapperKind['MUTATION_ROOT_FIELD'] = 'MapperKind.MUTATION_ROOT_FIELD';
  MapperKind['SUBSCRIPTION_ROOT_FIELD'] = 'MapperKind.SUBSCRIPTION_ROOT_FIELD';
  MapperKind['INTERFACE_FIELD'] = 'MapperKind.INTERFACE_FIELD';
  MapperKind['INPUT_OBJECT_FIELD'] = 'MapperKind.INPUT_OBJECT_FIELD';
  MapperKind['ARGUMENT'] = 'MapperKind.ARGUMENT';
  MapperKind['ENUM_VALUE'] = 'MapperKind.ENUM_VALUE';
})(MapperKind || (MapperKind = {}));

;// ./codegen/utils/graphql-tools/getObjectTypeFromTypeMap.js

function getObjectTypeFromTypeMap(typeMap, type) {
  if (type) {
    const maybeObjectType = typeMap[type.name];
    if ((0,external_graphql_.isObjectType)(maybeObjectType)) {
      return maybeObjectType;
    }
  }
}

;// ./codegen/utils/graphql-tools/stub.js

function createNamedStub(name, type) {
  let constructor;
  if (type === 'object') {
    constructor = GraphQLObjectType;
  } else if (type === 'interface') {
    constructor = GraphQLInterfaceType;
  } else {
    constructor = GraphQLInputObjectType;
  }
  return new constructor({
    name,
    fields: {
      _fake: {
        type: GraphQLString,
      },
    },
  });
}
function createStub(node, type) {
  switch (node.kind) {
    case Kind.LIST_TYPE:
      return new GraphQLList(createStub(node.type, type));
    case Kind.NON_NULL_TYPE:
      return new GraphQLNonNull(createStub(node.type, type));
    default:
      if (type === 'output') {
        return createNamedStub(node.name.value, 'object');
      }
      return createNamedStub(node.name.value, 'input');
  }
}
function isNamedStub(type) {
  if ('getFields' in type) {
    const fields = type.getFields();
    // eslint-disable-next-line no-unreachable-loop
    for (const fieldName in fields) {
      const field = fields[fieldName];
      return field.name === '_fake';
    }
  }
  return false;
}
function getBuiltInForStub(type) {
  switch (type.name) {
    case external_graphql_.GraphQLInt.name:
      return external_graphql_.GraphQLInt;
    case external_graphql_.GraphQLFloat.name:
      return external_graphql_.GraphQLFloat;
    case external_graphql_.GraphQLString.name:
      return external_graphql_.GraphQLString;
    case external_graphql_.GraphQLBoolean.name:
      return external_graphql_.GraphQLBoolean;
    case external_graphql_.GraphQLID.name:
      return external_graphql_.GraphQLID;
    default:
      return type;
  }
}

;// ./codegen/utils/graphql-tools/rewire.js


function rewireTypes(originalTypeMap, directives) {
  const referenceTypeMap = Object.create(null);
  for (const typeName in originalTypeMap) {
    referenceTypeMap[typeName] = originalTypeMap[typeName];
  }
  const newTypeMap = Object.create(null);
  for (const typeName in referenceTypeMap) {
    const namedType = referenceTypeMap[typeName];
    if (namedType == null || typeName.startsWith('__')) {
      continue;
    }
    const newName = namedType.name;
    if (newName.startsWith('__')) {
      continue;
    }
    if (newTypeMap[newName] != null) {
      console.warn(`Duplicate schema type name ${newName} found; keeping the existing one found in the schema`);
      continue;
    }
    newTypeMap[newName] = namedType;
  }
  for (const typeName in newTypeMap) {
    newTypeMap[typeName] = rewireNamedType(newTypeMap[typeName]);
  }
  const newDirectives = directives.map(directive => rewireDirective(directive));
  return {
    typeMap: newTypeMap,
    directives: newDirectives,
  };
  function rewireDirective(directive) {
    if ((0,external_graphql_.isSpecifiedDirective)(directive)) {
      return directive;
    }
    const directiveConfig = directive.toConfig();
    directiveConfig.args = rewireArgs(directiveConfig.args);
    return new external_graphql_.GraphQLDirective(directiveConfig);
  }
  function rewireArgs(args) {
    const rewiredArgs = {};
    for (const argName in args) {
      const arg = args[argName];
      const rewiredArgType = rewireType(arg.type);
      if (rewiredArgType != null) {
        arg.type = rewiredArgType;
        rewiredArgs[argName] = arg;
      }
    }
    return rewiredArgs;
  }
  function rewireNamedType(type) {
    if ((0,external_graphql_.isObjectType)(type)) {
      const config = type.toConfig();
      const newConfig = {
        ...config,
        fields: () => rewireFields(config.fields),
        interfaces: () => rewireNamedTypes(config.interfaces),
      };
      return new external_graphql_.GraphQLObjectType(newConfig);
    } else if ((0,external_graphql_.isInterfaceType)(type)) {
      const config = type.toConfig();
      const newConfig = {
        ...config,
        fields: () => rewireFields(config.fields),
      };
      if ('interfaces' in newConfig) {
        newConfig.interfaces = () => rewireNamedTypes(config.interfaces);
      }
      return new external_graphql_.GraphQLInterfaceType(newConfig);
    } else if ((0,external_graphql_.isUnionType)(type)) {
      const config = type.toConfig();
      const newConfig = {
        ...config,
        types: () => rewireNamedTypes(config.types),
      };
      return new external_graphql_.GraphQLUnionType(newConfig);
    } else if ((0,external_graphql_.isInputObjectType)(type)) {
      const config = type.toConfig();
      const newConfig = {
        ...config,
        fields: () => rewireInputFields(config.fields),
      };
      return new external_graphql_.GraphQLInputObjectType(newConfig);
    } else if ((0,external_graphql_.isEnumType)(type)) {
      const enumConfig = type.toConfig();
      return new external_graphql_.GraphQLEnumType(enumConfig);
    } else if ((0,external_graphql_.isScalarType)(type)) {
      if ((0,external_graphql_.isSpecifiedScalarType)(type)) {
        return type;
      }
      const scalarConfig = type.toConfig();
      return new external_graphql_.GraphQLScalarType(scalarConfig);
    }
    throw new Error(`Unexpected schema type: ${type}`);
  }
  function rewireFields(fields) {
    const rewiredFields = {};
    for (const fieldName in fields) {
      const field = fields[fieldName];
      const rewiredFieldType = rewireType(field.type);
      if (rewiredFieldType != null && field.args) {
        field.type = rewiredFieldType;
        field.args = rewireArgs(field.args);
        rewiredFields[fieldName] = field;
      }
    }
    return rewiredFields;
  }
  function rewireInputFields(fields) {
    const rewiredFields = {};
    for (const fieldName in fields) {
      const field = fields[fieldName];
      const rewiredFieldType = rewireType(field.type);
      if (rewiredFieldType != null) {
        field.type = rewiredFieldType;
        rewiredFields[fieldName] = field;
      }
    }
    return rewiredFields;
  }
  function rewireNamedTypes(namedTypes) {
    const rewiredTypes = [];
    for (const namedType of namedTypes) {
      const rewiredType = rewireType(namedType);
      if (rewiredType != null) {
        rewiredTypes.push(rewiredType);
      }
    }
    return rewiredTypes;
  }
  function rewireType(type) {
    if ((0,external_graphql_.isListType)(type)) {
      const rewiredType = rewireType(type.ofType);
      return rewiredType != null ? new external_graphql_.GraphQLList(rewiredType) : null;
    } else if ((0,external_graphql_.isNonNullType)(type)) {
      const rewiredType = rewireType(type.ofType);
      return rewiredType != null ? new external_graphql_.GraphQLNonNull(rewiredType) : null;
    } else if ((0,external_graphql_.isNamedType)(type)) {
      let rewiredType = referenceTypeMap[type.name];
      if (rewiredType === undefined) {
        rewiredType = isNamedStub(type) ? getBuiltInForStub(type) : rewireNamedType(type);
        newTypeMap[rewiredType.name] = referenceTypeMap[type.name] = rewiredType;
      }
      return rewiredType != null ? newTypeMap[rewiredType.name] : null;
    }
    return null;
  }
}

;// ./codegen/utils/graphql-tools/helpers.js

const URL_REGEXP = /^(https?|wss?|file):\/\//;
/**
 * Checks if the given string is a valid URL.
 *
 * @param str - The string to validate as a URL
 * @returns A boolean indicating whether the string is a valid URL
 *
 * @remarks
 * This function first attempts to use the `URL.canParse` method if available.
 * If not, it falls back to creating a new `URL` object to validate the string.
 */
function isUrl(str) {
  if (typeof str !== 'string') {
    return false;
  }
  if (!URL_REGEXP.test(str)) {
    return false;
  }
  if (URL.canParse) {
    return URL.canParse(str);
  }
  try {
    const url = new URL(str);
    return !!url;
  } catch (e) {
    return false;
  }
}
const asArray = fns => (Array.isArray(fns) ? fns : fns ? [fns] : []);
const invalidDocRegex = /\.[a-z0-9]+$/i;
/**
 * Determines if a given input is a valid GraphQL document string.
 *
 * @param str - The input to validate as a GraphQL document
 * @returns A boolean indicating whether the input is a valid GraphQL document string
 *
 * @remarks
 * This function performs several validation checks:
 * - Ensures the input is a string
 * - Filters out strings with invalid document extensions
 * - Excludes URLs
 * - Attempts to parse the string as a GraphQL document
 *
 * @throws {Error} If the document fails to parse and is empty except GraphQL comments
 */
function isDocumentString(str) {
  if (typeof str !== 'string') {
    return false;
  }
  // XXX: is-valid-path or is-glob treat SDL as a valid path
  // (`scalar Date` for example)
  // this why checking the extension is fast enough
  // and prevent from parsing the string in order to find out
  // if the string is a SDL
  if (invalidDocRegex.test(str) || isUrl(str)) {
    return false;
  }
  try {
    parse(str);
    return true;
  } catch (e) {
    if (!e.message.includes('EOF') && str.replace(/(\#[^*]*)/g, '').trim() !== '' && str.includes(' ')) {
      throw new Error(`Failed to parse the GraphQL document. ${e.message}\n${str}`);
    }
  }
  return false;
}
const invalidPathRegex = /[‘“!%^<>`\n]/;
/**
 * Checkes whether the `str` contains any path illegal characters.
 *
 * A string may sometimes look like a path but is not (like an SDL of a simple
 * GraphQL schema). To make sure we don't yield false-positives in such cases,
 * we disallow new lines in paths (even though most Unix systems support new
 * lines in file names).
 */
function isValidPath(str) {
  return typeof str === 'string' && !invalidPathRegex.test(str);
}
function compareStrings(a, b) {
  if (String(a) < String(b)) {
    return -1;
  }
  if (String(a) > String(b)) {
    return 1;
  }
  return 0;
}
function nodeToString(a) {
  let name;
  if ('alias' in a) {
    name = a.alias?.value;
  }
  if (name == null && 'name' in a) {
    name = a.name?.value;
  }
  if (name == null) {
    name = a.kind;
  }
  return name;
}
function compareNodes(a, b, customFn) {
  const aStr = nodeToString(a);
  const bStr = nodeToString(b);
  if (typeof customFn === 'function') {
    return customFn(aStr, bStr);
  }
  return compareStrings(aStr, bStr);
}
function isSome(input) {
  return input != null;
}
function assertSome(input, message = 'Value should be something') {
  if (input == null) {
    throw new Error(message);
  }
}

;// ./codegen/utils/graphql-tools/transformInputValue.js


function transformInputValue(type, value, inputLeafValueTransformer = null, inputObjectValueTransformer = null) {
  if (value == null) {
    return value;
  }
  const nullableType = (0,external_graphql_.getNullableType)(type);
  if ((0,external_graphql_.isLeafType)(nullableType)) {
    return inputLeafValueTransformer != null ? inputLeafValueTransformer(nullableType, value) : value;
  } else if ((0,external_graphql_.isListType)(nullableType)) {
    return asArray(value).map(listMember =>
      transformInputValue(nullableType.ofType, listMember, inputLeafValueTransformer, inputObjectValueTransformer)
    );
  } else if ((0,external_graphql_.isInputObjectType)(nullableType)) {
    const fields = nullableType.getFields();
    const newValue = {};
    for (const key in value) {
      const field = fields[key];
      if (field != null) {
        newValue[key] = transformInputValue(
          field.type,
          value[key],
          inputLeafValueTransformer,
          inputObjectValueTransformer
        );
      }
    }
    return inputObjectValueTransformer != null ? inputObjectValueTransformer(nullableType, newValue) : newValue;
  }
  // unreachable, no other possible return value
}
function serializeInputValue(type, value) {
  return transformInputValue(type, value, (t, v) => {
    try {
      return t.serialize(v);
    } catch {
      return v;
    }
  });
}
function parseInputValue(type, value) {
  return transformInputValue(type, value, (t, v) => {
    try {
      return t.parseValue(v);
    } catch {
      return v;
    }
  });
}
function parseInputValueLiteral(type, value) {
  return transformInputValue(type, value, (t, v) => t.parseLiteral(v, {}));
}

;// ./codegen/utils/graphql-tools/mapSchema.js





function mapSchema(schema, schemaMapper = {}) {
  const newTypeMap = mapArguments(
    mapFields(
      mapTypes(
        mapDefaultValues(
          mapEnumValues(
            mapTypes(mapDefaultValues(schema.getTypeMap(), schema, serializeInputValue), schema, schemaMapper, type =>
              (0,external_graphql_.isLeafType)(type)
            ),
            schema,
            schemaMapper
          ),
          schema,
          parseInputValue
        ),
        schema,
        schemaMapper,
        type => !(0,external_graphql_.isLeafType)(type)
      ),
      schema,
      schemaMapper
    ),
    schema,
    schemaMapper
  );
  const originalDirectives = schema.getDirectives();
  const newDirectives = mapDirectives(originalDirectives, schema, schemaMapper);
  const { typeMap, directives } = rewireTypes(newTypeMap, newDirectives);
  return new external_graphql_.GraphQLSchema({
    ...schema.toConfig(),
    query: getObjectTypeFromTypeMap(typeMap, getObjectTypeFromTypeMap(newTypeMap, schema.getQueryType())),
    mutation: getObjectTypeFromTypeMap(typeMap, getObjectTypeFromTypeMap(newTypeMap, schema.getMutationType())),
    subscription: getObjectTypeFromTypeMap(typeMap, getObjectTypeFromTypeMap(newTypeMap, schema.getSubscriptionType())),
    types: Object.values(typeMap),
    directives,
  });
}
function mapTypes(originalTypeMap, schema, schemaMapper, testFn = () => true) {
  const newTypeMap = {};
  for (const typeName in originalTypeMap) {
    if (!typeName.startsWith('__')) {
      const originalType = originalTypeMap[typeName];
      if (originalType == null || !testFn(originalType)) {
        newTypeMap[typeName] = originalType;
        continue;
      }
      const typeMapper = getTypeMapper(schema, schemaMapper, typeName);
      if (typeMapper == null) {
        newTypeMap[typeName] = originalType;
        continue;
      }
      const maybeNewType = typeMapper(originalType, schema);
      if (maybeNewType === undefined) {
        newTypeMap[typeName] = originalType;
        continue;
      }
      newTypeMap[typeName] = maybeNewType;
    }
  }
  return newTypeMap;
}
function mapEnumValues(originalTypeMap, schema, schemaMapper) {
  const enumValueMapper = getEnumValueMapper(schemaMapper);
  if (!enumValueMapper) {
    return originalTypeMap;
  }
  return mapTypes(
    originalTypeMap,
    schema,
    {
      [MapperKind.ENUM_TYPE]: type => {
        const config = type.toConfig();
        const originalEnumValueConfigMap = config.values;
        const newEnumValueConfigMap = {};
        for (const externalValue in originalEnumValueConfigMap) {
          const originalEnumValueConfig = originalEnumValueConfigMap[externalValue];
          const mappedEnumValue = enumValueMapper(originalEnumValueConfig, type.name, schema, externalValue);
          if (mappedEnumValue === undefined) {
            newEnumValueConfigMap[externalValue] = originalEnumValueConfig;
          } else if (Array.isArray(mappedEnumValue)) {
            const [newExternalValue, newEnumValueConfig] = mappedEnumValue;
            newEnumValueConfigMap[newExternalValue] =
              newEnumValueConfig === undefined ? originalEnumValueConfig : newEnumValueConfig;
          } else if (mappedEnumValue !== null) {
            newEnumValueConfigMap[externalValue] = mappedEnumValue;
          }
        }
        return correctASTNodes(
          new external_graphql_.GraphQLEnumType({
            ...config,
            values: newEnumValueConfigMap,
          })
        );
      },
    },
    type => (0,external_graphql_.isEnumType)(type)
  );
}
function mapDefaultValues(originalTypeMap, schema, fn) {
  const newTypeMap = mapArguments(originalTypeMap, schema, {
    [MapperKind.ARGUMENT]: argumentConfig => {
      if (argumentConfig.defaultValue === undefined) {
        return argumentConfig;
      }
      const maybeNewType = getNewType(originalTypeMap, argumentConfig.type);
      if (maybeNewType != null) {
        return {
          ...argumentConfig,
          defaultValue: fn(maybeNewType, argumentConfig.defaultValue),
        };
      }
    },
  });
  return mapFields(newTypeMap, schema, {
    [MapperKind.INPUT_OBJECT_FIELD]: inputFieldConfig => {
      if (inputFieldConfig.defaultValue === undefined) {
        return inputFieldConfig;
      }
      const maybeNewType = getNewType(newTypeMap, inputFieldConfig.type);
      if (maybeNewType != null) {
        return {
          ...inputFieldConfig,
          defaultValue: fn(maybeNewType, inputFieldConfig.defaultValue),
        };
      }
    },
  });
}
function getNewType(newTypeMap, type) {
  if ((0,external_graphql_.isListType)(type)) {
    const newType = getNewType(newTypeMap, type.ofType);
    return newType != null ? new external_graphql_.GraphQLList(newType) : null;
  } else if ((0,external_graphql_.isNonNullType)(type)) {
    const newType = getNewType(newTypeMap, type.ofType);
    return newType != null ? new external_graphql_.GraphQLNonNull(newType) : null;
  } else if ((0,external_graphql_.isNamedType)(type)) {
    const newType = newTypeMap[type.name];
    return newType != null ? newType : null;
  }
  return null;
}
function mapFields(originalTypeMap, schema, schemaMapper) {
  const newTypeMap = {};
  for (const typeName in originalTypeMap) {
    if (!typeName.startsWith('__')) {
      const originalType = originalTypeMap[typeName];
      if (!(0,external_graphql_.isObjectType)(originalType) && !(0,external_graphql_.isInterfaceType)(originalType) && !(0,external_graphql_.isInputObjectType)(originalType)) {
        newTypeMap[typeName] = originalType;
        continue;
      }
      const fieldMapper = getFieldMapper(schema, schemaMapper, typeName);
      if (fieldMapper == null) {
        newTypeMap[typeName] = originalType;
        continue;
      }
      const config = originalType.toConfig();
      const originalFieldConfigMap = config.fields;
      const newFieldConfigMap = {};
      for (const fieldName in originalFieldConfigMap) {
        const originalFieldConfig = originalFieldConfigMap[fieldName];
        const mappedField = fieldMapper(originalFieldConfig, fieldName, typeName, schema);
        if (mappedField === undefined) {
          newFieldConfigMap[fieldName] = originalFieldConfig;
        } else if (Array.isArray(mappedField)) {
          const [newFieldName, newFieldConfig] = mappedField;
          if (newFieldConfig.astNode != null) {
            newFieldConfig.astNode = {
              ...newFieldConfig.astNode,
              name: {
                ...newFieldConfig.astNode.name,
                value: newFieldName,
              },
            };
          }
          newFieldConfigMap[newFieldName] = newFieldConfig === undefined ? originalFieldConfig : newFieldConfig;
        } else if (mappedField !== null) {
          newFieldConfigMap[fieldName] = mappedField;
        }
      }
      if ((0,external_graphql_.isObjectType)(originalType)) {
        newTypeMap[typeName] = correctASTNodes(
          new external_graphql_.GraphQLObjectType({
            ...config,
            fields: newFieldConfigMap,
          })
        );
      } else if ((0,external_graphql_.isInterfaceType)(originalType)) {
        newTypeMap[typeName] = correctASTNodes(
          new external_graphql_.GraphQLInterfaceType({
            ...config,
            fields: newFieldConfigMap,
          })
        );
      } else {
        newTypeMap[typeName] = correctASTNodes(
          new external_graphql_.GraphQLInputObjectType({
            ...config,
            fields: newFieldConfigMap,
          })
        );
      }
    }
  }
  return newTypeMap;
}
function mapArguments(originalTypeMap, schema, schemaMapper) {
  const newTypeMap = {};
  for (const typeName in originalTypeMap) {
    if (!typeName.startsWith('__')) {
      const originalType = originalTypeMap[typeName];
      if (!(0,external_graphql_.isObjectType)(originalType) && !(0,external_graphql_.isInterfaceType)(originalType)) {
        newTypeMap[typeName] = originalType;
        continue;
      }
      const argumentMapper = getArgumentMapper(schemaMapper);
      if (argumentMapper == null) {
        newTypeMap[typeName] = originalType;
        continue;
      }
      const config = originalType.toConfig();
      const originalFieldConfigMap = config.fields;
      const newFieldConfigMap = {};
      for (const fieldName in originalFieldConfigMap) {
        const originalFieldConfig = originalFieldConfigMap[fieldName];
        const originalArgumentConfigMap = originalFieldConfig.args;
        if (originalArgumentConfigMap == null) {
          newFieldConfigMap[fieldName] = originalFieldConfig;
          continue;
        }
        const argumentNames = Object.keys(originalArgumentConfigMap);
        if (!argumentNames.length) {
          newFieldConfigMap[fieldName] = originalFieldConfig;
          continue;
        }
        const newArgumentConfigMap = {};
        for (const argumentName of argumentNames) {
          const originalArgumentConfig = originalArgumentConfigMap[argumentName];
          const mappedArgument = argumentMapper(originalArgumentConfig, fieldName, typeName, schema);
          if (mappedArgument === undefined) {
            newArgumentConfigMap[argumentName] = originalArgumentConfig;
          } else if (Array.isArray(mappedArgument)) {
            const [newArgumentName, newArgumentConfig] = mappedArgument;
            newArgumentConfigMap[newArgumentName] = newArgumentConfig;
          } else if (mappedArgument !== null) {
            newArgumentConfigMap[argumentName] = mappedArgument;
          }
        }
        newFieldConfigMap[fieldName] = {
          ...originalFieldConfig,
          args: newArgumentConfigMap,
        };
      }
      if ((0,external_graphql_.isObjectType)(originalType)) {
        newTypeMap[typeName] = new external_graphql_.GraphQLObjectType({
          ...config,
          fields: newFieldConfigMap,
        });
      } else if ((0,external_graphql_.isInterfaceType)(originalType)) {
        newTypeMap[typeName] = new external_graphql_.GraphQLInterfaceType({
          ...config,
          fields: newFieldConfigMap,
        });
      } else {
        newTypeMap[typeName] = new external_graphql_.GraphQLInputObjectType({
          ...config,
          fields: newFieldConfigMap,
        });
      }
    }
  }
  return newTypeMap;
}
function mapDirectives(originalDirectives, schema, schemaMapper) {
  const directiveMapper = getDirectiveMapper(schemaMapper);
  if (directiveMapper == null) {
    return originalDirectives.slice();
  }
  const newDirectives = [];
  for (const directive of originalDirectives) {
    const mappedDirective = directiveMapper(directive, schema);
    if (mappedDirective === undefined) {
      newDirectives.push(directive);
    } else if (mappedDirective !== null) {
      newDirectives.push(mappedDirective);
    }
  }
  return newDirectives;
}
function getTypeSpecifiers(schema, typeName) {
  const type = schema.getType(typeName);
  const specifiers = [MapperKind.TYPE];
  if ((0,external_graphql_.isObjectType)(type)) {
    specifiers.push(MapperKind.COMPOSITE_TYPE, MapperKind.OBJECT_TYPE);
    if (typeName === schema.getQueryType()?.name) {
      specifiers.push(MapperKind.ROOT_OBJECT, MapperKind.QUERY);
    } else if (typeName === schema.getMutationType()?.name) {
      specifiers.push(MapperKind.ROOT_OBJECT, MapperKind.MUTATION);
    } else if (typeName === schema.getSubscriptionType()?.name) {
      specifiers.push(MapperKind.ROOT_OBJECT, MapperKind.SUBSCRIPTION);
    }
  } else if ((0,external_graphql_.isInputObjectType)(type)) {
    specifiers.push(MapperKind.INPUT_OBJECT_TYPE);
  } else if ((0,external_graphql_.isInterfaceType)(type)) {
    specifiers.push(MapperKind.COMPOSITE_TYPE, MapperKind.ABSTRACT_TYPE, MapperKind.INTERFACE_TYPE);
  } else if ((0,external_graphql_.isUnionType)(type)) {
    specifiers.push(MapperKind.COMPOSITE_TYPE, MapperKind.ABSTRACT_TYPE, MapperKind.UNION_TYPE);
  } else if ((0,external_graphql_.isEnumType)(type)) {
    specifiers.push(MapperKind.ENUM_TYPE);
  } else if ((0,external_graphql_.isScalarType)(type)) {
    specifiers.push(MapperKind.SCALAR_TYPE);
  }
  return specifiers;
}
function getTypeMapper(schema, schemaMapper, typeName) {
  const specifiers = getTypeSpecifiers(schema, typeName);
  let typeMapper;
  const stack = [...specifiers];
  while (!typeMapper && stack.length > 0) {
    // It is safe to use the ! operator here as we check the length.
    const next = stack.pop();
    typeMapper = schemaMapper[next];
  }
  return typeMapper != null ? typeMapper : null;
}
function getFieldSpecifiers(schema, typeName) {
  const type = schema.getType(typeName);
  const specifiers = [MapperKind.FIELD];
  if ((0,external_graphql_.isObjectType)(type)) {
    specifiers.push(MapperKind.COMPOSITE_FIELD, MapperKind.OBJECT_FIELD);
    if (typeName === schema.getQueryType()?.name) {
      specifiers.push(MapperKind.ROOT_FIELD, MapperKind.QUERY_ROOT_FIELD);
    } else if (typeName === schema.getMutationType()?.name) {
      specifiers.push(MapperKind.ROOT_FIELD, MapperKind.MUTATION_ROOT_FIELD);
    } else if (typeName === schema.getSubscriptionType()?.name) {
      specifiers.push(MapperKind.ROOT_FIELD, MapperKind.SUBSCRIPTION_ROOT_FIELD);
    }
  } else if ((0,external_graphql_.isInterfaceType)(type)) {
    specifiers.push(MapperKind.COMPOSITE_FIELD, MapperKind.INTERFACE_FIELD);
  } else if ((0,external_graphql_.isInputObjectType)(type)) {
    specifiers.push(MapperKind.INPUT_OBJECT_FIELD);
  }
  return specifiers;
}
function getFieldMapper(schema, schemaMapper, typeName) {
  const specifiers = getFieldSpecifiers(schema, typeName);
  let fieldMapper;
  const stack = [...specifiers];
  while (!fieldMapper && stack.length > 0) {
    // It is safe to use the ! operator here as we check the length.
    const next = stack.pop();
    // TODO: fix this as unknown cast
    fieldMapper = schemaMapper[next];
  }
  return fieldMapper ?? null;
}
function getArgumentMapper(schemaMapper) {
  const argumentMapper = schemaMapper[MapperKind.ARGUMENT];
  return argumentMapper != null ? argumentMapper : null;
}
function getDirectiveMapper(schemaMapper) {
  const directiveMapper = schemaMapper[MapperKind.DIRECTIVE];
  return directiveMapper != null ? directiveMapper : null;
}
function getEnumValueMapper(schemaMapper) {
  const enumValueMapper = schemaMapper[MapperKind.ENUM_VALUE];
  return enumValueMapper != null ? enumValueMapper : null;
}
function correctASTNodes(type) {
  if ((0,external_graphql_.isObjectType)(type)) {
    const config = type.toConfig();
    if (config.astNode != null) {
      const fields = [];
      for (const fieldName in config.fields) {
        const fieldConfig = config.fields[fieldName];
        if (fieldConfig.astNode != null) {
          fields.push(fieldConfig.astNode);
        }
      }
      config.astNode = {
        ...config.astNode,
        kind: external_graphql_.Kind.OBJECT_TYPE_DEFINITION,
        fields,
      };
    }
    if (config.extensionASTNodes != null) {
      config.extensionASTNodes = config.extensionASTNodes.map(node => ({
        ...node,
        kind: external_graphql_.Kind.OBJECT_TYPE_EXTENSION,
        fields: undefined,
      }));
    }
    return new external_graphql_.GraphQLObjectType(config);
  } else if ((0,external_graphql_.isInterfaceType)(type)) {
    const config = type.toConfig();
    if (config.astNode != null) {
      const fields = [];
      for (const fieldName in config.fields) {
        const fieldConfig = config.fields[fieldName];
        if (fieldConfig.astNode != null) {
          fields.push(fieldConfig.astNode);
        }
      }
      config.astNode = {
        ...config.astNode,
        kind: external_graphql_.Kind.INTERFACE_TYPE_DEFINITION,
        fields,
      };
    }
    if (config.extensionASTNodes != null) {
      config.extensionASTNodes = config.extensionASTNodes.map(node => ({
        ...node,
        kind: external_graphql_.Kind.INTERFACE_TYPE_EXTENSION,
        fields: undefined,
      }));
    }
    return new external_graphql_.GraphQLInterfaceType(config);
  } else if ((0,external_graphql_.isInputObjectType)(type)) {
    const config = type.toConfig();
    if (config.astNode != null) {
      const fields = [];
      for (const fieldName in config.fields) {
        const fieldConfig = config.fields[fieldName];
        if (fieldConfig.astNode != null) {
          fields.push(fieldConfig.astNode);
        }
      }
      config.astNode = {
        ...config.astNode,
        kind: external_graphql_.Kind.INPUT_OBJECT_TYPE_DEFINITION,
        fields,
      };
    }
    if (config.extensionASTNodes != null) {
      config.extensionASTNodes = config.extensionASTNodes.map(node => ({
        ...node,
        kind: external_graphql_.Kind.INPUT_OBJECT_TYPE_EXTENSION,
        fields: undefined,
      }));
    }
    return new external_graphql_.GraphQLInputObjectType(config);
  } else if ((0,external_graphql_.isEnumType)(type)) {
    const config = type.toConfig();
    if (config.astNode != null) {
      const values = [];
      for (const enumKey in config.values) {
        const enumValueConfig = config.values[enumKey];
        if (enumValueConfig.astNode != null) {
          values.push(enumValueConfig.astNode);
        }
      }
      config.astNode = {
        ...config.astNode,
        values,
      };
    }
    if (config.extensionASTNodes != null) {
      config.extensionASTNodes = config.extensionASTNodes.map(node => ({
        ...node,
        values: undefined,
      }));
    }
    return new external_graphql_.GraphQLEnumType(config);
  } else {
    return type;
  }
}

;// ./codegen/utils/graphql-tools/get-implementing-types.js

function getImplementingTypes(interfaceName, schema) {
  const allTypesMap = schema.getTypeMap();
  const result = [];
  for (const graphqlTypeName in allTypesMap) {
    const graphqlType = allTypesMap[graphqlTypeName];
    if ((0,external_graphql_.isObjectType)(graphqlType)) {
      const allInterfaces = graphqlType.getInterfaces();
      if (allInterfaces.find(int => int.name === interfaceName)) {
        result.push(graphqlType.name);
      }
    }
  }
  return result;
}

;// ./codegen/utils/graphql-tools/errors.js

const possibleGraphQLErrorProperties = (/* unused pure expression or super */ null && ([
  'message',
  'locations',
  'path',
  'nodes',
  'source',
  'positions',
  'originalError',
  'name',
  'stack',
  'extensions',
]));
function isGraphQLErrorLike(error) {
  return (
    error != null &&
    typeof error === 'object' &&
    Object.keys(error).every(key => possibleGraphQLErrorProperties.includes(key))
  );
}
function errors_createGraphQLError(message, options) {
  if (
    options?.originalError &&
    !(options.originalError instanceof Error) &&
    isGraphQLErrorLike(options.originalError)
  ) {
    options.originalError = errors_createGraphQLError(options.originalError.message, options.originalError);
  }
  if (versionInfo.major >= 17) {
    return new GraphQLError(message, options);
  }
  return new GraphQLError(
    message,
    options?.nodes,
    options?.source,
    options?.positions,
    options?.path,
    options?.originalError,
    options?.extensions
  );
}
function relocatedError(originalError, path) {
  return errors_createGraphQLError(originalError.message, {
    nodes: originalError.nodes,
    source: originalError.source,
    positions: originalError.positions,
    path: path == null ? originalError.path : path,
    originalError,
    extensions: originalError.extensions,
  });
}

;// ./codegen/utils/graphql-tools/memoize.js
function memoize1(fn) {
  const memoize1cache = new WeakMap();
  return function memoized(a1) {
    const cachedValue = memoize1cache.get(a1);
    if (cachedValue === undefined) {
      const newValue = fn(a1);
      memoize1cache.set(a1, newValue);
      return newValue;
    }
    return cachedValue;
  };
}
function memoize2(fn) {
  const memoize2cache = new WeakMap();
  return function memoized(a1, a2) {
    let cache2 = memoize2cache.get(a1);
    if (!cache2) {
      cache2 = new WeakMap();
      memoize2cache.set(a1, cache2);
      const newValue = fn(a1, a2);
      cache2.set(a2, newValue);
      return newValue;
    }
    const cachedValue = cache2.get(a2);
    if (cachedValue === undefined) {
      const newValue = fn(a1, a2);
      cache2.set(a2, newValue);
      return newValue;
    }
    return cachedValue;
  };
}
function memoize3(fn) {
  const memoize3Cache = new WeakMap();
  return function memoized(a1, a2, a3) {
    let cache2 = memoize3Cache.get(a1);
    if (!cache2) {
      cache2 = new WeakMap();
      memoize3Cache.set(a1, cache2);
      const cache3 = new WeakMap();
      cache2.set(a2, cache3);
      const newValue = fn(a1, a2, a3);
      cache3.set(a3, newValue);
      return newValue;
    }
    let cache3 = cache2.get(a2);
    if (!cache3) {
      cache3 = new WeakMap();
      cache2.set(a2, cache3);
      const newValue = fn(a1, a2, a3);
      cache3.set(a3, newValue);
      return newValue;
    }
    const cachedValue = cache3.get(a3);
    if (cachedValue === undefined) {
      const newValue = fn(a1, a2, a3);
      cache3.set(a3, newValue);
      return newValue;
    }
    return cachedValue;
  };
}
function memoize4(fn) {
  const memoize4Cache = new WeakMap();
  return function memoized(a1, a2, a3, a4) {
    let cache2 = memoize4Cache.get(a1);
    if (!cache2) {
      cache2 = new WeakMap();
      memoize4Cache.set(a1, cache2);
      const cache3 = new WeakMap();
      cache2.set(a2, cache3);
      const cache4 = new WeakMap();
      cache3.set(a3, cache4);
      const newValue = fn(a1, a2, a3, a4);
      cache4.set(a4, newValue);
      return newValue;
    }
    let cache3 = cache2.get(a2);
    if (!cache3) {
      cache3 = new WeakMap();
      cache2.set(a2, cache3);
      const cache4 = new WeakMap();
      cache3.set(a3, cache4);
      const newValue = fn(a1, a2, a3, a4);
      cache4.set(a4, newValue);
      return newValue;
    }
    const cache4 = cache3.get(a3);
    if (!cache4) {
      const cache4 = new WeakMap();
      cache3.set(a3, cache4);
      const newValue = fn(a1, a2, a3, a4);
      cache4.set(a4, newValue);
      return newValue;
    }
    const cachedValue = cache4.get(a4);
    if (cachedValue === undefined) {
      const newValue = fn(a1, a2, a3, a4);
      cache4.set(a4, newValue);
      return newValue;
    }
    return cachedValue;
  };
}
function memoize5(fn) {
  const memoize5Cache = new WeakMap();
  return function memoized(a1, a2, a3, a4, a5) {
    let cache2 = memoize5Cache.get(a1);
    if (!cache2) {
      cache2 = new WeakMap();
      memoize5Cache.set(a1, cache2);
      const cache3 = new WeakMap();
      cache2.set(a2, cache3);
      const cache4 = new WeakMap();
      cache3.set(a3, cache4);
      const cache5 = new WeakMap();
      cache4.set(a4, cache5);
      const newValue = fn(a1, a2, a3, a4, a5);
      cache5.set(a5, newValue);
      return newValue;
    }
    let cache3 = cache2.get(a2);
    if (!cache3) {
      cache3 = new WeakMap();
      cache2.set(a2, cache3);
      const cache4 = new WeakMap();
      cache3.set(a3, cache4);
      const cache5 = new WeakMap();
      cache4.set(a4, cache5);
      const newValue = fn(a1, a2, a3, a4, a5);
      cache5.set(a5, newValue);
      return newValue;
    }
    let cache4 = cache3.get(a3);
    if (!cache4) {
      cache4 = new WeakMap();
      cache3.set(a3, cache4);
      const cache5 = new WeakMap();
      cache4.set(a4, cache5);
      const newValue = fn(a1, a2, a3, a4, a5);
      cache5.set(a5, newValue);
      return newValue;
    }
    let cache5 = cache4.get(a4);
    if (!cache5) {
      cache5 = new WeakMap();
      cache4.set(a4, cache5);
      const newValue = fn(a1, a2, a3, a4, a5);
      cache5.set(a5, newValue);
      return newValue;
    }
    const cachedValue = cache5.get(a5);
    if (cachedValue === undefined) {
      const newValue = fn(a1, a2, a3, a4, a5);
      cache5.set(a5, newValue);
      return newValue;
    }
    return cachedValue;
  };
}
function memoize2of4(fn) {
  const memoize2of4cache = new WeakMap();
  return function memoized(a1, a2, a3, a4) {
    let cache2 = memoize2of4cache.get(a1);
    if (!cache2) {
      cache2 = new WeakMap();
      memoize2of4cache.set(a1, cache2);
      const newValue = fn(a1, a2, a3, a4);
      cache2.set(a2, newValue);
      return newValue;
    }
    const cachedValue = cache2.get(a2);
    if (cachedValue === undefined) {
      const newValue = fn(a1, a2, a3, a4);
      cache2.set(a2, newValue);
      return newValue;
    }
    return cachedValue;
  };
}
function memoize2of5(fn) {
  const memoize2of4cache = new WeakMap();
  return function memoized(a1, a2, a3, a4, a5) {
    let cache2 = memoize2of4cache.get(a1);
    if (!cache2) {
      cache2 = new WeakMap();
      memoize2of4cache.set(a1, cache2);
      const newValue = fn(a1, a2, a3, a4, a5);
      cache2.set(a2, newValue);
      return newValue;
    }
    const cachedValue = cache2.get(a2);
    if (cachedValue === undefined) {
      const newValue = fn(a1, a2, a3, a4, a5);
      cache2.set(a2, newValue);
      return newValue;
    }
    return cachedValue;
  };
}

;// ./codegen/utils/graphql-tools/rootTypes.js


function getDefinedRootType(schema, operation, nodes) {
  const rootTypeMap = getRootTypeMap(schema);
  const rootType = rootTypeMap.get(operation);
  if (rootType == null) {
    throw createGraphQLError(`Schema is not configured to execute ${operation} operation.`, {
      nodes,
    });
  }
  return rootType;
}
const getRootTypeNames = memoize1(function getRootTypeNames(schema) {
  const rootTypes = getRootTypes(schema);
  return new Set([...rootTypes].map(type => type.name));
});
const getRootTypes = memoize1(function getRootTypes(schema) {
  const rootTypeMap = getRootTypeMap(schema);
  return new Set(rootTypeMap.values());
});
const getRootTypeMap = memoize1(function getRootTypeMap(schema) {
  const rootTypeMap = new Map();
  const queryType = schema.getQueryType();
  if (queryType) {
    rootTypeMap.set('query', queryType);
  }
  const mutationType = schema.getMutationType();
  if (mutationType) {
    rootTypeMap.set('mutation', mutationType);
  }
  const subscriptionType = schema.getSubscriptionType();
  if (subscriptionType) {
    rootTypeMap.set('subscription', subscriptionType);
  }
  return rootTypeMap;
});

;// ./codegen/utils/constants.js
// used to remove all types that are not related to requested game, but implement Ngf interface
const CommonNgfInterfacesPrefix = 'Ngf';

;// ./codegen/utils/graphql-tools/prune.js







/**
 * Prunes the provided schema, removing unused and empty types
 * @param schema The schema to prune
 * @param options Additional options for removing unused types from the schema
 */
function pruneSchema(schema, options = {}) {
  const {
    skipEmptyCompositeTypePruning,
    skipEmptyUnionPruning,
    skipPruning,
    skipUnimplementedInterfacesPruning,
    skipUnusedTypesPruning,
  } = options;
  let prunedTypes = []; // Pruned types during mapping
  let prunedSchema = schema;
  do {
    let visited = visitSchema(prunedSchema);
    // Custom pruning  was defined, so we need to pre-emptively revisit the schema accounting for this
    if (skipPruning) {
      const revisit = [];
      for (const typeName in prunedSchema.getTypeMap()) {
        if (typeName.startsWith('__')) {
          continue;
        }
        const type = prunedSchema.getType(typeName);
        // if we want to skip pruning for this type, add it to the list of types to revisit
        if (type && skipPruning(type)) {
          revisit.push(typeName);
        }
      }
      visited = visitQueue(revisit, prunedSchema, visited); // visit again
    }
    prunedTypes = [];
    prunedSchema = mapSchema(prunedSchema, {
      [MapperKind.TYPE]: type => {
        if (!visited.has(type.name) && !(0,external_graphql_.isSpecifiedScalarType)(type)) {
          if (
            (0,external_graphql_.isUnionType)(type) ||
            (0,external_graphql_.isInputObjectType)(type) ||
            (0,external_graphql_.isInterfaceType)(type) ||
            (0,external_graphql_.isObjectType)(type) ||
            (0,external_graphql_.isScalarType)(type)
          ) {
            // skipUnusedTypesPruning: skip pruning unused types
            if (skipUnusedTypesPruning) {
              return type;
            }
            // skipEmptyUnionPruning: skip pruning empty unions
            if ((0,external_graphql_.isUnionType)(type) && skipEmptyUnionPruning && !Object.keys(type.getTypes()).length) {
              return type;
            }
            if ((0,external_graphql_.isInputObjectType)(type) || (0,external_graphql_.isInterfaceType)(type) || (0,external_graphql_.isObjectType)(type)) {
              // skipEmptyCompositeTypePruning: skip pruning object types or interfaces with no fields
              if (skipEmptyCompositeTypePruning && !Object.keys(type.getFields()).length) {
                return type;
              }
            }
            // skipUnimplementedInterfacesPruning: skip pruning interfaces that are not implemented by any other types
            if ((0,external_graphql_.isInterfaceType)(type) && skipUnimplementedInterfacesPruning) {
              return type;
            }
          }
          prunedTypes.push(type.name);
          visited.delete(type.name);
          return null;
        }
        return type;
      },
    });
  } while (prunedTypes.length); // Might have empty types and need to prune again
  return prunedSchema;
}
function visitSchema(schema) {
  const queue = []; // queue of nodes to visit
  // Grab the root types and start there
  for (const type of getRootTypes(schema)) {
    queue.push(type.name);
  }
  return visitQueue(queue, schema);
}
function visitQueue(queue, schema, visited = new Set()) {
  // Interfaces encountered that are field return types need to be revisited to add their implementations
  const revisit = new Map();
  // Navigate all types starting with pre-queued types (root types)
  while (queue.length) {
    const typeName = queue.pop();
    // Skip types we already visited unless it is an interface type that needs revisiting
    if (visited.has(typeName) && revisit[typeName] !== true) {
      continue;
    }
    const type = schema.getType(typeName);
    if (type) {
      // Get types for union
      if ((0,external_graphql_.isUnionType)(type)) {
        queue.push(...type.getTypes().map(type => type.name));
      }
      // If it is an interface and it is a returned type, grab all implementations so we can use proper __typename in fragments
      if ((0,external_graphql_.isInterfaceType)(type) && revisit[typeName] === true) {
        if (!type.name.startsWith(CommonNgfInterfacesPrefix)) {
          queue.push(...getImplementingTypes(type.name, schema));
        }
        // No need to revisit this interface again
        revisit[typeName] = false;
      }
      if ((0,external_graphql_.isEnumType)(type)) {
        // Visit enum values directives argument types
        queue.push(...type.getValues().flatMap(value => getDirectivesArgumentsTypeNames(schema, value)));
      }
      // Visit interfaces this type is implementing if they haven't been visited yet
      if ('getInterfaces' in type) {
        // Only pushes to queue to visit but not return types
        queue.push(...type.getInterfaces().map(iface => iface.name));
      }
      // If the type has fields visit those field types
      if ('getFields' in type) {
        const fields = type.getFields();
        const entries = Object.entries(fields);
        if (!entries.length) {
          continue;
        }
        for (const [, field] of entries) {
          if ((0,external_graphql_.isObjectType)(type)) {
            // Visit arg types and arg directives arguments types
            queue.push(
              ...field.args.flatMap(arg => {
                const typeNames = [(0,external_graphql_.getNamedType)(arg.type).name];
                typeNames.push(...getDirectivesArgumentsTypeNames(schema, arg));
                return typeNames;
              })
            );
          }
          const namedType = (0,external_graphql_.getNamedType)(field.type);
          queue.push(namedType.name);
          queue.push(...getDirectivesArgumentsTypeNames(schema, field));
          // Interfaces returned on fields need to be revisited to add their implementations
          if ((0,external_graphql_.isInterfaceType)(namedType) && !(namedType.name in revisit)) {
            revisit[namedType.name] = true;
          }
        }
      }
      queue.push(...getDirectivesArgumentsTypeNames(schema, type));
      visited.add(typeName); // Mark as visited (and therefore it is used and should be kept)
    }
  }
  return visited;
}
function getDirectivesArgumentsTypeNames(schema, directableObj) {
  const argTypeNames = new Set();
  if (directableObj.astNode?.directives) {
    for (const directiveNode of directableObj.astNode.directives) {
      const directive = schema.getDirective(directiveNode.name.value);
      if (directive?.args) {
        for (const arg of directive.args) {
          const argType = (0,external_graphql_.getNamedType)(arg.type);
          argTypeNames.add(argType.name);
        }
      }
    }
  }
  if (directableObj.extensions?.['directives']) {
    for (const directiveName in directableObj.extensions['directives']) {
      const directive = schema.getDirective(directiveName);
      if (directive?.args) {
        for (const arg of directive.args) {
          const argType = (0,external_graphql_.getNamedType)(arg.type);
          argTypeNames.add(argType.name);
        }
      }
    }
  }
  return [...argTypeNames];
}

;// ./codegen/utils/clean-schema-by-game.js





const getCleanedSchemaByGame = ({ includedScopes, staticDataFieldName, scopesData, options = {} }) => {
  const { queryNamespaces, mutationNamespaces, subscriptionNamespaces, targetGameQueryFields, targetGameQueryTypeName } = scopesData;
  const queriesToRemove = queryNamespaces.filter(queryName => !includedScopes.includes(queryName));

  const cleanUpSchema = (schemaString) => {
    const fullFederatedSchema = (0,external_graphql_.buildSchema)((0,external_node_fs_namespaceObject.readFileSync)(schemaString, 'utf8'));

    const microfiber = new external_microfiber_namespaceObject.Microfiber((0,external_graphql_.introspectionFromSchema)(fullFederatedSchema));

    // remove top level nodes from other scopes - queries, mutations, subscriptions
    queriesToRemove.forEach(name => {
      microfiber.removeQuery({
        name,
        cleanup: false,
      });
    });
    mutationNamespaces.forEach(name => {
      microfiber.removeMutation({
        name,
        cleanup: false,
      });
    });
    subscriptionNamespaces.forEach(name => {
      microfiber.removeSubscription({
        name,
        cleanup: false,
      });
    });

    if (targetGameQueryTypeName && targetGameQueryFields.length > 0) {
      const fieldsToRemoveFromQuery = targetGameQueryFields.filter(field => field !== staticDataFieldName);

      fieldsToRemoveFromQuery.forEach(name => {
        microfiber.removeField({
          typeKind: 'OBJECT',
          typeName: targetGameQueryTypeName,
          fieldName: name,
          cleanup: false,
        });
      });
    }

    microfiber.cleanSchema();

    const cleanedSchema = (0,external_graphql_.buildClientSchema)(microfiber.getResponse());

    const entitiesEnumTypeName = targetGameQueryTypeName && targetGameQueryTypeName.endsWith('Query') ? `${targetGameQueryTypeName.slice(0, -5)}EntitiesEnum` : null;

    // Ensure the entitiesEnumTypeName type survives Microfiber cleanup so skipPruning can see it
    let schemaToPrune = cleanedSchema;
    if (entitiesEnumTypeName && !schemaToPrune.getType(entitiesEnumTypeName)) {
      const enumFromSource = fullFederatedSchema.getType(entitiesEnumTypeName);
      if (enumFromSource && (0,external_graphql_.isEnumType)(enumFromSource) && enumFromSource.astNode) {
        schemaToPrune = (0,external_graphql_.extendSchema)(schemaToPrune, {
          kind: 'Document',
          definitions: [enumFromSource.astNode],
        });
      }
    }
    // remove rest orphan types
    const pruneOptions = {
      ...options,
      skipPruning: (type) => {
        if (entitiesEnumTypeName && (0,external_graphql_.isEnumType)(type)) {
          return type.name === entitiesEnumTypeName;
        }
        return false;
      },
    };

    return pruneSchema(schemaToPrune, pruneOptions);
  };

  return cleanUpSchema;
};


/***/ }),

/***/ 404:
/***/ ((module) => {

module.exports = require("@graphql-codegen/cli");

/***/ }),

/***/ 419:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.generateQuery = generateQuery;
const run_cursor_generation_1 = __webpack_require__(550);
const path_1 = __importDefault(__webpack_require__(928));
const promises_1 = __webpack_require__(943);
const entrypointFileTemplate = `
import staticDataQuery from './static-data-query.gql.ts';
import staticDataMetaQuery from './static-data-meta-query.gql.ts';

export default {
  staticDataQuery,
  staticDataMetaQuery,
}
`;
const outputDir = 'build/gql';
async function generateQuery(options) {
    const { timeoutMs, model } = options;
    const promptFilePath = path_1.default.resolve(__dirname, 'generate-query.md');
    await (0, run_cursor_generation_1.runCursorGeneration)({
        timeoutMs,
        prompt: `"Implement instructions in the file ${promptFilePath}"`,
        model,
    });
    await (0, promises_1.writeFile)(path_1.default.join(outputDir, 'entrypoint.ts'), entrypointFileTemplate);
}


/***/ }),

/***/ 420:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.uploadBuild = void 0;
var upload_build_1 = __webpack_require__(903);
Object.defineProperty(exports, "uploadBuild", ({ enumerable: true, get: function () { return upload_build_1.uploadBuild; } }));


/***/ }),

/***/ 445:
/***/ ((module) => {

module.exports = require("gaxios");

/***/ }),

/***/ 463:
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.DynamicModuleSlug = void 0;
var DynamicModuleSlug;
(function (DynamicModuleSlug) {
    DynamicModuleSlug["STATIC_DATA_MAPPING"] = "static-data-mapping";
    DynamicModuleSlug["STATIC_DATA_QUERY"] = "static-data-query";
    DynamicModuleSlug["STATIC_DATA_QUERY_V2"] = "static-data-query-v2";
})(DynamicModuleSlug || (exports.DynamicModuleSlug = DynamicModuleSlug = {}));


/***/ }),

/***/ 484:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.generateWorkerOutputTypes = void 0;
var generate_worker_output_types_1 = __webpack_require__(584);
Object.defineProperty(exports, "generateWorkerOutputTypes", ({ enumerable: true, get: function () { return generate_worker_output_types_1.generateWorkerOutputTypes; } }));


/***/ }),

/***/ 485:
/***/ ((module) => {

module.exports = require("rimraf");

/***/ }),

/***/ 517:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.generateQuery = void 0;
var generate_query_1 = __webpack_require__(419);
Object.defineProperty(exports, "generateQuery", ({ enumerable: true, get: function () { return generate_query_1.generateQuery; } }));


/***/ }),

/***/ 523:
/***/ ((module) => {

module.exports = require("webpack-node-externals");

/***/ }),

/***/ 550:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


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
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.runCursorGeneration = runCursorGeneration;
const core = __importStar(__webpack_require__(659));
const exec_utils_1 = __webpack_require__(99);
async function runCursorGeneration(input) {
    try {
        const { timeoutMs, model = 'sonnet-4.5', prompt } = input;
        core.info(`Cursor-agent generation starts with prompt: ${prompt}`);
        try {
            await (0, exec_utils_1.spawnWithTimeout)({ command: 'which cursor-agent', args: [], timeoutMs });
            core.info('cursor-agent is installed');
        }
        catch {
            core.info('Installing cursor-cli...');
            await (0, exec_utils_1.spawnWithTimeout)({ command: 'curl -fsSL https://cursor.com/install | bash', args: [], timeoutMs });
            core.addPath(`${process.env.HOME}/.cursor/bin`);
            core.info('Installation completed');
        }
        // Get CURSOR_API_KEY from environment (GitHub Actions secrets)
        const cursorApiKey = process.env.CURSOR_API_KEY;
        if (!cursorApiKey) {
            throw new Error('CURSOR_API_KEY environment variable is not set');
        }
        const command = 'cursor-agent';
        const args = ['-p', '--force', `--model=${model}`, '--output-format', 'text', prompt];
        core.info(`Executing cursor-agent with timeout: ${timeoutMs}ms`);
        // Execute command with timeout
        try {
            await (0, exec_utils_1.spawnWithTimeout)({
                command,
                args,
                timeoutMs,
                env: {
                    ...process.env,
                    CURSOR_API_KEY: cursorApiKey,
                },
            });
            core.info(`✓ Generation completed successfully`);
            return;
        }
        catch (error) {
            const errorMessage = `Failed to execute cursor-agent: ${error instanceof Error ? error.message : String(error)}`;
            if (error instanceof Error && error.message === exec_utils_1.TimeoutError) {
                core.setFailed(`cursor-agent execution timed out after ${timeoutMs}ms`);
            }
            else {
                core.setFailed(errorMessage);
            }
            throw new Error(errorMessage);
        }
    }
    catch (error) {
        const errorMessage = `Failed to execute cursor-agent: ${error instanceof Error ? error.message : String(error)}`;
        core.setFailed(errorMessage);
        throw new Error(errorMessage);
    }
}


/***/ }),

/***/ 559:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.generateScopes = void 0;
var generate_scopes_1 = __webpack_require__(76);
Object.defineProperty(exports, "generateScopes", ({ enumerable: true, get: function () { return generate_scopes_1.generateScopes; } }));


/***/ }),

/***/ 561:
/***/ ((module) => {

module.exports = require("babel-plugin-graphql-tag");

/***/ }),

/***/ 584:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.generateWorkerOutputTypes = generateWorkerOutputTypes;
const run_cursor_generation_1 = __webpack_require__(550);
const path_1 = __importDefault(__webpack_require__(928));
async function generateWorkerOutputTypes(options) {
    const { timeoutMs, model } = options;
    const promptFilePath = path_1.default.resolve(__dirname, 'generate-worker-output-types.md');
    return await (0, run_cursor_generation_1.runCursorGeneration)({
        timeoutMs,
        prompt: `"Implement instructions in the file ${promptFilePath}"`,
        model,
    });
}


/***/ }),

/***/ 659:
/***/ ((module) => {

module.exports = require("@actions/core");

/***/ }),

/***/ 756:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.compileCode = compileCode;
const path_1 = __importDefault(__webpack_require__(928));
const fs_1 = __importDefault(__webpack_require__(896));
const core = __importStar(__webpack_require__(659));
const webpack_1 = __importDefault(__webpack_require__(807));
const graphqlTagPlugin = __webpack_require__(561);
const nodeExternals = __webpack_require__(523);
async function compileCode(queryDir, outputDir, entryFileName, outputFileName) {
    const absoluteQueryDir = path_1.default.resolve(process.cwd(), queryDir);
    const absoluteOutputDir = path_1.default.resolve(process.cwd(), outputDir);
    const entryFile = path_1.default.join(absoluteQueryDir, entryFileName);
    if (!fs_1.default.existsSync(absoluteQueryDir)) {
        throw new Error(`Query directory does not exist: ${absoluteQueryDir}`);
    }
    if (!fs_1.default.existsSync(entryFile)) {
        const errorMessage = `Entry file does not exist: ${entryFile}`;
        core.setFailed(errorMessage);
        throw new Error(errorMessage);
    }
    core.info(`Bundling query file: ${path_1.default.relative(process.cwd(), entryFile)}`);
    // Create output directory if it doesn't exist
    if (!fs_1.default.existsSync(absoluteOutputDir)) {
        fs_1.default.mkdirSync(absoluteOutputDir, { recursive: true });
        core.info(`Created output directory: ${absoluteOutputDir}`);
    }
    // Webpack configuration
    const webpackConfig = {
        mode: 'production',
        entry: entryFile,
        target: 'node',
        output: {
            path: absoluteOutputDir,
            filename: outputFileName,
            chunkFormat: 'module',
            library: {
                type: 'module',
                export: 'default',
            },
        },
        experiments: {
            outputModule: true,
        },
        resolve: {
            extensions: ['.ts', '.js', '.gql.ts'],
            modules: ['node_modules', path_1.default.resolve(process.cwd(), 'build/gql')],
        },
        module: {
            rules: [
                {
                    test: /\.gql\.ts$/,
                    use: [
                        {
                            loader: 'babel-loader',
                            options: {
                                presets: [
                                    [
                                        '@babel/preset-env',
                                        {
                                            modules: false,
                                            targets: {
                                                node: 'current',
                                            },
                                        },
                                    ],
                                    [
                                        '@babel/preset-typescript',
                                        {
                                            isTSX: false,
                                            allExtensions: false,
                                        },
                                    ],
                                ],
                                plugins: [[graphqlTagPlugin]],
                            },
                        },
                    ],
                    exclude: /node_modules/,
                },
                {
                    test: /\.ts$/,
                    use: [
                        {
                            loader: 'babel-loader',
                            options: {
                                presets: [
                                    [
                                        '@babel/preset-env',
                                        {
                                            modules: false,
                                            targets: {
                                                node: 'current',
                                            },
                                        },
                                    ],
                                    [
                                        '@babel/preset-typescript',
                                        {
                                            isTSX: false,
                                            allExtensions: false,
                                        },
                                    ],
                                ],
                            },
                        },
                    ],
                    exclude: /node_modules/,
                },
            ],
        },
        optimization: {
            minimize: true,
        },
        externals: [
            nodeExternals({
                allowlist: [],
            }),
        ],
    };
    // Run webpack
    return new Promise((resolve, reject) => {
        (0, webpack_1.default)(webpackConfig, (err, stats) => {
            if (err) {
                const errorMessage = `Webpack compilation failed: ${err.message}`;
                core.setFailed(errorMessage);
                reject(new Error(errorMessage));
                return;
            }
            if (!stats) {
                const errorMessage = 'Webpack compilation returned no stats';
                core.setFailed(errorMessage);
                reject(new Error(errorMessage));
                return;
            }
            if (stats.hasErrors()) {
                const errors = stats.compilation.errors.map(e => e.message).join('\n');
                const errorMessage = `Webpack compilation errors:\n${errors}`;
                core.setFailed(errorMessage);
                reject(new Error(errorMessage));
                return;
            }
            if (stats.hasWarnings()) {
                const warnings = stats.compilation.warnings.map(w => w.message).join('\n');
                core.warning(`Webpack compilation warnings:\n${warnings}`);
            }
            const outputPath = path_1.default.join(absoluteOutputDir, outputFileName);
            core.info(`✓ Successfully bundled query to: ${path_1.default.relative(process.cwd(), outputPath)}`);
            resolve();
        });
    });
}


/***/ }),

/***/ 798:
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.generateModulePath = generateModulePath;
exports.generateModuleFolderName = generateModuleFolderName;
function generateModulePath(env, game, moduleSlug) {
    return `dynamic-modules/${env}/${game}/${moduleSlug}`;
}
function generateModuleFolderName(version) {
    return `v${version}`;
}


/***/ }),

/***/ 807:
/***/ ((module) => {

module.exports = require("webpack");

/***/ }),

/***/ 869:
/***/ ((module) => {

module.exports = require("@google-cloud/storage");

/***/ }),

/***/ 896:
/***/ ((module) => {

module.exports = require("fs");

/***/ }),

/***/ 898:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.computeMd5Hash = computeMd5Hash;
const fs_1 = __importDefault(__webpack_require__(896));
const crypto_1 = __importDefault(__webpack_require__(982));
function computeMd5Hash(filePath) {
    const fileBuffer = fs_1.default.readFileSync(filePath);
    return crypto_1.default.createHash('md5').update(fileBuffer).digest('hex');
}


/***/ }),

/***/ 903:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


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
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.uploadBuild = uploadBuild;
const fs = __importStar(__webpack_require__(896));
const path = __importStar(__webpack_require__(928));
const core = __importStar(__webpack_require__(659));
const bucket_utils_1 = __webpack_require__(328);
const module_folder_utils_1 = __webpack_require__(994);
const dynamic_modules_types_1 = __webpack_require__(463);
const dynamic_module_utils_1 = __webpack_require__(798);
const fs_utils_1 = __webpack_require__(37);
const hash_utils_1 = __webpack_require__(898);
const buildPath = './build';
function getFilesInDirectory(dirPath, extension) {
    if (!fs.existsSync(dirPath) || !fs.statSync(dirPath).isDirectory()) {
        return [];
    }
    const files = [];
    const entries = fs.readdirSync(dirPath);
    for (const entry of entries) {
        const filePath = path.join(dirPath, entry);
        if (fs.statSync(filePath).isFile() && entry.endsWith(extension)) {
            files.push(filePath);
        }
    }
    return files;
}
function makeModuleEntrypointName(hash) {
    return `entrypoint.${hash}.js`;
}
async function uploadBuild(options) {
    try {
        const { bucket, env, gameUrlSlug, schemaVersion, disableQueryAst } = options;
        const bucketName = bucket.name;
        const staticDataQueryModuleSlug = disableQueryAst
            ? dynamic_modules_types_1.DynamicModuleSlug.STATIC_DATA_QUERY_V2
            : dynamic_modules_types_1.DynamicModuleSlug.STATIC_DATA_QUERY;
        core.info(`Starting upload of build files to GCS bucket: ${bucketName}`);
        // Step 1: Verify bucket exists
        try {
            const [exists] = await bucket.exists();
            if (!exists) {
                const errorMessage = `Bucket ${bucketName} does not exist`;
                core.setFailed(errorMessage);
                throw new Error(errorMessage);
            }
            core.info(`✓ Bucket ${bucketName} verified`);
        }
        catch (error) {
            const errorMessage = `Failed to verify bucket: ${error instanceof Error ? error.message : String(error)}`;
            core.setFailed(errorMessage);
            throw error instanceof Error ? error : new Error(errorMessage);
        }
        // Step 2: Build GCS paths
        const fullVersionPath = (0, module_folder_utils_1.buildStaticDataQueryModuleFolderPath)(env, gameUrlSlug, schemaVersion, staticDataQueryModuleSlug);
        core.info(`Target path: gs://${bucketName}/${fullVersionPath}`);
        // Step 3: Check if version folder already exists
        const moduleFolderExists = await (0, module_folder_utils_1.checkStaticDataQueryModuleFolderExists)(bucket, env, gameUrlSlug, schemaVersion, staticDataQueryModuleSlug);
        if (moduleFolderExists) {
            const errorMessage = `Folder ${fullVersionPath} already exists in bucket ${bucketName}. Cannot overwrite existing version.`;
            core.setFailed(errorMessage);
            throw new Error(errorMessage);
        }
        const moduleFolder = (0, dynamic_module_utils_1.generateModuleFolderName)(schemaVersion);
        core.info(`✓ Version folder does not exist, proceeding with upload`);
        // Step 4: Resolve build directory paths]
        const distPath = path.resolve(process.cwd(), buildPath, 'dist');
        const buildGqlPath = path.resolve(process.cwd(), buildPath, 'gql');
        const buildTypesPath = path.resolve(process.cwd(), buildPath, 'gql', 'gql-types');
        // Step 5: Upload files according to new structure
        let uploadedCount = 0;
        let entrypointName = '';
        // 6.1: Upload entrypoint query to root
        const entrypointFile = path.join(distPath, `entrypoint.js`);
        if (fs.existsSync(entrypointFile)) {
            const compiledEntrypointHash = (0, hash_utils_1.computeMd5Hash)(entrypointFile);
            entrypointName = makeModuleEntrypointName(compiledEntrypointHash);
            const destination = `${fullVersionPath}/${entrypointName}`;
            const success = await (0, bucket_utils_1.uploadFileToBucket)(bucket, entrypointFile, destination, bucketName, 'entrypoint');
            if (success) {
                uploadedCount++;
            }
            else {
                const errorMessage = `Entrypoint file hasn't been uploaded`;
                core.setFailed(errorMessage);
                throw new Error(errorMessage);
            }
        }
        else {
            const errorMessage = `Entrypoint file not found: ${entrypointFile}`;
            core.setFailed(errorMessage);
            throw new Error(errorMessage);
        }
        // 6.2: Upload fragments to fragments/ folder
        const fragmentFiles = getFilesInDirectory(buildGqlPath, '-fragment.gql.ts');
        if (fragmentFiles.length > 0) {
            for (const fragmentFile of fragmentFiles) {
                const fileName = path.basename(fragmentFile);
                const destination = `${fullVersionPath}/fragments/${fileName}`;
                const success = await (0, bucket_utils_1.uploadFileToBucket)(bucket, fragmentFile, destination, bucketName, `fragment: ${fileName}`);
                if (success) {
                    uploadedCount++;
                }
                else {
                    const errorMessage = `Fragment file ${fileName} hasn't been uploaded`;
                    core.setFailed(errorMessage);
                    throw new Error(errorMessage);
                }
            }
        }
        else {
            core.warning(`No fragment files found in ${buildGqlPath}`);
        }
        // 6.3: Upload ts static data query file to query/ folder
        const queryFile = path.join(buildGqlPath, `static-data-query.gql.ts`);
        if (fs.existsSync(queryFile)) {
            const destination = `${fullVersionPath}/query/static-data-query.gql.ts`;
            const success = await (0, bucket_utils_1.uploadFileToBucket)(bucket, queryFile, destination, bucketName, 'query file');
            if (success) {
                uploadedCount++;
            }
            else {
                const errorMessage = `Query file hasn't been uploaded`;
                core.setFailed(errorMessage);
                throw new Error(errorMessage);
            }
        }
        else {
            core.warning(`Query file not found: ${queryFile}`);
        }
        // 6.4: Upload ts static data meta query file to query/ folder
        const metaQueryFile = path.join(buildGqlPath, `static-data-meta-query.gql.ts`);
        if (fs.existsSync(queryFile)) {
            const destination = `${fullVersionPath}/query/static-data-meta-query.gql.ts`;
            const success = await (0, bucket_utils_1.uploadFileToBucket)(bucket, metaQueryFile, destination, bucketName, 'query file');
            if (success) {
                uploadedCount++;
            }
            else {
                const errorMessage = `Meta Query file hasn't been uploaded`;
                core.setFailed(errorMessage);
                throw new Error(errorMessage);
            }
        }
        else {
            core.warning(`Meta Query file not found: ${metaQueryFile}`);
        }
        // 6.4: Upload all files from gql-types folders to types/ folder
        const typeSourcePaths = [{ path: buildTypesPath, name: 'gql-types' }];
        let hasTypeFiles = false;
        for (const sourcePath of typeSourcePaths) {
            const typeFiles = (0, fs_utils_1.getAllFilesRecursive)(sourcePath.path);
            if (typeFiles.length > 0) {
                hasTypeFiles = true;
                for (const typeFile of typeFiles) {
                    const relativePath = path.relative(sourcePath.path, typeFile);
                    const gcsPath = relativePath.split(path.sep).join('/');
                    const destination = `${fullVersionPath}/types/${gcsPath}`;
                    const description = `type file from ${sourcePath.name}: ${relativePath}`;
                    const success = await (0, bucket_utils_1.uploadFileToBucket)(bucket, typeFile, destination, bucketName, description);
                    if (success) {
                        uploadedCount++;
                    }
                    else {
                        const errorMessage = `Type file ${relativePath} hasn't been uploaded`;
                        core.setFailed(errorMessage);
                        throw new Error(errorMessage);
                    }
                }
            }
        }
        if (!hasTypeFiles) {
            core.warning(`No type files found in any of the gql-types directories`);
        }
        // 6.5: Upload cleaned schema to cleaned-schema/ folder
        const cleanedSchemaFile = path.resolve(process.cwd(), '_generated/cleaned-schema.graphql');
        if (fs.existsSync(cleanedSchemaFile)) {
            const destination = `${fullVersionPath}/cleaned-schema/cleaned-schema.graphql`;
            const success = await (0, bucket_utils_1.uploadFileToBucket)(bucket, cleanedSchemaFile, destination, bucketName, 'cleaned schema');
            if (success) {
                uploadedCount++;
            }
            else {
                const errorMessage = `Cleaned schema file hasn't been uploaded`;
                core.setFailed(errorMessage);
                throw new Error(errorMessage);
            }
        }
        else {
            core.warning(`Cleaned schema file not found: ${cleanedSchemaFile}`);
        }
        // Step 6: Report results
        core.info(`✓ Upload completed: ${uploadedCount} files uploaded`);
        core.info(`✓ All files successfully uploaded to gs://${bucketName}/${fullVersionPath}/`);
        // Step 7: Upload config.json
        try {
            const config = {
                moduleFolder: `${moduleFolder}/`,
                name: `${moduleFolder}/${entrypointName}`,
                version: schemaVersion,
            };
            const basePath = (0, dynamic_module_utils_1.generateModulePath)(env, gameUrlSlug, staticDataQueryModuleSlug);
            const configDestination = `${basePath}/config.json`;
            const configFile = bucket.file(configDestination);
            const configJson = JSON.stringify(config, null, 2);
            core.info(`Uploading config.json to gs://${bucketName}/${configDestination}`);
            await configFile.save(configJson);
            core.info(`✓ Config.json successfully uploaded`);
        }
        catch (error) {
            const errorMessage = `Failed to upload config.json: ${error instanceof Error ? error.message : String(error)}`;
            core.setFailed(errorMessage);
            throw error instanceof Error ? error : new Error(errorMessage);
        }
    }
    catch (error) {
        const errorMessage = `Unexpected error in uploadBuild: ${error instanceof Error ? error.message : String(error)}`;
        core.setFailed(errorMessage);
        throw error instanceof Error ? error : new Error(errorMessage);
    }
}


/***/ }),

/***/ 911:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.checkSchemaVersion = void 0;
var check_schema_version_1 = __webpack_require__(58);
Object.defineProperty(exports, "checkSchemaVersion", ({ enumerable: true, get: function () { return check_schema_version_1.checkSchemaVersion; } }));


/***/ }),

/***/ 922:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.cleanSchema = void 0;
var clean_schema_1 = __webpack_require__(323);
Object.defineProperty(exports, "cleanSchema", ({ enumerable: true, get: function () { return clean_schema_1.cleanSchema; } }));


/***/ }),

/***/ 928:
/***/ ((module) => {

module.exports = require("path");

/***/ }),

/***/ 931:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.createStorage = createStorage;
const storage_1 = __webpack_require__(869);
const google_auth_library_1 = __webpack_require__(154);
const gaxios_1 = __webpack_require__(445);
/**
 * Scopes that `@google-cloud/storage` requests for its own auth client. We must
 * replicate them here because we provide a custom `authClient` (see below).
 */
const STORAGE_SCOPES = [
    'https://www.googleapis.com/auth/iam',
    'https://www.googleapis.com/auth/cloud-platform',
    'https://www.googleapis.com/auth/devstorage.full_control',
];
/**
 * Native `fetch` (undici) wrapper that adds `duplex: 'half'` whenever a request
 * carries a body. undici rejects streaming request bodies without this option
 * (`RequestInit: duplex option is required when sending a body`), which surfaces
 * during GCS uploads (multipart bodies are streams). `node-fetch` did not need
 * it, so the option must be supplied explicitly now that we use the native fetch.
 */
const nativeFetchWithDuplex = (input, init) => {
    if (init && init.body != null && init.duplex == null) {
        init = { ...init, duplex: 'half' };
    }
    return globalThis.fetch(input, init);
};
/**
 * Creates a GCS Storage client whose HTTP requests go through Node's native
 * `fetch` (undici) instead of `node-fetch`.
 *
 * Why: `@google-cloud/storage@7` pins `google-auth-library@9`, which ships
 * `gaxios@6`. gaxios 6 always uses `node-fetch` in Node (it only picks the
 * native fetch when a browser `window.fetch` exists). `node-fetch` fails against
 * the Google OAuth token endpoint with `Invalid response body while trying to
 * fetch https://www.googleapis.com/oauth2/v4/token: Premature close`, whereas
 * the native fetch works (verified). By giving the auth client a Gaxios
 * transporter with `fetchImplementation` set to the native fetch, gtoken/JWT
 * mint tokens via undici and the failure disappears.
 *
 * The same transporter is reused by `@google-cloud/storage` for JSON-API
 * uploads/downloads, hence {@link nativeFetchWithDuplex} for streaming bodies.
 *
 * TODO (remove this workaround when upstream upgrades): there is currently no
 * `@google-cloud/storage` release that drops gaxios 6 — even the latest (7.21)
 * still depends on `google-auth-library@^9`. Native fetch arrives only with
 * gaxios 7 (`google-auth-library@10`). Once `@google-cloud/storage` officially
 * moves to google-auth 10, delete this whole file, replace `createStorage(id)`
 * with `new Storage({ projectId: id })` at the call sites, and drop the explicit
 * `gaxios` / `google-auth-library` dependencies from package.json.
 */
function createStorage(projectId) {
    const authClient = new google_auth_library_1.GoogleAuth({
        projectId,
        scopes: STORAGE_SCOPES,
        clientOptions: {
            transporter: new gaxios_1.Gaxios({ fetchImplementation: nativeFetchWithDuplex }),
        },
    });
    return new storage_1.Storage({
        projectId,
        authClient,
        retryOptions: { autoRetry: true, maxRetries: 5, totalTimeout: 120 },
    });
}


/***/ }),

/***/ 943:
/***/ ((module) => {

module.exports = require("fs/promises");

/***/ }),

/***/ 982:
/***/ ((module) => {

module.exports = require("crypto");

/***/ }),

/***/ 985:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.generateFragments = void 0;
var generate_fragments_1 = __webpack_require__(258);
Object.defineProperty(exports, "generateFragments", ({ enumerable: true, get: function () { return generate_fragments_1.generateFragments; } }));


/***/ }),

/***/ 994:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.buildStaticDataQueryModuleFolderPath = buildStaticDataQueryModuleFolderPath;
exports.checkStaticDataQueryModuleFolderExists = checkStaticDataQueryModuleFolderExists;
const dynamic_module_utils_1 = __webpack_require__(798);
const bucket_utils_1 = __webpack_require__(328);
function buildStaticDataQueryModuleFolderPath(env, game, schemaVersion, slug) {
    const basePath = (0, dynamic_module_utils_1.generateModulePath)(env, game, slug);
    const versionFolder = (0, dynamic_module_utils_1.generateModuleFolderName)(schemaVersion);
    return `${basePath}/${versionFolder}`;
}
async function checkStaticDataQueryModuleFolderExists(bucket, env, game, schemaVersion, slug) {
    const versionFolderPath = buildStaticDataQueryModuleFolderPath(env, game, schemaVersion, slug);
    return (0, bucket_utils_1.isFolderExists)(bucket, versionFolderPath);
}


/***/ }),

/***/ 998:
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.fetchGqlShemaUserAgent = void 0;
exports.fetchGqlShemaUserAgent = 'moba-frontend-gql-schema-downloader';


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = __webpack_require__(156);
/******/ 	module.exports = __webpack_exports__;
/******/ 	
/******/ })()
;
//# sourceMappingURL=index.js.map