import { getAllFilesInBucket, validateAssetWithGCS } from './assets-cdn-validation.utils';
import { isScopedAssetsFolder } from '../common.utils';
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

describe('getAllFilesInBucket', () => {
  it('streams the listing under the prefix and keeps only referenced files', async () => {
    let askedPrefix: string | undefined;
    const bucket = {
      async *getFilesStream(options: { prefix?: string }) {
        askedPrefix = options.prefix;
        yield* [{ name: 'assets/x/a.png' }, { name: 'assets/x/b.png' }, { name: 'assets/x/c.png' }];
      },
    };
    const found = await getAllFilesInBucket(bucket, 'assets/x', new Set(['/assets/x/a.png', '/assets/x/missing.png']));
    expect(askedPrefix).toBe('assets/x');
    expect(found).toEqual(new Set(['/assets/x/a.png']));
  });
});

describe('isScopedAssetsFolder', () => {
  it('accepts a folder scoped to a game, the shape every ini section has', () => {
    expect(isScopedAssetsFolder('gs://cdn.mobalytics.gg/assets/wow-forever')).toBe(true);
    expect(isScopedAssetsFolder('gs://cdn.mobalytics.gg/assets/tft/')).toBe(true);
    expect(isScopedAssetsFolder('gs://cdn.mobalytics.gg/assets/diablo-4/images')).toBe(true);
  });

  it('rejects the bucket root, a single directory and an empty value', () => {
    // tft_dev / tft_stg 2026-09-18: listed the whole CDN and ran out of memory
    expect(isScopedAssetsFolder('gs://cdn.mobalytics.gg/assets/')).toBe(false);
    expect(isScopedAssetsFolder('gs://cdn.mobalytics.gg/assets')).toBe(false);
    expect(isScopedAssetsFolder('gs://cdn.mobalytics.gg/')).toBe(false);
    expect(isScopedAssetsFolder('gs://cdn.mobalytics.gg/assets//tft')).toBe(false);
    expect(isScopedAssetsFolder('')).toBe(false);
  });
});
