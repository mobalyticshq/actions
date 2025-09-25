import { logger } from '../utils/logger.utils';
import { mergeWithSpreadsheets } from '../utils/spreadsheets.utils';
import { SlackMessageManager } from '../utils/slack-manager.utils';
import { StaticData } from '../types';

export async function overrideStaticData(
  slackManager: SlackMessageManager,
  overrideSpreadsheetId: string,
  staticData: StaticData,
): Promise<{ overridedData: StaticData; spreadsheetReport: any; spreadsheetData: { [p: string]: string[][] } | null }> {
  logger.group('📊 Override static data by spreadsheets');
  await slackManager.sendOrUpdate(`Override static data by spreadsheets...`, ':bar_chart:', true, true);

  // Overrided data is the data that is overridden by spreadsheets and should be uploaded to the bucket
  const { overridedData, spreadsheetReport, spreadsheetData } = await mergeWithSpreadsheets(
    overrideSpreadsheetId,
    staticData,
  );
  logger.endGroup();

  return { overridedData, spreadsheetReport, spreadsheetData };
}
