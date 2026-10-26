import { applySheet, diffStaticData, formatShadowLine, isPipelineProduced, pickBucketBase, selectIncoming, shadowMerge } from './shadow-bucket-base';

describe('pickBucketBase', () => {
  it('takes the highest version numerically, ignoring other objects', () => {
    expect(pickBucketBase(['static_data_v0.0.9.json', 'static_data_v0.0.34.json', 'schema.json', 'static_data_v0.010.json'])).toBe('static_data_v0.0.34.json');
    expect(pickBucketBase(['schema.json'])).toBeNull();
  });
});

describe('isPipelineProduced', () => {
  it('requires the deprecated key on every entity', () => {
    expect(isPipelineProduced({ a: [{ id: '1', deprecated: false }], b: [{ id: '2', deprecated: true }] })).toBe(true);
    // rb_dev 2026-10-26: a raw extractor file copied into the bucket by hand
    expect(isPipelineProduced({ a: [{ id: '1' }] })).toBe(false);
    expect(isPipelineProduced({})).toBe(false);
  });
});

describe('selectIncoming', () => {
  it('keeps git files with version >= base, oldest first', () => {
    const v = ['x/static_data_v0.0.35.json', 'x/static_data_v0.0.33.json', 'x/static_data_v0.0.34.json', 'x/static_data_v0.0.36.json', 'x/schema.json'];
    expect(selectIncoming(v, 'static_data_v0.0.34.json')).toEqual(['x/static_data_v0.0.34.json', 'x/static_data_v0.0.35.json', 'x/static_data_v0.0.36.json']);
    expect(selectIncoming(v, 'static_data_v0.0.40.json')).toEqual([]);
  });
});

describe('shadowMerge', () => {
  const base = { spells: [{ id: 'a', name: 'A', deprecated: false }, { id: 'old', name: 'Old', deprecated: true }] };

  it('retires what the new file dropped and keeps what the base already retired', () => {
    const out = shadowMerge(base, [{ spells: [{ id: 'b', name: 'B' }] }]);
    expect(out.spells.map(e => [e.id, e.deprecated])).toEqual([['a', true], ['old', true], ['b', false]]);
  });

  it('re-merging the base version itself leaves live entities live', () => {
    const out = shadowMerge(base, [{ spells: [{ id: 'a', name: 'A' }] }]);
    expect(out.spells.map(e => [e.id, e.deprecated])).toEqual([['a', false], ['old', true]]);
  });

  it('skips an invalid older file but refuses an invalid newest one, as the merge step does', () => {
    expect(shadowMerge(base, [{ spells: [{ id: 'dup' }, { id: 'dup' }] }, { spells: [{ id: 'a' }] }]).spells.some(e => e.id === 'dup')).toBe(false);
    expect(() => shadowMerge(base, [{ spells: [{ id: 'dup' }, { id: 'dup' }] }])).toThrow('not valid for merge');
  });
});

describe('applySheet', () => {
  it('keeps a sheet row over a retired entity retired - the lol prod zombies would finally go', () => {
    const data = { items: [{ id: 'blackfire-torch', name: 'Blackfire Torch', deprecated: true }] };
    const sheet = { items: [['id', 'name'], ['blackfire-torch', 'Blackfire Torch']] };
    expect(applySheet(data, sheet).items[0].deprecated).toBe(true);
    expect(applySheet(data, null)).toBe(data);
  });
});

describe('diffStaticData', () => {
  it('classifies every kind of difference', () => {
    const shipped = {
      items: [
        { id: 'same', v: 1, deprecated: false },
        { id: 'zombie', deprecated: false },
        { id: 'gone', deprecated: false },
        { id: 'revived', deprecated: true },
        { id: 'changed', v: 1, deprecated: false },
      ],
    };
    const shadow = {
      items: [
        { id: 'same', v: 1, deprecated: false },
        { id: 'zombie', deprecated: true },
        { id: 'revived', deprecated: false },
        { id: 'changed', v: 2, deprecated: false },
        { id: 'extra', deprecated: true },
      ],
    };
    expect(diffStaticData(shipped, shadow)).toEqual({
      onlyInShipped: ['items/gone'],
      onlyInShadow: ['items/extra'],
      liveToDeprecated: ['items/zombie'],
      deprecatedToLive: ['items/revived'],
      fieldDiffs: ['items/changed'],
    });
  });

  it('normalises tmp vs prod asset URLs before comparing, and reports identical data as identical', () => {
    const shipped = { items: [{ id: 'a', iconUrl: 'https://cdn/tmp/a.png', deprecated: false }] };
    const shadow = { items: [{ id: 'a', iconUrl: 'https://cdn/prod/a.png', deprecated: false }] };
    const d = diffStaticData(shipped, shadow, 'https://cdn/tmp', 'https://cdn/prod');
    expect(Object.values(d).every(l => l.length === 0)).toBe(true);
    expect(formatShadowLine(d, 'static_data_v0.0.34.json', 1)).toBe(
      'Shadow bucket-base merge: identical to the pipeline result (base static_data_v0.0.34.json + 1 git file)',
    );
  });
});
