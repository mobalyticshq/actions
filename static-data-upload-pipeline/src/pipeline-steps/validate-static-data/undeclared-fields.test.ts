import { undeclaredFields } from './utils';

describe('undeclaredFields', () => {
  const schema = { fields: { id: { type: 'String' as const }, name: { type: 'String' as const }, speed: { type: 'String' as const } } };

  it('reports a field once per group, however many entities carry it', () => {
    // wowfor: items.maxCount shipped for several versions and never reached the API
    const items = [
      { id: '1', name: 'Sword', speed: '2.4', maxCount: '1' },
      { id: '2', name: 'Axe', maxCount: '5', gearSetRef: 'tier-1' },
    ];
    expect(undeclaredFields(items, 'items', schema).sort()).toEqual(['items.gearSetRef', 'items.maxCount']);
  });

  it('skips empty values, retired rows and the fields the pipeline owns', () => {
    const items = [
      // bl4: iconUrl is null on every row, so the schema generator drops it
      { id: '1', name: 'Sword', iconUrl: null, tags: [], note: '', extra: {}, gameId: '1', deprecated: false },
      // a retired row keeps whatever it had when it was last emitted
      { id: '2', name: 'Axe', maxCount: '5', deprecated: true },
    ];
    expect(undeclaredFields(items, 'items', schema)).toEqual([]);
  });

  it('counts false and "0" as values', () => {
    expect(undeclaredFields([{ id: '1', crafted: false, buyPrice: '0' }], 'items', schema).sort()).toEqual(['items.buyPrice', 'items.crafted']);
  });
});
