import { exec, spawn } from 'child_process';
import * as core from '@actions/core';
import { exec as execInAction } from '@actions/exec';

const execAsync = (
  command: string,
  options: { env?: NodeJS.ProcessEnv | undefined },
): Promise<ExecPromiseResult | string> => {
  return new Promise((resolve, reject) => {
    exec(command, options, (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }
      resolve({ stdout, stderr });
    });
  });
};

interface ExecWithTimeoutArgs {
  command: string;
  timeoutMs: number;
  env?: NodeJS.ProcessEnv;
  extraConditionPromise?: Promise<string>;
}

interface ExecPromiseResult {
  stdout: string | Buffer;
  stderr: string | Buffer;
}

export const TimeoutError = 'TIMEOUT_ERROR' as const;

export function execWithTimeout(args: ExecWithTimeoutArgs): Promise<ExecPromiseResult | string> {
  const { command, timeoutMs, env, extraConditionPromise } = args;
  const extraPromises = extraConditionPromise ? [extraConditionPromise] : [];
  return Promise.race([
    execAsync(command, { env }),
    new Promise<string>((_, reject) => setTimeout(() => reject(new Error(TimeoutError)), timeoutMs)),
    ...extraPromises,
  ]);
}

interface ExecWithTimeoutInActionArgs {
  command: string;
  args?: string[];
  timeoutMs: number;
  env?: { [key: string]: string };
  extraConditionPromise?: Promise<string>;
}

export function execWithTimeoutInAction(input: ExecWithTimeoutInActionArgs): Promise<number | string> {
  const { command, args, timeoutMs, env, extraConditionPromise } = input;
  const extraPromises = extraConditionPromise ? [extraConditionPromise] : [];

  const listeners = {
    stdout: (data: Buffer) => {
      console.log('stdout: ', data.toString());
    },
    stderr: (data: Buffer) => {
      console.log('stderr: ', data.toString());
    },
    stdline: (data: string) => {
      console.log('stdline: ', data);
    },
    errline: (data: string) => {
      console.log('errline: ', data);
    },
  };

  return Promise.race([
    execInAction(command, args, { env, listeners, cwd: process.cwd() }),
    new Promise<string>((_, reject) => setTimeout(() => reject(new Error(TimeoutError)), timeoutMs)),
    ...extraPromises,
  ]);
}

export function execWithTimeout2(
  command: string,
  args: string[],
  timeoutMs: number,
  env?: NodeJS.ProcessEnv,
): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      env: { ...process.env, ...env },
      shell: true,
      stdio: 'pipe',
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', data => {
      stdout += data.toString();
      // Можно логировать в реальном времени
      core.info(data.toString());
      console.log(data.toString());
    });

    child.stderr.on('data', data => {
      stderr += data.toString();
      core.warning(data.toString());
      console.error(data.toString());
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

      reject(new Error(`Command timed out after ${Math.round(timeoutMs / 1000)} seconds`));
    }, timeoutMs);
    child.on('close', (code, signal) => {
      clearTimeout(timeout);
      if (code === 0) {
        resolve({ stdout, stderr });
      } else if (signal === 'SIGTERM') {
        reject(new Error(`Process was terminated due to timeout`));
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
