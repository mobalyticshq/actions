import { DynamicModuleSlug } from '@shared/types/dynamic-modules.types';
import { resolveQueryModuleVersion } from '@shared/utils/query-module-version.utils';

describe('resolveQueryModuleVersion', () => {
  it('defaults to v2 built from LLM fragments', () => {
    expect(resolveQueryModuleVersion('')).toEqual({
      moduleSlug: DynamicModuleSlug.STATIC_DATA_QUERY_V2,
      deterministicFragments: false,
    });
  });

  it('builds v3 from deterministic fragments', () => {
    expect(resolveQueryModuleVersion('v3')).toEqual({
      moduleSlug: DynamicModuleSlug.STATIC_DATA_QUERY_V3,
      deterministicFragments: true,
    });
  });

  it('rejects unknown versions', () => {
    expect(() => resolveQueryModuleVersion('v1')).toThrow("Unknown query-module-version 'v1'");
  });
});
