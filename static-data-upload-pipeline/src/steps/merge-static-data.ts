import { logColors, logger } from '../logger';
import { StaticData } from '../types';
import { readFileSync } from 'fs';
import { isValidDataForMerge, mergeStaticData } from '../merge';
import { SlackMessageManager } from '../utils/slack-manager.utils';

export async function mergeStaticDataStep(slackManager: SlackMessageManager, versions: Array<string>) {
  logger.group(`✍ Merge static data files `);
  await slackManager.sendOrUpdate(`Merging static data files...`, ':arrows_counterclockwise:', true, false);

  let staticData = {} as StaticData;
  let oldData = {} as StaticData;

  for (let i = 0; i < versions.length; ++i) {
    const data = JSON.parse(readFileSync(versions[i], 'utf8'));
    //not for latest data skip invalid data files
    if (i < versions.length - 1 && !isValidDataForMerge(data)) {
      console.log(`❗Skip: ${logColors.yellow} ${versions[i]} is not valid for merge ${logColors.reset}`);
      continue;
    }
    console.log(`✍ Merge: ${logColors.green} ${versions[i]} ${logColors.reset}`);
    oldData = structuredClone(staticData);
    staticData = mergeStaticData(data, staticData);
  }
  logger.endGroup();

  return { staticData, oldData };
}
