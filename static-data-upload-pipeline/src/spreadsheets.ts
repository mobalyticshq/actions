import { google } from 'googleapis';
import { Entity, StaticData } from './types';
import { mergeStaticData } from './merge';
import { GoogleAuth } from 'google-auth-library';
import { addFilterToSheet, addSheet, protect, removeAllMetadata, setColor } from './spreadsheets.utils';
import { isImage, stringify } from './utils';

const sheets = google.sheets("v4");        


export type SpreadsheetReport = {
    emptyPages:Set<string>,
    pagesWidthWrongOverrides: { [key: string]: Set<string> };
    pagesWidthDuplicatedHeaders: { [key: string]: Set<string> };
    pagesWithoutId:Set<string>,
    pagesWithAbscentHeader:Set<string>,
    duplicatedEntities:{ [key: string]: Set<string> },
    pageWithAbscentId:Set<string>,
    pagesWidthUnprocessedCells: { [key: string]: Array<{row:number,column:number}> };
}

function applySpreadsheetsData(rawData: { [key: string]: any[][]|null },knownData:StaticData,spreadsheetReport:SpreadsheetReport){    
    const entities:StaticData={};

    for (const group of Object.keys(rawData)) {           

        if(!rawData[group] || rawData[group].length == 0){
            spreadsheetReport.emptyPages.add(group);
            continue;            
        }
        
        //check wrong header
        //zero line should be the header
        if(!rawData[group][0].find(val=>val === 'id')){
            spreadsheetReport.pagesWithoutId.add(group);                    
            continue;
        }
        if(rawData[group][0].find(val=>val === '')){
            spreadsheetReport.pagesWithAbscentHeader.add(group);                                
        }

        //get known fields 
        const knownFields = new Set<string>();
        knownData[group]?.forEach(ent=>{
            for (const prop of Object.keys(ent)) {    
                knownFields.add(prop)
            }
        })

        for(let j = 0;j<rawData[group][0].length;j++){                
            const field = rawData[group][0][j] as string;
            if(field.endsWith('_override')){
                const originalField = field.replace('_override','');
                if(originalField == 'id' || !knownFields.has(originalField)){
                    spreadsheetReport.pagesWidthWrongOverrides[group] ||=new Set()                                        
                    spreadsheetReport.pagesWidthWrongOverrides[group].add(field);  
                }
            }            
            if(field!==''&& rawData[group][0].filter(value=>value==field).length>1){                
                spreadsheetReport.pagesWidthDuplicatedHeaders[group]||=new Set()                          
                spreadsheetReport.pagesWidthDuplicatedHeaders[group].add(field);                 
            }
        }
        entities[group] = [];     

        //copy data to object
        for(let i=1;i<rawData[group].length;++i){
            const obj:{ [key: string]: any}={};
            for(let j = 0;j<rawData[group][0].length;j++){                
                const field = rawData[group][0][j] as string;
                //add new field to entity
                if(field!=='' && !field.endsWith('_override'))
                    if(j>=rawData[group][i].length){
                        obj[field]='';
                    }else                              
                        rawData[group][i][j]?obj[field]=rawData[group][i][j]:obj[field]='';                        
                }
            //check id is exist    
            if(obj.id===''|| !obj.id){
                spreadsheetReport.pageWithAbscentId.add(group);                
                continue;
            }

            //get value from known json        
            const knownObj = knownData[group]?.find(ent=>ent.id === obj.id)
            const ent:Entity = {id:obj.id,...obj,...knownObj};
            //now override fields
            for(let j = 0;j<rawData[group][0].length;j++){                
                const field = rawData[group][0][j] as string;
                if(field.endsWith('_override')){
                    const originalField = field.replace('_override','');                    
                    //override known field 
                    if(knownFields.has(originalField) && rawData[group][i][j] && originalField !== 'id'&& rawData[group][i][j]!==''){
                        ent[originalField] = rawData[group][i][j];
                    }                
                }                
            }            
            //check duplicates in data by id
            const found = entities[group].find(e=>e.id === ent.id );
            if(found){
                spreadsheetReport.duplicatedEntities[group]||=new Set()
                spreadsheetReport.duplicatedEntities[group].add(ent.id);                
            }else{
                //everything is ok 
                entities[group].push(ent);
            }
        }
    }

    return entities;
}

