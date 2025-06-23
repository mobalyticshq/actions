import { Entity, StaticData } from "./types";


function slugify(str:string) {
  str = str.replace(/^\s+|\s+$/g, ''); // trim leading/trailing white space
  str = str.toLowerCase(); // convert string to lowercase
  str = str.replace(/[^a-z0-9 -]/g, '') // remove any non-alphanumeric characters
           .replace(/\s+/g, '-') // replace spaces with hyphens
           .replace(/-+/g, '-'); // remove consecutive hyphens
  return str;
}

export type StaticDataConfig = {
    refs:Array<{from:string,to:string}>;
}

type ValidationGroupReport ={
    [key: string]:Set<string>;
    entitiesWithAbscentID: Set<string> ;
    entitiesWithDuplicatedIds: Set<string> ;
    entitiesWithMismatchedIds: Set<string> ;
    entitiesWithDuplicatedSlugs:  Set<string> ;
    entitiesWithDuplicatedGameIds:Set<string>;
    entitiesWithMismatchedSlugs:  Set<string> ;
    notCamelCaseEntities:  Set<string> ;
    abscentConfigurationForRef:  Set<string>;
    abscentGroupForRef:  Set<string>;
    invalidRef:  Set<string>;
    abscentIdInRef:  Set<string>;
    invalidAsserts:  Set<string>;
    invalidSubstitutions:  Set<string>;
}
export type ValidationReport ={
        groupNotArray: Set<string>;
        unavailableURLs:Set<string>;
        groupReport:{ [key: string]:ValidationGroupReport};
};

function isCamelCase(str:string) {
  const pattern = /^[a-z]+(?:[A-Z][a-z0-9]*)*$/;
  return pattern.test(str);
}

async function isCDNLinkValid(url:string) {
  try {    
    const res = await fetch(url,{ method: 'HEAD' });        
    return res.ok;
  } catch (err) {        
    return false;
  }
}

async function isValidAssert(val:string,tmpBucket:string,knownURL:Set<string>){            
    //check assets extensions    
    //assets must be in TMP bucket 
    //assets area available            
    if(!val|| val==='') return true;

    //TODO: should we test everything
    if(val.startsWith("https://")){
        //this is assert         
        if(!val.startsWith(tmpBucket)) return false;//tmp bucket asserts allowed only
        if(!(val.endsWith('.avif')||val.endsWith('.png')||val.endsWith('.webp'))) return false;//allowed  extensions        
        knownURL.add(val)
        return true;
    }
    //if(val.endsWith(".dds")) return true; //wrong extension    
    if(val.endsWith('.avif')||val.endsWith('.png')||val.endsWith('.webp')){
        return false;//asserts must be in bucket
    }
    
    return true;
}

function findSubstitutions(str:string) {
  const pattern = /\{\{(.*?)\}\}/g;
  const matches = [];
  let match;

  while ((match = pattern.exec(str)) !== null) {
    matches.push(match[1].trim()); 
  }

  return matches;
}


function isInvalidSubstitutions(str:string,data:StaticData){
    const subs = findSubstitutions(str);
    subs.forEach(sub=>{
        const [index, entity] = sub.split(":");        
        //TODO:is it necessery?
        //!isNaN(Number(index))
        if(entity){
            const [group,id] = entity.split(".");
            if(!data[group])
                return true;
            const ent = data[group].find(ent=>ent.id == id);
            if(!ent)
                return true;
        }
    })
    return false;
}

function deepTests(o:any,path:string,
    config:StaticDataConfig,
    data:StaticData,
    ent:Entity,
    tmpBucket:string,
    knownURL:Set<string>,
    validationGroupReport:ValidationGroupReport) {    

    if(Array.isArray(o)){
        for(const i of o)         
            deepTests(i,path,config,data,ent,tmpBucket,knownURL,validationGroupReport);        
    }else{
        if(o !== null && typeof o === 'object')
            for(const k of Object.keys(o)){
                //camelCase
                if(!isCamelCase(k)){
                    console.log(k,o);
                    validationGroupReport.notCamelCaseEntities.add(`[path=${path}]:[id=${ent.id}]`);                                
                }
                //all ref and *Ref must be correct ( need config file)
                if(k==='ref'|| k.endsWith('Ref')){   
                    const refTo = path+'.'+k;                
                    if(o[k]!==null && typeof o[k] !== "string"){
                        validationGroupReport.invalidRef.add(refTo);
                    }else {                    
                        const value = o[k];
                        const ref = config.refs.find(ref=>ref.from === refTo);
                        if(!ref){
                            validationGroupReport.abscentConfigurationForRef.add(refTo);
                        }else if(!data[ref.to]){
                            validationGroupReport.abscentGroupForRef.add(ref.to);
                        }else if(!data[ref.to].find(ent=>ent.id === value)){
                            validationGroupReport.abscentIdInRef.add(refTo+":"+value);
                        }
                    }
                }
                if(o[k] !== null && typeof o[k] === 'string'){
                    //check substitutions ( check all string values)                                            
                    if(isInvalidSubstitutions(o[k],data)){
                        validationGroupReport.invalidSubstitutions.add(o[k]);
                    }  
                    if(!isValidAssert(o[k],tmpBucket,knownURL))
                        validationGroupReport.invalidAsserts.add(o[k]);                                                                                          
                }        

            if (o[k] !== null && typeof o[k] === 'object') {
                    deepTests(o[k],path+"."+k,config,data,ent,tmpBucket,knownURL,validationGroupReport);
            }        
            };
    }
    
}


