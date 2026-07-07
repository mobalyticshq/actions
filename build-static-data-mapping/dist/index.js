/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ 33:
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
exports.downloadBuildArtifacts = downloadBuildArtifacts;
const core = __importStar(__webpack_require__(659));
const fs = __importStar(__webpack_require__(896));
const path = __importStar(__webpack_require__(928));
const bucket_utils_1 = __webpack_require__(328);
const dynamic_module_utils_1 = __webpack_require__(798);
const dynamic_modules_types_1 = __webpack_require__(463);
const filterTypesFiles = (fileName) => fileName.endsWith('fragment.gql.generated.ts') || fileName === 'types.ts';
async function downloadBuildArtifacts(options) {
    try {
        const { bucket, env, gameUrlSlug, disableQueryAst } = options;
        const bucketName = bucket.name;
        const staticDataQueryModuleSlug = disableQueryAst
            ? dynamic_modules_types_1.DynamicModuleSlug.STATIC_DATA_QUERY_V2
            : dynamic_modules_types_1.DynamicModuleSlug.STATIC_DATA_QUERY;
        // Step 1: Download config.json
        const config = await (0, bucket_utils_1.downloadConfigFromBucket)(bucket, env, gameUrlSlug, staticDataQueryModuleSlug);
        if (!config) {
            const errorMessage = `Config file not found for game: ${gameUrlSlug}`;
            core.setFailed(errorMessage);
            throw new Error(errorMessage);
        }
        // Step 2: Extract moduleFolder from config
        if (!config.moduleFolder) {
            const errorMessage = `Config file does not contain moduleFolder field for game: ${gameUrlSlug}`;
            core.setFailed(errorMessage);
            throw new Error(errorMessage);
        }
        const moduleFolder = config.moduleFolder.endsWith('/') ? config.moduleFolder : `${config.moduleFolder}/`;
        core.info(`Module folder: ${moduleFolder}`);
        // Step 3: Build bucket path
        const baseModulePath = (0, dynamic_module_utils_1.generateModulePath)(env, gameUrlSlug, staticDataQueryModuleSlug);
        const baseBucketPath = `${baseModulePath}/${moduleFolder}`;
        core.info(`Base bucket path: gs://${bucketName}/${baseBucketPath}`);
        // Step 4: Create local build folder
        const buildPath = path.resolve(process.cwd(), 'build', 'downloaded');
        if (!fs.existsSync(buildPath)) {
            fs.mkdirSync(buildPath, { recursive: true });
            core.info(`Created build directory: ${buildPath}`);
        }
        else {
            core.info(`Build directory already exists: ${buildPath}`);
        }
        // Step 5: Download root file from moduleFolder
        if (!config.name) {
            const errorMessage = `Config file does not contain name field for game: ${gameUrlSlug}`;
            core.setFailed(errorMessage);
            throw new Error(errorMessage);
        }
        const compiledQueryBucketFilePath = `${baseModulePath}/${config.name}`;
        const compiledQueryLocalFilePath = path.join(buildPath, 'query.js');
        core.info(`Downloading query.js from gs://${bucketName}/${compiledQueryBucketFilePath}`);
        try {
            const file = bucket.file(compiledQueryBucketFilePath);
            await file.download({ destination: compiledQueryLocalFilePath });
            core.info(`✓ Successfully downloaded query.js`);
        }
        catch (error) {
            const errorMessage = `Failed to download query.js from gs://${bucketName}/${compiledQueryBucketFilePath}: ${error instanceof Error ? error.message : String(error)}`;
            core.setFailed(errorMessage);
            throw new Error(errorMessage);
        }
        // Step 6: Download required folders
        const requiredFolders = ['cleaned-schema', 'fragments', 'types', 'query'];
        for (const folderName of requiredFolders) {
            const bucketFolderPath = `${baseBucketPath}${folderName}`;
            const localFolderPath = path.join(buildPath, folderName);
            const filterFiles = folderName === 'types' ? filterTypesFiles : undefined;
            await (0, bucket_utils_1.downloadFolderFromBucket)(bucket, bucketFolderPath, localFolderPath, folderName, filterFiles);
        }
        core.info(`✓ Successfully downloaded all build artifacts for game: ${gameUrlSlug}`);
    }
    catch (error) {
        // errors should fail the pipeline
        core.setFailed(`Error in downloadBuildArtifacts: ${error instanceof Error ? error.message : String(error)}`);
        throw error;
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
const _1_download_build_artifacts_1 = __webpack_require__(244);
const _2_extract_entities_enum_1 = __webpack_require__(779);
const _3_copy_user_prompts_1 = __webpack_require__(330);
const _4_generate_mapping_1 = __webpack_require__(606);
/**
 * Main function for the GitHub Action
 */
async function run() {
    try {
        // Get inputs
        const game = core.getInput('game', { required: true });
        const gameUrlSlug = core.getInput('game-url-slug', { required: false }) || game;
        const configurationGameSlug = core.getInput('configuration-game-slug', { required: false }) || game;
        const timeoutMs = parseInt(core.getInput('timeout') || '600000', 10);
        const model = core.getInput('model-version', { required: false });
        const gcsBucketName = core.getInput('gcs-bucket-name', { required: true });
        const gcsProjectId = core.getInput('gcs-project-id', { required: true });
        const dynamicModulesEnv = core.getInput('dynamic-modules-env', { required: true });
        const disableQueryAst = core.getBooleanInput('disable-query-ast-compilation');
        core.info(`🚀 Starting build static data mapping pipeline for game: ${game}`);
        // Initialize Storage and Bucket
        const storage = (0, storage_utils_1.createStorage)(gcsProjectId);
        const bucket = storage.bucket(gcsBucketName);
        // Step 1: Check schema version
        core.startGroup('🔍 Step 1: Checking schema version');
        await (0, _1_download_build_artifacts_1.downloadBuildArtifacts)({
            bucket,
            env: dynamicModulesEnv,
            gameUrlSlug,
            disableQueryAst,
        });
        core.endGroup();
        // Step 2: Extract entities enum
        core.startGroup('🔍 Step 2: Extracting entities enum');
        await (0, _2_extract_entities_enum_1.extractEntitiesEnum)();
        core.endGroup();
        // Step 3: Copy user prompts from repository
        core.startGroup('📋 Step 3: Copying user prompts from repository');
        await (0, _3_copy_user_prompts_1.copyUserPrompts)({
            game: configurationGameSlug,
            dynamicModulesEnv,
        });
        core.endGroup();
        // Step 4: Generate mapping
        core.startGroup('🔨 Step 4: Generating mapping');
        await (0, _4_generate_mapping_1.generateMapping)({
            timeoutMs,
            model,
        });
        core.info(`✓ Mapping generation completed`);
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

/***/ 208:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.generateMapping = generateMapping;
const run_cursor_generation_1 = __webpack_require__(550);
const path_1 = __importDefault(__webpack_require__(928));
async function generateMapping(options) {
    const { timeoutMs, model } = options;
    const promptFilePath = path_1.default.resolve(__dirname, 'generate-mapping.md');
    return await (0, run_cursor_generation_1.runCursorGeneration)({
        timeoutMs,
        prompt: `"Implement instructions in the file ${promptFilePath}"`,
        model,
    });
}


/***/ }),

/***/ 244:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.downloadBuildArtifacts = void 0;
var download_build_artifacts_1 = __webpack_require__(33);
Object.defineProperty(exports, "downloadBuildArtifacts", ({ enumerable: true, get: function () { return download_build_artifacts_1.downloadBuildArtifacts; } }));


/***/ }),

