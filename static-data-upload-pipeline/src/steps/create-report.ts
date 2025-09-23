import { logger } from '../logger';
import { ValidationReport } from '../types';
import { createReport } from '../utils/report';
import { SlackMessageManager } from '../utils/slack-manager.utils';

export async function createReportStep(
  slackManager: SlackMessageManager,
  reports: ValidationReport[],
  reportSpreadsheetId: string,
  errors: number,
  warnings: number,
  infos: number,
) {
  logger.group(`📊 Create Mistakes Report: https://docs.google.com/spreadsheets/d/${reportSpreadsheetId}`);
  const reportDone = await createReport(reports, reportSpreadsheetId);

  let slackMsg = `Report: `;
  slackMsg += `❗ - errors:${errors}  `;
  slackMsg += `⚠️ - warnings:${warnings}  `;
  slackMsg += `ℹ️ - infos:${infos}`;

  if (reportDone) {
    console.log('✅ Mistakes Report done');
    await slackManager.sendOrUpdate(
      `${slackMsg}\n <https://docs.google.com/spreadsheets/d/${reportSpreadsheetId}|Report>`,
      ':receipt:',
      true,
      true,
    );
  } else {
    console.log('⚠️ Can`t create spreadsheetreport');
    await slackManager.sendOrUpdate(
      `Can't create Mistakes <https://docs.google.com/spreadsheets/d/${reportSpreadsheetId}|Report>`,
      ':warning:',
      true,
      true,
    );
  }
  logger.endGroup();
}
