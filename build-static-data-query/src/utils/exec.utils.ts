import { promisify } from 'util';
import { exec } from 'child_process';

const execAsync = promisify(exec);

interface ExecWithTimeoutArgs {
  command: string;
  timeoutMs: number;
  env?: NodeJS.ProcessEnv;
  extraConditionPromise?: Promise<string>;
}

interface ExecPromiseResult {
  stdout: string | Buffer<ArrayBuffer>;
  stderr: string | Buffer<ArrayBuffer>;
}

const TimeoutError = 'TIMEOUT_ERROR' as const;

async function execWithTimeout(args: ExecWithTimeoutArgs): Promise<ExecPromiseResult | string> {
  const { command, timeoutMs, env, extraConditionPromise } = args;
  const extraPromises = extraConditionPromise ? [extraConditionPromise] : [];
  return Promise.race([
    execAsync(command, { env }),
    new Promise<string>((_, reject) => setTimeout(() => reject(new Error(TimeoutError)), timeoutMs)),
    ...extraPromises,
  ]);
}
