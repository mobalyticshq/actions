import { Entity, StaticData, StaticDataConfig, ValidationEntityReport, ValidationRecords } from "./types";
import { slugify } from "./utils";

export enum ReportMessages{
    assertURLNotAvailable = "Assert URL not available",
    groupNotArray = "Group is not array",
    abscentID = "id is abscent",
    duplicatedIds="id is not uniq",
    mismatchedIds="id!=gameId||id!=slugify(name)",
    duplicatedSlugs="slug is not uniq",
    duplicatedGameIds="gameId is not uniq",
    mismatchedSlugs="slug!=slugify(name)",
    notInCamelCase = "not in camel case",
    abscentConfigurationForRef="can't find ref in config file",
    abscentGroupForRef="can't find group for ref",
    invalidRef="wrong field type for ref",
    abscentIdInRef="can't find entity in referenced group",
    invalidAsserts="invalid assert value",
    invalidSubstitutions="can't find data for substitution",
} 


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

function subPath(path:string,idx:number){
    return path.split('.')[idx];
}

function deepTests(o:any,path:string,
    config:StaticDataConfig,
    data:StaticData,
    tmpBucket:string,
    knownURL:Set<string>,
    validationEntityReport:ValidationEntityReport) {    

    if(Array.isArray(o)){
        for(const i of o)         
            deepTests(i,path,config,data,tmpBucket,knownURL,validationEntityReport);        
    }else{
        if(o !== null && typeof o === 'object')
            for(const k of Object.keys(o)){
                const prop = path+'.'+k;                
                //camelCase
                if(!isCamelCase(k)){
                    validationEntityReport.errors[ReportMessages.notInCamelCase].add(subPath(prop,1));                                
                }
                //all ref and *Ref must be correct ( need config file)
                if(k==='ref'|| k.endsWith('Ref')){   
                    if(o[k]!==null && typeof o[k] !== "string"){
                        validationEntityReport.errors[ReportMessages.invalidRef].add(subPath(prop,1));
                    }else {                    
                        const value = o[k];
                        const ref = config.refs.find(ref=>ref.from === prop);
                        if(!ref){
                            validationEntityReport.errors[ReportMessages.abscentConfigurationForRef].add(subPath(prop,1));
                        }else if(!data[ref.to]){
                            validationEntityReport.errors[ReportMessages.abscentGroupForRef].add(subPath(prop,1));
                        }else if(!data[ref.to].find(ent=>ent.id === value)){
                            validationEntityReport.errors[ReportMessages.abscentIdInRef].add(subPath(prop,1));
                        }
                    }
                }
                if(o[k] !== null && typeof o[k] === 'string'){
                    //check substitutions ( check all string values)                                            
                    if(isInvalidSubstitutions(o[k],data)){
                        validationEntityReport.errors[ReportMessages.invalidSubstitutions].add(subPath(prop,1));
                    }  
                    if(!isValidAssert(o[k],tmpBucket,knownURL))
                        validationEntityReport.errors[ReportMessages.invalidAsserts].add(subPath(prop,1));                                                                                          
                }        

            if (o[k] !== null && typeof o[k] === 'object') {
                    deepTests(o[k],path+"."+k,config,data,tmpBucket,knownURL,validationEntityReport);
            }        
            };
    }
    
}


export async function validate(data:StaticData,config:StaticDataConfig,tmpBucket:string){
    const validationReport = {
        errors:{
            unavailableURLs:new Set<string>()
        } as ValidationRecords,
        warnings:{} as ValidationRecords,
        byGroup:{} as { [key: string]:Array<ValidationEntityReport>}
    }
    const knownURL = new Set<string>();
    //groups are flat array Of entities
    for (const group of Object.keys(data)) {   

        validationReport.byGroup[group] = new Array<ValidationEntityReport>();
        validationReport.errors[ReportMessages.groupNotArray] = new Set();        
        validationReport.errors[ReportMessages.assertURLNotAvailable]= new Set();

        if(!Array.isArray(data[group])){
            validationReport.errors["Group is not array"].add(`[${group}]`);
            continue;
        }
        const knownIds = new Set();
        const knownSlugs = new Set();
        const knownGameIds= new Set();

        //entities has id 
        for (const ent of data[group]) {
            const entityReport = {
                entity:ent,
                warnings:{},
                errors:{
                    [ReportMessages.abscentID]:new Set<string>(),
                    [ReportMessages.duplicatedIds]:new Set<string>(),
                    [ReportMessages.mismatchedIds]:new Set<string>(),
                    [ReportMessages.duplicatedSlugs]:new Set<string>(),
                    [ReportMessages.duplicatedGameIds]:new Set<string>(),
                    [ReportMessages.mismatchedSlugs]:new Set<string>(),
                    [ReportMessages.notInCamelCase]:new Set<string>(),
                    [ReportMessages.abscentConfigurationForRef]:  new Set<string>(),
                    [ReportMessages.abscentGroupForRef]: new Set<string>(),
                    [ReportMessages.invalidRef]: new Set<string>(),    
                    [ReportMessages.abscentIdInRef]: new Set<string>(), 
                    [ReportMessages.invalidAsserts]:new Set<string>(),
                    [ReportMessages.invalidSubstitutions]:new Set<string>(),
                }
            } as ValidationEntityReport; 

            if(!ent.id)
                entityReport.errors[ReportMessages.abscentID].add('id');
      //  }
        //id  is unique in group
            if(ent.id && knownIds.has(ent.id)){
                entityReport.errors[ReportMessages.duplicatedIds].add('id');
            }
            ent.id&&knownIds.add(ent.id)


            if(ent.slug && knownSlugs.has(ent.slug)){
                entityReport.errors[ReportMessages.duplicatedSlugs].add('slug');
            }
            ent.slug&&knownSlugs.add(ent.slug)

        //gameId is unique
            if(ent.gameId && knownGameIds.has(ent.gameId)){
                entityReport.errors[ReportMessages.duplicatedGameIds].add('gameId');
            }
            ent.gameId&&knownGameIds.add(ent.gameId)

        //gameId && id == gamId || name && id == slugify(name)
            if(ent.gameId && ent.id){
                if(ent.gameId!==ent.id){
                    entityReport.errors[ReportMessages.mismatchedIds].add('id');
                }
            }else if(ent.name && ent.id){
                if(slugify(ent.name)!==ent.id){
                    entityReport.errors[ReportMessages.mismatchedIds].add('id');
                }                
            }
        
        //name && slug == slugify(name)
            if(ent.name && ent.slug)
                if(slugify(ent.name)!==ent.slug){
                    entityReport.errors[ReportMessages.mismatchedSlugs].add('slug');
                }

        //rest tests
            await deepTests(
                ent,
                group,
                config,
                data,
                tmpBucket,
                knownURL,
                entityReport);
                validationReport.byGroup[group].push(entityReport);
        }        
        
    }  
    await Promise.all(Array.from(knownURL).map(async url => {
        const resp = await isCDNLinkValid(url);
        if(!resp)
            validationReport.errors[ReportMessages.assertURLNotAvailable].add(url); 

        return Promise.resolve(resp);
    }));

    return validationReport;
}