async function getCurrentRawData(spreadsheetId:string,auth:GoogleAuth,spreadsheetReport:SpreadsheetReport){
    const sheetsData = await sheets.spreadsheets.get({spreadsheetId, auth,includeGridData: true,  
        fields: 'sheets.properties.title,sheets.data.rowData.values.userEnteredValue', 
    });
    const rawData: { [key: string]: Array<Array<string>> } = {};    
    
    console.log(`## Current spreadsheet structure:##`);
    console.log(sheetsData.data.sheets);

    if(sheetsData.data.sheets)
        for(let i=0;i<sheetsData.data.sheets.length;++i){
            const sheet = sheetsData.data.sheets[i];
            if(sheet.properties?.title){
                rawData[sheet.properties?.title] = new Array<Array<string>>();
            }            
            if(sheet.properties?.title && sheet.data && sheet.data.length>0 && sheet.data[0].rowData){                  
                const gridData = sheet.data[0].rowData;
                const header = gridData[0];
                if(header && header.values){
                    const resultHeader = new Array<string>();                
                    for (const cell of header.values) {
                        if(!cell || !cell.userEnteredValue || !cell.userEnteredValue.stringValue)
                            break;                        
                        resultHeader.push(cell.userEnteredValue.stringValue)
                    }

                    rawData[sheet.properties?.title].push(resultHeader);

                    for (let j = 1;j<gridData.length;++j){
                        const row = gridData[j];
                        if (!row.values) continue;
                        const result = new Array<string>();     
                        let emptyCells = 0;           
                        for (let k = 0;k<row.values.length&& k<resultHeader.length;k++){
                            const cell = row.values[k];
                            if(cell&& cell.userEnteredValue){
                                if(cell.userEnteredValue.stringValue){
                                    result.push(cell.userEnteredValue.stringValue);
                                }else if(cell.userEnteredValue.formulaValue){
                                    const formula = cell.userEnteredValue.formulaValue;
                                    if(formula.startsWith("=IMAGE(\"")){
                                        const txt = formula.substring(0,formula.length-2);
                                        result.push(txt.replace("=IMAGE(\"",""));        
                                    }else{
                                        spreadsheetReport.pagesWidthUnprocessedCells[sheet.properties?.title]||=new Array();
                                        spreadsheetReport.pagesWidthUnprocessedCells[sheet.properties?.title].push({row:j,column:k});
                                    }
                                }else if(cell.userEnteredValue.boolValue){
                                    result.push(String(cell.userEnteredValue.boolValue));
                                }else if(cell.userEnteredValue.numberValue){
                                    result.push(String(cell.userEnteredValue.numberValue));
                                }else{
                                    spreadsheetReport.pagesWidthUnprocessedCells[sheet.properties?.title]||=new Array();
                                    spreadsheetReport.pagesWidthUnprocessedCells[sheet.properties?.title].push({row:j,column:k});                                
                                }
                            }else{
                                result.push('');
                                emptyCells++;
                            }
                        }
                        if(emptyCells==resultHeader.length)
                            break;
                        rawData[sheet.properties?.title].push(result);
                    }
                    
                }
            }

        }

    return rawData;
}   

function getRange(enities:Array<{[key:string]:any}>){
    const headerSet = new Set<string>();
    enities.forEach(ent=>{
        for (const prop of Object.keys(ent)) {    
            headerSet.add(prop)
        }
    })
    return {rows:enities.length+1,columns:headerSet.size};
}

