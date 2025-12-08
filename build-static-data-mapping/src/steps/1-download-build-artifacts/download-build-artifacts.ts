import { Bucket } from '@google-cloud/storage';
import * as core from '@actions/core';

export interface DownloadBuildArtifactsOptions {
  bucket: Bucket;
  env: string;
  game: string;
}

export async function downloadBuildArtifacts(options: DownloadBuildArtifactsOptions): Promise<void> {
  try {
    const { bucket, env, game } = options;

    core.info(`Download build artifacts for game: ${game}`);
  } catch (error) {
    // GraphQL errors should fail the pipeline
    core.setFailed(`Error in downloadBuildArtifacts: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}
