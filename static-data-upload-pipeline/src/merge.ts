import { Entity, StaticData } from './types';

export type MergeReport={    
    newGroupsWithAbscentID:Set<string>;
    oldGroupsWithAbscentID:Set<string>;
    lostGroups:Set<string>;
    newGroups:Set<string>;
    newGroupNotArray:Set<string>;
    oldGroupNotArray:Set<string>;
    deprecatedEntities:{ [key: string]: Set<string> };
    duplicatesInNewData:{ [key: string]: Set<string> };
  }

function mergeGroup(mergedData:StaticData,newGroup:Array<Entity>,oldGroup:Array<Entity>,group:string,mergeReport:MergeReport,deprecateLostData:boolean){
  mergedData[group]=[];

  //keep old values
  oldGroup.forEach(oldIt => {
    const match = newGroup.find(newIt=>newIt.id == oldIt.id);
    if(!match ){
      //deprecated
      mergeReport.deprecatedEntities[group]||=new Set();
      mergeReport.deprecatedEntities[group].add(oldIt.id);
      
      if(deprecateLostData)
        mergedData[group].push({...oldIt,deprecated:true});    
      else
        mergedData[group].push(oldIt);    
    }else{
      //merged already - duplicate of ID
      if(mergedData[group].find(it=>it.id == match.id)){      
        mergeReport.duplicatesInNewData[group]||=new Set();
        mergeReport.duplicatesInNewData[group].add(match.id);        
      }else{
        //correct
        mergedData[group].push(match);
      }     
    }  
  });

  //add new entities
  newGroup.forEach(newIt => {
    const match = oldGroup.find(oldIt=>newIt.id == oldIt.id);
    if(!match){
      //new entity      
      if(mergedData[group].find(it=>it.id == newIt.id)){      
        //merged already - duplicate of ID
        mergeReport.duplicatesInNewData[group]||=new Set();
        mergeReport.duplicatesInNewData[group].add(newIt.id);
      }else{
        //correct
        mergedData[group].push(newIt);
      } 
    }       
  });
}

function validateData(data:StaticData){
  const abscentId = new Set<string>();
  for (const group of Object.keys(data)) {    
    if(data[group].find(ent=>!ent.id)){
      abscentId.add(group);
    }
  }
  return abscentId;
}

export function mergeStaticData(newData:StaticData,oldData:StaticData,deprecateLostData:boolean = true){
  const mergedData: StaticData = {};

  const mergeReport={    
    newGroupsWithAbscentID:new Set<string>(),
    oldGroupsWithAbscentID:new Set<string>(),
    lostGroups:new Set<string>(),
    newGroups:new Set<string>(),
    newGroupNotArray:new Set<string>(),
    oldGroupNotArray:new Set<string>(),
    deprecatedEntities:{} as { [key: string]: Set<string> },
    duplicatesInNewData:{} as { [key: string]: Set<string> },  
  }

  try{        

    //validate static data
    mergeReport.newGroupsWithAbscentID = validateData(newData);
    mergeReport.oldGroupsWithAbscentID = validateData(oldData);

    //save known items 
    for (const group of Object.keys(oldData)) {    
      if(!Array.isArray(oldData[group])){
        mergeReport.oldGroupNotArray.add(group);
        continue;
      }
      //deprecated group
      if(newData[group] === undefined){         
        mergeReport.lostGroups.add(group); 
        mergedData[group]=[];
        if(deprecateLostData)
          oldData[group].forEach(it => mergedData[group].push({...it,deprecated:true}));     
        else
          oldData[group].forEach(it => mergedData[group].push(it));     
      }else{        
        if(!Array.isArray(newData[group])){
          mergeReport.newGroupNotArray.add(group);
          continue;
        }
        mergeGroup(mergedData,newData[group],oldData[group],group,mergeReport,deprecateLostData);
      }
    }

    //add new groups 
    for (const group of Object.keys(newData)) {
      if(oldData[group] === undefined){
        mergeReport.newGroups.add(group);
        if(!Array.isArray(newData[group])){
          mergeReport.newGroupNotArray.add(group);
          continue;
        }
        mergedData[group]=[];
        newData[group].forEach(it=>mergedData[group].push(it));
      }    
    }

  }catch(error){
    console.log(error)
  }
  return {mergedData,mergeReport}
}