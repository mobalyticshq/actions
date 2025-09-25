import { Schema, SchemaObject } from '../schema-validation/types';
import { Entity, StaticData, StaticDataConfig, ValidationEntityReport, ValidationRecords } from '../../types';
import { slugify } from '../../utils/common.utils';
import { logger } from '../../utils/logger.utils';
import { processUrlsInChunks as processUrlsWithGCS } from '../../utils/assets-utils';
import { existsSync, readFileSync } from 'fs';

export enum ReportMessages {
  assetURLNotAvailable = 'Asset URL not available',
  assetTooBig = 'Asset too big',
  groupNotArray = 'Group is not array',
  abscentID = 'id is abscent',
  duplicatedIds = 'id is not uniq',
  mismatchedIds = 'id!=gameId||id!=slugify(name)',
  duplicatedSlugs = 'slug is not uniq',
  duplicatedGameIds = 'gameId is not uniq',
  mismatchedSlugs = 'slug!=slugify(name)',
  notInCamelCase = 'not in camel case',
  abscentConfigurationForRef = "can't find ref in config file",
  abscentGroupForRef = "can't find group for ref",
  invalidRef = 'wrong field type for ref',
  abscentIdInRef = "can't find entity in referenced group",
  invalidAssetURL = 'invalid asset URL',
  invalidSubstitutions = "can't find data for substitution",
  numberNotAllowed = 'number is not allowed',
  newEntity = 'new entity',
  deprecated = 'entity deprecated',
  slugChanged = 'slug changed',
  nameChanged = 'name changed',
  fieldDisappear = 'field disappear',
  assetChanged = 'asset changed',

  justMsg = 'wrong id, expected:',
  justColor = 'wrong slug, expected:',

  // Schema validation messages
  requiredFieldMissing = 'required field is missing',
  invalidFieldType = 'invalid field type',
  invalidRefTarget = 'invalid ref target',
  schemaNotFound = 'schema file not found',
  groupNotInSchema = 'group not found in schema',
}

const assetExtensions = ['.jpeg', '.jpg', '.png', '.gif', '.webp', '.svg', '.avif', '.webm', '.mp4'];
const assetSizeLimit = 100 * 1024 * 1024; //100MB
//cameCalse and numbers
function isCamelCase(str: string) {
  const pattern = /^[a-z][a-zA-Z0-9]*$/;
  return pattern.test(str);
}

const wait = (delay: number): Promise<void> => new Promise(resolve => setTimeout(resolve, delay));

// Schema validation functions
function readSchema(schemaPath: string): Schema | null {
  const schemaFilePath = `${schemaPath}/schema.json`;

  try {
    if (!existsSync(schemaFilePath)) {
      console.log(`⚠️ Schema file not found at: ${schemaFilePath}`);
      return null;
    }

    const schemaContent = readFileSync(schemaFilePath, 'utf8');
    return JSON.parse(schemaContent) as Schema;
  } catch (error) {
    console.log(`❌ Error reading schema file: ${error}`);
    return null;
  }
}

function validateFieldType(value: any, fieldType: string, isArray: boolean = false): boolean {
  if (isArray) {
    if (!Array.isArray(value)) return false;
    return value.every(item => validateFieldType(item, fieldType, false));
  }

  switch (fieldType) {
    case 'String':
      return typeof value === 'string';
    case 'Boolean':
      return typeof value === 'boolean';
    case 'Object':
      return typeof value === 'object' && value !== null && !Array.isArray(value);
    case 'Ref':
      return typeof value === 'string';
    default:
      return false;
  }
}

function validateRefTarget(refValue: any, refTo: string, data: StaticData): boolean {
  if (!data[refTo]) return false;

  if (typeof refValue === 'string') {
    return data[refTo].some(entity => entity.id === refValue);
  }

  if (Array.isArray(refValue)) {
    return refValue.every(id => typeof id === 'string' && data[refTo].some(entity => entity.id === id));
  }

  return false;
}