function entitiesToRawData(knownData:Array<Entity>|undefined,mergedData:Array<Entity>,rows:any[][]|null){

    const knownFields = new Set<string>();
    knownData?.forEach(ent=>{
        for (const prop of Object.keys(ent)) {    
            knownFields.add(prop)
        }
    })
    const idColumnIdx =rows&&rows.length>0? rows[0].findIndex(val=>val==='id'):-1;

    const header = Array.from(knownFields)
    //add header from spreadsheets to known header
    if(rows&&rows.length>0){
        if(idColumnIdx>=0){
            //add header from spreadsheets to known header
            for(let j=0;j<rows[0].length;j++){
                const field = rows[0][j] as string;
                if(!header.includes(field)){
                    header.push(field);
                }
            }
        }
    }    

    const resultRows = new Array<Array<string>>()
    //add header
    resultRows.push(header);    

    mergedData.forEach(ent=>{
        const newRow = [];
        for(let i=0;i<header.length;i++){
            const known = knownData?.find(obj=>obj.id == ent.id);
            const oldRow = rows?.find(row=>row[idColumnIdx] == ent.id);
            if(known && known[header[i]]){
                newRow.push(stringify(known[header[i]]))
                continue;
            }else if(idColumnIdx>=0 && oldRow && oldRow[i]){
                newRow.push(stringify(oldRow[i]))                
            }else
                newRow.push('');
        }
        resultRows.push(newRow);
    })

    return resultRows;
}

//set colors and protections for data
async function setMetadata(spreadsheetId:string,auth:GoogleAuth,knownData:StaticData,allData:{ [key: string]: Array<Array<string>> },clientEmail:string) {  
        
    const response = await sheets.spreadsheets.get({
        spreadsheetId,
        auth: auth,
    });
    const requests = [];

    const sheetsInfo = response.data.sheets;
    if(sheetsInfo){        
        for (const sheet of sheetsInfo) {
            if(sheet.properties?.title  && sheet.properties?.sheetId && knownData[sheet.properties?.title]){                
                const protectedDataRange = getRange(knownData[sheet.properties?.title]); 
                const allDataRange = getRange(allData[sheet.properties?.title]); 
                //reset color
                requests.push(setColor(sheet.properties?.sheetId,
                    0,1000,0,26,1,1,1));

                requests.push(setColor(sheet.properties?.sheetId,
                    0,1,0,protectedDataRange.columns,143./255,176./255,106./255));
                
                requests.push(setColor(sheet.properties?.sheetId,
                    1,protectedDataRange.rows,0,protectedDataRange.columns,0.8,0.8,0.8));

                //  requests.push(addFilterToSheet(sheet.properties?.sheetId,0,1000,0,26));
                                 
                requests.push( protect(sheet.properties?.sheetId,protectedDataRange.rows,protectedDataRange.columns,clientEmail));   
                // requests.push( allowFormating(sheet.properties?.sheetId));   

            }      
        }
    }

    await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        auth: auth,
        requestBody: {
        requests:requests}});  
             
}

async function updateFormulas(spreadsheetId:string,auth:GoogleAuth,data:{ [key: string]: Array<Array<string>> }){
    const response = await sheets.spreadsheets.get({
        spreadsheetId,
        auth: auth,        
    });
    const sheetsInfo = response.data.sheets;
    
    if(sheetsInfo){        
        for (const sheet of sheetsInfo) {
            if(sheet.properties?.title && sheet.properties?.sheetId && data[sheet.properties?.title]){                
                const requests= [];                
                //update images
                 for(let i=0;i<data[sheet.properties?.title].length;++i)
                     for(let j=0;j<data[sheet.properties?.title][i].length;++j){
                        const cell = data[sheet.properties?.title][i][j];
                        if(isImage(cell.toLowerCase()))
                        {
                            requests.push({
                            updateCells: {
                            start: {
                                sheetId: sheet.properties?.sheetId,
                                rowIndex: i,
                                columnIndex: j,
                            },
                            rows: [
                                {
                                values: [
                                    {
                                    userEnteredValue: {
                                        formulaValue: `=IMAGE("${cell}")`,
                                    },
                                    },
                                ],
                                },
                            ],
                            fields: 'userEnteredValue',
                            },
                            });
                        }
                     }            
                if(requests.length>0)
                    await sheets.spreadsheets.batchUpdate({
                        spreadsheetId: spreadsheetId,
                        auth,
                        requestBody: { requests },
                    });
            }
        }
    }
}

