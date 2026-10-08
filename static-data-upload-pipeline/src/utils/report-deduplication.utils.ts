import { ValidationEntityReport, ValidationRecords, ValidationReport } from '../types';

/**
 * Deduplicate validation reports by entity (group + id)
 * Extracts all entity reports from ValidationReport[], deduplicates them, and returns as ValidationReport[]
 * 
 * @param reports - Array of ValidationReport (potentially with duplicate entities across reports)
 * @returns Array of ValidationReport with deduplicated entity reports
 */
export function deduplicateReports(reports: ValidationReport[]): ValidationReport[] {
  // The same entity is reported once per validation pass (before and after the spreadsheet
  // override), so its records are merged. The key is group + id + occurrence, not the bare id:
  // - ids are only unique within a group, and small integer ids collide across lookup groups,
  //   so a bare-id key filed one group's findings under another group's entity
  // - an id that is duplicated inside a group (the very thing `id is not uniq` reports) must
  //   stay two rows; the n-th occurrence in one pass pairs with the n-th in the other
  const reportMap = new Map<string, { group: string; report: ValidationEntityReport }>();

  for (const report of reports) {
    for (const [group, entityReports] of Object.entries(report.byGroup)) {
      const seen = new Map<unknown, number>();
      for (const entityReport of entityReports) {
        const id = entityReport.entity.id;
        const occurrence = seen.get(id) ?? 0;
        seen.set(id, occurrence + 1);
        const key = JSON.stringify([group, id, occurrence]);

        const existing = reportMap.get(key);
        if (!existing) {
          reportMap.set(key, {
            group,
            report: {
              entity: entityReport.entity,
              errors: cloneValidationRecords(entityReport.errors),
              warnings: cloneValidationRecords(entityReport.warnings),
              infos: cloneValidationRecords(entityReport.infos),
            },
          });
        } else {
          mergeValidationRecords(existing.report.errors, entityReport.errors);
          mergeValidationRecords(existing.report.warnings, entityReport.warnings);
          mergeValidationRecords(existing.report.infos, entityReport.infos);
        }
      }
    }
  }

  const groupedReports: { [key: string]: ValidationEntityReport[] } = {};
  for (const { group, report } of reportMap.values()) {
    (groupedReports[group] ??= []).push(report);
  }

  // Return as single ValidationReport with all deduplicated entities
  return [{
    errors: mergeAllErrors(reports),
    warnings: mergeAllWarnings(reports),
    infos: mergeAllInfos(reports),
    byGroup: groupedReports
  }];
}

/**
 * Merge errors from all reports
 */
function mergeAllErrors(reports: ValidationReport[]): ValidationRecords {
  const merged: ValidationRecords = {};
  for (const report of reports) {
    mergeValidationRecords(merged, report.errors);
  }
  return merged;
}

/**
 * Merge warnings from all reports
 */
function mergeAllWarnings(reports: ValidationReport[]): ValidationRecords {
  const merged: ValidationRecords = {};
  for (const report of reports) {
    mergeValidationRecords(merged, report.warnings);
  }
  return merged;
}

/**
 * Merge infos from all reports
 */
function mergeAllInfos(reports: ValidationReport[]): ValidationRecords {
  const merged: ValidationRecords = {};
  for (const report of reports) {
    mergeValidationRecords(merged, report.infos);
  }
  return merged;
}

/**
 * Clone ValidationRecords with new Set instances
 * 
 * @param records - Validation records to clone
 * @returns Cloned records with new Set instances
 */
function cloneValidationRecords(records: ValidationRecords): ValidationRecords {
  const cloned: ValidationRecords = {};
  for (const [key, value] of Object.entries(records)) {
    cloned[key] = new Set(value);
  }
  return cloned;
}

/**
 * Merge source ValidationRecords into target
 * 
 * @param target - Target validation records to merge into
 * @param source - Source validation records to merge from
 */
function mergeValidationRecords(target: ValidationRecords, source: ValidationRecords): void {
  for (const [key, sourceSet] of Object.entries(source)) {
    if (!target[key]) {
      target[key] = new Set();
    }
    // Add all items from source Set to target Set (automatically deduplicates)
    sourceSet.forEach(item => target[key].add(item));
  }
}

