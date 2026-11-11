import { validate } from './utils';
import { processUrlsInChunks } from '../../utils/assets-utils';

// The asset rules hand every accepted URL to a GCS lookup; here the lookup is a no-op
jest.mock('../../utils/assets-utils', () => ({ processUrlsInChunks: jest.fn(async () => undefined) }));

const TMP = 'https://cdn.mobalytics.gg/assets/x';
type Options = { old?: any; refs?: { from: string; to: string }[]; schema?: any; before?: boolean };
const run = (data: any, { old = {}, refs = [], schema = null, before = true }: Options = {}) => validate(data, old, { refs }, TMP, schema, before);

// 'message @ path' for every finding of a level: report-wide records and entity rows together
const found = (report: any, level: 'errors' | 'warnings' | 'infos') => {
  const out: string[] = [];
  const collect = (records: Record<string, Set<string>>) => Object.entries(records).forEach(([message, paths]) => paths.forEach(p => out.push(`${message} @ ${p}`)));
  collect(report[level]);
  (Object.values(report.byGroup).flat() as any[]).forEach(row => collect(row[level]));
  return out.sort();
};
const errors = async (data: any, options?: Options) => found(await run(data, options), 'errors');
const warnings = async (data: any, options?: Options) => found(await run(data, options), 'warnings');

beforeAll(() => jest.spyOn(console, 'log').mockImplementation(() => undefined));

describe('validate - ids, slugs and gameIds', () => {
  it('requires an id', async () => {
    expect(await errors({ items: [{ name: 'Sword' }] })).toEqual(['id is abscent @ items.id']);
  });

  it('rejects a repeated id, slug or gameId inside a group, not across groups', async () => {
    expect(await errors({ items: [{ id: 'a' }, { id: 'a' }], spells: [{ id: 'a' }] })).toEqual(['id is not uniq @ items.id']);
    expect(await errors({ items: [{ id: 'a', slug: 's' }, { id: 'b', slug: 's' }] })).toEqual(['slug is not uniq @ items.slug']);
    expect(await errors({ items: [{ id: '1', gameId: '1' }, { id: '1b', gameId: '1' }] })).toEqual([
      'gameId is not uniq @ items.gameId',
      'wrong id, expected: @ wrong id, expected:1',
    ]);
  });

  it('holds a deprecated row to the slug rule too (STD-1862 is about relaxing exactly this)', async () => {
    const items = [
      { id: 'old', slug: 'iron-will', deprecated: true },
      { id: 'new', slug: 'iron-will', deprecated: false },
    ];
    expect(await errors({ items })).toEqual(['slug is not uniq @ items.slug']);
  });

  it('wants id to equal gameId when there is one, in both passes', async () => {
    const data = { items: [{ id: 'sword', gameId: '17', name: 'Sword' }] };
    expect(await errors(data)).toEqual(['wrong id, expected: @ wrong id, expected:17']);
    expect(await errors(data, { before: false })).toEqual(['wrong id, expected: @ wrong id, expected:17']);
  });

  it('wants id to equal slugify(name) otherwise, but only before the spreadsheet override', async () => {
    const data = { items: [{ id: 'sword', name: 'Iron Will' }] };
    expect(await errors(data)).toEqual(['wrong id, expected: @ wrong id, expected:iron-will']);
    expect(await errors(data, { before: false })).toEqual([]);
    expect(await errors({ items: [{ id: 'iron-will', name: 'Iron Will' }] })).toEqual([]);
  });
});

