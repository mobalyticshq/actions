import { google } from 'googleapis';
import { Entity, StaticData } from '../types';
import { mergeStaticData } from './merge.utils';
import { GoogleAuth } from 'google-auth-library';
import { isImage, stringify, tryParse } from './common.utils';

const sheets = google.sheets('v4');

export type SpreadsheetReport = {
  emptyPages: Set<string>;
  pagesWidthWrongOverrides: { [key: string]: Set<string> };
  pagesWidthDuplicatedHeaders: { [key: string]: Set<string> };
  pagesWithoutId: Set<string>;
  pagesWithAbscentHeader: Set<string>;
  duplicatedEntities: { [key: string]: Set<string> };
  pageWithAbscentId: Set<string>;
  pagesWidthUnprocessedCells: { [key: string]: Array<{ row: number; column: number }> };
};

function applySpreadsheetsData(
  rawData: {
    [key: string]: any[][] | null;
  },
  knownData: StaticData,
  spreadsheetReport: SpreadsheetReport,
) {
  const entities: StaticData = {};

  for (const group of Object.keys(rawData)) {
    if (!rawData[group] || rawData[group].length == 0) {
      spreadsheetReport.emptyPages.add(group);
      continue;
    }

    //check wrong header
    //zero line should be the header
    if (!rawData[group][0].find(val => val === 'id')) {
      spreadsheetReport.pagesWithoutId.add(group);
      continue;
    }
    if (rawData[group][0].find(val => val === '')) {
      spreadsheetReport.pagesWithAbscentHeader.add(group);
    }

    //get known fields
    const knownFields = new Set<string>();
    knownData[group]?.forEach(ent => {
      for (const prop of Object.keys(ent)) {
        knownFields.add(prop);
      }
    });

    for (let j = 0; j < rawData[group][0].length; j++) {
      const field = rawData[group][0][j] as string;
      if (field.endsWith('_override')) {
        const originalField = field.replace('_override', '');
        if (originalField == 'id' || !knownFields.has(originalField)) {
          spreadsheetReport.pagesWidthWrongOverrides[group] ||= new Set();
          spreadsheetReport.pagesWidthWrongOverrides[group].add(field);
        }
      }
      if (field !== '' && rawData[group][0].filter(value => value == field).length > 1) {
        spreadsheetReport.pagesWidthDuplicatedHeaders[group] ||= new Set();
        spreadsheetReport.pagesWidthDuplicatedHeaders[group].add(field);
      }
    }
    entities[group] = [];

    //copy data to object
    for (let i = 1; i < rawData[group].length; ++i) {
      const obj: { [key: string]: any } = {};
      for (let j = 0; j < rawData[group][0].length; j++) {
        const field = rawData[group][0][j] as string;
        //add unknown field to entity only
        if (field !== '' && !field.endsWith('_override') && field !== 'deprecated' && knownFields.has(field)) {
          if (j >= rawData[group][i].length) {
            obj[field] = '';
          } else if (rawData[group][i][j]) {
            obj[field] = tryParse(rawData[group][i][j]);
          }
        }
      }
      //check id is exist
      if (obj.id === '' || !obj.id) {
        spreadsheetReport.pageWithAbscentId.add(group);
        continue;
      }

      //get value from known json
      const knownObj = knownData[group]?.find(ent => ent.id === obj.id);
      const ent: Entity = { id: obj.id, ...obj, ...knownObj };
      //now override fields
      for (let j = 0; j < rawData[group][0].length; j++) {
        const field = rawData[group][0][j] as string;
        if (field.endsWith('_override')) {
          const originalField = field.replace('_override', '');
          //override known field
          if (
            knownFields.has(originalField) &&
            rawData[group][i][j] &&
            originalField !== 'id' &&
            rawData[group][i][j] !== ''
          ) {
            ent[originalField] = tryParse(rawData[group][i][j]);
          }
        }
      }
      //check duplicates in data by id
      const found = entities[group].find(e => e.id === ent.id);
      if (found) {
        spreadsheetReport.duplicatedEntities[group] ||= new Set();
        spreadsheetReport.duplicatedEntities[group].add(ent.id);
      } else {
        //everything is ok
        entities[group].push(ent);
      }
    }
  }

  return entities;
}

