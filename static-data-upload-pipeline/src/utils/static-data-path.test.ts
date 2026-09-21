import { parseStaticDataPath } from './common.utils';

describe('parseStaticDataPath', () => {
  it('reads games/<slug>/<env>/static_data', () => {
    expect(parseStaticDataPath('games/wowfor/dev/static_data')).toEqual({ gameSlug: 'wowfor', environment: 'DEV' });
    expect(parseStaticDataPath('games/d4/dev-warlock/static_data')).toEqual({ gameSlug: 'd4', environment: 'DEV-WARLOCK' });
  });

  it('reads the shallower <slug>/<env>/static_data layout', () => {
    expect(parseStaticDataPath('moba-equipment/prod/static_data')).toEqual({ gameSlug: 'moba-equipment', environment: 'PROD' });
  });

  it('tolerates a trailing slash', () => {
    expect(parseStaticDataPath('games/gi/stg/static_data/')).toEqual({ gameSlug: 'gi', environment: 'STG' });
  });

  it('does not throw on a short path', () => {
    expect(() => parseStaticDataPath('static_data')).not.toThrow();
  });
});
