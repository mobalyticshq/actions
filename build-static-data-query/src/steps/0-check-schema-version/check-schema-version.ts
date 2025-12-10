import { Bucket } from '@google-cloud/storage';
import * as core from '@actions/core';
import { buildStaticDataQueryModuleFolderPath, checkStaticDataQueryModuleFolderExists } from '../../utils/module-folder.utils';
import { downloadConfigFromBucket } from '@shared/utils/bucket.utils';
import { DynamicModuleSlug } from '@shared/types/dynamic-modules.types';

export interface CheckSchemaVersionOptions {
  graphqlEndpoint: string;
  bucket: Bucket;
  env: string;
  game: string;
}

export interface CheckSchemaVersionResult {
  shouldContinue: boolean;
  currentSchemaVersion?: string;
  existingSchemaVersion?: string;
}

interface GraphQLResponse<T = unknown> {
  data?: T;
  errors?: Array<{ message: string }>;
}

interface SchemaVersionData {
  [game: string]: {
    staticData: {
      metadata: {
        schemaVersion: string;
      };
    };
  };
}

const headers = {
  'xmoba-no-cache': '1',
  'Content-Type': 'application/json',
};

async function fetchSchemaVersionFromGraphQL(endpoint: string, game: string): Promise<string> {
  const query = `
    query {
      ${game} {
        staticData {
          metadata {
            schemaVersion
          }
        }
      }
    }
  `;

  core.info(`Fetching schema version from GraphQL endpoint: ${endpoint}`);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        query,
        variables: {},
      }),
    });

    if (!response.ok) {
      throw new Error(`GraphQL request failed with status ${response.status}: ${response.statusText}`);
    }

    const result = (await response.json()) as GraphQLResponse<SchemaVersionData>;

    if (result.errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
    }

    const schemaVersion = result.data?.[game]?.staticData?.metadata?.schemaVersion;

    if (!schemaVersion) {
      throw new Error(`Schema version not found in GraphQL response: ${JSON.stringify(result.data)}`);
    }

    core.info(`✓ Current schema version from GraphQL: ${schemaVersion}`);
    return schemaVersion;
  } catch (error) {
    core.setFailed(
      `Failed to fetch schema version from GraphQL: ${error instanceof Error ? error.message : String(error)}`,
    );
    throw error;
  }
}

export async function checkSchemaVersion(options: CheckSchemaVersionOptions): Promise<CheckSchemaVersionResult> {
  try {
    const { graphqlEndpoint, bucket, env, game } = options;

    core.info(`Checking schema version for game: ${game}`);

    // Execute GraphQL query and GCS download in parallel
    const [currentSchemaVersion, existingSchemaVersion] = await Promise.all([
      fetchSchemaVersionFromGraphQL(graphqlEndpoint, game),
      downloadConfigFromBucket(bucket, env, game, DynamicModuleSlug.STATIC_DATA_QUERY).then(result => result?.version),
    ]);

    // Check if version folder already exists
    if (currentSchemaVersion) {
      const versionFolderExists = await checkStaticDataQueryModuleFolderExists(bucket, env, game, currentSchemaVersion);
      if (versionFolderExists) {
        const bucketName = bucket.name;
        const versionFolderPath = buildStaticDataQueryModuleFolderPath(env, game, currentSchemaVersion);
        core.info(
          `✓ Version folder already exists at gs://${bucketName}/${versionFolderPath}. Pipeline will be skipped.`,
        );
        return {
          shouldContinue: false,
          currentSchemaVersion,
          existingSchemaVersion: existingSchemaVersion,
        };
      }
    }

    // If config file doesn't exist, continue pipeline
    if (!existingSchemaVersion) {
      core.info(`No existing config found, continuing pipeline`);
      return {
        shouldContinue: true,
        currentSchemaVersion,
      };
    }

    // If we can't get schema version from the endpoint, pipeline should be stopped
    if (!currentSchemaVersion) {
      core.info(`Schema versions can't be fetched. Pipeline will be skipped.`);
      return {
        shouldContinue: false,
        currentSchemaVersion,
        existingSchemaVersion,
      };
    }

    // Compare versions
    if (currentSchemaVersion === existingSchemaVersion) {
      core.info(`✓ Schema versions match (${currentSchemaVersion}). Pipeline will be skipped.`);
      return {
        shouldContinue: false,
        currentSchemaVersion,
        existingSchemaVersion,
      };
    }

    core.info(
      `Schema versions differ: current=${currentSchemaVersion}, existing=${existingSchemaVersion}. Continuing pipeline.`,
    );
    return {
      shouldContinue: true,
      currentSchemaVersion,
      existingSchemaVersion,
    };
  } catch (error) {
    // GraphQL errors should fail the pipeline
    core.setFailed(`Error in checkSchemaVersion: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}
