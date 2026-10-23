import { buildSchema } from 'graphql';
import {
  collectFragmentPaths,
  compareFragments,
  extractGqlFromFragmentFile,
  pathExistsInSchema,
  summariseDropped,
} from './fragment-paths';

// A cut-down cleaned schema in the shape the generator works from.
const schema = buildSchema(`
  type WowforItemQualities { id: String name: String color: String }
  type WowforClasses { id: String name: String color: String iconUrl: String }
  type WowforItems { id: String name: String quality: WowforItemQualities allowableClasses: [WowforClasses] }
  type WowforLegacyPerks { id: String name: String tree: String }
`);

const fileFor = (body: string) => `import { gql } from '@apollo/client';

export const FragmentGql = gql\`
  ${body}
\`;
`;

// What the live query selected (complete).
const liveItems = fileFor(`
  fragment WowforItemsFragment on WowforItems {
    id
    name
    quality { id name color }
    allowableClasses { id name color iconUrl }
  }
`);

// What a narrowed regeneration produced: every linked type cut to { id name }.
const narrowedItems = fileFor(`
  fragment WowforItemsFragment on WowforItems {
    id
    name
    quality { id name }
    allowableClasses { id name }
  }
`);

const parse = (source: string) => collectFragmentPaths(extractGqlFromFragmentFile(source));

describe('collectFragmentPaths', () => {
  it('reads the fragment out of a generated .gql.ts file and lists every field as a path', () => {
    const [fragment] = parse(liveItems);
    expect(fragment.name).toBe('WowforItemsFragment');
    expect(fragment.typeCondition).toBe('WowforItems');
    expect([...fragment.paths].sort()).toEqual([
      'allowableClasses',
      'allowableClasses.color',
      'allowableClasses.iconUrl',
      'allowableClasses.id',
      'allowableClasses.name',
      'id',
      'name',
      'quality',
      'quality.color',
      'quality.id',
      'quality.name',
    ]);
  });

  it('ignores template interpolations', () => {
    const source = fileFor('fragment F on WowforItems { id }\n  ${OtherFragmentGql}');
    expect(parse(source)[0].paths).toEqual(new Set(['id']));
  });
});

describe('pathExistsInSchema', () => {
  it('follows linked types', () => {
    expect(pathExistsInSchema(schema, 'WowforItems', 'quality.color')).toBe(true);
    expect(pathExistsInSchema(schema, 'WowforItems', 'quality.missing')).toBe(false);
    expect(pathExistsInSchema(schema, 'NoSuchType', 'id')).toBe(false);
  });
});

describe('compareFragments', () => {
  it('flags fields the generator dropped while the schema still has them', () => {
    const result = compareFragments(parse(liveItems), parse(narrowedItems), schema);
    expect(result.regressions.map(r => r.path).sort()).toEqual([
      'allowableClasses.color',
      'allowableClasses.iconUrl',
      'quality.color',
    ]);
    expect(result.schemaRemovals).toEqual([]);
  });

  it('allows fields the schema itself removed', () => {
    const live = parse(fileFor('fragment F on WowforItems { id iconFileId }'));
    const fresh = parse(fileFor('fragment F on WowforItems { id }'));
    const result = compareFragments(live, fresh, schema);
    expect(result.regressions).toEqual([]);
    expect(result.schemaRemovals.map(r => r.path)).toEqual(['iconFileId']);
  });

  it('allows additions, including a whole new fragment', () => {
    const fresh = [...parse(liveItems), ...parse(fileFor('fragment WowforLegacyPerksFragment on WowforLegacyPerks { id name tree }'))];
    const result = compareFragments(parse(liveItems), fresh, schema);
    expect(result.regressions).toEqual([]);
    expect(result.addedCount).toBe(3);
  });

  it('flags a fragment that disappeared while its type is still in the schema', () => {
    const result = compareFragments(parse(liveItems), [], schema);
    expect(result.regressions).toHaveLength(parse(liveItems)[0].paths.size);
  });

  it('passes identical fragments', () => {
    const result = compareFragments(parse(liveItems), parse(liveItems), schema);
    expect(result).toEqual({ regressions: [], schemaRemovals: [], addedCount: 0 });
  });
});

describe('summariseDropped', () => {
  it('lists a dropped sub-object once instead of every field under it', () => {
    const result = compareFragments(parse(liveItems), parse(fileFor('fragment WowforItemsFragment on WowforItems { id name }')), schema);
    expect(summariseDropped(result.regressions)).toEqual(['WowforItemsFragment: allowableClasses, quality']);
  });
});