/***/ 317:
/***/ ((module) => {

module.exports = require("child_process");

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

/***/ 330:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.copyUserPrompts = void 0;
var copy_user_prompts_1 = __webpack_require__(995);
Object.defineProperty(exports, "copyUserPrompts", ({ enumerable: true, get: function () { return copy_user_prompts_1.copyUserPrompts; } }));


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
    DynamicModuleSlug["STATIC_DATA_MAPPING_V2"] = "static-data-mapping-v2";
    DynamicModuleSlug["STATIC_DATA_QUERY"] = "static-data-query";
    DynamicModuleSlug["STATIC_DATA_QUERY_V2"] = "static-data-query-v2";
})(DynamicModuleSlug || (exports.DynamicModuleSlug = DynamicModuleSlug = {}));


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

/***/ 606:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.generateMapping = void 0;
var generate_mapping_1 = __webpack_require__(208);
Object.defineProperty(exports, "generateMapping", ({ enumerable: true, get: function () { return generate_mapping_1.generateMapping; } }));


/***/ }),

/***/ 659:
/***/ ((module) => {

module.exports = require("@actions/core");

/***/ }),

/***/ 748:
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
exports.extractEntitiesEnum = extractEntitiesEnum;
const core = __importStar(__webpack_require__(659));
const fs = __importStar(__webpack_require__(896));
const path = __importStar(__webpack_require__(928));
async function extractEntitiesEnum() {
    try {
        const schemaPath = path.resolve(process.cwd(), 'build', 'downloaded', 'cleaned-schema', 'cleaned-schema.graphql');
        const outputPath = path.resolve(process.cwd(), 'build', 'downloaded', 'cleaned-schema', 'entities.graphql');
        const schema = fs.readFileSync(schemaPath, 'utf-8');
        const match = schema.match(/enum\s+\w+EntitiesEnum\s*\{[^}]*\}/);
        if (!match) {
            throw new Error('EntitiesEnum not found in cleaned-schema.graphql');
        }
        fs.writeFileSync(outputPath, match[0], 'utf-8');
        core.info(`✓ Extracted entities enum to ${outputPath}`);
    }
    catch (error) {
        core.setFailed(`Error in extractEntitiesEnum: ${error instanceof Error ? error.message : String(error)}`);
        throw error;
    }
}