async function getCurrentRawData(spreadsheetId: string, auth: GoogleAuth, spreadsheetReport: SpreadsheetReport) {
  const sheetsData = await sheets.spreadsheets.get({
    spreadsheetId,
    auth,
    includeGridData: true,
    fields: 'sheets.properties.title,sheets.data.rowData.values.userEnteredValue',
  });
  const rawData: { [key: string]: Array<Array<string>> } = {};

  console.log(`## Current spreadsheet structure:`);
  console.log(sheetsData.data.sheets);

  if (sheetsData.data.sheets)
    for (let i = 0; i < sheetsData.data.sheets.length; ++i) {
      const sheet = sheetsData.data.sheets[i];
      if (sheet.properties?.title) {
        rawData[sheet.properties?.title] = new Array<Array<string>>();
      }
      if (sheet.properties?.title && sheet.data && sheet.data.length > 0 && sheet.data[0].rowData) {
        const gridData = sheet.data[0].rowData;
        const header = gridData[0];
        if (header && header.values) {
          const resultHeader = new Array<string>();
          for (const cell of header.values) {
            if (!cell || !cell.userEnteredValue || !cell.userEnteredValue.stringValue) break;
            resultHeader.push(cell.userEnteredValue.stringValue);
          }

          rawData[sheet.properties?.title].push(resultHeader);

          for (let j = 1; j < gridData.length; ++j) {
            const row = gridData[j];
            if (!row.values) continue;
            const result = new Array<string>();
            let emptyCells = 0;
            for (let k = 0; k < row.values.length && k < resultHeader.length; k++) {
              const cell = row.values[k];
              if (cell && cell.userEnteredValue) {
                if (cell.userEnteredValue.stringValue) {
                  result.push(cell.userEnteredValue.stringValue);
                } else if (cell.userEnteredValue.formulaValue) {
                  const formula = cell.userEnteredValue.formulaValue;
                  if (formula.startsWith('=IMAGE("')) {
                    const txt = formula.substring(0, formula.length - 2);
                    result.push(txt.replace('=IMAGE("', ''));
                  } else {
                    spreadsheetReport.pagesWidthUnprocessedCells[sheet.properties?.title] ||= new Array();
                    spreadsheetReport.pagesWidthUnprocessedCells[sheet.properties?.title].push({
                      row: j,
                      column: k,
                    });
                  }
                } else if (cell.userEnteredValue.boolValue) {
                  result.push(String(cell.userEnteredValue.boolValue));
                } else if (cell.userEnteredValue.numberValue) {
                  result.push(String(cell.userEnteredValue.numberValue));
                } else {
                  spreadsheetReport.pagesWidthUnprocessedCells[sheet.properties?.title] ||= new Array();
                  spreadsheetReport.pagesWidthUnprocessedCells[sheet.properties?.title].push({
                    row: j,
                    column: k,
                  });
                }
              } else {
                result.push('');
                emptyCells++;
              }
            }
            if (emptyCells == resultHeader.length) break;
            rawData[sheet.properties?.title].push(result);
          }
        }
      }
    }

  return rawData;
}

function getRange(enities: Array<{ [key: string]: any }>) {
  const headerSet = new Set<string>();
  enities.forEach(ent => {
    for (const prop of Object.keys(ent)) {
      headerSet.add(prop);
    }
  });
  return { rows: enities.length + 1, columns: headerSet.size };
}

function entitiesToRawData(knownData: Array<Entity> | undefined, mergedData: Array<Entity>) {
  const knownFields = new Set<string>();
  knownData?.forEach(ent => {
    for (const prop of Object.keys(ent)) {
      knownFields.add(prop);
    }
  });
  // const idColumnIdx =rows&&rows.length>0? rows[0].findIndex(val=>val==='id'):-1;

  const header = Array.from(knownFields);

  //add header from spreadsheets to known header
  const newFields = new Set<string>();
  mergedData.forEach(ent => {
    for (const prop of Object.keys(ent)) {
      if (!knownFields.has(prop)) newFields.add(prop);
    }
  });
  header.push(...Array.from(newFields));

  const resultRows = new Array<Array<string>>();
  //add header
  resultRows.push(header);

  knownData?.forEach(ent => {
    const newRow = [];
    for (let i = 0; i < header.length; i++) {
      const known = mergedData?.find(obj => obj.id == ent.id);
      // const oldRow = rows?.find(row=>row[idColumnIdx] == ent.id);
      if (known && known[header[i]]) {
        newRow.push(stringify(known[header[i]]));
      } else if (known) newRow.push('');
    }
    resultRows.push(newRow);
  });

  mergedData?.forEach(ent => {
    const newRow = [];
    for (let i = 0; i < header.length; i++) {
      const known = knownData?.find(obj => obj.id == ent.id);
      const newEntity = mergedData?.find(obj => obj.id == ent.id);
      if (!known && newEntity && newEntity[header[i]]) {
        newRow.push(stringify(newEntity[header[i]]));
      } else if (!known && newEntity) newRow.push('');
    }
    resultRows.push(newRow);
  });

  return resultRows;
}

export function addFilterToSheet(
  sheetId: number,
  startRowIndex: number,
  endRowIndex: number,
  startColumnIndex: number,
  endColumnIndex: number,
) {
  const request = {
    addFilterView: {
      filter: {
        title: 'Filter view',
        range: {
          sheetId: sheetId,
          startRowIndex,
          endRowIndex,
          startColumnIndex,
          endColumnIndex,
        },
        filterSpecs: [],
      },
    },
  };
  return request;
}

