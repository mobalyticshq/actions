import * as fs from 'fs';
import * as path from 'path';
import * as core from '@actions/core';
import {
  buildSchema,
  getNamedType,
  isInterfaceType,
  isLeafType,
  isNonNullType,
  isObjectType,
  isUnionType,
  type GraphQLNamedType,
  type GraphQLObjectType,
  type GraphQLSchema,
} from 'graphql';

const SCHEMA_PATH = '_generated/cleaned-schema.graphql';
const OUTPUT_DIR = 'build/gql';
const INDENT = '  ';

export interface GenerateFragmentsOptions {
  gameField: string;
  staticDataFieldName: string;
}

export interface GeneratedFragment {
  fileName: string;
  content: string;
}

function getObjectFieldType(type: GraphQLObjectType, fieldName: string): GraphQLObjectType {
  const field = type.getFields()[fieldName];
  if (!field) {
    throw new Error(`Field '${fieldName}' not found in type '${type.name}'`);
  }

  const fieldType = getNamedType(field.type);
  if (!isObjectType(fieldType)) {
    throw new Error(`Field '${type.name}.${fieldName}' is not an object type`);
  }

  return fieldType;
}

export function getEntityTypes(schema: GraphQLSchema, options: GenerateFragmentsOptions): GraphQLObjectType[] {
  const queryType = schema.getQueryType();
  if (!queryType) {
    throw new Error('Schema has no Query type');
  }

  const gameType = getObjectFieldType(queryType, options.gameField);
  const staticDataType = getObjectFieldType(gameType, options.staticDataFieldName);
  const groupsType = getObjectFieldType(staticDataType, 'groups');

  return Object.keys(groupsType.getFields()).map(groupName =>
    getObjectFieldType(getObjectFieldType(groupsType, groupName), 'data'),
  );
}

function block(header: string, body: string[]): string[] {
  if (body.length === 0) {
    return [];
  }
  return [`${header} {`, ...body.map(line => INDENT + line), '}'];
}

/**
 * Entities from other groups are selected by their scalar fields only: the client already loads every
 * group in full and links entities by id, so expanding them again only multiplies the response size.
 * Embedded value objects (stats, bonuses, grid cells...) are expanded recursively, falling back to
 * scalars only for a type that is already on the current path.
 */
function selectType(type: GraphQLNamedType, entityNames: Set<string>, ancestors: ReadonlySet<string>): string[] {
  if (isUnionType(type)) {
    return [
      '__typename',
      ...type.getTypes().flatMap(member => block(`... on ${member.name}`, selectType(member, entityNames, ancestors))),
    ];
  }

  const isExpandable = !entityNames.has(type.name) && !ancestors.has(type.name);
  return selectFields(type, entityNames, isExpandable ? new Set([...ancestors, type.name]) : null);
}

function selectFields(
  type: GraphQLNamedType,
  entityNames: Set<string>,
  ancestors: ReadonlySet<string> | null,
): string[] {
  if (!isObjectType(type) && !isInterfaceType(type)) {
    return [];
  }

  return Object.values(type.getFields()).flatMap(field => {
    if (field.args.some(arg => isNonNullType(arg.type))) {
      return [];
    }

    const fieldType = getNamedType(field.type);
    if (isLeafType(fieldType)) {
      return [field.name];
    }

    return ancestors ? block(field.name, selectType(fieldType, entityNames, ancestors)) : [];
  });
}

function toKebabCase(value: string): string {
  return value.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

export function buildFragments(schema: GraphQLSchema, options: GenerateFragmentsOptions): GeneratedFragment[] {
  const entityTypes = getEntityTypes(schema, options);
  const entityNames = new Set(entityTypes.map(type => type.name));

  return entityTypes.map(type => {
    const fragmentName = `${type.name}Fragment`;
    const selections = selectFields(type, entityNames, new Set([type.name]));
    const fragment = block(`fragment ${fragmentName} on ${type.name}`, selections);

    return {
      fileName: `${toKebabCase(type.name)}-fragment.gql.ts`,
      content: [
        `import { gql } from '@apollo/client';`,
        '',
        `export const ${fragmentName}Gql = gql\``,
        ...fragment.map(line => INDENT + line),
        '`;',
        '',
      ].join('\n'),
    };
  });
}

export async function generateFragments(options: GenerateFragmentsOptions): Promise<void> {
  const schemaPath = path.resolve(process.cwd(), SCHEMA_PATH);
  const outputDir = path.resolve(process.cwd(), OUTPUT_DIR);

  const schema = buildSchema(fs.readFileSync(schemaPath, 'utf-8'));
  const fragments = buildFragments(schema, options);

  fs.mkdirSync(outputDir, { recursive: true });
  for (const { fileName, content } of fragments) {
    fs.writeFileSync(path.join(outputDir, fileName), content, 'utf-8');
    core.info(`✓ ${fileName}`);
  }

  core.info(`✓ Generated ${fragments.length} fragments in ${OUTPUT_DIR}`);
}
