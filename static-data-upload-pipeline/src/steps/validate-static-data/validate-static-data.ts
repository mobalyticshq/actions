import { logger } from '../../utils/logger.utils';
import { StaticData, StaticDataConfig, ValidationReport } from '../../types';
import { SlackMessageManager } from '../../utils/slack-manager.utils';
import { readdirSync } from 'fs';
import path from 'path';
import { isValidReport } from '../../utils/is-valid-report.utils';
import { validate } from './utils';

export async function validateStaticData(
  slackManager: SlackMessageManager,
  overridedData: StaticData,
  oldData: StaticData,
  config: StaticDataConfig,
  testsDir: string,
  tmpAssetPrefix: string,
  schemaPath?: string,
) {
  logger.group('🔍 Validate final static data ');
  await slackManager.sendOrUpdate(`Validating static data...`, ':mag:', true, true);

  const reports = new Array<ValidationReport>();
  const commonReport = await validate(overridedData, oldData, config, tmpAssetPrefix, schemaPath);
  reports.push(commonReport);
  reports.push(...(await runValidationExtensions(testsDir, overridedData, oldData)));

  const { errors, warnings, infos } = isValidReport(reports);

  console.log(`⚠️ Errors:${errors}`);
  console.log(`❗ Warnings:${warnings}`);
  console.log(`ℹ️ Infos:${infos}`);
  logger.endGroup();

  return { errors, warnings, infos, reports };
}

async function runValidationExtensions(extensionsDir: string, data: StaticData, oldData: StaticData) {
  const reports = new Array<ValidationReport>();
  try {
    const files = readdirSync(extensionsDir).filter(f => f.endsWith('.js'));

    for (const file of files) {
      const test = require(path.join(extensionsDir, file));
      reports.push(await test(data, oldData));
    }
  } catch (error) {
    console.log(`⚠️ unable execute game specific test:${error}`);
  }
  return reports;
}