export function setColor(
  sheetId: number,
  startRowIndex: number,
  endRowIndex: number,
  startColumnIndex: number,
  endColumnIndex: number,
  red = 1.0,
  green = 1.0,
  blue = 1.0,
) {
  const request = {
    repeatCell: {
      range: {
        sheetId,
        startRowIndex,
        endRowIndex,
        startColumnIndex,
        endColumnIndex,
      },
      cell: {
        userEnteredFormat: {
          backgroundColor: {
            red,
            green,
            blue,
          },
        },
      },
      fields: 'userEnteredFormat.backgroundColor',
    },
  };
  return request;
}

export async function removeAllMetadata(spreadsheetId: string, auth: GoogleAuth) {
  const sheetData = await sheets.spreadsheets.get({
    spreadsheetId,
    fields: 'sheets.properties,sheets.protectedRanges,sheets.properties,sheets.filterViews.filterViewId',
    auth: auth,
  });
  const requests = [];

  const filterIds = (sheetData.data.sheets || []).flatMap(s => s.filterViews || []).map(v => v.filterViewId);

  filterIds.forEach(id => {
    requests.push({
      deleteFilterView: { filterId: id },
    });
  });

  for (const sheet of sheetData.data.sheets || []) {
    requests.push({
      clearBasicFilter: { sheetId: sheet.properties?.sheetId },
    });
    const ranges = sheet.protectedRanges || [];
    for (const range of ranges) {
      if (range.protectedRangeId != null) {
        requests.push({
          deleteProtectedRange: {
            protectedRangeId: range.protectedRangeId,
          },
        });
      }
    }
  }

  if (requests.length > 0) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      auth: auth,
      requestBody: {
        requests: requests,
      },
    });
  }
}

export function protect(sheetId: number, rows: number, columns: number, clientEmail: string) {
  const request = {
    addProtectedRange: {
      protectedRange: {
        range: {
          sheetId,
          startRowIndex: 0,
          endRowIndex: rows,
          startColumnIndex: 0,
          endColumnIndex: columns,
        },
        description: 'Read-only column for users',
        warningOnly: false,
        editors: {
          users: [clientEmail],
        },
      },
    },
  };
  return request;
}

export async function addSheet(spreadsheetId: string, auth: GoogleAuth, title: string) {
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    auth: auth,
    requestBody: {
      requests: [
        {
          addSheet: {
            properties: {
              title,
              gridProperties: {
                rowCount: 1000,
                columnCount: 26,
              },
              tabColor: {
                red: 0.8,
                green: 0.8,
                blue: 1,
              },
            },
          },
        },
      ],
    },
  });
}

export async function deleteSheet(spreadsheetId: string, auth: GoogleAuth, sheetId: number) {
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    auth: auth,
    requestBody: {
      requests: [
        {
          deleteSheet: {
            sheetId,
          },
        },
      ],
    },
  });
}

export async function clearSheets(
  spreadsheetData: {
    [key: string]: Array<Array<string>>;
  },
  spreadsheetId: string,
  auth: GoogleAuth,
) {
  if (Object.keys(spreadsheetData).length > 0) {
    const sheetsData = await sheets.spreadsheets.get({ spreadsheetId, auth, includeGridData: false });
    if (sheetsData.data.sheets && sheetsData.data.sheets.length > 1) {
      for (let i = 0; i < sheetsData.data.sheets.length; ++i) {
        const sheet = sheetsData.data.sheets[i];
        if (
          sheet.properties &&
          sheet.properties.sheetId != null &&
          sheet.properties?.title &&
          !spreadsheetData[sheet.properties.title]
        ) {
          await deleteSheet(spreadsheetId, auth, sheet.properties.sheetId);
        }
      }
    }
  }
}

//set colors and protections for data
async function setMetadata(
  spreadsheetId: string,
  auth: GoogleAuth,
  knownData: StaticData,
  allData: {
    [key: string]: Array<Array<string>>;
  },
  clientEmail: string,
) {
  const response = await sheets.spreadsheets.get({
    spreadsheetId,
    auth: auth,
  });
  const requests = [];

  const sheetsInfo = response.data.sheets;
  if (sheetsInfo) {
    for (const sheet of sheetsInfo) {
      if (sheet.properties?.title && sheet.properties?.sheetId && knownData[sheet.properties?.title]) {
        const protectedDataRange = getRange(knownData[sheet.properties?.title]);
        const allDataRange = getRange(allData[sheet.properties?.title]);
        //reset color
        requests.push(setColor(sheet.properties?.sheetId, 0, 1000, 0, 26, 1, 1, 1));

        requests.push(
          setColor(sheet.properties?.sheetId, 0, 1, 0, protectedDataRange.columns, 143 / 255, 176 / 255, 106 / 255),
        );

        requests.push(
          setColor(sheet.properties?.sheetId, 1, protectedDataRange.rows, 0, protectedDataRange.columns, 0.8, 0.8, 0.8),
        );

        requests.push(
          protect(sheet.properties?.sheetId, protectedDataRange.rows, protectedDataRange.columns, clientEmail),
        );
      }
    }
  }

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    auth: auth,
    requestBody: {
      requests: requests,
    },
  });
}

