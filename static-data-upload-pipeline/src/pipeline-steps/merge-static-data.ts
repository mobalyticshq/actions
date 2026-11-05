import { logColors } from '../utils/logger.utils';
import { StaticData } from '../types';
import { readFileSync } from 'fs';
import { mergeProblem, mergeStaticData } from '../utils/merge.utils';
import { SlackMessageManagerV2 } from '../utils/slack-manager-v2.utils';
import { describeError, docsLink } from '../utils/common.utils';
import * as path from 'path';

interface MergeStaticDataOutput {
  staticData: StaticData;
  oldData: StaticData;
  success: boolean;
  problem?: string;
}

export async function mergeStaticDataStep(
  actionUrl: string,
  slackManager: SlackMessageManagerV2,
  versions: Array<string>,
): Promise<MergeStaticDataOutput> {
  // Kept outside the loop so the catch can say which file broke the merge
  let currentFile = '';
  try {
    await slackManager.appendNewLine({
      id: 'merge-static-data',
      content: `Merging static data files...`,
      emoji: ':arrows_counterclockwise:',
    });

    let staticData = {} as StaticData;
    let oldData = {} as StaticData;

    for (let i = 0; i < versions.length; ++i) {
      currentFile = versions[i];
      const data: StaticData = JSON.parse(readFileSync(versions[i], 'utf8'));
      const problem = mergeProblem(data);
      if (problem) {
        //not for latest data skip invalid data files
        if (i < versions.length - 1) {
          console.log(`❗Skip: ${logColors.yellow} ${versions[i]} is not valid for merge - ${problem} ${logColors.reset}`);
          continue;
        }
        // The newest file is the one being shipped - name the problem instead of validating raw data
        const message = `${path.basename(versions[i])} is not valid for merge - ${problem}`;
        console.log(`❌ ${message}`);
        await slackManager.updateMessage('merge-static-data', `Merging static data files failed: ${message}. ${docsLink('merging-static-data-files')}`, ':x:');
        return { staticData: data, oldData, success: false, problem: message };
      }

      console.log(`✍ Merge: ${logColors.green} ${versions[i]} ${logColors.reset}`);
      oldData = structuredClone(staticData);
      staticData = mergeStaticData(data, staticData);
    }

    await slackManager.updateMessage('merge-static-data', `Merging static data files done`, ':white_check_mark:');

    return { staticData, oldData, success: true };
  } catch (error) {
    console.log(`❌ Merging static data files failed on ${currentFile}:`, error);
    const where = currentFile ? ` on \`${path.basename(currentFile)}\`` : '';
    await slackManager.updateMessage(
      'merge-static-data',
      `Merging static data files failed${where}: ${describeError(error)}. <${actionUrl}|See pipeline logs>`,
      ':mild-panic:',
    );

    throw error;
  }
}
