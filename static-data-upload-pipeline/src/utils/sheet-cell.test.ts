import { SHEET_CELL_LIMIT, sheetCell } from './spreadsheets.utils';

describe('sheetCell', () => {
  it('writes values as before up to the Sheets limit', () => {
    expect(sheetCell('fire')).toBe('fire');
    expect(sheetCell({ a: [1, 2] })).toBe('{"a":[1,2]}');
    expect(sheetCell('x'.repeat(SHEET_CELL_LIMIT))).toHaveLength(SHEET_CELL_LIMIT);
  });

  it('replaces a value over the limit with a placeholder that names the size', () => {
    const groups = { nodes: 'n'.repeat(193_123) }; // + 12 chars of {"nodes":""}
    expect(sheetCell(groups)).toBe('(too large for a sheet cell: 193135 chars)');
  });
});
