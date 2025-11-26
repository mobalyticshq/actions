import * as core from '@actions/core';
import { execWithTimeout, TimeoutError } from '../../utils/exec.utils';

export interface GenerateFragmentsOptions {
  timeoutMs: number;
}

export async function generateFragments(options: GenerateFragmentsOptions): Promise<void> {
  try {
    const { timeoutMs } = options;

    // Проверка наличия cursor-cli
    try {
      await execWithTimeout({ command: 'which cursor-agent', timeoutMs });
      console.log('cursor-agent is installed');
    } catch {
      console.log('Installing cursor-cli...');
      core.info('Installing cursor-cli...');
      await execWithTimeout({ command: 'curl -fsSL https://cursor.com/install | bash', timeoutMs });
      core.addPath(`${process.env.HOME}/.cursor/bin`);
      console.log('Installation completed');
    }

    // Get CURSOR_API_KEY from environment (GitHub Actions secrets)
    const cursorApiKey = process.env.CURSOR_API_KEY;
    if (!cursorApiKey) {
      core.setFailed('CURSOR_API_KEY environment variable is not set');
      process.exit(1);
    }

    const command =
      'cursor-agent -p --force --model=sonnet-4.5 --output-format text \\"Implement instructions in the file build-static-data-query/src/steps/4-generate-fragments/generate-fragments.md\\"';
    // const command = 'cursor-agent';
    // const args = [
    //   '-p',
    //   '--force',
    //   '--model=sonnet-4.5',
    //   '--output-format',
    //   'text',
    //   'Implement instructions in the file build-static-data-query/src/steps/4-generate-fragments/generate-fragments.md',
    // ];

    core.info(`Executing cursor-agent with timeout: ${timeoutMs}ms`);

    // Execute command with timeout
    try {
      const result = await execWithTimeout({
        command,
        timeoutMs,
        env: {
          ...process.env,
          CURSOR_API_KEY: cursorApiKey,
        },
      });

      if (typeof result === 'string') {
        core.info(`Command completed: ${result}`);
      } else {
        core.info(`Command stdout: ${result.stdout.toString()}`);
        if (result.stderr) {
          core.info(`Command stderr: ${result.stderr.toString()}`);
        }
      }

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
