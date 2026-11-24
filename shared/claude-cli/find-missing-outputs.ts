import fs from 'fs';

export interface ExpectedOutputs {
  files?: string[];
  nonEmptyDirs?: string[];
}

function isNonEmptyDir(dirPath: string): boolean {
  return fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory() && fs.readdirSync(dirPath).length > 0;
}

export function findMissingOutputs({ files = [], nonEmptyDirs = [] }: ExpectedOutputs): string[] {
  const missingFiles = files.filter(filePath => !fs.existsSync(filePath));
  const missingDirs = nonEmptyDirs.filter(dirPath => !isNonEmptyDir(dirPath)).map(dirPath => `${dirPath}/ (empty)`);
  return [...missingFiles, ...missingDirs];
}
