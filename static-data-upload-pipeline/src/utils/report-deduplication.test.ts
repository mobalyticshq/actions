import { deduplicateReports } from './report-deduplication.utils';
import { ValidationEntityReport, ValidationReport } from '../types';

const entityReport = (entity: any, warnings: Record<string, string[]> = {}): ValidationEntityReport => ({
  entity,
  errors: {},
  infos: {},
  warnings: Object.fromEntries(Object.entries(warnings).map(([k, v]) => [k, new Set(v)])),
});

const pass = (byGroup: Record<string, ValidationEntityReport[]>): ValidationReport => ({
  errors: {},
  warnings: {},
  infos: {},
  byGroup,
});

describe('deduplicateReports', () => {
  it('keeps entities with the same id in different groups apart', () => {
    // wowfor_dev 2026-09-22: itemSubclasses/1 was deprecated and the warning landed on classes/1 (Warrior)
    const [report] = deduplicateReports([
      pass({
        classes: [entityReport({ id: '1', name: 'Warrior' })],
        itemSubclasses: [entityReport({ id: '1', name: 'newitem' }, { 'entity deprecated': ['deprecated'] })],
      }),
    ]);

    expect(report.byGroup.classes).toHaveLength(1);
    expect(report.byGroup.classes[0].entity.name).toBe('Warrior');
    expect(report.byGroup.classes[0].warnings['entity deprecated']).toBeUndefined();
    expect(report.byGroup.itemSubclasses[0].warnings['entity deprecated']).toEqual(new Set(['deprecated']));
  });

  it('merges the same entity reported by both validation passes into one row', () => {
    const before = pass({ spells: [entityReport({ id: 'a' }, { 'slug changed': ['slug'] })] });
    const after = pass({ spells: [entityReport({ id: 'a' }, { 'name changed': ['name'] })] });

    const [report] = deduplicateReports([before, after]);

    expect(report.byGroup.spells).toHaveLength(1);
    expect(report.byGroup.spells[0].warnings).toEqual({
      'slug changed': new Set(['slug']),
      'name changed': new Set(['name']),
    });
  });

  it('keeps an id duplicated inside a group as separate rows, paired across passes by occurrence', () => {
    const before = pass({
      items: [entityReport({ id: 'dup', n: 1 }, { w: ['first'] }), entityReport({ id: 'dup', n: 2 }, { w: ['second'] })],
    });
    const after = pass({
      items: [entityReport({ id: 'dup', n: 1 }, { w: ['first-after'] }), entityReport({ id: 'dup', n: 2 })],
    });

    const [report] = deduplicateReports([before, after]);

    expect(report.byGroup.items.map(r => r.entity.n)).toEqual([1, 2]);
    expect(report.byGroup.items[0].warnings.w).toEqual(new Set(['first', 'first-after']));
    expect(report.byGroup.items[1].warnings.w).toEqual(new Set(['second']));
  });

  it('does not mutate the input records', () => {
    const original = entityReport({ id: 'a' }, { w: ['x'] });
    deduplicateReports([pass({ g: [original] }), pass({ g: [entityReport({ id: 'a' }, { w: ['y'] })] })]);
    expect(original.warnings.w).toEqual(new Set(['x']));
  });
});