function validateEntityAgainstSchema(
  entity: Entity,
  groupName: string,
  schema: Schema,
  data: StaticData,
  report: ValidationEntityReport,
): void {
  const groupSchema = schema.groups[groupName];
  if (!groupSchema) {
    report.errors[ReportMessages.groupNotInSchema].add(groupName);
    return;
  }

  // Validate required fields
  for (const [fieldName, fieldSchema] of Object.entries(groupSchema.fields)) {
    const fieldPath = fieldName;
    const fieldValue = entity[fieldName];

    // Check required fields
    if (fieldSchema.required && (fieldValue === undefined || fieldValue === null || fieldValue === '')) {
      report.errors[ReportMessages.requiredFieldMissing].add(fieldPath);
      continue;
    }

    // Skip validation if field is not present and not required
    if (fieldValue === undefined || fieldValue === null) continue;

    // Validate field type
    if (!validateFieldType(fieldValue, fieldSchema.type, fieldSchema.array)) {
      report.errors[ReportMessages.invalidFieldType].add(fieldPath);
      continue;
    }

    // Validate Ref fields
    if (fieldSchema.type === 'Ref' && fieldSchema.refTo) {
      if (!validateRefTarget(fieldValue, fieldSchema.refTo, data)) {
        report.errors[ReportMessages.invalidRefTarget].add(fieldPath);
      }
    }

    // Validate Object fields recursively
    if (fieldSchema.type === 'Object' && fieldSchema.objName) {
      const objectSchema = groupSchema.objects?.[fieldSchema.objName];
      if (objectSchema) {
        if (fieldSchema.array && Array.isArray(fieldValue)) {
          fieldValue.forEach((obj, index) => {
            validateObjectAgainstSchema(obj, objectSchema, groupName, schema, data, report, `${fieldPath}[${index}]`);
          });
        } else if (!fieldSchema.array && typeof fieldValue === 'object') {
          validateObjectAgainstSchema(fieldValue, objectSchema, groupName, schema, data, report, fieldPath);
        }
      }
    }
  }
}

function validateObjectAgainstSchema(
  obj: any,
  objectSchema: SchemaObject,
  groupName: string,
  schema: Schema,
  data: StaticData,
  report: ValidationEntityReport,
  path: string,
): void {
  for (const [fieldName, fieldSchema] of Object.entries(objectSchema.fields)) {
    const fieldPath = `${path}.${fieldName}`;
    const fieldValue = obj[fieldName];

    // Check required fields
    if (fieldSchema.required && (fieldValue === undefined || fieldValue === null || fieldValue === '')) {
      report.errors[ReportMessages.requiredFieldMissing].add(fieldPath);
      continue;
    }

    // Skip validation if field is not present and not required
    if (fieldValue === undefined || fieldValue === null) continue;

    // Validate field type
    if (!validateFieldType(fieldValue, fieldSchema.type, fieldSchema.array)) {
      report.errors[ReportMessages.invalidFieldType].add(fieldPath);
      continue;
    }

    // Validate Ref fields
    if (fieldSchema.type === 'Ref' && fieldSchema.refTo) {
      if (!validateRefTarget(fieldValue, fieldSchema.refTo, data)) {
        report.errors[ReportMessages.invalidRefTarget].add(fieldPath);
      }
    }

    // Validate nested Object fields recursively
    if (fieldSchema.type === 'Object' && fieldSchema.objName) {
      const groupSchema = schema.groups[groupName];
      const nestedObjectSchema = groupSchema.objects?.[fieldSchema.objName];
      if (nestedObjectSchema) {
        if (fieldSchema.array && Array.isArray(fieldValue)) {
          fieldValue.forEach((nestedObj, index) => {
            validateObjectAgainstSchema(
              nestedObj,
              nestedObjectSchema,
              groupName,
              schema,
              data,
              report,
              `${fieldPath}[${index}]`,
            );
          });
        } else if (!fieldSchema.array && typeof fieldValue === 'object') {
          validateObjectAgainstSchema(fieldValue, nestedObjectSchema, groupName, schema, data, report, fieldPath);
        }
      }
    }
  }
}

function validateAsset(
  val: string,
  tmpBucket: string,
  path: string,
  report: ValidationEntityReport,
  knownAssets: Map<string, Array<{ report: ValidationEntityReport; path: string }>>,
) {
  //check assets extensions
  //assets must be in TMP bucket
  //assets area available
  if (!val || val === '') return true;

  //TODO: should we test everything
  if (val.startsWith('http://') || val.startsWith('https://')) {
    //this is assert
    if (!val.startsWith(tmpBucket)) {
      return false; //tmp bucket asserts allowed only
    }
    if (!assetExtensions.find(ext => val.endsWith(ext))) {
      return false; //allowed  extensions
    }
    if (knownAssets.has(val)) knownAssets.get(val)?.push({ report, path });
    else knownAssets.set(val, [{ report, path }]);
    return true;
  }

  if (assetExtensions.find(ext => val.endsWith(ext))) {
    return false;
  }

  return true;
}

