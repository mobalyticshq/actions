import { widenSheetRequest } from './spreadsheets.utils';

const sheet = (columnCount?: number) => ({ properties: { sheetId: 7, gridProperties: { rowCount: 1000, columnCount } } });

describe('widenSheetRequest', () => {
  it('widens a sheet narrower than the data', () => {
    // wowfor_stg 2026-09-22: spells needed 33 columns, the sheet had the default 26
    expect(widenSheetRequest(sheet(26), 33)).toEqual({
      updateSheetProperties: {
        properties: { sheetId: 7, gridProperties: { columnCount: 33 } },
        fields: 'gridProperties.columnCount',
      },
    });
  });

  it('leaves a sheet that already fits alone', () => {
    expect(widenSheetRequest(sheet(26), 26)).toBeNull();
    expect(widenSheetRequest(sheet(26), 3)).toBeNull();
  });

  it('never shrinks a sheet someone widened by hand', () => {
    expect(widenSheetRequest(sheet(40), 31)).toBeNull();
  });
});
