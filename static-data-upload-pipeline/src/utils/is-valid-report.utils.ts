import { ValidationReport } from '../types';
import { logColors } from './logger.utils';

export function isValidReport(reports: ValidationReport[]) {
  let errors = 0,
    warnings = 0,
    infos = 0;
  for (const report of reports) {
    for (const error of Object.keys(report.errors)) {
      if (report.errors[error].size > 0)
        console.log(
          `⚠️${logColors.yellow} ${error} ${logColors.blue} ${Array.from(report.errors[error])} ${logColors.reset}`,
        );
      errors += report.errors[error].size;
    }
    for (const warning of Object.keys(report.warnings)) {
      if (report.warnings[warning].size > 0)
        console.log(
          `❗${logColors.yellow} ${warning} ${logColors.blue} ${Array.from(report.warnings[warning])} ${logColors.reset}`,
        );
      warnings += report.warnings[warning].size;
    }
    for (const info of Object.keys(report.infos)) {
      if (report.infos[info].size > 0)
        console.log(
          `ℹ️ ${logColors.yellow} ${info} ${logColors.blue} ${Array.from(report.infos[info])} ${logColors.reset}`,
        );
      infos += report.infos[info].size;
    }

    for (const group of Object.keys(report.byGroup)) {
      const errorsSet = new Set<string>();
      const errorFields = new Set<string>();

      for (const ent of report.byGroup[group]) {
        for (const error of Object.keys(ent.errors)) {
          if (ent.errors[error].size > 0) {
            errorsSet.add(error);
            for (const field of ent.errors[error]) errorFields.add(field);
          }
          errors += ent.errors[error].size;
        }
        for (const warinig of Object.keys(ent.warnings)) warnings += ent.warnings[warinig].size;
        for (const info of Object.keys(ent.infos)) {
          infos += ent.infos[info].size;
        }
      }
      if (errorsSet.size > 0) {
        console.log(
          `⚠️For group ${logColors.green}${group}${logColors.reset} errors:\n${logColors.yellow}[${Array.from(errorsSet)}]\n in fields:\n${logColors.blue}[${Array.from(errorFields)}]${logColors.reset}`,
        );
      }
    }
  }
  return { errors, warnings, infos };
}
