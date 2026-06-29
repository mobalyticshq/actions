/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

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

/***/ 89:
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
const path = __importStar(__webpack_require__(928));
const core = __importStar(__webpack_require__(659));
const bucket_utils_1 = __webpack_require__(328);
const module_folder_utils_1 = __webpack_require__(994);
const dynamic_modules_types_1 = __webpack_require__(463);
const dynamic_module_utils_1 = __webpack_require__(798);
const buildMappingPath = './build/mapping';
const buildTypesPath = './build/types';
const buildDistPath = './build/dist';
async function uploadBuild(options) {
    try {
        const { bucket, env, gameUrlSlug } = options;
        const bucketName = bucket.name;
        core.info(`Starting upload of mapping files to GCS bucket: ${bucketName}`);
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
        // Step 2: Get current version and increment
        const existingConfig = await (0, bucket_utils_1.downloadConfigFromBucket)(bucket, env, gameUrlSlug, dynamic_modules_types_1.DynamicModuleSlug.STATIC_DATA_MAPPING);
        const currentVersion = existingConfig?.version || null;
        const newVersion = (0, module_folder_utils_1.incrementVersion)(currentVersion);
        core.info(`Current version: ${currentVersion || 'none'}, new version: ${newVersion}`);
        // Step 3: Build GCS paths
        const moduleFolderPath = (0, module_folder_utils_1.buildStaticDataMappingModulePath)(env, gameUrlSlug, newVersion);
        core.info(`Target path: gs://${bucketName}/${moduleFolderPath}`);
        // Step 4: Check if module folder already exists
        const moduleFolderExists = await (0, bucket_utils_1.isFolderExists)(bucket, moduleFolderPath);
        if (moduleFolderExists) {
            const errorMessage = `Folder ${moduleFolderPath} already exists in bucket ${bucketName}. Cannot overwrite existing version.`;
            core.setFailed(errorMessage);
            throw new Error(errorMessage);
        }
        core.info(`✓ Module folder ${newVersion} does not exist, proceeding with upload`);
        // Step 5: Resolve build directory paths
        const buildMappingFullPath = path.resolve(process.cwd(), buildMappingPath);
        const buildTypesFullPath = path.resolve(process.cwd(), buildTypesPath);
        const buildDistFullPath = path.resolve(process.cwd(), buildDistPath);
        // Step 6: Upload files from build/mapping to src/ subfolder
        const mappingResult = await (0, bucket_utils_1.uploadFolderToBucket)(bucket, bucketName, buildMappingFullPath, `${moduleFolderPath}/src/`, 'mapping files', true);
        // Step 7: Upload files from build/types to types/ subfolder
        const typesResult = await (0, bucket_utils_1.uploadFolderToBucket)(bucket, bucketName, buildTypesFullPath, `${moduleFolderPath}/types/`, 'types files', true);
        // Step 8: Upload files from build/dist to root of moduleFolder
        const distResult = await (0, bucket_utils_1.uploadFolderToBucket)(bucket, bucketName, buildDistFullPath, `${moduleFolderPath}/`, 'dist file', true);
        const uploadedCount = mappingResult.uploadedCount + distResult.uploadedCount + typesResult.uploadedCount;
        const failedCount = mappingResult.failedCount + distResult.failedCount + typesResult.failedCount;
        // Step 9: Report results
        core.info(`✓ Upload completed: ${uploadedCount} files uploaded, ${failedCount} files failed`);
        if (failedCount > 0) {
            const errorMessage = `Failed to upload ${failedCount} file(s)`;
            core.setFailed(errorMessage);
            throw new Error(errorMessage);
        }
        core.info(`✓ All files successfully uploaded to gs://${bucketName}/${moduleFolderPath}/`);
        // Step 10: Upload config.json
        try {
            const config = {
                moduleFolder: `${newVersion}/`,
                name: `${newVersion}/index.js`,
                version: newVersion,
            };
            const basePath = (0, dynamic_module_utils_1.generateModulePath)(env, gameUrlSlug, dynamic_modules_types_1.DynamicModuleSlug.STATIC_DATA_MAPPING);
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

/***/ 154:
/***/ ((module) => {

module.exports = require("google-auth-library");

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
})(DynamicModuleSlug || (exports.DynamicModuleSlug = DynamicModuleSlug = {}));


/***/ }),

/***/ 577:
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
const core = __importStar(__webpack_require__(659));
const storage_utils_1 = __webpack_require__(931);
const upload_build_1 = __webpack_require__(89);
/**
 * Entry point for upload-build script
 * This script is called separately from the main action
 */
async function run() {
    try {
        const game = core.getInput('game', { required: true });
        const gameUrlSlug = core.getInput('game-url-slug', { required: false }) || game;
        const gcsBucketName = core.getInput('gcs-bucket-name', { required: true });
        const gcsProjectId = core.getInput('gcs-project-id', { required: true });
        const dynamicModulesEnv = core.getInput('dynamic-modules-env', { required: true });
        core.info(`🚀 Starting upload build for static data mapping - game: ${game}`);
        // Initialize Storage and Bucket
        const storage = (0, storage_utils_1.createStorage)(gcsProjectId);
        const bucket = storage.bucket(gcsBucketName);
        // Upload build
        await (0, upload_build_1.uploadBuild)({
            bucket,
            env: dynamicModulesEnv,
            gameUrlSlug,
        });
        core.info(`✓ Upload build completed successfully`);
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

/***/ 659:
/***/ ((module) => {

module.exports = require("@actions/core");

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
 * Creates a GCS Storage client whose **auth/token** requests go through Node's
 * native `fetch` (undici) instead of `node-fetch`.
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
 * Only token requests use this transporter; object up/downloads keep their own
 * transport, so response-stream semantics are unaffected.
 */
function createStorage(projectId) {
    const authClient = new google_auth_library_1.GoogleAuth({
        projectId,
        scopes: STORAGE_SCOPES,
        clientOptions: {
            transporter: new gaxios_1.Gaxios({ fetchImplementation: globalThis.fetch }),
        },
    });
    return new storage_1.Storage({
        projectId,
        authClient,
        retryOptions: { autoRetry: true, maxRetries: 5, totalTimeout: 120 },
    });
}


/***/ }),

/***/ 994:
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
exports.buildStaticDataMappingModulePath = buildStaticDataMappingModulePath;
exports.incrementVersion = incrementVersion;
const dynamic_module_utils_1 = __webpack_require__(798);
const dynamic_modules_types_1 = __webpack_require__(463);
const core = __importStar(__webpack_require__(659));
function buildStaticDataMappingModulePath(env, game, version) {
    const basePath = (0, dynamic_module_utils_1.generateModulePath)(env, game, dynamic_modules_types_1.DynamicModuleSlug.STATIC_DATA_MAPPING);
    return `${basePath}/${version}`;
}
function incrementVersion(currentVersion) {
    const defaultFolderName = (0, dynamic_module_utils_1.generateModuleFolderName)('1');
    if (!currentVersion) {
        return defaultFolderName;
    }
    // Extract number from version string (e.g., "v1" -> 1, "v2" -> 2)
    const match = currentVersion.match(/^v(\d+)$/);
    if (!match) {
        core.warning(`Invalid version format: ${currentVersion}. Starting with v1`);
        return defaultFolderName;
    }
    const versionNumber = parseInt(match[1], 10);
    const nextVersion = `${versionNumber + 1}`;
    return (0, dynamic_module_utils_1.generateModuleFolderName)(nextVersion);
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
/******/ 	var __webpack_exports__ = __webpack_require__(577);
/******/ 	module.exports = __webpack_exports__;
/******/ 	
/******/ })()
;
//# sourceMappingURL=upload-build.js.map