describe('validate - changes against the previous state', () => {
  it('marks an entity as new when its id or its whole group was not there before', async () => {
    const data = { items: [{ id: 'a' }, { id: 'b' }] };
    expect(found(await run(data, { old: { items: [{ id: 'a' }] } }), 'infos')).toEqual(['new entity @ items.id']);
    expect(found(await run(data), 'infos')).toHaveLength(2);
  });

  it('warns once when a live entity becomes deprecated', async () => {
    const data = { items: [{ id: 'a', deprecated: true }] };
    expect(await warnings(data, { old: { items: [{ id: 'a', deprecated: false }] } })).toEqual(['entity deprecated @ items.deprecated']);
    expect(await warnings(data, { old: { items: [{ id: 'a', deprecated: true }] } })).toEqual([]);
  });

  it('warns on a changed slug and a changed name', async () => {
    const old = { items: [{ id: 'a', slug: 'a', name: 'A' }] };
    expect(await warnings({ items: [{ id: 'a', slug: 'a2', name: 'A2' }] }, { old, before: false })).toEqual([
      'name changed @ items.name',
      'slug changed @ items.slug',
    ]);
  });

  it('warns on every path that disappeared, nested ones included, but not on deprecated', async () => {
    const old = { items: [{ id: 'a', power: '5', stats: { crit: '1', haste: '2' }, deprecated: false }] };
    expect(await warnings({ items: [{ id: 'a', stats: { haste: '2' } }] }, { old })).toEqual([
      'field disappear @ items.power',
      'field disappear @ items.stats.crit',
    ]);
  });

  it('warns when an asset URL changes and sends the new one to the bucket check', async () => {
    const old = { items: [{ id: 'a', iconUrl: `${TMP}/a.png` }] };
    expect(await warnings({ items: [{ id: 'a', iconUrl: `${TMP}/b.png` }] }, { old })).toEqual(['asset changed @ items.iconUrl']);
    const [entries] = (processUrlsInChunks as jest.Mock).mock.calls.at(-1);
    expect(entries.map(([url]: [string]) => url)).toEqual([`${TMP}/b.png`]);
  });
});

describe('validate - rules applied to every value', () => {
  it('wants camelCase keys at any depth', async () => {
    expect(await errors({ items: [{ id: 'a', Bad_key: 'x', stats: [{ also_bad: 'y' }] }] })).toEqual([
      'not in camel case @ items.Bad_key',
      'not in camel case @ items.stats[0].also_bad',
    ]);
  });

  it('rejects every number - there is no Int or Float yet', async () => {
    expect(await errors({ items: [{ id: 'a', power: 5, levels: ['1', 2.5] }] })).toEqual([
      'number is not allowed @ items.levels[1]',
      'number is not allowed @ items.power',
    ]);
  });

  it('accepts an asset only from the tmp folder and with a known extension', async () => {
    const bad = (iconUrl: string) => errors({ items: [{ id: 'a', iconUrl }] });
    expect(await bad('https://cdn.mobalytics.gg/assets/other-game/a.png')).toEqual(['invalid asset URL @ items.iconUrl']);
    expect(await bad(`${TMP}/a.txt`)).toEqual(['invalid asset URL @ items.iconUrl']);
    // a cache-busting suffix fails the extension check today
    expect(await bad(`${TMP}/a.png?v1`)).toEqual(['invalid asset URL @ items.iconUrl']);
    // a file name that is not a URL at all
    expect(await bad('a.png')).toEqual(['invalid asset URL @ items.iconUrl']);
    expect(await bad(`${TMP}/a.png`)).toEqual([]);
    expect(await bad('plain text')).toEqual([]);
  });
});

