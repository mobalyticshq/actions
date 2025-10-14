import { ValidationEntityReport, ValidationRecords, ValidationReport } from '../types';

/**
 * Deduplicate validation reports by entity ID
 * Extracts all entity reports from ValidationReport[], deduplicates them, and returns as ValidationReport[]
 * 
 * @param reports - Array of ValidationReport (potentially with duplicate entities across reports)
 * @returns Array of ValidationReport with deduplicated entity reports
 */
export function deduplicateReports(reports: ValidationReport[]): ValidationReport[] {
  // Extract all entity reports from all validation reports
  const allEntityReports: ValidationEntityReport[] = [];
  
  for (const report of reports) {
    for (const group of Object.keys(report.byGroup)) {
      allEntityReports.push(...report.byGroup[group]);
    }
  }

  // Deduplicate entity reports by entity ID
  const deduplicatedEntityReports = deduplicateEntityReports(allEntityReports);

  // Group deduplicated entity reports back by group
  const groupedReports: { [key: string]: ValidationEntityReport[] } = {};
  for (const entityReport of deduplicatedEntityReports) {
    // Extract group name from entity (assuming entity has a __group property or we can infer it)
    // We'll need to find which group this entity belongs to
    const group = findEntityGroup(entityReport.entity, reports);
    if (group) {
      if (!groupedReports[group]) {
        groupedReports[group] = [];
      }
      groupedReports[group].push(entityReport);
    }
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
 * Find which group an entity belongs to
 */
function findEntityGroup(entity: any, reports: ValidationReport[]): string | null {
  for (const report of reports) {
    for (const [groupName, entityReports] of Object.entries(report.byGroup)) {
      if (entityReports.some(er => er.entity.id === entity.id)) {
        return groupName;
      }
    }
  }
  return null;
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
 * Deduplicate entity reports by entity ID
 * Merges reports for the same entity, combining all errors/warnings/infos
 * 
 * @param reports - Array of entity validation reports (potentially with duplicates)
 * @returns Deduplicated array with one report per entity ID
 */
function deduplicateEntityReports(reports: ValidationEntityReport[]): ValidationEntityReport[] {
  const reportMap = new Map<string, ValidationEntityReport>();

  for (const report of reports) {
    const entityId = report.entity.id as string;

    if (!reportMap.has(entityId)) {
      // First occurrence - clone the report with new Sets
      reportMap.set(entityId, {
        entity: report.entity,
        errors: cloneValidationRecords(report.errors),
        warnings: cloneValidationRecords(report.warnings),
        infos: cloneValidationRecords(report.infos),
      });
    } else {
      // Merge with existing report
      const existing = reportMap.get(entityId)!;
      mergeValidationRecords(existing.errors, report.errors);
      mergeValidationRecords(existing.warnings, report.warnings);
      mergeValidationRecords(existing.infos, report.infos);
    }
  }

  return Array.from(reportMap.values());
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

