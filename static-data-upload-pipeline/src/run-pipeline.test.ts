import * as core from '@actions/core';
import { runPipeline } from './run-pipeline';
import { schemaValidationStep } from './pipeline-steps/schema-validation/schema-validation';
import { mergeStaticDataStep } from './pipeline-steps/merge-static-data';
import { syncStaticDataStep } from './pipeline-steps/sync-static-data-step';
import { isValidReport } from './utils/is-valid-report.utils';

jest.mock('@actions/core', () => ({ setFailed: jest.fn() }));
jest.mock('./pipeline-steps/schema-validation/schema-validation', () => ({ schemaValidationStep: jest.fn() }));
jest.mock('./pipeline-steps/merge-static-data', () => ({ mergeStaticDataStep: jest.fn() }));
jest.mock('./pipeline-steps/validate-static-data/validate-static-data-step', () => ({
  validateStaticDataStep: jest.fn(async () => ({ errors: 0, warnings: 0, infos: 0, reports: [] })),
}));
jest.mock('./pipeline-steps/override-static-data', () => ({
  overrideStaticData: jest.fn(async () => ({ overridedData: {}, spreadsheetData: {}, spreadsheetReport: {} })),
}));
jest.mock('./pipeline-steps/create-report', () => ({ createReportStep: jest.fn() }));
jest.mock('./pipeline-steps/sync-static-data-step', () => ({ syncStaticDataStep: jest.fn() }));
jest.mock('./utils/is-valid-report.utils', () => ({ isValidReport: jest.fn() }));

const slackManager: any = { sendMessage: jest.fn(), appendNewLine: jest.fn(), updateMessage: jest.fn(), reset: jest.fn() };

const run = (overrides: Partial<Parameters<typeof runPipeline>[0]> = {}) =>
  runPipeline({
    versions: ['games/x/dev/static_data/static_data_v0.0.1.json'],
    staticDataPath: 'games/x/dev/static_data',
    overrideSpreadsheetId: 'o',
    reportSpreadsheetId: 'r',
    tmpAssetFolder: 'gs://cdn.mobalytics.gg/assets/x',
    prodAssetFolder: 'gs://cdn.mobalytics.gg/assets/x',
    testsDir: './tests',
    dryRun: false,
    slackManager,
    apiSchema: { groups: {} } as any,
    apiSchemaPath: 'games/x/dev/static_data/schema.json',
    ...overrides,
  });

const counts = (errors: number, warnings = 0) => (isValidReport as jest.Mock).mockReturnValue({ errors, warnings, infos: 0 });

beforeEach(() => {
  jest.clearAllMocks();
  (schemaValidationStep as jest.Mock).mockResolvedValue({ success: true });
  (mergeStaticDataStep as jest.Mock).mockResolvedValue({ staticData: {}, oldData: {}, success: true });
});

describe('runPipeline job status', () => {
  it('stays green and syncs when there are no errors, warnings included', async () => {
    counts(0, 5);
    await run();
    expect(core.setFailed).not.toHaveBeenCalled();
    expect(syncStaticDataStep).toHaveBeenCalled();
  });

  it('fails a dry run with data errors - the PR check goes red', async () => {
    counts(2);
    await run({ dryRun: true });
    expect(core.setFailed).toHaveBeenCalledWith(expect.stringContaining('2 error(s)'));
    expect(syncStaticDataStep).not.toHaveBeenCalled();
  });

  it('fails a real run with data errors and does not sync', async () => {
    counts(1);
    await run();
    expect(core.setFailed).toHaveBeenCalledTimes(1);
    expect(syncStaticDataStep).not.toHaveBeenCalled();
  });

  it('fails when a step throws', async () => {
    (mergeStaticDataStep as jest.Mock).mockRejectedValue(new Error('ENOENT: static_data_v0.010.json'));
    await run();
    expect(core.setFailed).toHaveBeenCalledWith('Pipeline failed: ENOENT: static_data_v0.010.json');
  });

  it('fails when the sync itself throws', async () => {
    counts(0);
    (syncStaticDataStep as jest.Mock).mockRejectedValueOnce(new Error('gsutil exit with 1'));
    await run();
    expect(core.setFailed).toHaveBeenCalledWith('Pipeline failed: gsutil exit with 1');
  });

  it('fails when the schema is invalid or there are no version files', async () => {
    (schemaValidationStep as jest.Mock).mockResolvedValue({ success: false, errors: [] });
    await run();
    expect(core.setFailed).toHaveBeenCalledWith(expect.stringContaining('Schema validation failed'));

    jest.clearAllMocks();
    await run({ versions: [] });
    expect(core.setFailed).toHaveBeenCalledWith(expect.stringContaining('no static data files'));
  });
});
