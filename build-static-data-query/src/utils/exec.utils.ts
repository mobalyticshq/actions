import { spawn } from 'child_process';
import * as core from '@actions/core';

export const TimeoutError = 'TIMEOUT_ERROR' as const;


interface SpawnWithTimeoutInActionArgs {
  command: string,
  args: string[],
  timeoutMs: number,
  env?: NodeJS.ProcessEnv,
  extraConditionPromise?: Promise<string>;
}

function makeSpawnPromise(input: Omit<SpawnWithTimeoutInActionArgs, 'extraConditionPromise'>): Promise<string> {
  const { command, args, timeoutMs, env, extraConditionPromise } = input;

  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      env: { ...process.env, ...env },
      shell: true,
      stdio: 'inherit',
    });

    let stdout = '';
    let stderr = '';

    child.stdout?.on('data', data => {
      stdout += data.toString();
      // Можно логировать в реальном времени
      core.info(data.toString());
    });

    child.stderr?.on('data', data => {
      stderr += data.toString();
      core.warning(data.toString());
    });

    const timeout = setTimeout(() => {
      core.warning(`Command timeout reached (${timeoutMs}ms), killing process...`);
      child.kill('SIGTERM');

      // Даем процессу время на корректное завершение
      setTimeout(() => {
        if (!child.killed) {
          child.kill('SIGKILL');
        }
      }, 5000);

      reject(new Error(TimeoutError));
    }, timeoutMs);
    child.on('close', (code, signal) => {
      clearTimeout(timeout);
      if (code === 0) {
        resolve({ stdout, stderr });
      } else if (signal === 'SIGTERM') {
        reject(new Error(TimeoutError));
      } else {
        reject(new Error(`Process exited with code ${code}. stderr: ${stderr}`));
      }
    });

    child.on('error', error => {
      clearTimeout(timeout);
      reject(error);
    });
  });
}

export function spawnWithTimeout(
  input: SpawnWithTimeoutInActionArgs
): Promise<string> {
  const { command, args,timeoutMs,env, extraConditionPromise } = input;
  const spawnPromise = makeSpawnPromise(input);

  if (extraConditionPromise) {
    return Promise.race([spawnPromise, extraConditionPromise]);
  }

  return spawnPromise;
}
