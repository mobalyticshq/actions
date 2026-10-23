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
 * Compares freshly generated fragments with the ones that are live. A field the live fragments
 * select that the new ones do not is a regression if the schema still has it - the generator
 * dropped it - and an acceptable removal if the schema no longer has it.
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

  for (const liveFragment of live) {
    const freshFragment = freshByName.get(liveFragment.name);
    for (const path of liveFragment.paths) {
      if (freshFragment?.paths.has(path)) {
        continue;
      }
      const dropped = { fragment: liveFragment.name, typeCondition: liveFragment.typeCondition, path };
      if (pathExistsInSchema(schema, liveFragment.typeCondition, path)) {
        regressions.push(dropped);
      } else {
        schemaRemovals.push(dropped);
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

  return { regressions, schemaRemovals, addedCount };
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
