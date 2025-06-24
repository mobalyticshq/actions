import { MergeReport } from "./merge";
import { SpreadsheetReport } from "./spreadsheets";
import { StaticData, ValidationRecords, ValidationReport } from "./types";

import { google } from 'googleapis';

import { GoogleAuth } from 'google-auth-library';
import { addSheet, deleteSheet, setColor } from "./spreadsheets.utils";
import { stringify } from "./utils";

const reportName= "pipeline report";
const sheets = google.sheets("v4");     

type ColoredCell = {row:number,col:number,r:number,g:number,b:number};

async function prepareSheets(spreadsheetId:string,auth:GoogleAuth){
    const sheetsData = await sheets.spreadsheets.get({spreadsheetId, auth,includeGridData: false});

    //prepare sheets
    if(sheetsData.data.sheets){            
        const report = sheetsData.data.sheets.find(sheet=>sheet.properties?.title === reportName);
        if(!report){
            addSheet(spreadsheetId,auth,reportName);
        }

        for(let i=0;i<sheetsData.data.sheets.length;++i){
            const sheet = sheetsData.data.sheets[i];
            if(sheet.properties && sheet.properties.sheetId!=null && sheet.properties?.title!==reportName){
                await deleteSheet(spreadsheetId,auth,sheet.properties.sheetId);
            }    
            if(sheet.properties?.sheetId && sheet.properties?.title==reportName){
                await sheets.spreadsheets.values.clear({
                    spreadsheetId,
                    auth,
                    range: reportName, 
                });
            }
        }
    }
}


async function fillColors(
    cells:{ [key: string]: Array<{row:number,col:number,r:number,g:number,b:number}>},
    spreadsheetId:string,
    auth:GoogleAuth){
        
    const response = await sheets.spreadsheets.get({
        spreadsheetId,
        auth: auth,
    });
    const requests = [];

    const sheetsInfo = response.data.sheets;
    if(sheetsInfo){        
        for (const sheet of sheetsInfo) {
            const sheetId = sheet.properties?.sheetId;
            if(sheet.properties?.title  &&  sheetId){                

                //reset color
                requests.push(setColor(sheetId,0,1000,0,26,1,1,1));                
                cells[sheet.properties?.title]?.forEach(cell=>{
                    requests.push(setColor(sheetId, cell.row,cell.row+1,
                        cell.col,cell.col+1,cell.r,cell.g,cell.b));                
                });

            }      
        }
    }

    await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        auth: auth,
        requestBody: {
        requests:requests}});  
}


function prepareData(reports:ValidationReport[]){
    const spreadsheetData:{ [key: string]: Array<Array<string>> } = {};           
    spreadsheetData[reportName] = new Array<Array<string>>();
    const coloredCells:{ [key: string]: Array<ColoredCell>} = {};   

    for(const report of reports){    
        //all report generators 
        for(const error of Object.keys(report.errors)){                
            if(report.errors[error].size>0){
                //add line with name of error                    
                for (const value of report.errors[error]) {
                    spreadsheetData[reportName].push([error,value])
                }
                spreadsheetData[reportName].push([''])
            }
        }

        for(const group of Object.keys(report.byGroup)){      
            //all groups
            //get header for group
            coloredCells[group] = new Array<{row:number,col:number,r:number,g:number,b:number}>();
            const headerSet = new Set<string>();
            report.byGroup[group].forEach(record=>{
                for (const prop of Object.keys(record.entity)) {    
                    headerSet.add(prop);
                }
            });

            const header = Array.from(headerSet);                
            let rowNumber =0;
            for(const entReport of report.byGroup[group]){                            
                //all entities
                const row = new Array<string>();      
                //check errors              
                for(const error of Object.keys(entReport.errors)){
                    //kind of errors                
                    if(entReport.errors[error].size>0){                                                           
                        row.length==0?row.push(error):row[0]=row[0]+'\n'+error;                        
                        let colNumber =0;
                        for(const prop of header){
                            //error in this field
                            if(entReport.errors[error].has(prop)){
                                coloredCells[group].push({
                                    row:rowNumber+1,
                                    col:colNumber+1,
                                    r:181./255, 
                                    g:49./255, 
                                    b:49./255
                                });
                            }
                            colNumber++;
                        }
                    }
                }

                //check warnings
                for(const warning of Object.keys(entReport.warnings)){
                    //kind of warning
                    if(entReport.warnings[warning].size>0){                                                           
                        row.length==0?row.push(warning):row[0]=row[0]+'\n'+warning;
                        let colNumber =0;
                        for(const prop of header){
                            //warnings in this field
                            if(entReport.warnings[warning].has(prop)){
                                coloredCells[group].push({
                                    row:rowNumber+1,
                                    col:colNumber+1,
                                    r:181./255, 
                                    g:181./255, 
                                    b:49./255
                                });
                            }
                            colNumber++;
                        }                        
                    }
                }
                //check info
                for(const info of Object.keys(entReport.infos)){
                    //kind of info                
                    if(entReport.infos[info].size>0){           
                        row.length==0?row.push(info):row[0]=row[0]+'\n'+info;
                        let colNumber =0;
                        for(const prop of header){
                            //infos in this field
                            if(entReport.infos[info].has(prop)){
                                coloredCells[group].push({
                                    row:rowNumber+1,
                                    col:colNumber+1,
                                    r:49./255, 
                                    g:181./255, 
                                    b:49./255
                                });
                            }
                            colNumber++;
                        }                             
                    }
                }   

                if(row.length>0){
                    for(const prop of header){
                        if(entReport.entity[prop]){
                            row.push(stringify(entReport.entity[prop]));
                        }else
                            row.push('');
                    }                        
                    if(!spreadsheetData[group]){
                        spreadsheetData[group]=new Array<Array<string>>();
                        //add header                                            
                        spreadsheetData[group].push(["report messages",...header]);
                        for(let i=0;i<spreadsheetData[group][0].length;++i)
                            coloredCells[group].push({
                                row:0,
                                col:i,
                                r:143./255,g:176./255,b:106./255                          
                        });
                    }
                    spreadsheetData[group].push(row);
                    rowNumber++;
                }
            }
        }
    }
    return {spreadsheetData,coloredCells};
}

async function fillPages(spreadsheetData:{ [key: string]: Array<Array<string>> },spreadsheetId:string,auth:GoogleAuth){
    const sheetsData = await sheets.spreadsheets.get({spreadsheetId, auth,includeGridData: false});
    
    if(sheetsData.data.sheets){     
        for (const group of Object.keys(spreadsheetData)) {           
            const report = sheetsData.data.sheets.find(sheet=>sheet.properties?.title === group);                
            if(!report){
                await addSheet(spreadsheetId,auth,group);
            }
            
           await sheets.spreadsheets.values.append({
           spreadsheetId: spreadsheetId,
           auth: auth,
           range: group,
           valueInputOption: "RAW",
           requestBody: {
              values: spreadsheetData[group]
           }
           }); 
        }
    }
}

export async function createReport(reports:ValidationReport[],    
    spreadsheetId:string){

    try {
        const auth = new google.auth.GoogleAuth({
            credentials: {
                client_email: process.env.GOOGLE_CLIENT_EMAIL,
                private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            },
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        await prepareSheets(spreadsheetId,auth);
        
        const {spreadsheetData,coloredCells} = prepareData(reports);
        
        await fillPages(spreadsheetData,spreadsheetId,auth);

        await fillColors(coloredCells,spreadsheetId,auth);

    }catch(error){
        console.error('Report spreadsheets access error :', error);
    }

}