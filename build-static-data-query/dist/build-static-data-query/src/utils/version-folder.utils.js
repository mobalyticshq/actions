"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateBasePath = generateBasePath;
exports.generateVersionFolderName = generateVersionFolderName;
exports.buildVersionFolderPath = buildVersionFolderPath;
exports.folderExists = folderExists;
exports.checkVersionFolderExists = checkVersionFolderExists;
function generateBasePath(env, game) {
    return `dynamic-modules/${env}/${game}/static-data-query`;
}
function generateVersionFolderName(schemaVersion) {
    return `v-${schemaVersion}-query`;
}
function buildVersionFolderPath(env, game, schemaVersion) {
    const basePath = generateBasePath(env, game);
    const versionFolder = generateVersionFolderName(schemaVersion);
    return `${basePath}/${versionFolder}`;
}
async function folderExists(bucket, folderPath) {
    const prefix = folderPath.endsWith('/') ? folderPath : `${folderPath}/`;
    const [files] = await bucket.getFiles({ prefix, maxResults: 1 });
    return files.length > 0;
}
async function checkVersionFolderExists(bucket, env, game, schemaVersion) {
    const versionFolderPath = buildVersionFolderPath(env, game, schemaVersion);
    return folderExists(bucket, versionFolderPath);
}
//# sourceMappingURL=version-folder.utils.js.map