function isAsset(val: string) {
  if (val.startsWith('https://cdn.mobalytics.gg')) return true;
  return false;
}

function findSubstitutions(str: string) {
  const pattern = /\{\{(.*?)\}\}/g;
  const matches = [];
  let match;

  while ((match = pattern.exec(str)) !== null) {
    matches.push(match[1].trim());
  }

  return matches;
}

function isInvalidSubstitutions(str: string, data: StaticData) {
  const subs = findSubstitutions(str);
  subs.forEach(sub => {
    const [index, entity] = sub.split(':');
    if (entity) {
      const [group, id] = entity.split('.');
      if (!data[group]) return true;
      const ent = data[group].find(ent => ent.id == id);
      if (!ent) return true;
    }
  });
  return false;
}

function getAllPaths(o: any, path: string, paths: Set<string>, assets: Map<string, string>) {
  if (o == null) return;

  if (typeof o === 'string') {
    if (isAsset(o)) assets.set(path, o);
  } else if (Array.isArray(o)) {
    let idx = 0;
    for (const i of o) {
      getAllPaths(i, `${path}[${idx}]`, paths, assets);
      idx++;
    }
  } else if (typeof o === 'object') {
    for (const k of Object.keys(o)) {
      const prop = path + '.' + k;
      paths.add(prop);
      if (o[k] != null) getAllPaths(o[k], prop, paths, assets);
    }
  }
}

function fieldChanged(newObject: Entity, oldObject?: Entity) {
  if (!oldObject) return { abscentPaths: [], changedAssets: [] };
  const abscentPaths = new Set<string>();
  const assetsChanges = new Set<string>();
  const oldAssets = new Map<string, string>();
  const oldPaths = new Set<string>();
  const newAssets = new Map<string, string>();
  const newPaths = new Set<string>();
  const changedAssets = new Array<string>();
  getAllPaths(oldObject, '', oldPaths, oldAssets);
  getAllPaths(newObject, '', newPaths, newAssets);

  for (const path of newAssets) {
    if (oldAssets.has(path[0]) && oldAssets.get(path[0]) != path[1]) changedAssets.push(path[0]);
  }

  for (const path of oldPaths) {
    if (!newPaths.has(path) && path !== '.deprecated') {
      abscentPaths.add(path);
    }
  }
  return { abscentPaths: Array.from(abscentPaths), changedAssets };
}

function deepTests(
  o: any,
  path: string,
  config: StaticDataConfig,
  data: StaticData,
  tmpBucket: string,
  knownAssets: Map<string, Array<{ report: ValidationEntityReport; path: string }>>,
  report: ValidationEntityReport,
) {
  if (o == null) return;

  if (typeof o === 'string') {
    //check substitutions ( check all string values)
    if (isInvalidSubstitutions(o, data)) {
      report.errors[ReportMessages.invalidSubstitutions].add(path);
    }
    //check on assert
    if (!validateAsset(o, tmpBucket, path, report, knownAssets))
      report.errors[ReportMessages.invalidAssetURL].add(path);
  } else if (Array.isArray(o)) {
    let idx = 0;
    for (const i of o) {
      deepTests(i, `${path}[${idx}]`, config, data, tmpBucket, knownAssets, report);
      idx++;
    }
  } else if (typeof o === 'object') {
    for (const k of Object.keys(o)) {
      const prop = path + '.' + k;
      //camelCase
      if (!isCamelCase(k)) {
        report.errors[ReportMessages.notInCamelCase].add(prop);
      }
      //all ref and *Ref must be correct ( need config file)
      if (k === 'ref' || k.endsWith('Ref')) {
        if (o[k] !== null && typeof o[k] !== 'string' && !Array.isArray(o[k])) {
          report.errors[ReportMessages.invalidRef].add(prop);
        } else {
          const value = o[k];
          const _prop = prop.replace(/\[\d+\]/g, '');
          const ref = config.refs?.find(ref => ref.from === _prop);
          if (!ref) {
            report.errors[ReportMessages.abscentConfigurationForRef].add(prop);
          } else if (!data[ref.to]) {
            report.errors[ReportMessages.abscentGroupForRef].add(prop);
          } else {
            if (typeof o[k] == 'string') {
              if (!data[ref.to].find(ent => ent.id === value)) {
                report.errors[ReportMessages.abscentIdInRef].add(prop);
              }
            } else if (Array.isArray(o[k])) {
              o[k].forEach(id => {
                if (!data[ref.to].find(ent => ent.id === id)) {
                  report.errors[ReportMessages.abscentIdInRef].add(prop);
                }
              });
            }
          }
        }
      }
      if (o[k] != null) deepTests(o[k], prop, config, data, tmpBucket, knownAssets, report);
    }
  } else if (typeof o === 'number') {
    report.errors[ReportMessages.numberNotAllowed].add(path);
  }
}

