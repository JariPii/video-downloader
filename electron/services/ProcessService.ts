import { ChildProcess, execFile, spawn } from 'node:child_process';
import { ProcessResult } from '../types/ProcessResult';
import { Buffer } from 'node:buffer';
import { logService } from './LogService';
import { LogLevel } from '../enums/LogLevel';
import { LogCategory } from '../enums/LogCategory';

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
    logService.info(LogCategory.Process, 'Starting process', { executable });

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

      child.on('error', (error) => {
        logService.error(
          LogCategory.Process,
          `Failed to start process`,
          error,
          {
            executable,
          },
        );

        rej(error);
      });

      child.on('close', (code: number | null) => {
        const exitCode = code ?? -1;

        logService.info(LogCategory.Process, `Process finished`, {
          executable,
          exitCode,
        });

        res({
          stdout,
          stderr,
          exitCode,
        });
      });
    });
  }

  public start(executable: string, args: string[], options?: RunOptions) {
    logService.log(LogLevel.Info, LogCategory.Process, `Starting process`, {
      executable,
    });

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

    const completed = new Promise<ProcessResult>((res, rej) => {
      child.on('error', (error) => {
        logService.log(
          LogLevel.Error,
          LogCategory.Process,
          `Failed to start process`,
          {
            executable,
          },
          error,
        );

        rej(error);
      });

      child.on('close', (code) => {
        const exitCode = code ?? -1;

        logService.log(
          exitCode === 0 ? LogLevel.Info : LogLevel.Warning,
          LogCategory.Process,
          `Process finished`,
          {
            executable,
            exitCode,
          },
        );

        res({
          stdout,
          stderr,
          exitCode,
        });
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
      logService.warning(
        LogCategory.Process,
        'Kill requested for process without PID',
      );
      return;
    }

    logService.info(LogCategory.Process, 'Killing process', {
      pid,
    });

    await new Promise<void>((res, rej) => {
      execFile('taskkill', ['/PID', pid.toString(), '/T', '/F'], (error) => {
        if (error) {
          logService.error(
            LogCategory.Process,
            'Failed to kill process',
            error,
            {
              pid,
            },
          );

          rej(error);
          return;
        }

        logService.info(LogCategory.Process, 'Process killed', {
          pid,
        });

        res();
      });
    });
  }
}

export const processService = new ProcessService();
