import { ChildProcess } from 'node:child_process';

export interface RunningProcess {
  process: ChildProcess;
  completed: Promise<number>;
}
