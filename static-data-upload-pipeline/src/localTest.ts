import { readdirSync,readFileSync,existsSync, writeFileSync } from 'fs';
import * as path from 'path'
import { StaticData, StaticDataConfig } from './types';
import { logColors } from './logger';
import { mergeStaticData } from './merge';

async function run(){
    const dirName = "C:\\mobalytics\\ngf-configuration\\borderlands-4\\dev\\static_data"

    const pattern = /static_data_v\d+.\d+.\d+.json/;

    const files = readdirSync( dirName);
    const versionedFiles = new Array<string>();
    files.forEach(filename => {    
        if (!pattern.test(filename)) return null;                
        versionedFiles.push(path.join(dirName,filename));
    });
    const sortedFiles = versionedFiles.map( a => a.replace(/\d+/g, n => ''+(Number(n)+10000) ) ).sort()
          .map( a => a.replace(/\d+/g, n => ''+(Number(n)-10000) ) ) ;

    console.log(sortedFiles);          

    let configDir = path.dirname(sortedFiles[0]);
    let gameConfig = "";
    let config = {} as StaticDataConfig;
 
    for(let i=0;i<3;++i){
      if(await existsSync(path.join(configDir,"config.json"))){
        gameConfig = path.join(configDir,"config.json");
        break;
      }
      configDir = path.join(configDir,"../");
    }

    if(gameConfig.length==0){
      console.log(`❌ Can't find game config for ${sortedFiles[0]}`)
    }else{
      console.log(`ℹ️ Game config  ${gameConfig}`);
      config = JSON.parse(readFileSync(gameConfig, 'utf8'));
    }

    let  staticData = {} as StaticData,oldData = {} as StaticData;
    
    for(let i=0;i<sortedFiles.length;++i){
      console.log(`✍ Merge ${logColors.green} ${sortedFiles[i]} ${logColors.reset}`);
      const data = JSON.parse(readFileSync(sortedFiles[i], 'utf8'));    
      staticData = mergeStaticData(data,staticData);
      if(i==sortedFiles.length-2)
        oldData = structuredClone(staticData);
    }
    writeFileSync("staticData.json",JSON.stringify(staticData),'utf8')

}

// run();