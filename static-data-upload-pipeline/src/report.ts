import { Entity, StaticData, ValidationEntityReport, ValidationRecords, ValidationReport } from "./types";

import { google } from 'googleapis';

import { GoogleAuth } from 'google-auth-library';
import { addSheet, deleteSheet, setColor } from "./spreadsheets.utils";
import { stringify } from "./utils";

const mainReportName= "main report";
const sheets = google.sheets("v4");     

type ColoredCell = {row:number,col:number,r:number,g:number,b:number};

function subPath(path:string,idx:number){
    return path.split('.')[idx]?.replace(/\[\d+\]/g, '');
}

function skipBeginPath(path:string){
    return path.substring(path.indexOf('.')+1);
}

async function prepareSheets(spreadsheetId:string,auth:GoogleAuth){
    const sheetsData = await sheets.spreadsheets.get({spreadsheetId, auth,includeGridData: false});

    //prepare sheets
    if(sheetsData.data.sheets){            
        const report = sheetsData.data.sheets.find(sheet=>sheet.properties?.title === mainReportName);
        if(!report){
            addSheet(spreadsheetId,auth,mainReportName);
        }

        for(let i=0;i<sheetsData.data.sheets.length;++i){
            const sheet = sheetsData.data.sheets[i];
            if(sheet.properties && sheet.properties.sheetId!=null && sheet.properties?.title!==mainReportName){
                await deleteSheet(spreadsheetId,auth,sheet.properties.sheetId);
            }    
            if(sheet.properties?.sheetId && sheet.properties?.title==mainReportName){
                await sheets.spreadsheets.values.clear({
                    spreadsheetId,
                    auth,
                    range: mainReportName, 
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

function validateRecords(
    spreadsheetData:{ [key: string]: Array<Array<string>> },
    records:ValidationRecords,
    coloredCells:{ [key: string]: Array<ColoredCell>},
    group:string, 
    row:Array<string>,
    header:Array<string>,r:number,g:number,b:number){
    
    for(const key of Object.keys(records)){
        //kind of message                        
        let msg ='';
        let colNumber =0;
        for(const prop of header){
            //warnings in this field
            records[key].forEach(path =>{
                if(subPath(path,1)==prop){
                    msg+=`${key} (${skipBeginPath(path)})\n`;
                    coloredCells[group].push({
                        row:spreadsheetData[group]?spreadsheetData[group].length:1,
                        col:colNumber+1,
                        r,g,b
                    });
                }
            });
            colNumber++;
        }
        if(msg.length>0)
            row.length==0?row.push(msg):row[0]=row[0]+msg;                        
    }
}
function appendRow(
    spreadsheetData:{ [key: string]: Array<Array<string>> },
    coloredCells:{ [key: string]: Array<ColoredCell>},
    group:string, 
    entity:Entity, 
    row:Array<string>,
    header:Array<string>){

    if(row.length>0){
        for(const prop of header){
            if(entity[prop]){
                row.push(stringify(entity[prop]));
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
    }
}

function prepareData(reports:ValidationReport[]){
    const spreadsheetData:{ [key: string]: Array<Array<string>> } = {};           
    spreadsheetData[mainReportName] = new Array<Array<string>>();
    const coloredCells:{ [key: string]: Array<ColoredCell>} = {};   

    for(const report of reports){    
        //all report generators 
        if(report.errors && Object.keys(report.errors).length>0){                        
            let flag=false;
            for(const error of Object.keys(report.errors)){                
                if(report.errors[error].size>0){
                    //add line with name of error                    
                    for (const value of report.errors[error]) {
                        if(!flag){
                            spreadsheetData[mainReportName].push(['ERRORS']);
                            flag = true;
                        }
                        spreadsheetData[mainReportName].push([error,value])
                    }
                    spreadsheetData[mainReportName].push([''])
                }
            }
        }
        if(report.warnings && Object.keys(report.warnings).length>0){
            for(const warning of Object.keys(report.warnings)){                
                let flag = false;
                if(report.warnings[warning].size>0){
                    //add line with name of warning                    
                    for (const value of report.warnings[warning]) {
                        if(!flag){
                            spreadsheetData[mainReportName].push(['WARNINGS']);
                            flag = true;
                        }
                        spreadsheetData[mainReportName].push([warning,value])
                    }
                    spreadsheetData[mainReportName].push([''])
                }
            }
        }
        
        if(report.infos && Object.keys(report.infos).length>0){            
            let flag  = false;
            for(const info of Object.keys(report.infos)){                        
                if(report.infos[info].size>0){
                    //add line with name of info                                        
                    for (const value of report.infos[info]) {
                        if(!flag){
                            spreadsheetData[mainReportName].push(['INFOS']);
                            flag = true;
                        }                        
                        spreadsheetData[mainReportName].push([info,value])
                    }
                    spreadsheetData[mainReportName].push([''])
                }
            }        
        }                

        for(const group of Object.keys(report.byGroup)){      
            //all groups
            //get header for group
            const groupErrors = `${group} errors`;
            const groupWarnings = `${group} warnings`;
            const groupInfos = `${group} infos`;
            coloredCells[groupErrors] = new Array<{row:number,col:number,r:number,g:number,b:number}>();
            coloredCells[groupWarnings] = new Array<{row:number,col:number,r:number,g:number,b:number}>();
            coloredCells[groupInfos] = new Array<{row:number,col:number,r:number,g:number,b:number}>();

            const headerSet = new Set<string>();
            report.byGroup[group].forEach(record=>{
                for (const prop of Object.keys(record.entity)) {    
                    headerSet.add(prop);
                }
            });
            const header = Array.from(headerSet);                
            for(const entReport of report.byGroup[group]){                            
                //all entities
                const rowError = new Array<string>();      
                const rowWarning = new Array<string>();      
                const rowInfo = new Array<string>();    
                validateRecords(spreadsheetData,
                    entReport.errors,
                    coloredCells,
                    groupErrors,
                    rowError,
                    header,
                    181./255, 49./255, 49./255);  

                validateRecords(spreadsheetData,
                    entReport.warnings,
                    coloredCells,
                    groupWarnings,
                    rowWarning,header,
                    181./255, 181./255, 49./255
                );
               
                validateRecords(spreadsheetData,
                    entReport.infos,
                    coloredCells,
                    groupInfos,
                    rowInfo,
                    header,
                    49./255, 181./255, 49./255                    
                );            


               appendRow(spreadsheetData,coloredCells,groupErrors,entReport.entity,rowError,header);
               appendRow(spreadsheetData,coloredCells,groupWarnings,entReport.entity,rowWarning,header);
               appendRow(spreadsheetData,coloredCells,groupInfos,entReport.entity,rowInfo,header);
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
                client_email: process.env.GOOGLE_SPREADSHEET_REPORT_EMAIL,
                private_key: process.env.GOOGLE_SPREADSHEET_REPORT_KEY?.replace(/\\n/g, '\n'),
            },
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });
        console.log("## prepare sheets");
        await prepareSheets(spreadsheetId,auth);        
        
        console.log("## prepare data");
        const {spreadsheetData,coloredCells} = prepareData(reports);

        console.log("## fill pages sheets");
        await fillPages(spreadsheetData,spreadsheetId,auth);

        console.log("## fill colors");
        await fillColors(coloredCells,spreadsheetId,auth);
        return true;
    }catch(error){
        console.error('Report spreadsheets access error :', error);
    }
    return false;
}