//update spreadsheets
export async function updateSpreadsheets(spreadsheetId:string,    
    mergedData:StaticData,
    jsonData:StaticData,
    oldSpreadsheetsData:{ [key: string]: Array<Array<string>> }) {  
    
    if(process.env.GOOGLE_CLIENT_EMAIL){
        console.log(`## Update spreadsheets ${spreadsheetId}`)
    
        const auth = new google.auth.GoogleAuth({
            credentials: {
                client_email: process.env.GOOGLE_CLIENT_EMAIL,
                private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            },
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        console.log("## Remove all protections ##")
        //remove all protections from pages
        await removeAllMetadata(spreadsheetId,auth);
        const newSpreadsheetData:{ [key: string]: Array<Array<string>> } = {};   
        //fill spreadsheets with merged data
        for (const group of Object.keys(mergedData)) {           
            //add new sheet if needed
            if(!oldSpreadsheetsData[group]){                
                console.log(`## Add page ${group} ##`)
                await addSheet(spreadsheetId,auth,group);
            }             
            
            newSpreadsheetData[group] = entitiesToRawData(jsonData[group],mergedData[group],oldSpreadsheetsData[group]) 
            console.log(`## Clear page ${group} ##`)
            await sheets.spreadsheets.values.clear({
                spreadsheetId,
                auth,
                range: group, 
            });
            console.log(`## Append data for page ${group} ##`)
            await sheets.spreadsheets.values.append({
               spreadsheetId: spreadsheetId,
               auth: auth,
               range: group,
               valueInputOption: "RAW",
               requestBody: {
                   values: newSpreadsheetData[group]
               }
            }); 
        }
        await updateFormulas(spreadsheetId,auth,newSpreadsheetData);


        await setMetadata(spreadsheetId,auth,jsonData,newSpreadsheetData,process.env.GOOGLE_CLIENT_EMAIL);

        console.log(`## Spreadsheets https://docs.google.com/spreadsheets/d/${spreadsheetId} updated`);
    }else{
        console.log(`can't edit spreadsheet need to set email`);
    }
}

export async function mergeWithSpreadsheets(spreadsheetId:string,jsonData:StaticData) {  
    
    const spreadsheetReport = {
        emptyPages:new Set<string>(),
        pagesWidthWrongOverrides:{} as { [key: string]: Set<string> },
        pagesWidthDuplicatedHeaders:{} as { [key: string]: Set<string> },
        pagesWithoutId:new Set<string>(),
        pagesWithAbscentHeader:new Set<string>(),
        duplicatedEntities:{} as { [key: string]: Set<string> },
        pageWithAbscentId:new Set<string>(),
        pagesWidthUnprocessedCells:{} as { [key: string]: Array<{row:number,column:number}> },
    }
    try {

        const auth = new google.auth.GoogleAuth({
            credentials: {
                client_email: process.env.GOOGLE_CLIENT_EMAIL,
                private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            },
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        //get all data from spreadsheet
        console.log(`##Load spreadsheets ${spreadsheetId}`)
        const spreadsheetData = await getCurrentRawData(spreadsheetId,auth,spreadsheetReport);
        //parse and validate data
        console.log(`##Create enities from spreadsheet and override them`)
        const processedData = applySpreadsheetsData(spreadsheetData,jsonData,spreadsheetReport);
        console.log(`##Merge JSON with spreadsheets`)
        //merge spreadsheet and jsonData, spreadsheet data is additional data
        const {mergedData,mergeReport} = mergeStaticData(processedData,jsonData,false);        
        
        // await updateSpreadsheets(spreadsheetId,auth,mergedData,jsonData,rawData);
        
        return {overridedData:mergedData,spreadsheetReport,spreadsheetData}

    }catch(error){
        console.error('Spreadsheets access error :', error);
    }

    return {overridedData:jsonData,spreadsheetReport,spreadsheetData:null};
}