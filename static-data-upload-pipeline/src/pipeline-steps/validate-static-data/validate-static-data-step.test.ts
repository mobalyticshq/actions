import { mkdtempSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import * as path from 'path';
import { validateStaticDataStep } from './validate-static-data-step';

const slack: any = { appendNewLine: async () => true, updateMessage: async () => true };
const data: any = { items: [{ id: 'a', deprecated: false }] };
const run = (testsDir: string) =>
  validateStaticDataStep(slack, data, {}, { refs: [] }, testsDir, 'https://cdn.mobalytics.gg/assets/x', null, true);

describe('game-specific tests', () => {
  it('loads a rule from a relative tests dir and counts its findings', async () => {
    // The workflow always passes a relative dir (./tests or an ini value); joined with a file
    // name that was a bare require specifier, so no game-specific test ever ran in CI.
    const dir = mkdtempSync(path.join(tmpdir(), 'game-tests-'));
    writeFileSync(
      path.join(dir, 'rule.js'),
      "module.exports = async (data) => ({ errors: { 'game rule failed': new Set(['items.name']) }, warnings: {}, infos: {}, byGroup: {} });",
    );
    const result = await run(path.relative(process.cwd(), dir));
    expect(result.reports).toHaveLength(2);
    expect(result.errors).toBe(1);
  });

  it('skips quietly when the folder does not exist', async () => {
    const result = await run('./no-such-tests');
    expect(result.reports).toHaveLength(1);
    expect(result.errors).toBe(0);
  });
});
