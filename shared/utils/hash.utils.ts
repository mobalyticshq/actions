import fs from 'fs';
import crypto from 'crypto';

export function computeMd5Hash(filePath: string): string {
  const fileBuffer = fs.readFileSync(filePath);
  return crypto.createHash('md5').update(fileBuffer).digest('hex');
}
