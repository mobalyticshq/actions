import { google } from 'googleapis';
import { GoogleAuth } from 'google-auth-library';

const sheets = google.sheets("v4");        

export function addFilterToSheet(sheetId:number,
    startRowIndex:number,endRowIndex:number,startColumnIndex:number,endColumnIndex:number
) {
  const request = 
    {
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
            filterSpecs: [

            ]
          }
        }
    };
  return request;
}


export function  setColor(sheetId:number,
    startRowIndex:number,
    endRowIndex:number,
    startColumnIndex:number,
    endColumnIndex:number,
    red=1.0,green=1.0,blue=1.0){
    const request = 
        {
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

export async function removeAllMetadata(spreadsheetId:string,auth:GoogleAuth){

    const sheetData = await sheets.spreadsheets.get({
        spreadsheetId,
        fields: 'sheets.properties,sheets.protectedRanges,sheets.properties,sheets.filterViews.filterViewId',
        auth: auth,
    });
    const requests = [];

    const filterIds = (sheetData.data.sheets || [])
        .flatMap(s => s.filterViews || [])
        .map(v => v.filterViewId);

    filterIds.forEach(id=>{
        requests.push({
            deleteFilterView: { filterId: id }
        })
    })    

    for (const sheet of sheetData.data.sheets || []) {
        requests.push({
            clearBasicFilter: { sheetId: sheet.properties?.sheetId }
        })
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

export function protect(sheetId:number,rows:number,columns:number,clientEmail:string){   
    const request = 
        {
            addProtectedRange: {
            protectedRange: {
                range: {
                sheetId,
                startRowIndex:0,
                endRowIndex:rows,
                startColumnIndex: 0,
                endColumnIndex: columns,
                },
                description: 'Read-only column for users',
                warningOnly: false,
                editors: {
                users: [clientEmail]
                }
                },
            },
        };
    return request; 
}

// export  function allowFormating(sheetId:number){   
//     const request = 
//         {
//         updateSheetProperties: {
//             properties: {
//             sheetId: 0,
//             sheetProtection: {
//                 protected: true,
//                 warningOnly: false,
//                 allowFormattingColumns: true,
//                 allowFormattingCells: false,
//                 allowDeletingColumns: false
//             }
//             },
//             fields: 'sheetProtection(protected,warningOnly,allowFormattingColumns,allowFormattingCells,allowDeletingColumns)'
//         }
//         }
//     return request; 
// }


export async function addSheet(spreadsheetId:string,auth:GoogleAuth,title:string){
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
                    columnCount: 26      
                },
                tabColor: {
                    red: 0.8,
                    green: 0.8,
                    blue: 1
                }
                },
            },
            },
        ],
        },
    });  
}

export async function deleteSheet(spreadsheetId:string,auth:GoogleAuth,sheetId:number){
    await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        auth: auth,
        requestBody: {
        requests: [
            {
                deleteSheet: {
                    sheetId
                }
            }
        ],
        },
    });  
}