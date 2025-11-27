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
const storage_1 = require("@google-cloud/storage");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const core = __importStar(require("@actions/core"));
/**
 * Recursively get all files in a directory
 */
function getAllFiles(dirPath, arrayOfFiles = []) {
    const files = fs.readdirSync(dirPath);
    files.forEach(file => {
        const filePath = path.join(dirPath, file);
        if (fs.statSync(filePath).isDirectory()) {
            arrayOfFiles = getAllFiles(filePath, arrayOfFiles);
        }
        else {
            arrayOfFiles.push(filePath);
        }
    });
    return arrayOfFiles;
}
const buildPath = './build';
async function uploadBuild(options) {
    try {
        const { bucketName, gcsProjectId } = options;
        core.info(`Starting upload of build directory to GCS bucket: ${bucketName}`);
        // Step 1: Create Storage client
        const storage = new storage_1.Storage({ projectId: gcsProjectId });
        const bucket = storage.bucket(bucketName);
        // Step 2: Verify bucket exists
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
        // Step 3: Resolve build directory path
        const absoluteBuildPath = path.resolve(process.cwd(), buildPath);
        if (!fs.existsSync(absoluteBuildPath)) {
            core.setFailed(`Build directory does not exist: ${absoluteBuildPath}`);
            process.exit(1);
        }
        if (!fs.statSync(absoluteBuildPath).isDirectory()) {
            core.setFailed(`Build path is not a directory: ${absoluteBuildPath}`);
            process.exit(1);
        }
        core.info(`Build directory: ${absoluteBuildPath}`);
        // Step 4: Get all files recursively
        const allFiles = getAllFiles(absoluteBuildPath);
        core.info(`Found ${allFiles.length} files to upload`);
        if (allFiles.length === 0) {
            core.warning('No files found in build directory');
            return;
        }
        // Step 5: Upload each file
        let uploadedCount = 0;
        let failedCount = 0;
        for (const filePath of allFiles) {
            try {
                // Get relative path from build directory
                const relativePath = path.relative(absoluteBuildPath, filePath);
                // Normalize path separators for GCS (use forward slashes)
                const gcsPath = relativePath.split(path.sep).join('/');
                // Preserve directory structure: build/gql/... -> bucket/build/gql/...
                const destinationPath = path.join('build', gcsPath).split(path.sep).join('/');
                core.info(`Uploading: ${relativePath} -> gs://${bucketName}/${destinationPath}`);
                await bucket.upload(filePath, {
                    destination: destinationPath,
                });
                uploadedCount++;
                core.info(`✓ Uploaded: ${relativePath}`);
            }
            catch (error) {
                failedCount++;
                const relativePath = path.relative(absoluteBuildPath, filePath);
                core.error(`Failed to upload ${relativePath}: ${error instanceof Error ? error.message : String(error)}`);
            }
        }
        // Step 7: Report results
        core.info(`✓ Upload completed: ${uploadedCount} files uploaded, ${failedCount} files failed`);
        if (failedCount > 0) {
            core.setFailed(`Failed to upload ${failedCount} file(s)`);
            process.exit(1);
        }
        core.info(`✓ All files successfully uploaded to gs://${bucketName}/build/`);
    }
    catch (error) {
        core.setFailed(`Unexpected error in uploadBuild: ${error instanceof Error ? error.message : String(error)}`);
        process.exit(1);
    }
}
//# sourceMappingURL=upload-build.js.map