import { Entity, StaticData } from '../types';
import { tryParse } from './common.utils';
import { SpreadsheetReport } from './spreadsheets.utils';

/**
 * Apply spreadsheet data to known static data (V2 - Improved version)
 * 
 * This function handles override columns and new fields from spreadsheet:
 * - Columns ending with `_override` will override existing fields in StaticData
 * - New columns (not in StaticData) will be added as new fields
 * - Columns matching existing StaticData fields (without _override) will generate errors
 * - `id_override` is not allowed
 * 
 * @param rawData - Spreadsheet data where [0] index contains column headers
 * @param knownData - Merged static data from all static_data_v*.*.*.json files
 * @param spreadsheetReport - Report object to collect errors and warnings
 * @returns Merged entities with applied overrides
 */
export function applySpreadsheetsDataV2(
  rawData: { [key: string]: any[][] | null },
  knownData: StaticData,
  spreadsheetReport: SpreadsheetReport,
): StaticData {
  const entities: StaticData = {};

  for (const group of Object.keys(rawData)) {
    // Validate group has data
    if (!rawData[group] || rawData[group].length === 0) {
      spreadsheetReport.emptyPages.add(group);
      continue;
    }

    const headers = rawData[group][0];
    const rows = rawData[group].slice(1);

    // Validate headers
    const headerValidation = validateHeaders(headers, group, spreadsheetReport);
    if (!headerValidation.isValid) {
      continue;
    }

    // Get known fields from StaticData for this group
    const knownFields = collectKnownFields(knownData[group]);

    // Validate override columns
    validateOverrideColumns(headers, knownFields, group, spreadsheetReport);

    // Categorize columns
    const columnCategories = categorizeColumns(headers, knownFields);

    // Process each row
    entities[group] = [];
    for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
      const row = rows[rowIndex];
      
      const entityResult = processRow(
        row,
        headers,
        columnCategories,
        knownData[group],
        group,
        spreadsheetReport,
      );

      if (entityResult) {
        // Check for duplicate IDs
        const duplicate = entities[group].find(e => e.id === entityResult.id);
        if (duplicate) {
          spreadsheetReport.duplicatedEntities[group] ||= new Set();
          spreadsheetReport.duplicatedEntities[group].add(entityResult.id as string);
        } else {
          entities[group].push(entityResult);
        }
      }
    }
  }

  return entities;
}

/**
 * Validate spreadsheet headers
 */
function validateHeaders(
  headers: any[],
  group: string,
  report: SpreadsheetReport,
): { isValid: boolean } {
  // Check if 'id' column exists
  if (!headers.find(val => val === 'id')) {
    report.pagesWithoutId.add(group);
    return { isValid: false };
  }

  // Check for empty headers
  if (headers.find(val => val === '')) {
    report.pagesWithAbscentHeader.add(group);
  }

  // Check for duplicate headers
  const headerCounts = new Map<string, number>();
  for (const header of headers) {
    if (header !== '') {
      headerCounts.set(header, (headerCounts.get(header) || 0) + 1);
    }
  }

  for (const [header, count] of headerCounts.entries()) {
    if (count > 1) {
      report.pagesWidthDuplicatedHeaders[group] ||= new Set();
      report.pagesWidthDuplicatedHeaders[group].add(header);
    }
  }

  return { isValid: true };
}

/**
 * Collect all known field names from entities
 */
function collectKnownFields(entities: Entity[] | undefined): Set<string> {
  const knownFields = new Set<string>();
  
  if (!entities) {
    return knownFields;
  }

  for (const entity of entities) {
    for (const prop of Object.keys(entity)) {
      knownFields.add(prop);
    }
  }

  return knownFields;
}

/**
 * Validate override columns
 * - Override columns should target existing fields
 * - Cannot override 'id'
 */
function validateOverrideColumns(
  headers: any[],
  knownFields: Set<string>,
  group: string,
  report: SpreadsheetReport,
): void {
  for (const header of headers) {
    if (typeof header === 'string' && header.endsWith('_override')) {
      const originalField = header.replace('_override', '');
      
      // Check if trying to override 'id'
      if (originalField === 'id') {
        report.pagesWidthWrongOverrides[group] ||= new Set();
        report.pagesWidthWrongOverrides[group].add(header);
        continue;
      }

      // Check if original field exists in known data
      if (!knownFields.has(originalField)) {
        report.pagesWidthWrongOverrides[group] ||= new Set();
        report.pagesWidthWrongOverrides[group].add(header);
      }
    }
  }
}

/**
 * Column categories for processing
 */
interface ColumnCategories {
  overrideColumns: Map<number, string>; // index -> original field name
  newFields: Set<number>; // indices of new fields to add
  existingFields: Set<number>; // indices of existing fields (should generate error)
  specialFields: Set<number>; // id, deprecated, etc.
}

/**
 * Categorize columns into different types
 */
