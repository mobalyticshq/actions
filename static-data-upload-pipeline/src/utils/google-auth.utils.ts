import { GoogleAuth } from 'google-auth-library';
import * as fs from 'fs';

export const SPREADSHEETS_SCOPE = 'https://www.googleapis.com/auth/spreadsheets';
export const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive';

export function getServiceAccountEmail(): string {
  if (process.env.GOOGLE_CLIENT_EMAIL) {
    return process.env.GOOGLE_CLIENT_EMAIL;
  }
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    const keyFile = JSON.parse(fs.readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS, 'utf8'));
    if (!keyFile.client_email) {
      throw new Error(
        `No client_email found in GOOGLE_APPLICATION_CREDENTIALS file: ${process.env.GOOGLE_APPLICATION_CREDENTIALS}`,
      );
    }
    return keyFile.client_email;
  }
  throw new Error(
    'Cannot resolve service account email: neither GOOGLE_CLIENT_EMAIL nor GOOGLE_APPLICATION_CREDENTIALS is set.',
  );
}

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
