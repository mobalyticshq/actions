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
exports.uploadBuild = uploadBuild;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const core = __importStar(require("@actions/core"));
const bucket_utils_1 = require("@shared/utils/bucket.utils");
const buildPath = './build';
/**
 * Check if a folder exists in GCS bucket
 */
async function folderExists(bucket, folderPath) {
    const prefix = folderPath.endsWith('/') ? folderPath : `${folderPath}/`;
    const [files] = await bucket.getFiles({ prefix, maxResults: 1 });
    return files.length > 0;
}
/**
 * Get all files with specific extension in a directory (non-recursive)
 */
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
/**
 * Get all files recursively in a directory
 */
function getAllFilesRecursive(dirPath) {
    const files = [];
    if (!fs.existsSync(dirPath) || !fs.statSync(dirPath).isDirectory()) {
        return files;
    }
    const entries = fs.readdirSync(dirPath);
    for (const entry of entries) {
        const filePath = path.join(dirPath, entry);
        if (fs.statSync(filePath).isDirectory()) {
            files.push(...getAllFilesRecursive(filePath));
        }
        else {
            files.push(filePath);
        }
    }
    return files;
}
async function uploadBuild(options) {
    try {
        const { bucket, env, game, schemaVersion } = options;
        const bucketName = bucket.name;
        core.info(`Starting upload of build files to GCS bucket: ${bucketName}`);
        // Step 1: Verify bucket exists
        try {
            const [exists] = await bucket.exists();
            if (!exists) {
                core.setFailed(`Bucket ${bucketName} does not exist`);
                process.exit(1);
            }
            core.info(`✓ Bucket ${bucketName} verified`);
        }
        catch (error) {
            core.setFailed(`Failed to verify bucket: ${error instanceof Error ? error.message : String(error)}`);
            process.exit(1);
        }
        // Step 2: Build GCS paths
        const basePath = `dynamic-modules/${env}/${game}/static-data-query`;
        const versionFolder = `v-${schemaVersion}-query`;
        const fullVersionPath = `${basePath}/${versionFolder}`;
        core.info(`Target path: gs://${bucketName}/${fullVersionPath}`);
        // Step 4: Check if version folder already exists
        const versionFolderExists = await folderExists(bucket, fullVersionPath);
        if (versionFolderExists) {
            core.setFailed(`Folder ${fullVersionPath} already exists in bucket ${bucketName}. Cannot overwrite existing version.`);
            process.exit(1);
        }
        core.info(`✓ Version folder ${versionFolder} does not exist, proceeding with upload`);
        // Step 3: Resolve build directory paths
        const buildQueryPath = path.resolve(process.cwd(), buildPath, 'gql', 'query');
        const buildFragmentsPath = path.resolve(process.cwd(), buildPath, 'gql', 'fragments');
        const buildTypesPath = path.resolve(process.cwd(), buildPath, 'gql', 'gql-types');
        const buildFragmentsTypesPath = path.resolve(process.cwd(), buildPath, 'gql', 'fragments', 'gql-types');
        const buildQueryTypesPath = path.resolve(process.cwd(), buildPath, 'gql', 'query', 'gql-types');
        // Step 4: Upload files according to new structure
        let uploadedCount = 0;
        let failedCount = 0;
        // 6.1: Upload compiled query to root
        const compiledQueryFile = path.join(buildQueryPath, `${game}-static-data-query-compiled.gql.ts`);
        if (fs.existsSync(compiledQueryFile)) {
            const destination = `${fullVersionPath}/${game}-static-data-query-compiled.gql.ts`;
            const success = await (0, bucket_utils_1.uploadFileToBucket)(bucket, compiledQueryFile, destination, bucketName, 'compiled query');
            if (success) {
                uploadedCount++;
            }
            else {
                failedCount++;
            }
        }
        else {
            core.warning(`Compiled query file not found: ${compiledQueryFile}`);
        }
        // 6.2: Upload fragments to fragments/ folder
        const fragmentFiles = getFilesInDirectory(buildFragmentsPath, '.gql.ts');
        if (fragmentFiles.length > 0) {
            for (const fragmentFile of fragmentFiles) {
                const fileName = path.basename(fragmentFile);
                const destination = `${fullVersionPath}/fragments/${fileName}`;
                const success = await (0, bucket_utils_1.uploadFileToBucket)(bucket, fragmentFile, destination, bucketName, `fragment: ${fileName}`);
                if (success) {
                    uploadedCount++;
                }
                else {
                    failedCount++;
                }
            }
        }
        else {
            core.warning(`No fragment files found in ${buildFragmentsPath}`);
        }
        // 6.3: Upload query file (without -compiled suffix) to query/ folder
        const queryFile = path.join(buildQueryPath, `${game}-static-data-query.gql.ts`);
        if (fs.existsSync(queryFile)) {
            const destination = `${fullVersionPath}/query/${game}-static-data-query.gql.ts`;
            const success = await (0, bucket_utils_1.uploadFileToBucket)(bucket, queryFile, destination, bucketName, 'query file');
            if (success) {
                uploadedCount++;
            }
            else {
                failedCount++;
            }
        }
        else {
            core.warning(`Query file not found: ${queryFile}`);
        }
        // 6.4: Upload all files from gql-types folders to types/ folder
        const typeSourcePaths = [
            { path: buildTypesPath, name: 'gql-types' },
            { path: buildFragmentsTypesPath, name: 'fragments/gql-types' },
            { path: buildQueryTypesPath, name: 'query/gql-types' },
        ];
        let hasTypeFiles = false;
        for (const sourcePath of typeSourcePaths) {
            const typeFiles = getAllFilesRecursive(sourcePath.path);
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
                        failedCount++;
                    }
                }
            }
        }
        if (!hasTypeFiles) {
            core.warning(`No type files found in any of the gql-types directories`);
        }
        // Step 5: Report results
        core.info(`✓ Upload completed: ${uploadedCount} files uploaded, ${failedCount} files failed`);
        if (failedCount > 0) {
            core.setFailed(`Failed to upload ${failedCount} file(s)`);
            process.exit(1);
        }
        core.info(`✓ All files successfully uploaded to gs://${bucketName}/${fullVersionPath}/`);
        // Step 6: Upload config.json
        try {
            const config = {
                name: `${versionFolder}/${game}-static-data-query-compiled.gql.ts`,
                schemaVersion: schemaVersion,
            };
            const configDestination = `${basePath}/config.json`;
            const configFile = bucket.file(configDestination);
            const configJson = JSON.stringify(config, null, 2);
            core.info(`Uploading config.json to gs://${bucketName}/${configDestination}`);
            await configFile.save(configJson, {
                contentType: 'application/json',
            });
            core.info(`✓ Config.json successfully uploaded`);
        }
        catch (error) {
            core.setFailed(`Failed to upload config.json: ${error instanceof Error ? error.message : String(error)}`);
            process.exit(1);
        }
    }
    catch (error) {
        core.setFailed(`Unexpected error in uploadBuild: ${error instanceof Error ? error.message : String(error)}`);
        process.exit(1);
    }
}
//# sourceMappingURL=upload-build.js.map