function categorizeColumns(
  headers: any[],
  knownFields: Set<string>,
): ColumnCategories {
  const categories: ColumnCategories = {
    overrideColumns: new Map(),
    newFields: new Set(),
    existingFields: new Set(),
    specialFields: new Set(),
  };

  for (let i = 0; i < headers.length; i++) {
    const header = headers[i];
    
    if (header === '' || typeof header !== 'string') {
      continue;
    }

    // Handle override columns
    if (header.endsWith('_override')) {
      const originalField = header.replace('_override', '');
      if (originalField !== 'id' && knownFields.has(originalField)) {
        categories.overrideColumns.set(i, originalField);
      }
      continue;
    }

    // Handle special fields (id, deprecated)
    if (header === 'id' || header === 'deprecated') {
      categories.specialFields.add(i);
      continue;
    }

    // Check if this is an existing field or a new field
    if (knownFields.has(header)) {
      categories.existingFields.add(i);
    } else {
      categories.newFields.add(i);
    }
  }

  return categories;
}

/**
 * Process a single row from spreadsheet
 */
function processRow(
  row: any[],
  headers: any[],
  categories: ColumnCategories,
  knownEntities: Entity[] | undefined,
  group: string,
  report: SpreadsheetReport,
): Entity | null {
  // Extract ID from row
  const idIndex = headers.indexOf('id');
  if (idIndex === -1 || !row[idIndex] || row[idIndex] === '') {
    report.pageWithAbscentId.add(group);
    return null;
  }

  const entityId = row[idIndex];

  // Check if this is an existing or new entity
  const knownEntity = knownEntities?.find(ent => ent.id === entityId);
  const isNewEntity = !knownEntity;
  const entity: Entity = knownEntity ? { ...knownEntity } : { id: entityId };

  if (isNewEntity) {
    // For NEW entities: populate from all non-override columns
    // Step 1: Add fields from existing columns (regular fields)
    for (const fieldIndex of categories.existingFields) {
      const fieldName = headers[fieldIndex];
      const value = row[fieldIndex];
      
      if (value !== undefined && value !== '') {
        entity[fieldName] = tryParse(value);
      } else if (value === undefined || value === '') {
        entity[fieldName] = '';
      }
    }

    // Step 2: Add new fields
    for (const fieldIndex of categories.newFields) {
      const fieldName = headers[fieldIndex];
      const value = row[fieldIndex];
      
      if (value !== undefined && value !== '') {
        entity[fieldName] = tryParse(value);
      } else if (value === undefined || value === '') {
        entity[fieldName] = '';
      }
    }

    // Step 3: Warn about override columns for new entities (they shouldn't be used for new records)
    if (categories.overrideColumns.size > 0) {
      for (const [overrideIndex, originalFieldName] of categories.overrideColumns.entries()) {
        const overrideValue = row[overrideIndex];
        if (overrideValue !== undefined && overrideValue !== '') {
          console.warn(`⚠️ Override column "${originalFieldName}_override" used for new entity "${entityId}" in group "${group}". Overrides should only be used for existing entities.`);
        }
      }
    }
  } else {
    // For EXISTING entities: only apply new fields and overrides
    // Check if existing fields are being used without _override suffix (ERROR)
    if (categories.existingFields.size > 0) {
      if (!report.pagesWithExistingFieldColumns) {
        report.pagesWithExistingFieldColumns = {};
      }
      report.pagesWithExistingFieldColumns[group] ||= new Set();
      
      for (const fieldIndex of categories.existingFields) {
        const fieldName = headers[fieldIndex];
        if (fieldName) {
          report.pagesWithExistingFieldColumns[group].add(fieldName);
        }
      }
    }

    // Step 1: Add new fields from spreadsheet
    for (const fieldIndex of categories.newFields) {
      const fieldName = headers[fieldIndex];
      const value = row[fieldIndex];
      
      if (value !== undefined && value !== '') {
        entity[fieldName] = tryParse(value);
      } else if (value === undefined || value === '') {
        entity[fieldName] = '';
      }
    }

    // Step 2: Apply overrides
    for (const [overrideIndex, originalFieldName] of categories.overrideColumns.entries()) {
      const overrideValue = row[overrideIndex];
      
      // Only apply override if value is not empty
      if (overrideValue !== undefined && overrideValue !== '') {
        entity[originalFieldName] = tryParse(overrideValue);
      }
    }
  }

  return entity;
}

/**
 * ANALYSIS OF ORIGINAL applySpreadsheetsData:
 * 
 * Problems with the original implementation:
 * 1. Logic is scattered across multiple nested loops
 * 2. Validation mixed with data processing
 * 3. Hard to understand what happens to each field
 * 4. Doesn't report errors for existing fields without _override
 * 5. Complex flow: parse unknowns -> merge with known -> apply overrides
 * 
 * What the original does:
 * 1. Validates headers (id exists, no empty headers, no duplicates)
 * 2. Collects known fields from knownData
 * 3. Validates override columns (must target existing fields, not id)
 * 4. First pass: Collects ONLY unknown fields from spreadsheet
 * 5. Creates entity: { id, ...unknownFields, ...knownEntity }
 * 6. Second pass: Applies _override columns
 * 7. Checks for duplicate IDs
 * 
 * Improvements in V2:
 * 1. ✅ Separated concerns: validation, categorization, processing
 * 2. ✅ Clear function names and comments
 * 3. ✅ Single pass through data
 * 4. ✅ Explicit column categorization
 * 5. ✅ Reports error for existing fields without _override
 * 6. ✅ Easier to test individual functions
 * 7. ✅ Better type safety with ColumnCategories interface
 * 8. ✅ Clear processing order: known data -> new fields -> overrides
 */

