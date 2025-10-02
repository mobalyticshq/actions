import { logColors, logger } from '../utils/logger.utils';
import { SlackMessageManager } from '../utils/slack-manager.utils';
import { replaceAssets } from '../utils/merge.utils';
import { StaticData } from '../types';
import { writeFileSync, readFileSync } from 'fs';
import { updateSpreadsheets } from '../utils/spreadsheets.utils';
import { promisify } from 'util';
import { exec, spawn } from 'child_process';
import { ApiSchema } from './schema-validation/types';

const execAsync = promisify(exec);

export async function syncStaticDataStep(
  slackManager: SlackMessageManager,
  versions: string[],
  overridedData: StaticData,
  spreadsheetData: { [p: string]: string[][] } | null,
  tmpAssetFolder: string,
  tmpAssetPrefix: string,
  prodAssetFolder: string,
  prodAssetPrefix: string,
  overrideSpreadsheetId: string,
  staticData: StaticData,
  gameConfig: string,
  apiSchemaPath: string,
  apiSchema: ApiSchema | null,
): Promise<void> {
  logger.group('✅ Static data is valid! Sync data 📦');

  console.log(
    `✍ Update assets URLs! ${logColors.green}${tmpAssetPrefix}${logColors.reset} to ${logColors.green}${prodAssetPrefix}${logColors.reset}`,
  );
  replaceAssets(overridedData, tmpAssetPrefix, prodAssetPrefix);

  console.log(`✍ Write static data file ${logColors.green}${versions[versions.length - 1]}${logColors.reset}`);
  console.log(JSON.stringify(overridedData['legendaryHeroes']?.[0] || overridedData['characters']?.[0] || {}, null, 2));

  writeFileSync(versions[versions.length - 1], JSON.stringify(overridedData), 'utf8');
  
  // Читаем файл обратно и показываем что записалось
  const writtenData = JSON.parse(readFileSync(versions[versions.length - 1], 'utf8'));
  console.log('📄 What was written to file:');
  console.log(JSON.stringify(writtenData['legendaryHeroes']?.[0] || writtenData['characters']?.[0] || {}, null, 2));

  try {
    if (spreadsheetData) {
      console.log(`📊 Update override spreadsheet https://docs.google.com/spreadsheets/d/${overrideSpreadsheetId}`);
      await updateSpreadsheets(overrideSpreadsheetId, overridedData, staticData, spreadsheetData, apiSchema);
      console.log(`✅ spreadsheet updated`);
      await slackManager.sendOrUpdate(
        `<https://docs.google.com/spreadsheets/d/${overrideSpreadsheetId}|Override spreadsheet  updated>`,
        ':white_check_mark:',
        true,
      );
    }
  } catch (error) {
    await slackManager.sendOrUpdate(`Unable to write override spreadsheet\n ${error}`, ':warning:', true);
    console.log(`⚠️ Unable to write override spreadsheet: ${error}`);
  }

  console.log('🔄 Sync static data file with bucket');
  //upload static data
  {
    const dst = `gs://${process.env.GCP_BUCKET_NAME}/${versions[versions.length - 1]}`;
    // const cmd = `gsutil -m rsync -r -d -c -x "README.md|.gitignore|.github|.git|gha-creds-.*\.json$" ${src} ${dst} `
    const cmd = `gsutil cp ${versions[versions.length - 1]} ${dst}`;
    console.log('static data sync cmd:\n', cmd);
    const { stdout, stderr } = await execAsync(cmd);
    console.log('stdout:', stdout);
    if (stderr) console.error('stderr:', stderr);
  }
  //upload game config
  if (gameConfig.length > 0) {
    const dst = `gs://${process.env.GCP_BUCKET_NAME}/${gameConfig}`;
    // const cmd = `gsutil -m rsync -r -d -c -x "README.md|.gitignore|.github|.git|gha-creds-.*\.json$" ${src} ${dst} `
    const cmd = `gsutil cp ${gameConfig} ${dst}`;
    console.log('static game config sync cmd:\n', cmd);
    const { stdout, stderr } = await execAsync(cmd);
    console.log('stdout:', stdout);
    if (stderr) console.error('stderr:', stderr);
  }
  //upload scheme
  if (apiSchemaPath.length > 0) {
    const dst = `gs://${process.env.GCP_BUCKET_NAME}/${apiSchemaPath}`;
    // const cmd = `gsutil -m rsync -r -d -c -x "README.md|.gitignore|.github|.git|gha-creds-.*\.json$" ${src} ${dst} `
    const cmd = `gsutil cp ${apiSchemaPath} ${dst}`;
    console.log('static scheme sync cmd:\n', cmd);
    const { stdout, stderr } = await execAsync(cmd);
    console.log('stdout:', stdout);
    if (stderr) console.error('stderr:', stderr);
  }
  console.log('✅ Statid databucket synced');

  const cfClientID = process.env.CF_CLIENT_ID;

  await updateAssets(slackManager, tmpAssetFolder, prodAssetFolder, cfClientID);

  await slackManager.sendOrUpdate(
    `<https://storage.cloud.google.com/${process.env.GCP_BUCKET_NAME}/${versions[versions.length - 1]}|Static data uploaded>`,
    ':tada:',
    true,
  );
  console.log('🔥 All done!!!');
  logger.endGroup();
}

