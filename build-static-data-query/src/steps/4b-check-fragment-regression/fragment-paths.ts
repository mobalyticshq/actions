import {
  Kind,
  parse,
  getNamedType,
  isInterfaceType,
  isObjectType,
  type GraphQLNamedType,
  type GraphQLSchema,
  type SelectionSetNode,
} from 'graphql';

export interface FragmentInfo {
  name: string;
  typeCondition: string;
  /** Every selected field as a dotted path from the fragment root, e.g. "quality.color". */
  paths: Set<string>;
}

export interface DroppedField {
  fragment: string;
  typeCondition: string;
  path: string;
}

export interface FragmentComparison {
  /** Selected in the live fragments, missing from the new ones, and still in the schema. */
  regressions: DroppedField[];
  /** Selected in the live fragments, missing from the new ones, and gone from the schema too. */
  schemaRemovals: DroppedField[];
  /**
   * Selected in the live fragments, missing from the new ones, and deeper than one level of linked
   * entities - fields an over-expanded live query fetched that the generator is not meant to.
   */
  beyondOneLevel: DroppedField[];
  /**
   * Live fragments on embedded (non-entity) types with no new counterpart. The generator is asked
   * for entity fragments only; their fields are covered through the entity fragments.
   */
  droppedHelperFragments: string[];
  /** Paths the new fragments select that the live ones did not. */
  addedCount: number;
}

/**
 * Pulls the GraphQL document out of a generated `*-fragment.gql.ts` file, which wraps it in a
 * gql`...` template literal. Interpolations (`${...}`) are dropped; fragments are compared one by one.
 */
export function extractGqlFromFragmentFile(source: string): string {
  const start = source.indexOf('`');
  const end = source.lastIndexOf('`');
  if (start < 0 || end <= start) {
    throw new Error('No gql template literal found');
  }
  return source.slice(start + 1, end).replace(/\$\{[^}]*\}/g, '');
}

function collectPaths(selectionSet: SelectionSetNode, prefix: string[], paths: Set<string>): void {
  for (const selection of selectionSet.selections) {
    if (selection.kind === Kind.FIELD) {
      const fieldPath = [...prefix, selection.name.value];
      paths.add(fieldPath.join('.'));
      if (selection.selectionSet) {
        collectPaths(selection.selectionSet, fieldPath, paths);
      }
    } else if (selection.kind === Kind.INLINE_FRAGMENT) {
      collectPaths(selection.selectionSet, prefix, paths);
    }
    // Fragment spreads are skipped: the spread fragment is compared on its own.
  }
}

export function collectFragmentPaths(gqlText: string): FragmentInfo[] {
  const document = parse(gqlText);
  const fragments: FragmentInfo[] = [];
  for (const definition of document.definitions) {
    if (definition.kind !== Kind.FRAGMENT_DEFINITION) {
      continue;
    }
    const paths = new Set<string>();
    collectPaths(definition.selectionSet, [], paths);
    fragments.push({
      name: definition.name.value,
      typeCondition: definition.typeCondition.name.value,
      paths,
    });
  }
  return fragments;
}

/** Whether `path` can still be selected from `typeName` in the given schema. */
export function pathExistsInSchema(schema: GraphQLSchema, typeName: string, path: string): boolean {
  let type: GraphQLNamedType | undefined | null = schema.getType(typeName);
  for (const segment of path.split('.')) {
    if (!type || !(isObjectType(type) || isInterfaceType(type))) {
      return false;
    }
    const field = type.getFields()[segment];
    if (!field) {
      return false;
    }
    type = getNamedType(field.type);
  }
  return true;
}

/**
 * The entity types: the item type of each group's `data` field under `<Game>StaticDataQuery.groups`.
 * Empty when the schema has no such query type.
 */
export function entityTypeNames(schema: GraphQLSchema): Set<string> {
  const entities = new Set<string>();
  for (const type of Object.values(schema.getTypeMap())) {
    if (!isObjectType(type) || !type.name.endsWith('StaticDataQuery')) {
      continue;
    }
    const groupsField = type.getFields()['groups'];
    const groups = groupsField && getNamedType(groupsField.type);
    if (!groups || !isObjectType(groups)) {
      continue;
    }
    for (const group of Object.values(groups.getFields())) {
      const groupType = getNamedType(group.type);
      const data = isObjectType(groupType) ? groupType.getFields()['data'] : undefined;
      if (data) {
        entities.add(getNamedType(data.type).name);
      }
    }
  }
  return entities;
}

/**
 * Whether `path` stays within one level of linked entities, as the generator is told to: a linked
 * entity contributes its scalar fields only, never its own object-type fields.
 */