describe('validate - refs declared in the schema', () => {
  const refs = [
    { from: 'items.spellRef', to: 'spells' },
    { from: 'items.spellRefs', to: 'spells' },
    { from: 'items.effects.spellRef', to: 'spells' },
    { from: 'items.setRef', to: 'sets' },
  ];
  const spells = [{ id: 'fire' }];
  const check = (item: object) => errors({ items: [{ id: 'a', ...item }], spells }, { refs });

  it('resolves a string, an array and a ref inside an array of objects', async () => {
    expect(await check({ spellRef: 'fire', spellRefs: ['fire'], effects: [{ spellRef: 'fire' }] })).toEqual([]);
    expect(await check({ spellRef: 'ice' })).toEqual(["can't find entity in referenced group @ items.spellRef"]);
    expect(await check({ spellRefs: ['fire', 'ice'] })).toEqual(["can't find entity in referenced group @ items.spellRefs"]);
    expect(await check({ effects: [{ spellRef: 'fire' }, { spellRef: 'ice' }] })).toEqual(["can't find entity in referenced group @ items.effects[1].spellRef"]);
  });

  it('takes null as no ref, and an empty string as a ref to nothing', async () => {
    expect(await check({ spellRef: null })).toEqual([]);
    expect(await check({ spellRef: '' })).toEqual(["can't find entity in referenced group @ items.spellRef"]);
  });

  it('rejects a ref of the wrong type and a ref to a group that is not in the data', async () => {
    expect(await check({ spellRef: { id: 'fire' } })).toEqual(['wrong field type for ref @ items.spellRef']);
    expect(await check({ setRef: 'tier-1' })).toEqual(["can't find group for ref @ items.setRef"]);
  });

  it('leaves a field alone when the schema does not declare it as a ref', async () => {
    expect(await check({ otherRef: 'ice' })).toEqual([]);
  });
});

describe('validate - the group and its schema', () => {
  const schema = {
    groups: {
      items: {
        fields: {
          id: { type: 'String', required: true },
          name: { type: 'String', required: true },
          tags: { type: 'String', array: true },
          crafted: { type: 'Boolean' },
          spellRef: { type: 'Ref', refTo: 'spells' },
          stats: { type: 'Object', objName: 'stats' },
          effects: { type: 'Object', objName: 'effects', array: true },
        },
        objects: {
          stats: { fields: { crit: { type: 'String', required: true } } },
          effects: { fields: { value: { type: 'String', required: true }, spellRef: { type: 'Ref', refTo: 'spells' } } },
        },
      },
      spells: { fields: { id: { type: 'String', required: true } } },
    },
  };
  const spells = [{ id: 'fire' }];
  const check = (item: object) => errors({ items: [{ id: 'a', name: 'a', ...item }], spells }, { schema });

  it('reports a group that is not an array, wherever it sits in the file', async () => {
    expect(await errors({ items: 'oops', spells: [] })).toEqual(['Group is not array @ items']);
    expect(await errors({ spells: [], items: 'oops' })).toEqual(['Group is not array @ items']);
  });

  it('reports a group the schema does not know, unless every row in it is deprecated', async () => {
    expect(await errors({ extra: [{ id: 'a' }] }, { schema })).toEqual(['group not found in schema @ extra']);
    expect(await errors({ extra: [{ id: 'a', deprecated: true }] }, { schema })).toEqual([]);
  });

  it('requires required fields - an empty string counts as missing', async () => {
    expect(await errors({ items: [{ id: 'a' }], spells }, { schema })).toEqual(['required field is missing @ items.name']);
    expect(await check({ name: '' })).toEqual(['required field is missing @ items.name']);
  });

  it('checks the type of a present value and skips null', async () => {
    expect(await check({ crafted: 'yes', tags: 'one', stats: [] })).toEqual([
      'invalid field type @ items.crafted',
      'invalid field type @ items.stats',
      'invalid field type @ items.tags',
    ]);
    expect(await check({ crafted: null, tags: null, stats: null, spellRef: null })).toEqual([]);
  });

  it('resolves a Ref - an empty string is a broken ref, not an absent one', async () => {
    expect(await check({ spellRef: 'fire' })).toEqual([]);
    expect(await check({ spellRef: 'ice' })).toEqual(['invalid ref target @ items.spellRef']);
    expect(await check({ spellRef: '' })).toEqual(['invalid ref target @ items.spellRef']);
  });

  it('validates nested objects and points at the field inside them', async () => {
    expect(await check({ stats: {} })).toEqual(['required field is missing @ items.stats.crit']);
    expect(await check({ effects: [{ value: '1' }, { value: '2', spellRef: 'ice' }, {}] })).toEqual([
      'invalid ref target @ items.effects[1].spellRef',
      'required field is missing @ items.effects[2].value',
    ]);
  });
});
