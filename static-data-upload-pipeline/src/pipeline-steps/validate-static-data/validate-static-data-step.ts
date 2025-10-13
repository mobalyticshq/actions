import { StaticData, StaticDataConfig, ValidationReport } from '../../types';
import { readdirSync } from 'fs';
import path from 'path';
import { isValidReport } from '../../utils/is-valid-report.utils';
import { validate } from './utils';
import { ApiSchema } from '../schema-validation/types';
import { SlackMessageManagerV2 } from '../../utils/slack-manager-v2.utils';

export async function validateStaticDataStep(
  slackManager: SlackMessageManagerV2,
  overridedData: StaticData,
  oldData: StaticData,
  config: StaticDataConfig,
  testsDir: string,
  tmpAssetPrefix: string,
  apiSchema: ApiSchema | null,
  isValidationBeforeOverride: boolean
) {
  await slackManager.appendNewLine({
    id: `validate-static-data-${isValidationBeforeOverride ? 'before' : 'after'}-override`,
    content: `Validating static data ${isValidationBeforeOverride ? 'before override by spreadsheet' : 'after override by spreadsheet'}...`,
    emoji: ':mag:',
  });

  const reports = new Array<ValidationReport>();
  const commonReport = await validate(overridedData, oldData, config, tmpAssetPrefix, apiSchema, isValidationBeforeOverride);
  reports.push(commonReport);
  reports.push(...(await runValidationExtensions(testsDir, overridedData, oldData)));

  const { errors, warnings, infos } = isValidReport(reports);

  console.log(`⚠️ Errors:${errors}`);
  console.log(`❗ Warnings:${warnings}`);
  console.log(`ℹ️ Infos:${infos}`);

  if (errors === 0) {
    console.log(`✅ Static data validation passed`);
    await slackManager.updateMessage(
      `validate-static-data-${isValidationBeforeOverride ? 'before' : 'after'}-override`,
      `Static data validation passed`,
      ':white_check_mark:',
    );
  }

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