export async function validate(
  data: StaticData,
  oldData: StaticData,
  config: StaticDataConfig,
  tmpBucket: string,
  schemaPath?: string,
) {
  const validationReport = {
    errors: {
      unavailableURLs: new Set<string>(),
    } as ValidationRecords,
    warnings: {} as ValidationRecords,
    infos: {} as ValidationRecords,
    byGroup: {} as { [key: string]: Array<ValidationEntityReport> },
  };
  const knownAssets = new Map<string, Array<{ report: ValidationEntityReport; path: string }>>();

  // Read and validate schema if provided
  let schema: Schema | null = null;
  if (schemaPath) {
    schema = readSchema(schemaPath);
    if (!schema) {
      validationReport.errors[ReportMessages.schemaNotFound] = new Set([schemaPath]);
    }
  }

  //groups are flat array Of entities
  for (const group of Object.keys(data)) {
    validationReport.byGroup[group] = new Array<ValidationEntityReport>();
    validationReport.errors[ReportMessages.groupNotArray] = new Set();

    if (!Array.isArray(data[group])) {
      validationReport.errors['Group is not array'].add(group);
      continue;
    }
    const knownIds = new Set();
    const knownSlugs = new Set();
    const knownGameIds = new Set();

    for (const ent of data[group]) {
      const entityReport = {
        entity: ent,
        warnings: {
          [ReportMessages.fieldDisappear]: new Set<string>(),
          [ReportMessages.assetChanged]: new Set<string>(),
          [ReportMessages.deprecated]: new Set<string>(),
          [ReportMessages.slugChanged]: new Set<string>(),
          [ReportMessages.nameChanged]: new Set<string>(),
          //[ReportMessages.URLChanged]:new Set<string>(),
        },
        infos: {
          [ReportMessages.newEntity]: new Set<string>(),
        },
        errors: {
          [ReportMessages.assetTooBig]: new Set<string>(),
          [ReportMessages.assetURLNotAvailable]: new Set<string>(),
          [ReportMessages.abscentID]: new Set<string>(),
          [ReportMessages.duplicatedIds]: new Set<string>(),
          [ReportMessages.mismatchedIds]: new Set<string>(),
          [ReportMessages.duplicatedSlugs]: new Set<string>(),
          [ReportMessages.duplicatedGameIds]: new Set<string>(),
          [ReportMessages.mismatchedSlugs]: new Set<string>(),
          [ReportMessages.notInCamelCase]: new Set<string>(),
          [ReportMessages.abscentConfigurationForRef]: new Set<string>(),
          [ReportMessages.abscentGroupForRef]: new Set<string>(),
          [ReportMessages.invalidRef]: new Set<string>(),
          [ReportMessages.abscentIdInRef]: new Set<string>(),
          [ReportMessages.invalidAssetURL]: new Set<string>(),
          [ReportMessages.invalidSubstitutions]: new Set<string>(),
          [ReportMessages.numberNotAllowed]: new Set<string>(),

          [ReportMessages.justMsg]: new Set<string>(),
          [ReportMessages.justColor]: new Set<string>(),

          // Schema validation errors
          [ReportMessages.requiredFieldMissing]: new Set<string>(),
          [ReportMessages.invalidFieldType]: new Set<string>(),
          [ReportMessages.invalidRefTarget]: new Set<string>(),
          [ReportMessages.groupNotInSchema]: new Set<string>(),
        },
      } as ValidationEntityReport;
      //entities has id
      if (!ent.id) entityReport.errors[ReportMessages.abscentID].add(`${group}.id`);

      //id  is unique in group
      if (ent.id && knownIds.has(ent.id)) {
        entityReport.errors[ReportMessages.duplicatedIds].add(`${group}.id`);
      }
      if (ent.id) knownIds.add(ent.id);
      //slug  is unique in group
      if (ent.slug && knownSlugs.has(ent.slug)) {
        entityReport.errors[ReportMessages.duplicatedSlugs].add(`${group}.slug`);
      }
      if (ent.slug) knownSlugs.add(ent.slug);

      //gameId is unique
      if (ent.gameId && knownGameIds.has(ent.gameId)) {
        entityReport.errors[ReportMessages.duplicatedGameIds].add(`${group}.gameId`);
      }
      if (ent.gameId) knownGameIds.add(ent.gameId);

      //gameId && id == gamId || name && id == slugify(name)
      if (ent.gameId && ent.id) {
        if (ent.gameId !== ent.id) {
          // entityReport.errors[ReportMessages.mismatchedIds].add(`${group}.id`);
          entityReport.errors[ReportMessages.justMsg].add(`wrong id, expected:${ent.gameId}`);
          entityReport.errors[ReportMessages.justColor].add(`${group}.id`);
        }
      } else if (ent.name && ent.id) {
        if (slugify(ent.name) !== ent.id) {
          // entityReport.errors[ReportMessages.mismatchedIds].add(`${group}.id`);
          entityReport.errors[ReportMessages.justMsg].add(`wrong id, expected:${slugify(ent.name)}`);
          entityReport.errors[ReportMessages.justColor].add(`${group}.id`);
        }
      }

      //name && slug == slugify(name)
      //   if(ent.gameId&& ent.slug){
      //      if(slugify(ent.gameId)!==ent.slug){
      //          entityReport.errors[ReportMessages.justMsg].add(`wrong slug, expected:${slugify(ent.name)}`);
      //          entityReport.errors[ReportMessages.justColor].add(`${group}.slug`);
      //      }
      //  }else{
      //      if(ent.name && ent.slug)
      //          if(slugify(ent.name)!==ent.slug){
      //              // entityReport.errors[ReportMessages.mismatchedSlugs].add(`${group}.slug`);
      //              entityReport.errors[ReportMessages.justMsg].add(`wrong slug, expected:${slugify(ent.name)}`);
      //              entityReport.errors[ReportMessages.justColor].add(`${group}.slug`);
      //          }
      //  }

      //new entity
      if (ent.id && oldData[group] && !oldData[group].find(e => e.id == ent.id)) {
        entityReport.infos[ReportMessages.newEntity].add(`${group}.id`);
      }
      if (ent.id && !oldData[group]) {
        entityReport.infos[ReportMessages.newEntity].add(`${group}.id`);
      }
      //deprecated entity
      if (ent.id && ent.deprecated && oldData[group] && oldData[group].find(e => ent.id == e.id && !e.deprecated)) {
        entityReport.warnings[ReportMessages.deprecated].add(`${group}.deprecated`);
      }
      //slug changed
      if (ent.id && ent.slug && oldData[group] && oldData[group].find(e => ent.id == e.id && e.slug !== ent.slug)) {
        entityReport.warnings[ReportMessages.slugChanged].add(`${group}.slug`);
      }
      //name changed
      if (ent.id && ent.name && oldData[group] && oldData[group].find(e => ent.id == e.id && e.name !== ent.name)) {
        entityReport.warnings[ReportMessages.nameChanged].add(`${group}.name`);
      }
      //field disappear
      if (ent.id && oldData[group]) {
        const { abscentPaths, changedAssets } = fieldChanged(
          ent,
          oldData[group].find(e => ent.id == e.id),
        );
        for (const field of abscentPaths) {
          entityReport.warnings[ReportMessages.fieldDisappear].add(`${group}${field}`);
        }
        for (const field of changedAssets) {
          entityReport.warnings[ReportMessages.assetChanged].add(`${group}${field}`);
        }
      }
      //rest tests
      await deepTests(ent, group, config, data, tmpBucket, knownAssets, entityReport);

      // Entity validation according to Schema
      if (schema) {
        validateEntityAgainstSchema(ent, group, schema, data, entityReport);
      }

      validationReport.byGroup[group].push(entityReport);
    }
  }

  // Validate all collected asset URLs
  logger.group(`🔍 Validating assets URLs`);

  const entries = Array.from(knownAssets); // [ [url, reports[]], ... ]
  console.log(`📊 Found ${entries.length} URL references to validate`);

  await processUrlsWithGCS(entries, assetSizeLimit, tmpBucket);

  logger.endGroup();

  return validationReport;
}
