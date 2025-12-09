import * as core from '@actions/core';
import * as fs from 'fs';
import * as path from 'path';

export interface CopyUserPromptsOptions {
  game: string;
  dynamicModulesEnv: string;
}

/**
 * Recursively copy files from source directory to destination directory
 */
async function copyRecursive(src: string, dest: string): Promise<void> {
  const stat = await fs.promises.stat(src);

  if (stat.isDirectory()) {
    // Create destination directory if it doesn't exist
    if (!fs.existsSync(dest)) {
      await fs.promises.mkdir(dest, { recursive: true });
    }

    // Read all entries in the source directory
    const entries = await fs.promises.readdir(src, { withFileTypes: true });

    // Copy each entry recursively
    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      await copyRecursive(srcPath, destPath);
    }
  } else {
    // Copy file
    const destDir = path.dirname(dest);
    if (!fs.existsSync(destDir)) {
      await fs.promises.mkdir(destDir, { recursive: true });
    }
    await fs.promises.copyFile(src, dest);
    core.info(`Copied: ${path.relative(process.env.GITHUB_WORKSPACE || '', src)} -> ${path.relative(process.cwd(), dest)}`);
  }
}

export async function copyUserPrompts(options: CopyUserPromptsOptions): Promise<void> {
  try {
    const { game, dynamicModulesEnv } = options;

    // Get repository root from GitHub Actions environment variable
    const githubWorkspace = process.env.GITHUB_WORKSPACE;
    if (!githubWorkspace) {
      const errorMessage = 'GITHUB_WORKSPACE environment variable is not set';
      core.setFailed(errorMessage);
      throw new Error(errorMessage);
    }

    // Build source path: ${game}/${dynamicModulesEnv}/static_data_mapping
    const sourcePath = path.join(githubWorkspace, game, dynamicModulesEnv, 'static_data_mapping');
    core.info(`Source path: ${sourcePath}`);

    // Check if source directory exists
    if (!fs.existsSync(sourcePath)) {
      const errorMessage = `Source directory does not exist: ${sourcePath}`;
      core.setFailed(errorMessage);
      throw new Error(errorMessage);
    }

    // Check if source is a directory
    const stat = await fs.promises.stat(sourcePath);
    if (!stat.isDirectory()) {
      const errorMessage = `Source path is not a directory: ${sourcePath}`;
      core.setFailed(errorMessage);
      throw new Error(errorMessage);
    }

    // Build destination path: dist/user-prompts (relative to action directory)
    const destPath = path.resolve(process.cwd(), 'dist', 'user-prompts');
    core.info(`Destination path: ${destPath}`);

    // Create destination directory if it doesn't exist
    if (!fs.existsSync(destPath)) {
      await fs.promises.mkdir(destPath, { recursive: true });
      core.info(`Created destination directory: ${destPath}`);
    } else {
      core.info(`Destination directory already exists: ${destPath}`);
    }

    // Copy all files recursively
    core.info(`Copying files from ${sourcePath} to ${destPath}...`);
    await copyRecursive(sourcePath, destPath);

    core.info(`✓ Successfully copied user prompts from ${sourcePath} to ${destPath}`);
  } catch (error) {
    const errorMessage = `Error in copyUserPrompts: ${error instanceof Error ? error.message : String(error)}`;
    core.setFailed(errorMessage);
    throw error;
  }
}

