import { checkRefTarget, ReportMessages, validateEntityAgainstSchema } from './utils';

const data: any = {
  spells: [{ id: 'live' }, { id: 'retired', deprecated: true }],
};

describe('checkRefTarget', () => {
  it('tells a live target from a retired and a missing one', () => {
    expect(checkRefTarget('live', 'spells', data)).toBe('ok');
    expect(checkRefTarget('retired', 'spells', data)).toBe('deprecated');
    expect(checkRefTarget('nope', 'spells', data)).toBe('missing');
  });

  it('handles arrays - missing wins over deprecated', () => {
    expect(checkRefTarget(['live', 'retired'], 'spells', data)).toBe('deprecated');
    expect(checkRefTarget(['retired', 'nope'], 'spells', data)).toBe('missing');
    expect(checkRefTarget([], 'spells', data)).toBe('ok');
  });

  it('keeps the old verdict for bad shapes and unknown groups', () => {
    expect(checkRefTarget(5, 'spells', data)).toBe('missing');
    expect(checkRefTarget(['live', 5], 'spells', data)).toBe('missing');
    expect(checkRefTarget('live', 'nope', data)).toBe('missing');
  });
});

describe('validateEntityAgainstSchema - refs to deprecated entities', () => {
  const schema: any = { groups: { plans: { fields: { craftSpellRef: { type: 'Ref', refTo: 'spells' } } } } };
  const run = (entity: any) => {
    const report: any = {
      entity,
      errors: {
        [ReportMessages.requiredFieldMissing]: new Set(),
        [ReportMessages.invalidFieldType]: new Set(),
        [ReportMessages.invalidRefTarget]: new Set(),
      },
      warnings: { [ReportMessages.refToDeprecated]: new Set() },
      infos: {},
    };
    validateEntityAgainstSchema(entity, 'plans', schema, data, report);
    return {
      warned: report.warnings[ReportMessages.refToDeprecated].size,
      errors: report.errors[ReportMessages.invalidRefTarget].size,
    };
  };

  it('warns when a live entity points at a retired one', () => {
    // every retirement on wowfor (crusade, tigers-fury, the warrior talents) was checked by hand for this
    expect(run({ id: 'p', craftSpellRef: 'retired' })).toEqual({ warned: 1, errors: 0 });
  });

  it('stays quiet for a retired entity and for a live target', () => {
    expect(run({ id: 'p', deprecated: true, craftSpellRef: 'retired' })).toEqual({ warned: 0, errors: 0 });
    expect(run({ id: 'p', craftSpellRef: 'live' })).toEqual({ warned: 0, errors: 0 });
  });

  it('still errors on a missing target', () => {
    expect(run({ id: 'p', craftSpellRef: 'nope' })).toEqual({ warned: 0, errors: 1 });
  });
});
