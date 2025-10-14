// Interface for runPipeline parameters
import { ApiSchema } from './pipeline-steps/schema-validation/types';
import { gameIconsMap, gameNamesMap } from './utils/common.utils';
import { logColors, logger } from './utils/logger.utils';
import { schemaValidationStep } from './pipeline-steps/schema-validation/schema-validation';
import { createReportStep } from './pipeline-steps/create-report';
import path from 'path';
import { existsSync, readFileSync } from 'fs';
import { mergeStaticDataStep } from './pipeline-steps/merge-static-data';
import { overrideStaticData } from './pipeline-steps/override-static-data';
import { validateStaticDataStep } from './pipeline-steps/validate-static-data/validate-static-data-step';
import { syncStaticDataStep } from './pipeline-steps/sync-static-data-step';
import { MessageLine, SlackMessageManagerV2 } from './utils/slack-manager-v2.utils';
import { ExtractedRefs, extractSchemaRefs } from './utils/schema-refs-extractor/schema-refs-extractor';
import { deduplicateReports } from './utils/report-deduplication.utils';

export interface RunPipelineArgs {
  versions: Array<string>;
  staticDataPath: string;
  overrideSpreadsheetId: string;
  reportSpreadsheetId: string;
  tmpAssetFolder: string;
  prodAssetFolder: string;
  testsDir: string;
  dryRun: boolean;
  slackManager: SlackMessageManagerV2;
  apiSchema: ApiSchema | null;
  apiSchemaPath: string;
  skipSchemaValidation?: boolean;
}