/***/ }),

/***/ 779:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.extractEntitiesEnum = void 0;
var extract_entities_enum_1 = __webpack_require__(748);
Object.defineProperty(exports, "extractEntitiesEnum", ({ enumerable: true, get: function () { return extract_entities_enum_1.extractEntitiesEnum; } }));


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

/***/ 869:
/***/ ((module) => {

module.exports = require("@google-cloud/storage");

/***/ }),

/***/ 896:
/***/ ((module) => {

module.exports = require("fs");

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

/***/ 995:
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
exports.copyUserPrompts = copyUserPrompts;
const core = __importStar(__webpack_require__(659));
const fs = __importStar(__webpack_require__(896));
const path = __importStar(__webpack_require__(928));
/**
 * Recursively copy files from source directory to destination directory
 */
async function copyRecursive(src, dest) {
    const stat = await fs.promises.stat(src);
    if (stat.isDirectory()) {
        // Create destination directory if it doesn't exist
        if (!fs.existsSync(dest)) {
            await fs.promises.mkdir(dest, { recursive: true });
        }
        // Read all entries in the source directory
        const entries = await fs.promises.readdir(src, { withFileTypes: true });
        // Copy each entry recursively
        for (const entry of entries) {
            const srcPath = path.join(src, entry.name);
            const destPath = path.join(dest, entry.name);
            await copyRecursive(srcPath, destPath);
        }
    }
    else {
        // Copy file
        const destDir = path.dirname(dest);
        if (!fs.existsSync(destDir)) {
            await fs.promises.mkdir(destDir, { recursive: true });
        }
        await fs.promises.copyFile(src, dest);
        core.info(`Copied: ${path.relative(process.env.GITHUB_WORKSPACE || '', src)} -> ${path.relative(process.cwd(), dest)}`);
    }
}
async function copyUserPrompts(options) {
    try {
        const { game, dynamicModulesEnv } = options;
        // Get repository root from GitHub Actions environment variable
        const githubWorkspace = process.env.GITHUB_WORKSPACE;
        if (!githubWorkspace) {
            const errorMessage = 'GITHUB_WORKSPACE environment variable is not set';
            core.setFailed(errorMessage);
            throw new Error(errorMessage);
        }
        // Build source path: ${game}/${dynamicModulesEnv}/static_data_mapping
        const sourcePath = path.join(githubWorkspace, game, dynamicModulesEnv, 'static_data_mapping');
        core.info(`Source path: ${sourcePath}`);
        // Check if source directory exists
        if (!fs.existsSync(sourcePath)) {
            const errorMessage = `Source directory does not exist: ${sourcePath}`;
            core.setFailed(errorMessage);
            throw new Error(errorMessage);
        }
        // Check if source is a directory
        const stat = await fs.promises.stat(sourcePath);
        if (!stat.isDirectory()) {
            const errorMessage = `Source path is not a directory: ${sourcePath}`;
            core.setFailed(errorMessage);
            throw new Error(errorMessage);
        }
        // Build destination path: build/user-prompts (relative to action directory)
        const destPath = path.resolve(process.cwd(), 'build', 'user-prompts');
        core.info(`Destination path: ${destPath}`);
        // Create destination directory if it doesn't exist
        if (!fs.existsSync(destPath)) {
            await fs.promises.mkdir(destPath, { recursive: true });
            core.info(`Created destination directory: ${destPath}`);
        }
        else {
            core.info(`Destination directory already exists: ${destPath}`);
        }
        // Copy all files recursively
        core.info(`Copying files from ${sourcePath} to ${destPath}...`);
        await copyRecursive(sourcePath, destPath);
        core.info(`✓ Successfully copied user prompts from ${sourcePath} to ${destPath}`);
    }
    catch (error) {
        const errorMessage = `Error in copyUserPrompts: ${error instanceof Error ? error.message : String(error)}`;
        core.setFailed(errorMessage);
        throw error;
    }
}


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