//update spreadsheets
export async function updateSpreadsheets(
  spreadsheetId: string,
  mergedData: StaticData,
  jsonData: StaticData,
  oldSpreadsheetsData: { [key: string]: Array<Array<string>> },
) {
  if (process.env.GOOGLE_CLIENT_EMAIL) {
    console.log(`## Update spreadsheets ${spreadsheetId}`);
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    console.log('## Remove all protections');
    //remove all protections from pages
    await removeAllMetadata(spreadsheetId, auth);
    const newSpreadsheetData: { [key: string]: Array<Array<string>> } = {};

    console.log(`## Append data`);
    //fill spreadsheets with merged data
    for (const group of Object.keys(mergedData)) {
      //add new sheet if needed
      if (!oldSpreadsheetsData[group]) {
        await addSheet(spreadsheetId, auth, group);
      }

      newSpreadsheetData[group] = entitiesToRawData(jsonData[group], mergedData[group]);

      for (let i = 0; i < newSpreadsheetData[group].length; ++i)
        for (let j = 0; j < newSpreadsheetData[group][i].length; ++j)
          if (isImage(newSpreadsheetData[group][i][j].toLowerCase())) {
            newSpreadsheetData[group][i][j] = `=IMAGE("${newSpreadsheetData[group][i][j]}")`;
          }
    }

    const requests = [];
    const sheetsDataNew = await sheets.spreadsheets.get({ spreadsheetId, auth, includeGridData: false });
    if (sheetsDataNew.data.sheets) {
      //clear
      for (const sheet of sheetsDataNew.data.sheets) {
        requests.push({
          updateCells: {
            range: { sheetId: sheet.properties?.sheetId },
            fields: '*',
          },
        });

        if (sheet.properties?.title) {
          requests.push({
            appendCells: {
              sheetId: sheet.properties?.sheetId,
              rows: newSpreadsheetData[sheet.properties?.title]?.map(row => ({
                values: row.map(cell =>
                  cell.startsWith('=')
                    ? { userEnteredValue: { formulaValue: String(cell) } }
                    : { userEnteredValue: { stringValue: String(cell) } },
                ),
              })),
              fields: '*',
            },
          });
        }
      }

      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        auth,
        requestBody: { requests },
      });
    }

    console.log(`## Remove unused sheets`);
    clearSheets(newSpreadsheetData, spreadsheetId, auth);

    console.log(`## Update metadata`);
    await setMetadata(spreadsheetId, auth, jsonData, newSpreadsheetData, process.env.GOOGLE_CLIENT_EMAIL);

    console.log(`## Spreadsheets https://docs.google.com/spreadsheets/d/${spreadsheetId} updated`);
  } else {
    console.log(`can't edit spreadsheet need to set email`);
  }
}

export async function mergeWithSpreadsheets(spreadsheetId: string, jsonData: StaticData) {
  const spreadsheetReport = {
    emptyPages: new Set<string>(),
    pagesWidthWrongOverrides: {} as { [key: string]: Set<string> },
    pagesWidthDuplicatedHeaders: {} as { [key: string]: Set<string> },
    pagesWithoutId: new Set<string>(),
    pagesWithAbscentHeader: new Set<string>(),
    duplicatedEntities: {} as { [key: string]: Set<string> },
    pageWithAbscentId: new Set<string>(),
    pagesWidthUnprocessedCells: {} as { [key: string]: Array<{ row: number; column: number }> },
  };
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    //get all data from spreadsheet
    console.log(`##Load spreadsheets ${spreadsheetId}`);
    const spreadsheetData = await getCurrentRawData(spreadsheetId, auth, spreadsheetReport);
    //parse and validate data
    console.log(`##Create enities from spreadsheet and override them`);
    const processedData = applySpreadsheetsData(spreadsheetData, jsonData, spreadsheetReport);
    console.log(`##Merge JSON with spreadsheets`);
    //merge spreadsheet and jsonData, spreadsheet data is additional data
    const mergedData = mergeStaticData(processedData, jsonData, false);

    return { overridedData: mergedData, spreadsheetReport, spreadsheetData };
  } catch (error) {
    console.error('Spreadsheets access error :', error);
  }

  return { overridedData: jsonData, spreadsheetReport, spreadsheetData: null };
}
