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
    numberNotAllowed="number is not allowed",
    newEntity="new entity",
    deprecated="deprecated",
    slugChanged="slug changed",
    nameChanged="name changed",
    URLChanged="url changed",
    fieldDisappear="field disappear",
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


function fieldDisappear(newObject:Entity,oldObject?:Entity){
    if(!oldObject)
        return null;
    for(const prop of Object.keys(newObject)){
        if(oldObject[prop]===undefined && prop !="deprecated"){
            return prop;
        }
    }
    return null;
}

function deepTests(o:any,path:string,
    config:StaticDataConfig,
    data:StaticData,
    tmpBucket:string,
    knownURL:Set<string>,
    validationEntityReport:ValidationEntityReport) {    

    if(o==null)
        return;

    if( typeof o === 'string'){
        //check substitutions ( check all string values)                                            
        if(isInvalidSubstitutions(o,data)){
            validationEntityReport.errors[ReportMessages.invalidSubstitutions].add(path);
        }  
        //check on assert
        if(!isValidAssert(o,tmpBucket,knownURL))
            validationEntityReport.errors[ReportMessages.invalidAsserts].add(path);                                                                                          
    }else if(Array.isArray(o)){
        for(const i of o)         
            deepTests(i,path,config,data,tmpBucket,knownURL,validationEntityReport);            
    }else if(typeof o === 'object'){
        for(const k of Object.keys(o)){
            const prop = path+'.'+k;                
            //camelCase
            if(!isCamelCase(k)){
                validationEntityReport.errors[ReportMessages.notInCamelCase].add(prop);                                
            }
            //all ref and *Ref must be correct ( need config file)
            if(k==='ref'|| k.endsWith('Ref')){   
                if(o[k]!==null && typeof o[k] !== "string"){
                    validationEntityReport.errors[ReportMessages.invalidRef].add(prop);
                }else {                    
                    const value = o[k];
                    const ref = config.refs.find(ref=>ref.from === prop);
                    if(!ref){
                        validationEntityReport.errors[ReportMessages.abscentConfigurationForRef].add(prop);
                    }else if(!data[ref.to]){
                        validationEntityReport.errors[ReportMessages.abscentGroupForRef].add(prop);
                    }else if(!data[ref.to].find(ent=>ent.id === value)){
                        validationEntityReport.errors[ReportMessages.abscentIdInRef].add(prop);
                    }
                }
            }   
            if(o[k]!=null)
                deepTests(o[k],prop,config,data,tmpBucket,knownURL,validationEntityReport);                
        };
    }else if(typeof o === 'number'){
        validationEntityReport.errors[ReportMessages.numberNotAllowed].add(path);                                                                                          
    }
    
}


export async function validate(data:StaticData,oldData:StaticData,config:StaticDataConfig,tmpBucket:string){
    const validationReport = {
        errors:{
            unavailableURLs:new Set<string>()
        } as ValidationRecords,
        warnings:{} as ValidationRecords,
        infos:{} as ValidationRecords,
        byGroup:{} as { [key: string]:Array<ValidationEntityReport>}
    }
    const knownURL = new Set<string>();
    //groups are flat array Of entities
    for (const group of Object.keys(data)) {   

        validationReport.byGroup[group] = new Array<ValidationEntityReport>();
        validationReport.errors[ReportMessages.groupNotArray] = new Set();        
        validationReport.errors[ReportMessages.assertURLNotAvailable]= new Set();

        if(!Array.isArray(data[group])){
            validationReport.errors["Group is not array"].add(group);
            continue;
        }
        const knownIds = new Set();
        const knownSlugs = new Set();
        const knownGameIds= new Set();

        for (const ent of data[group]) {
            const entityReport = {
                entity:ent,
                warnings:{
                    [ReportMessages.fieldDisappear]:new Set<string>(),
                    [ReportMessages.deprecated]:new Set<string>(),
                    [ReportMessages.slugChanged]:new Set<string>(),
                    [ReportMessages.nameChanged]:new Set<string>(),
                    [ReportMessages.URLChanged]:new Set<string>(),
                },
                infos:{
                    [ReportMessages.newEntity]:new Set<string>(),
                },
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
                    [ReportMessages.numberNotAllowed]:new Set<string>(),
                }
            } as ValidationEntityReport; 
        //entities has id 
            if(!ent.id)
                entityReport.errors[ReportMessages.abscentID].add(`${group}.id`);

        //id  is unique in group
            if(ent.id && knownIds.has(ent.id)){
                entityReport.errors[ReportMessages.duplicatedIds].add(`${group}.id`);
            }
            ent.id&&knownIds.add(ent.id)

        //slug  is unique in group
            if(ent.slug && knownSlugs.has(ent.slug)){
                entityReport.errors[ReportMessages.duplicatedSlugs].add(`${group}.slug`);
            }
            ent.slug&&knownSlugs.add(ent.slug)

        //gameId is unique
            if(ent.gameId && knownGameIds.has(ent.gameId)){
                entityReport.errors[ReportMessages.duplicatedGameIds].add(`${group}.gameId`);
            }
            ent.gameId&&knownGameIds.add(ent.gameId)

        //gameId && id == gamId || name && id == slugify(name)
            if(ent.gameId && ent.id){
                if(ent.gameId!==ent.id){
                    entityReport.errors[ReportMessages.mismatchedIds].add(`${group}.id`);
                }
            }else if(ent.name && ent.id){
                if(slugify(ent.name)!==ent.id){
                    entityReport.errors[ReportMessages.mismatchedIds].add(`${group}.id`);
                }                
            }
        
        //name && slug == slugify(name)
            if(ent.name && ent.slug)
                if(slugify(ent.name)!==ent.slug){
                    entityReport.errors[ReportMessages.mismatchedSlugs].add(`${group}.slug`);
                }

        //new entity
            if(ent.id && oldData[group] && !oldData[group].find(e=>e.id==ent.id)){
                entityReport.infos[ReportMessages.newEntity].add(`${group}`);
            }
            if(ent.id && !oldData[group]){
                entityReport.infos[ReportMessages.newEntity].add(`${group}`);
            }
        //deprecated entity
            if(ent.id && ent.deprecated && oldData[group] && oldData[group].find(e=>ent.id==e.id && !e.deprecated)){
                entityReport.warnings[ReportMessages.deprecated].add(`${group}.deprecated`);
            }     
        //slug changed    
            if(ent.id && ent.slug && oldData[group] && oldData[group].find(e=>ent.id==e.id && e.slug!==ent.slug)){
                entityReport.warnings[ReportMessages.slugChanged].add(`${group}.slug`);
            }     
        //name changed    
            if(ent.id && ent.name && oldData[group] && oldData[group].find(e=>ent.id==e.id && e.name!==ent.name)){
                entityReport.warnings[ReportMessages.nameChanged].add(`${group}.name`);
            }        
        //field disappear
            if(ent.id && oldData[group]){
                const field = fieldDisappear(ent,oldData[group].find(e=>ent.id==e.id));
                if(field){
                    entityReport.warnings[ReportMessages.fieldDisappear].add(`${group}.${field}`);
                }
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