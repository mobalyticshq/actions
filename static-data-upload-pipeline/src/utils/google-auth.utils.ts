import { GoogleAuth } from 'google-auth-library';
import * as fs from 'fs';

export const SPREADSHEETS_SCOPE = 'https://www.googleapis.com/auth/spreadsheets';
export const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive';

export function buildGoogleAuth(scopes: string[]): GoogleAuth {
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    const keyFile = JSON.parse(fs.readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS, 'utf8'));
    return new GoogleAuth({ credentials: keyFile, scopes });
  }
  if (process.env.GOOGLE_CLIENT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
    return new GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      },
      scopes,
    });
  }
  throw new Error(
    'No Google credentials found. Set GOOGLE_APPLICATION_CREDENTIALS (path to service account JSON) ' +
    'or GOOGLE_CLIENT_EMAIL + GOOGLE_PRIVATE_KEY.',
  );
}
