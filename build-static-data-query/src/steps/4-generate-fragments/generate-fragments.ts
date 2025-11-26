import * as core from '@actions/core';
import { spawnWithTimeout, TimeoutError } from '../../utils/exec.utils';

export interface GenerateFragmentsOptions {
  timeoutMs: number;
}

export async function generateFragments(options: GenerateFragmentsOptions): Promise<void> {
  try {
    const { timeoutMs } = options;

    // Проверка наличия cursor-cli
    try {
      await spawnWithTimeout({ command: 'which cursor-agent', args: [], timeoutMs });
      core.info('cursor-agent is installed');
    } catch {
      core.info('Installing cursor-cli...');
      await spawnWithTimeout({ command: 'curl -fsSL https://cursor.com/install | bash', args: [], timeoutMs });
      core.addPath(`${process.env.HOME}/.cursor/bin`);
      core.info('Installation completed');
    }

    // Get CURSOR_API_KEY from environment (GitHub Actions secrets)
    const cursorApiKey = process.env.CURSOR_API_KEY;
    if (!cursorApiKey) {
      core.setFailed('CURSOR_API_KEY environment variable is not set');
      process.exit(1);
    }

    const command = 'cursor-agent';
    const args = [
      '-p',
      '--force',
      '--model=sonnet-4.5',
      '--output-format',
      'text',
      '"Implement instructions in the file build-static-data-query/src/steps/4-generate-fragments/generate-fragments.md"',
    ];

    core.info(`Executing cursor-agent with timeout: ${timeoutMs}ms`);

    // Execute command with timeout
    try {
      await spawnWithTimeout({
        command,
        args,
        timeoutMs,
        env: {
          ...process.env,
          CURSOR_API_KEY: cursorApiKey,
        },
      });

      core.info(`✓ Fragments generation completed successfully`);
      return;
    } catch (error) {
      if (error instanceof Error && error.message === TimeoutError) {
        core.setFailed(`cursor-agent execution timed out after ${timeoutMs}ms`);
      } else {
        core.setFailed(`Failed to execute cursor-agent: ${error instanceof Error ? error.message : String(error)}`);
      }
      process.exit(1);
    }
  } catch (error) {
    core.setFailed(`Unexpected error in generateFragments: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}
