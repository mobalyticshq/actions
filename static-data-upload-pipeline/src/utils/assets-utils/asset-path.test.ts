import { validateAssetWithGCS } from './assets-cdn-validation.utils';
import { ReportMessages } from '../../pipeline-steps/validate-static-data/utils';

const check = (url: string, existing: string[]) => {
  const report: any = { errors: { [ReportMessages.assetURLNotAvailable]: new Set<string>() } };
  const found = validateAssetWithGCS(url, [{ report, path: 'spells.iconUrl' }], 0, new Set(existing));
  return { found, errors: report.errors[ReportMessages.assetURLNotAvailable].size };
};

describe('validateAssetWithGCS', () => {
  it('finds an object whose name has a space', () => {
    // wowfor_dev 2026-09-17: reported missing although it existed and served fine
    const name = '/assets/wow-forever/trade_archaeology_carved wildhammer gryphon figurine.webp';
    expect(check(`https://cdn.mobalytics.gg${name}`, [name])).toEqual({ found: true, errors: 0 });
    expect(check(`https://cdn.mobalytics.gg${name.replace(/ /g, '%20')}`, [name])).toEqual({ found: true, errors: 0 });
  });

  it('finds an object with a non-ASCII name', () => {
    expect(check('https://cdn.mobalytics.gg/assets/x/Ægir.png', ['/assets/x/Ægir.png']).found).toBe(true);
  });

  it('still reports a missing object and a malformed escape', () => {
    expect(check('https://cdn.mobalytics.gg/assets/x/a.png', [])).toEqual({ found: false, errors: 1 });
    expect(check('https://cdn.mobalytics.gg/assets/x/a%E0.png', ['/assets/x/a%E0.png'])).toEqual({ found: false, errors: 1 });
  });
});
