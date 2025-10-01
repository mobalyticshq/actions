import { Entity, StaticData } from '../types';

//TODO: checking changes in pipeline, remove comments and unused code later
function mergeGroup(
  mergedData: StaticData,
  newGroup: Array<Entity>,
  oldGroup: Array<Entity>,
  group: string,
  deprecateLostData: boolean,
) {
  mergedData[group] = [];

  //keep old values
  oldGroup.forEach(oldIt => {
    const match = newGroup.find(newIt => newIt.id == oldIt.id);
    if (!match) {
      //deprecated - entity was removed from new data
      if (deprecateLostData) {
        mergedData[group].push({ ...oldIt, deprecated: true });
      } else mergedData[group].push(oldIt);
    } else {
      // Entity exists in new data - will be added with deprecated: false below
      mergedData[group].push({ ...oldIt, ...match });
    }
  });

}

export function isValidDataForMerge(data: StaticData) {
  //all groups and id's MUST be consistents
  for (const group of Object.keys(data)) {
    if (!Array.isArray(data[group])) {
      return false;
    }
    if (data[group].find(ent => !ent.id)) {
      return false;
    }
  }
  for (const group of Object.keys(data)) {
    for (const ent of data[group]) {
      if (data[group].filter(e => e.id == ent.id).length > 1) return false;
    }
  }
  return true;
}

export function mergeStaticData(newData: StaticData, oldData: StaticData, deprecateLostData: boolean = true) {
  const mergedData: StaticData = {};
  try {
    //save known items
    for (const group of Object.keys(oldData)) {
      //deprecated group
      if (newData[group] === undefined) {
        // mergeReport.lostGroups.add(group);
        mergedData[group] = [];
        if (deprecateLostData) {
          oldData[group].forEach(it => mergedData[group].push({ ...it, deprecated: true }));
        } else oldData[group].forEach(it => mergedData[group].push(it));
      } else {
        if (!Array.isArray(newData[group])) {
          // mergeReport.newGroupNotArray.add(group);
          mergedData[group] = newData[group];
          continue;
        }
        mergeGroup(mergedData, newData[group], oldData[group], group, deprecateLostData);
      }
    }

    //add new groups - all entities in new groups are not deprecated
    for (const group of Object.keys(newData)) {
      if (oldData[group] === undefined) {
        // mergeReport.newGroups.add(group);
        mergedData[group] = newData[group].map(entity => ({ ...entity, deprecated: false }));
      }
    }
  } catch (error) {
    console.log(`Error during the merge ${error}`);
  }
  return mergedData;
}

export function replaceAssets(o: any, oldPrefix: string, newPrefix: string) {
  if (o == null) return;

  if (Array.isArray(o)) {
    for (let i = 0; i < o.length; ++i) {
      if (o[i] && typeof o[i] == 'string') {
        o[i] = o[i].replace(oldPrefix, newPrefix);
      } else if (typeof o[i] === 'object') replaceAssets(o[i], oldPrefix, newPrefix);
    }
  } else if (typeof o === 'object') {
    for (const k of Object.keys(o)) {
      if (o[k]) {
        if (typeof o[k] == 'string') {
          o[k] = o[k].replace(oldPrefix, newPrefix);
        } else replaceAssets(o[k], oldPrefix, newPrefix);
      }
    }
  }
}