async function updateAssets(
  slackManager: SlackMessageManager,
  tmpAssetFolder: string,
  prodAssetFolder: string,
  cfClientID?: string,
) {
  if (tmpAssetFolder == prodAssetFolder) {
    console.log('🔄 Tmp bucket equal prod bucket, skip asset sync ');
    return;
  }
  console.log('🔄 Sync tmp assets bucket with prod bucket');
  const assetCmd = `gsutil -m rsync -r  -c  ${tmpAssetFolder} ${prodAssetFolder} `;
  console.log(assetCmd);

  const { copied } = await syncBuckets(tmpAssetFolder, prodAssetFolder);

  if (copied.length > 0) {
    if (cfClientID) {
      console.log(`🔄 Reset cloudflare cache for ${copied.length} files`);

      const chunks: string[][] = [];
      const chunkSize = 100;
      for (let i = 0; i < copied.length; i += chunkSize) {
        chunks.push(copied.slice(i, i + chunkSize));
      }
      for (const chunk of chunks) {
        const response = await fetch(`https://api.cloudflare.com/client/v4/zones/${cfClientID}/purge_cache`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.CF_AUTH_TOKEN}`,
          },
          body: JSON.stringify({ files: chunk }),
        });
        if (response.status != 200) {
          console.log('⚠️ Error during CF cache reset', { response });
        }
      }
      console.log(`✅ Cloudflare reset`);
    } else {
      console.log('⚠️ CF_CLIENT_ID not defined - unable to reset CF cache');
      await slackManager.sendOrUpdate(`CF_CLIENT_ID not defined - unable to reset CF cache`, ':warning:', true);
    }
  }
}

function syncBuckets(source: string, target: string): Promise<{ copied: Array<string> }> {
  return new Promise((resolve, reject) => {
    const prefix = `Copying ${source}`;
    const proc = spawn('gsutil', ['-m', 'rsync', '-r', '-c', source, target]);

    const copied = new Array<string>();

    proc.stdout.on('data', (data: string) => {
      const lines = data.toString().split('\n');
      for (const line of lines) {
        if (line.startsWith(prefix)) {
          const match = line.replace(prefix, target).replace('gs://', 'https://');
          if (match) copied.push(match.substring(0, match.indexOf('[Content-Type')).trim());
        }
      }
    });

    proc.stderr.on('data', data => {
      const lines = data.toString().split('\n');
      for (const line of lines) {
        if (line.startsWith(prefix)) {
          const match = line.replace(prefix, target).replace('gs://', 'https://');
          match.substring(0, match.indexOf('[Content-Type')).trim();
          if (match) copied.push(match.substring(0, match.indexOf('[Content-Type')).trim());
        }
      }
    });

    proc.on('close', code => {
      if (code !== 0) {
        return reject(new Error(`gsutil exit with ${code}`));
      }
      resolve({ copied });
    });
  });
}
