import * as core from '@actions/core';
import { spawnWithTimeout, TimeoutError } from '../utils/exec.utils';

interface RunCursorGenerationInput {
  timeoutMs: number;
  prompt: string;
  model?: string;
}

export async function runCursorGeneration(input: RunCursorGenerationInput): Promise<void> {
  try {
    const { timeoutMs, model = 'sonnet-4.5', prompt } = input;

    core.info(`Cursor-agent generation starts with prompt: ${prompt}`);

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
      throw new Error('CURSOR_API_KEY environment variable is not set');
    }

    const command = 'cursor-agent';
    const args = ['-p', '--force', `--model=${model}`, '--output-format', 'text', prompt];

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

      core.info(`✓ Generation completed successfully`);
      return;
    } catch (error) {
      const errorMessage = `Failed to execute cursor-agent: ${error instanceof Error ? error.message : String(error)}`;
      if (error instanceof Error && error.message === TimeoutError) {
        core.setFailed(`cursor-agent execution timed out after ${timeoutMs}ms`);
      } else {
        core.setFailed(errorMessage);
      }
      throw new Error(errorMessage);
    }
  } catch (error) {
    const errorMessage = `Failed to execute cursor-agent: ${error instanceof Error ? error.message : String(error)}`;
    core.setFailed(errorMessage);
    throw new Error(errorMessage);
  }
}
