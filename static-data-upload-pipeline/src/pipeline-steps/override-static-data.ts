import { mergeWithSpreadsheets } from '../utils/spreadsheets.utils';
import { StaticData } from '../types';
import { SlackMessageManagerV2 } from '../utils/slack-manager-v2.utils';

export async function overrideStaticData(
  slackManager: SlackMessageManagerV2,
  overrideSpreadsheetId: string,
  staticData: StaticData,
): Promise<{ overridedData: StaticData; spreadsheetReport: any; spreadsheetData: { [p: string]: string[][] } | null }> {
  // await slackManager.sendOrUpdate(`Override static data by spreadsheets...`, ':bar_chart:', true, true);
  await slackManager.appendNewLine(
    {
      id: 'override-static-data',
      content: `Override static data by spreadsheets...`,
      emoji: ':bar_chart:',
    },
  )

  // Overrided data is the data that is overridden by spreadsheets and should be uploaded to the bucket
  const { overridedData, spreadsheetReport, spreadsheetData } = await mergeWithSpreadsheets(
    overrideSpreadsheetId,
    staticData,
  );

  return { overridedData, spreadsheetReport, spreadsheetData };
}
