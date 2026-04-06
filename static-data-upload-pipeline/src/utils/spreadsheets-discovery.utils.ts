import { google, drive_v3 } from 'googleapis';
import { buildGoogleAuth, SPREADSHEETS_SCOPE, DRIVE_SCOPE } from './google-auth.utils';

export interface SpreadsheetIds {
  overrideSpreadsheetId: string;
  reportSpreadsheetId: string;
}

export function parseFolderIdFromUrl(folderUrl: string): string {
  const match = folderUrl.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (!match) {
    throw new Error(
      `Cannot extract folder ID from URL: '${folderUrl}'. ` +
      `Expected format: https://drive.google.com/drive/folders/{id}`,
    );
  }
  return match[1];
}

export const buildOverrideSpreadsheetName = (slug: string) => `${slug}/${slug} overrides sheet`;
export const buildReportSpreadsheetName = (slug: string) => `${slug}/${slug} report sheet`;

async function findSpreadsheetInFolder(
  drive: drive_v3.Drive,
  folderId: string,
  name: string,
): Promise<string | null> {
  console.log(`🔍 Searching for spreadsheet "${name}" in folder ${folderId}...`);
  const res = await drive.files.list({
    q: `name='${name}' and '${folderId}' in parents and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false`,
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
    fields: 'files(id, name)',
  });
  const file = res.data.files?.[0];
  if (file?.id) {
    console.log(`✅ Found "${name}" → ID: ${file.id} (https://docs.google.com/spreadsheets/d/${file.id}/edit)`);
    return file.id;
  }
  console.log(`ℹ️ No spreadsheet named "${name}" found in folder ${folderId}.`);
  return null;
}

async function createSpreadsheetInFolder(
  drive: drive_v3.Drive,
  folderId: string,
  name: string,
): Promise<string> {
  console.log(`📝 Creating spreadsheet "${name}" in folder ${folderId}...`);
  const res = await drive.files.create({
    supportsAllDrives: true,
    requestBody: {
      name,
      mimeType: 'application/vnd.google-apps.spreadsheet',
      parents: [folderId],
    },
    fields: 'id, name, webViewLink',
  });
  if (!res.data.id) {
    throw new Error(
      `Drive API returned no ID after creating spreadsheet "${name}" in folder "${folderId}".`,
    );
  }
  console.log(`✅ Created "${name}" → ID: ${res.data.id} (${res.data.webViewLink})`);
  return res.data.id;
}

async function resolveOrCreateSpreadsheet(
  drive: drive_v3.Drive,
  folderId: string,
  name: string,
): Promise<string> {
  try {
    return (
      (await findSpreadsheetInFolder(drive, folderId, name)) ??
      (await createSpreadsheetInFolder(drive, folderId, name))
    );
  } catch (err) {
    throw new Error(
      `Failed to resolve/create spreadsheet "${name}" in folder "${folderId}": ${err}`,
    );
  }
}

export async function discoverSpreadsheetIds(
  gameEnvSlug: string,
  spreadsheetsFolderUrl: string,
): Promise<SpreadsheetIds> {
  console.log(
    `🗂 Discovering spreadsheets for gameEnvSlug="${gameEnvSlug}", folderUrl="${spreadsheetsFolderUrl}"`,
  );

  const folderId = parseFolderIdFromUrl(spreadsheetsFolderUrl);
  console.log(`📁 Folder ID: ${folderId}`);

  const auth = buildGoogleAuth([SPREADSHEETS_SCOPE, DRIVE_SCOPE]);
  const drive = google.drive({ version: 'v3', auth });

  const overrideSpreadsheetId = await resolveOrCreateSpreadsheet(
    drive,
    folderId,
    buildOverrideSpreadsheetName(gameEnvSlug),
  );

  const reportSpreadsheetId = await resolveOrCreateSpreadsheet(
    drive,
    folderId,
    buildReportSpreadsheetName(gameEnvSlug),
  );

  console.log(`✅ Override spreadsheet: https://docs.google.com/spreadsheets/d/${overrideSpreadsheetId}/edit`);
  console.log(`✅ Report spreadsheet:   https://docs.google.com/spreadsheets/d/${reportSpreadsheetId}/edit`);

  return { overrideSpreadsheetId, reportSpreadsheetId };
}
