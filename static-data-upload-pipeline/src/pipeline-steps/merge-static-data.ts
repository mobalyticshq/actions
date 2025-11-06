import { logColors } from '../utils/logger.utils';
import { StaticData } from '../types';
import { readFileSync } from 'fs';
import { isValidDataForMerge, mergeStaticData } from '../utils/merge.utils';
import { SlackMessageManagerV2 } from '../utils/slack-manager-v2.utils';

interface MergeStaticDataOutput {
  staticData: StaticData;
  oldData: StaticData;
  success: boolean;
}

export async function mergeStaticDataStep(
  actionUrl: string,
  slackManager: SlackMessageManagerV2,
  versions: Array<string>,
): Promise<MergeStaticDataOutput> {
  try {
    await slackManager.appendNewLine({
      id: 'merge-static-data',
      content: `Merging static data files...`,
      emoji: ':arrows_counterclockwise:',
    });

    let staticData = {} as StaticData;
    let oldData = {} as StaticData;

    for (let i = 0; i < versions.length; ++i) {
      const data: StaticData = JSON.parse(readFileSync(versions[i], 'utf8'));
      const isValidForMerge = isValidDataForMerge(data);
      if (!isValidForMerge) {
        //not for latest data skip invalid data files
        if (i < versions.length - 1) {
          console.log(`❗Skip: ${logColors.yellow} ${versions[i]} is not valid for merge ${logColors.reset}`);
          continue;
        }
        if (i === versions.length - 1) {
          await slackManager.updateMessage('merge-static-data', `Merging static data files failed. The last static_data file is invalid`, ':x:');
          return { staticData: data, oldData, success: false }
        }
      }

      console.log(`✍ Merge: ${logColors.green} ${versions[i]} ${logColors.reset}`);
      oldData = structuredClone(staticData);
      staticData = mergeStaticData(data, staticData);
    }

    await slackManager.updateMessage('merge-static-data', `Merging static data files done`, ':white_check_mark:');

    return { staticData, oldData, success: true };
  } catch (error) {
    await slackManager.updateMessage(
      'merge-static-data',
      `Merging static data files failed, something went wrong! Please contact any engineer. <${actionUrl}|See pipeline logs>`,
      ':mild-panic:',
    );

    throw error;
  }
}
