import { GoogleAuth } from 'google-auth-library';

export const SPREADSHEETS_SCOPE = 'https://www.googleapis.com/auth/spreadsheets';
export const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive';

export function getServiceAccountEmail(): string {
  if (process.env.GOOGLE_CLIENT_EMAIL) {
    return process.env.GOOGLE_CLIENT_EMAIL;
  }
  throw new Error('Cannot resolve service account email: GOOGLE_CLIENT_EMAIL is not set.');
}

export function buildGoogleAuth(scopes: string[]): GoogleAuth {
  if (process.env.GOOGLE_CLIENT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
    return new GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      },
      scopes,
    });
  }
  throw new Error('No Google credentials found. Set GOOGLE_CLIENT_EMAIL and GOOGLE_PRIVATE_KEY.');
}