export async function validate(data:StaticData,config:StaticDataConfig,tmpBucket:string){
    const validationReport = {
        groupNotArray:new Set<string>(),
        unavailableURLs:new Set<string>(),
        groupReport:{} as { [key: string]:ValidationGroupReport},
    }
    const knownURL = new Set<string>();
    //groups are flat array Of entities
    for (const group of Object.keys(data)) {   
        const groupReport = {
            entitiesWithAbscentID:new Set<string>(),
            entitiesWithDuplicatedIds:new Set<string>(),
            entitiesWithMismatchedIds:new Set<string>(),
            entitiesWithDuplicatedSlugs:new Set<string>(),
            entitiesWithDuplicatedGameIds:new Set<string>(),
            entitiesWithMismatchedSlugs:new Set<string>(),
            notCamelCaseEntities:new Set<string>(),
            abscentConfigurationForRef:  new Set<string>(),
            abscentGroupForRef: new Set<string>(),
            invalidRef: new Set<string>(),    
            abscentIdInRef: new Set<string>(), 
            invalidAsserts:new Set<string>(),
            invalidSubstitutions:new Set<string>(),
        }; 
        validationReport.groupReport[group]=groupReport;

        if(!Array.isArray(data[group])){
            validationReport.groupNotArray.add(`[${group}]`);
            continue;
        }
        //entities has id 
        if(data[group].find(ent=>!ent.id)){
            groupReport.entitiesWithAbscentID.add(`[${group}]`);
        }
        //id  is unique in group
        const knownIds = new Set();
        data[group].forEach(ent=>{
            if(ent.id && knownIds.has(ent.id)){
                groupReport.entitiesWithDuplicatedIds.add(`[${group}]:[id=${ent.id}]`); 
            }
            ent.id&&knownIds.add(ent.id)
        })

        //slug is unique
        const knownSlugs = new Set();
        data[group].forEach(ent=>{
            if(ent.slug && knownSlugs.has(ent.slug)){
                groupReport.entitiesWithDuplicatedSlugs.add(`[${group}]:[slug=${ent.slug}]`); 
            }
            ent.slug&&knownSlugs.add(ent.slug)
        })

        //gameId is unique
        const knownGameIds= new Set();
        data[group].forEach(ent=>{
            if(ent.gameId && knownGameIds.has(ent.gameId)){
                groupReport.entitiesWithDuplicatedGameIds.add(`[${group}]:[gameId=${ent.gameId}]`);
            }
            ent.gameId&&knownGameIds.add(ent.gameId)
        })

        //gameId && id == gamId || name && id == slugify(name)
        data[group].forEach(ent=>{
            if(ent.gameId && ent.id){
                if(ent.gameId!==ent.id){
                    groupReport.entitiesWithMismatchedIds.add(`[${group}]:[id=${ent.id}]`);
                }
            }else if(ent.name && ent.id){
                if(slugify(ent.name)!==ent.id){
                    groupReport.entitiesWithMismatchedIds.add(`[${group}]:[id=${ent.id}]`);
                }                
            }
        })
        
        //name && slug == slugify(name)
        data[group].forEach(ent=>{
            if(ent.name && ent.slug)
                if(slugify(ent.name)!==ent.slug){
                    groupReport.entitiesWithMismatchedSlugs.add(`[${group}]:[slug=${ent.slug}]`);      
                }
        })

        //rest tests
        for (const ent of data[group]) {
            deepTests(
                ent,
                group,
                config,
                data,
                ent,
                tmpBucket,
                knownURL,
                groupReport);
        }        
    }  
    await Promise.all(Array.from(knownURL).map(async url => {
        const resp = await isCDNLinkValid(url)        
        if(!resp)
            validationReport.unavailableURLs.add(url); 
        return Promise.resolve(resp);
    }));
    let valid = false;    
    return {valid,validationReport};
}