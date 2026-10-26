import { buildSchema } from 'graphql';
import {
  checkGrowth,
  collectFragmentPaths,
  compareFragments,
  entityTypeNames,
  extractGqlFromFragmentFile,
  fragmentStats,
  pathExistsInSchema,
  pathWithinOneLevel,
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
    expect(result).toEqual({
      regressions: [],
      schemaRemovals: [],
      beyondOneLevel: [],
      droppedHelperFragments: [],
      addedCount: 0,
    });
  });
});

describe('summariseDropped', () => {
  it('lists a dropped sub-object once instead of every field under it', () => {
    const result = compareFragments(parse(liveItems), parse(fileFor('fragment WowforItemsFragment on WowforItems { id name }')), schema);
    expect(summariseDropped(result.regressions)).toEqual(['WowforItemsFragment: allowableClasses, quality']);
  });
});

// A schema with the groups query, so entity types are known: items, classes and races are entities,
// item effects are embedded.
const groupedSchema = buildSchema(`
  type WowforRaces { id: String name: String }
  type WowforClasses { id: String name: String color: String races: [WowforRaces] }
  type WowforItemsEffects { slotIndex: Int classRef: WowforClasses }
  type WowforItems { id: String name: String allowableClasses: [WowforClasses] effects: [WowforItemsEffects] }
  type WowforItemsGroup { data: [WowforItems] }
  type WowforClassesGroup { data: [WowforClasses] }
  type WowforRacesGroup { data: [WowforRaces] }
  type WowforStaticDataGroups { items: WowforItemsGroup classes: WowforClassesGroup races: WowforRacesGroup }
  type WowforStaticDataQuery { groups: WowforStaticDataGroups! }
`);

describe('one level of linked entities', () => {
  it('reads the entity types from the groups query', () => {
    expect([...entityTypeNames(groupedSchema)].sort()).toEqual(['WowforClasses', 'WowforItems', 'WowforRaces']);
    expect(entityTypeNames(schema).size).toBe(0);
  });

  it("allows a linked entity's scalars, through embedded types too, but not its own links", () => {
    const entities = entityTypeNames(groupedSchema);
    const within = (path: string) => pathWithinOneLevel(groupedSchema, 'WowforItems', path, entities);
    expect(within('allowableClasses.color')).toBe(true);
    expect(within('effects.classRef.name')).toBe(true);
    expect(within('allowableClasses.races')).toBe(false);
    expect(within('effects.classRef.races.name')).toBe(false);
  });

  it('allows dropping fields an over-expanded live query fetched beyond one level', () => {
    const live = parse(fileFor(`
      fragment WowforItemsFragment on WowforItems {
        id
        allowableClasses { id color races { id name } }
      }
    `));
    const fresh = parse(fileFor('fragment WowforItemsFragment on WowforItems { id allowableClasses { id } }'));
    const result = compareFragments(live, fresh, groupedSchema);
    expect(result.regressions.map(r => r.path)).toEqual(['allowableClasses.color']);
    expect(result.beyondOneLevel.map(r => r.path).sort()).toEqual([
      'allowableClasses.races',
      'allowableClasses.races.id',
      'allowableClasses.races.name',
    ]);
  });

  it('allows dropping a helper fragment on an embedded type, but not one on an entity type', () => {
    const live = parse(fileFor(`
      fragment WowforItemsEffectsFragment on WowforItemsEffects { slotIndex }
      fragment WowforRacesFragment on WowforRaces { id name }
    `));
    const result = compareFragments(live, [], groupedSchema);
    expect(result.droppedHelperFragments).toEqual(['WowforItemsEffectsFragment']);
    expect(result.regressions.map(r => r.path).sort()).toEqual(['id', 'name']);
  });
});

describe('checkGrowth', () => {
  const limits = { maxFieldRatio: 3, maxDepthIncrease: 1 };

  it('counts fields and the deepest path', () => {
    expect(fragmentStats(parse(liveItems))).toEqual({ fields: 11, maxDepth: 2 });
  });

  it('passes a similar-sized regeneration', () => {
    const result = checkGrowth(parse(liveItems), parse(liveItems), limits);
    expect(result.tooManyFields).toBe(false);
    expect(result.tooDeep).toBe(false);
  });

  it('flags a regeneration that expands linked types far deeper', () => {
    const oneDeeper = parse(fileFor('fragment F on WowforItems { id allowableClasses { id races { id } } }'));
    const twoDeeper = parse(fileFor('fragment F on WowforItems { id allowableClasses { id races { id classes { id } } } }'));
    expect(checkGrowth(parse(liveItems), oneDeeper, limits).tooDeep).toBe(false);
    expect(checkGrowth(parse(liveItems), twoDeeper, limits).tooDeep).toBe(true);
  });

  it('flags a regeneration with many times the fields', () => {
    const small = parse(fileFor('fragment WowforItemsFragment on WowforItems { id name }'));
    const result = checkGrowth(small, parse(liveItems), limits);
    expect(result.live.fields).toBe(2);
    expect(result.fresh.fields).toBe(11);
    expect(result.tooManyFields).toBe(true);
  });
});
