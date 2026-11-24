import * as core from '@actions/core';
import { spawnWithTimeout, TimeoutError } from '../utils/exec.utils';
import { ExpectedOutputs, findMissingOutputs } from './find-missing-outputs';

const DEFAULT_MODEL = 'sonnet';

interface RunClaudeGenerationInput {
  timeoutMs: number;
  prompt: string;
  model?: string;
  expectedOutputs: ExpectedOutputs;
}

export async function runClaudeGeneration(input: RunClaudeGenerationInput): Promise<void> {
  try {
    const { timeoutMs, prompt, expectedOutputs } = input;
    const model = input.model || DEFAULT_MODEL;

    core.info(`Claude Code generation starts with prompt: ${prompt}`);

    const oauthToken = process.env.CLAUDE_CODE_OAUTH_TOKEN;
    if (!oauthToken) {
      throw new Error('CLAUDE_CODE_OAUTH_TOKEN environment variable is not set');
    }

    // In print mode an API key or an auth token has priority over the OAuth token.
    const { ANTHROPIC_API_KEY, ANTHROPIC_AUTH_TOKEN, ...inheritedEnv } = process.env;

    const command = 'claude';
    const args = ['-p', '--model', model, '--permission-mode', 'bypassPermissions', '--output-format', 'text', prompt];

    core.info(`Executing Claude Code (model: ${model}) with timeout: ${timeoutMs}ms`);

    try {
      await spawnWithTimeout({
        command,
        args,
        timeoutMs,
        env: {
          ...inheritedEnv,
          CLAUDE_CODE_OAUTH_TOKEN: oauthToken,
          // Keep the pinned version for all Claude Code runs in the job.
          DISABLE_UPDATES: '1',
        },
      });
    } catch (error) {
      if (error instanceof Error && error.message === TimeoutError) {
        throw new Error(`Claude Code execution timed out after ${timeoutMs}ms`);
      }
      throw error;
    }

    // Claude Code exits with code 0 also when the agent stops before it does the task.
    const missingOutputs = findMissingOutputs(expectedOutputs);
    if (missingOutputs.length > 0) {
      throw new Error(`Claude Code did not create the expected outputs: ${missingOutputs.join(', ')}`);
    }

    core.info(`✓ Generation completed successfully`);
  } catch (error) {
    const errorMessage = `Failed to execute Claude Code: ${error instanceof Error ? error.message : String(error)}`;
    core.setFailed(errorMessage);
    throw new Error(errorMessage);
  }
}
