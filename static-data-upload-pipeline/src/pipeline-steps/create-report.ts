import { logger } from '../utils/logger.utils';
import { ValidationReport } from '../types';
import { createReport } from '../utils/report.utils';
import { SlackMessageManagerV2 } from '../utils/slack-manager-v2.utils';

export async function createReportStep(
  actionUrl: string,
  slackManager: SlackMessageManagerV2,
  reports: ValidationReport[],
  reportSpreadsheetId: string,
  errors: number,
  warnings: number,
  infos: number,
  schemaValidationErrors: any[] = [],
) {
  logger.group(`📊 Create Mistakes Report: https://docs.google.com/spreadsheets/d/${reportSpreadsheetId}`);
  const reportDone = await createReport(reports, reportSpreadsheetId, schemaValidationErrors);

  let slackMsg = `Report: `;
  slackMsg += `❗ - errors:${errors}  `;
  slackMsg += `⚠️ - warnings:${warnings}  `;
  slackMsg += `ℹ️ - infos:${infos}`;

  if (reportDone) {
    console.log('✅ Mistakes Report done');
    await slackManager.appendNewLine({
      id: 'spreadsheet-report',
      content: `${slackMsg} <https://docs.google.com/spreadsheets/d/${reportSpreadsheetId}|See Report>`,
      emoji: ':receipt:',
      }
    );
  } else {
    console.log('⚠️ Can`t create spreadsheetreport');
    await slackManager.appendNewLine({
        id: 'spreadsheet-report',
        content: `Can't create mistakes report, something went wrong! Please contact any engineer. <${actionUrl}|See pipeline logs>`,
        emoji: ':mild-panic:',
    });
  }
  logger.endGroup();
}