export async function runPipeline({
  versions,
  staticDataPath,
  overrideSpreadsheetId,
  reportSpreadsheetId,
  tmpAssetFolder,
  prodAssetFolder,
  testsDir,
  dryRun,
  slackManager,
  apiSchema,
  apiSchemaPath,
  skipSchemaValidation = false,
}: RunPipelineArgs) {
  // Define environment (dev/stg/prod) from the staticDataPatn
  const environment = staticDataPath.split('/')[1].toUpperCase();
  // Define what game we are processing from the path
  const gameSlug = staticDataPath.split('/')[0];
  const gameName = gameNamesMap[gameSlug] || gameSlug;
  const gameIcon = gameIconsMap[gameSlug] || '';
  // Define asset prefixes for tmp and prod buckets
  const tmpAssetPrefix = tmpAssetFolder.replace('gs://', 'https://');
  const prodAssetPrefix = prodAssetFolder.replace('gs://', 'https://');

  // If there is no versioned files - exit
  if (versions.length == 0) {
    console.log(`❌ There is no static data files for ${gameName} ${gameIcon} ${environment} ${staticDataPath}`);
    const message = [
      {
        id: 'header',
        content: `There is no static data files for ${gameName} ${gameIcon} ${environment}`,
        emoji: ':x:',
      },
    ];
    await slackManager.sendMessage(message);
    return;
  }

  logger.group(`🚀 Run pipeline for:\n ${logColors.green}${versions}${logColors.reset}`);
  console.log(`ℹ️ Newest version is ${versions[versions.length - 1]}`);
  console.log(`ℹ️ Oldest version is ${versions[0]}`);
  logger.endGroup();

  // Link to GitHub Action run and latest version
  const actionUrl = `https://github.com/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`;
  const latestSDVersion = versions[versions.length - 1].split('/').at(-1);

  // Reset Slack message manager for new pipeline run
  slackManager.reset();
  const actionLinkLine: MessageLine = {
    id: 'action-link',
    content: `<${actionUrl}|View action Details>\n`,
    emoji: ':information_source:',
  };

  // Send initial message to Slack about pipeline start (dry-run or real run)
  if (dryRun) {
    await slackManager.sendMessage([
      {
        id: 'start-pipeline',
        content: `DRY RUN pipeline for ${latestSDVersion} ${gameName} ${gameIcon} ${environment}`,
        emoji: ':test_tube:',
      },
      actionLinkLine,
    ]);
  } else {
    await slackManager.sendMessage([
      {
        id: 'start-pipeline',
        content: `RUN pipeline for ${latestSDVersion} ${gameName} ${gameIcon} ${environment}`,
        emoji: ':rocket:',
      },
      actionLinkLine,
    ]);
  }

  if (!apiSchema) {
    await slackManager.appendNewLine({
      id: 'no-schema',
      content: `schema.json file not found in ${staticDataPath}`,
      emoji: ':warning:',
    });
  }

  /** Here we go step by step through the pipeline
   * Start point is here
   */
  try {
    // -------- Schema validation step ----------
    if (apiSchema) {
      logger.group('📋 Validate schema.json');

      const schemaValidationResult = await schemaValidationStep(
        actionUrl,
        slackManager,
        apiSchema,
        staticDataPath,
        skipSchemaValidation,
      );
      if (!schemaValidationResult.success) {
        /** If schema validation failed - create report and exit
         * because we can't continue without valid schema
         * Static Data validation step requires valid schema */
        await createReportStep(
          actionUrl,
          slackManager,
          [],
          reportSpreadsheetId,
          0,
          0,
          0,
          schemaValidationResult.errors ?? [],
        );
        return;
      }
      logger.endGroup();
    }

    // ------------------ КУСОК ОТ КОТОРОГО НАДО ИЗБАВИТЬСЯ КОГДА ИЗБАВИМСЯ ОТ CONFIG.JSON ------------------

    let config: ExtractedRefs = {refs: []};
    const pathToConfig = path.join(staticDataPath, 'config.json');
    if (existsSync(pathToConfig)) {
      config = JSON.parse(readFileSync(pathToConfig, 'utf8'));
    } else {
      config = apiSchema ? extractSchemaRefs(apiSchema) : {refs: []};
    }
    // ----------------------------- КОНЕЦ КУСКА ОТ КОТОРОГО НАДО ИЗБАВИТЬСЯ --------------------------------

    // -------- Merge static data files step --------
    logger.group(`:merge: Merge static data files `);
    let { staticData, oldData } = await mergeStaticDataStep(actionUrl, slackManager, versions);
    logger.endGroup();

    // ----------- Validate static data before merge with Spreadshhet step -----------
    logger.group('🔍 Validate merged static data');
    const { errors: beforeOverrideErrors, warnings: beforeOverrideWarnings, infos: beforeOverrideInfos, reports: beforeOverrideReports } = await validateStaticDataStep(
      slackManager,
      staticData,
      oldData,
      config,
      testsDir,
      tmpAssetPrefix,
      apiSchema,
      true
    );
    logger.endGroup();

    // --------- Override static data by spreadsheets step --------
    logger.group('📊 Override static data by spreadsheets');
    let { overridedData, spreadsheetData, spreadsheetReport } = await overrideStaticData(
      actionUrl,
      slackManager,
      overrideSpreadsheetId,
      staticData,
    );
    logger.endGroup();

    // ----------- Validate static data after merge with Spreadshhet step -----------
    logger.group('🔍 Validate static data after override by spreadsheets');
    const { errors: afterOverrideErrors, warnings: afterOverrideWarnings, infos: afterOverrideInfos, reports: afterOverrideReports } = await validateStaticDataStep(
      slackManager,
      overridedData,
      oldData,
      config,
      testsDir,
      tmpAssetPrefix,
      apiSchema,
      false
    );
    logger.endGroup();

    const errors = beforeOverrideErrors + afterOverrideErrors;
    const warnings = beforeOverrideWarnings + afterOverrideWarnings;
    const infos = beforeOverrideInfos + afterOverrideInfos;
    
    // Deduplicate reports - merge reports for the same entity ID
    // This prevents duplicate errors/warnings/infos for entities that appear in both validations
    const allReports = [...beforeOverrideReports, ...afterOverrideReports];
    const reports = deduplicateReports(allReports);

    // If errors or warnings or infos - create report
    if (errors > 0 || warnings > 0 || infos > 0) {
      await createReportStep(actionUrl, slackManager, reports, reportSpreadsheetId, errors, warnings, infos, []);
    } else {
      await slackManager.appendNewLine({
        id: 'no-issues',
        content: `No issues found during validation!`,
        emoji: ':lee-nice:',
      })
    }

    if(!dryRun) {
      if (errors == 0) {
        logger.group('✅ Static data is valid! Sync data 📦');
        if (errors == 0) {
          await syncStaticDataStep(
            actionUrl,
            slackManager,
            versions,
            overridedData,
            spreadsheetData,
            tmpAssetFolder,
            tmpAssetPrefix,
            prodAssetFolder,
            prodAssetPrefix,
            overrideSpreadsheetId,
            staticData,
            apiSchemaPath,
            apiSchema,
          );
        }
      }
    }

  } catch (error) {
    console.log(`⚠️ Error during pipeline ${error}`);
    await slackManager.appendNewLine({
      id: 'pipeline-error',
      content: `Something went wrong during pipeline running. Please contact any engineer. <${actionUrl}|See pipeline logs>`,
      emoji: ':mild-panic:',
    })
  }
}
