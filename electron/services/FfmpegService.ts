import { binaryService } from './BinaryService';
import { processService } from './ProcessService';

export class FfmpegService {
  public async getVersion(): Promise<string> {
    const executable = binaryService.getFfmpegPath();

    const result = await processService.run(executable, ['-version']);

    if (result.exitCode !== 0) {
      throw new Error(result.stderr);
    }

    return result.stdout.split('\n')[0];
  }

  public async getProbeVersion(): Promise<string> {
    const executable = binaryService.getFfprobePath();

    const result = await processService.run(executable, ['-version']);

    if (result.exitCode !== 0) {
      throw new Error(result.stderr);
    }

    return result.stdout.split('\n')[0];
  }
}

export const ffmpegService = new FfmpegService();
