import { Entity, StaticData } from '../types';

//TODO: checking changes in pipeline, remove comments and unused code later
function mergeGroup(
  mergedData: StaticData,
  newDataGroup: Array<Entity>,
  oldDataGroup: Array<Entity>,
  group: string,
  deprecateLostData: boolean,
) {
  mergedData[group] = [];
  const alreadyMergedIds = new Set<string>();

  //keep old values
  oldDataGroup.forEach(oldIt => {
    const match = newDataGroup.find(newIt => newIt.id == oldIt.id);
    if (!match) {
      //deprecated - entity was removed from new data
      if (deprecateLostData) {
        mergedData[group].push({ ...oldIt, deprecated: true });
      } else mergedData[group].push(oldIt);
    } else {
      // Entity exists in new data - will be added with deprecated: false below
      mergedData[group].push({ ...oldIt, ...match, deprecated: match.deprecated === oldIt.deprecated ? match.deprecated : false });
      alreadyMergedIds.add(oldIt.id);
    }
  });

  //add new entities with deprecated: false
  newDataGroup.forEach(newIt => {
    if (!alreadyMergedIds.has(newIt.id)) {
      mergedData[group].push({ ...newIt, deprecated: false });
    }
  });

}

// The first thing that makes a version file unusable as a merge input, or null.
// Ids are compared as strings, as the merge itself does with ==.
export function mergeProblem(data: StaticData): string | null {
  for (const group of Object.keys(data)) {
    if (!Array.isArray(data[group])) return `group "${group}" is not an array`;
    const seen = new Set<string>();
    for (const ent of data[group]) {
      if (!ent.id) return `an entity in "${group}" has no id`;
      if (seen.has(String(ent.id))) return `duplicate id "${ent.id}" in "${group}"`;
      seen.add(String(ent.id));
    }
  }
  return null;
}

export function isValidDataForMerge(data: StaticData) {
  return mergeProblem(data) === null;
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
        if (newData[group]) {
          mergedData[group] = newData[group].map(entity => ({ ...entity, deprecated: false }));
        }

      }
    }
  } catch (error) {
    console.log(`Error during the merge ${error}`);
    throw error;
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