export function pathWithinOneLevel(
  schema: GraphQLSchema,
  typeName: string,
  path: string,
  entities: Set<string>,
): boolean {
  let type: GraphQLNamedType | undefined | null = schema.getType(typeName);
  let insideLinkedEntity = false;
  for (const segment of path.split('.')) {
    if (!type || !(isObjectType(type) || isInterfaceType(type))) {
      return true;
    }
    const field = type.getFields()[segment];
    if (!field) {
      return true;
    }
    type = getNamedType(field.type);
    const isObject = isObjectType(type) || isInterfaceType(type);
    if (isObject && insideLinkedEntity) {
      return false;
    }
    if (isObject && entities.has(type.name)) {
      insideLinkedEntity = true;
    }
  }
  return true;
}

/**
 * Compares freshly generated fragments with the ones that are live. A field the live fragments
 * select that the new ones do not is a regression if the schema still has it - the generator
 * dropped it - and an acceptable removal if the schema no longer has it, or if it sits deeper than
 * one level of linked entities.
 */
export function compareFragments(
  live: FragmentInfo[],
  fresh: FragmentInfo[],
  schema: GraphQLSchema,
): FragmentComparison {
  const freshByName = new Map(fresh.map(fragment => [fragment.name, fragment]));
  const liveByName = new Map(live.map(fragment => [fragment.name, fragment]));
  const regressions: DroppedField[] = [];
  const schemaRemovals: DroppedField[] = [];
  const beyondOneLevel: DroppedField[] = [];
  const droppedHelperFragments: string[] = [];
  const entities = entityTypeNames(schema);

  for (const liveFragment of live) {
    const freshFragment = freshByName.get(liveFragment.name);
    if (!freshFragment && entities.size > 0 && !entities.has(liveFragment.typeCondition)) {
      droppedHelperFragments.push(liveFragment.name);
      continue;
    }
    for (const path of liveFragment.paths) {
      if (freshFragment?.paths.has(path)) {
        continue;
      }
      const dropped = { fragment: liveFragment.name, typeCondition: liveFragment.typeCondition, path };
      if (!pathExistsInSchema(schema, liveFragment.typeCondition, path)) {
        schemaRemovals.push(dropped);
      } else if (!pathWithinOneLevel(schema, liveFragment.typeCondition, path, entities)) {
        beyondOneLevel.push(dropped);
      } else {
        regressions.push(dropped);
      }
    }
  }

  let addedCount = 0;
  for (const freshFragment of fresh) {
    const liveFragment = liveByName.get(freshFragment.name);
    for (const path of freshFragment.paths) {
      if (!liveFragment?.paths.has(path)) {
        addedCount++;
      }
    }
  }

  return { regressions, schemaRemovals, beyondOneLevel, droppedHelperFragments, addedCount };
}

export interface FragmentStats {
  /** Total selected fields across all fragments. */
  fields: number;
  /** Deepest selection, counted in path segments ("effects.spell.name" is 3). */
  maxDepth: number;
}

export function fragmentStats(fragments: FragmentInfo[]): FragmentStats {
  let fields = 0;
  let maxDepth = 0;
  for (const fragment of fragments) {
    for (const path of fragment.paths) {
      fields++;
      maxDepth = Math.max(maxDepth, path.split('.').length);
    }
  }
  return { fields, maxDepth };
}

export interface GrowthLimits {
  /** Fail when the new fragments select more than this many times the live field count. */
  maxFieldRatio: number;
  /** Fail when the new fragments nest more than this many levels deeper than the live ones. */
  maxDepthIncrease: number;
}

export interface GrowthCheck {
  live: FragmentStats;
  fresh: FragmentStats;
  tooManyFields: boolean;
  tooDeep: boolean;
}

/**
 * The opposite failure to a regression: the generator expanding linked types far deeper than the
 * live query does, producing a query too large for the GraphQL server to accept.
 */
export function checkGrowth(live: FragmentInfo[], fresh: FragmentInfo[], limits: GrowthLimits): GrowthCheck {
  const liveStats = fragmentStats(live);
  const freshStats = fragmentStats(fresh);
  return {
    live: liveStats,
    fresh: freshStats,
    tooManyFields: freshStats.fields > liveStats.fields * limits.maxFieldRatio,
    tooDeep: freshStats.maxDepth > liveStats.maxDepth + limits.maxDepthIncrease,
  };
}

/**
 * One line per fragment listing its dropped paths. When a whole sub-object was dropped, only the
 * sub-object is listed - "grid.talent", not also "grid.talent.iconUrl", "grid.talent.name", ...
 */
export function summariseDropped(dropped: DroppedField[]): string[] {
  const byFragment = new Map<string, Set<string>>();
  for (const field of dropped) {
    if (!byFragment.has(field.fragment)) {
      byFragment.set(field.fragment, new Set());
    }
    byFragment.get(field.fragment)!.add(field.path);
  }
  const lines: string[] = [];
  for (const [fragment, paths] of byFragment) {
    const topMost = [...paths].filter(path => {
      const segments = path.split('.');
      for (let i = 1; i < segments.length; i++) {
        if (paths.has(segments.slice(0, i).join('.'))) {
          return false;
        }
      }
      return true;
    });
    lines.push(`${fragment}: ${topMost.sort().join(', ')}`);
  }
  return lines.sort();
}
