import fs from 'fs';
import path from 'path';

export function getAllFilesRecursive(dirPath: string): string[] {
  const files: string[] = [];

  if (!fs.existsSync(dirPath) || !fs.statSync(dirPath).isDirectory()) {
    return files;
  }

  const entries = fs.readdirSync(dirPath);

  for (const entry of entries) {
    const filePath = path.join(dirPath, entry);
    if (fs.statSync(filePath).isDirectory()) {
      files.push(...getAllFilesRecursive(filePath));
    } else {
      files.push(filePath);
    }
  }

  return files;
}
