import { Storage } from '@google-cloud/storage';
import * as core from '@actions/core';

export interface CheckSchemaVersionOptions {
  graphqlEndpoint: string;
  bucketName: string;
  gcsProjectId: string;
  env: string;
  game: string;
}

export interface CheckSchemaVersionResult {
  shouldContinue: boolean;
  currentSchemaVersion?: string;
  existingSchemaVersion?: string;
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

    const result = await response.json();

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

async function downloadConfigFromBucket(
  bucketName: string,
  gcsProjectId: string,
  env: string,
  game: string,
): Promise<{ schemaVersion: string } | null> {
  const configPath = `dynamic-modules/${env}/${game}/static-data-query/config.json`;

  core.info(`Downloading config.json from gs://${bucketName}/${configPath}`);

  try {
    const storage = new Storage({ projectId: gcsProjectId });
    const bucket = storage.bucket(bucketName);

    // Check if bucket exists
    const [exists] = await bucket.exists();
    if (!exists) {
      core.warning(`Bucket ${bucketName} does not exist`);
      return null;
    }

    const file = bucket.file(configPath);

    // Download file
    const [fileContents] = await file.download();
    const configJson = JSON.parse(fileContents.toString('utf-8'));

    if (!configJson.schemaVersion) {
      core.warning(`Config file exists but does not contain schemaVersion field`);
      return null;
    }

    core.info(`✓ Existing schema version from config.json: ${configJson.schemaVersion}`);
    return { schemaVersion: configJson.schemaVersion };
  } catch (error: any) {
    // Handle 404 (file not found) as a normal case
    if (error?.code === 404 || error?.message?.includes('No such object')) {
      core.info(`Config file not found at gs://${bucketName}/${configPath}, continuing pipeline`);
      return null;
    }

    // For other errors, log warning but continue
    core.warning(`Failed to download config.json: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}

export async function checkSchemaVersion(options: CheckSchemaVersionOptions): Promise<CheckSchemaVersionResult> {
  try {
    const { graphqlEndpoint, bucketName, gcsProjectId, env, game } = options;

    core.info(`Checking schema version for game: ${game}`);

    // Execute GraphQL query and GCS download in parallel
    const [currentSchemaVersion, existingConfig] = await Promise.all([
      fetchSchemaVersionFromGraphQL(graphqlEndpoint, game),
      downloadConfigFromBucket(bucketName, gcsProjectId, env, game),
    ]);

    // If config file doesn't exist, continue pipeline
    if (!existingConfig) {
      core.info(`No existing config found, continuing pipeline`);
      return {
        shouldContinue: true,
        currentSchemaVersion,
      };
    }

    const existingSchemaVersion = existingConfig.schemaVersion;

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
