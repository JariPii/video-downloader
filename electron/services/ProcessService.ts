import { ChildProcess, execFile, spawn } from 'node:child_process';
import { ProcessResult } from '../types/ProcessResult';
import { Buffer } from 'node:buffer';

interface RunOptions {
  cwd?: string;
  env?: NodeJS.ProcessEnv;
  onStdout?(data: string): void;
  onStderr?(data: string): void;
}

export class ProcessService {
  public async run(
    executable: string,
    args: string[],
    options?: RunOptions,
  ): Promise<ProcessResult> {
    return new Promise((res, rej) => {
      const child = spawn(executable, args, {
        cwd: options?.cwd,
        env: options?.env ?? process.env,
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data: Buffer) => {
        const text = data.toString();

        stdout += text;
        options?.onStdout?.(text);
      });

      child.stderr.on('data', (data: Buffer) => {
        const text = data.toString();

        stderr += text;
        options?.onStderr?.(text);
      });

      child.on('error', rej);

      child.on('close', (code: number | null) => {
        res({
          stdout,
          stderr,
          exitCode: code ?? -1,
        });
      });
    });
  }

  public start(executable: string, args: string[], options?: RunOptions) {
    const child = spawn(executable, args, {
      cwd: options?.cwd,
      env: options?.env ?? process.env,
    });

    child.stdout.on('data', (data: Buffer) => {
      options?.onStdout?.(data.toString());
    });

    child.stderr.on('data', (data: Buffer) => {
      options?.onStderr?.(data.toString());
    });

    const completed = new Promise<number>((res, rej) => {
      child.on('error', rej);

      child.on('close', (code) => {
        res(code ?? -1);
      });
    });

    return {
      process: child,
      completed,
    };
  }

  public async kill(process: ChildProcess): Promise<void> {
    const pid = process.pid;
    if (pid === undefined) {
      return;
    }

    await new Promise<void>((res) => {
      execFile('taskkill', ['/PID', pid.toString(), '/T', '/F'], () => {
        res();
      });
    });
  }
}

export const processService = new ProcessService();
