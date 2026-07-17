import { ChildProcess } from 'node:child_process';
import { ProcessResult } from './ProcessResult';

export interface RunningProcess {
  process: ChildProcess;
  completed: Promise<ProcessResult>;
}
