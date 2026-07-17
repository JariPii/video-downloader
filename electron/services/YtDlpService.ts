import { YtDlpVideoInfo } from '../types/YtDlpVideoInfo';
import { binaryService } from './BinaryService';
import { processService } from './ProcessService';
import { videoMapper } from '../mappers/VideoMapper';

export class YtDlpService {
  public async getVersion(): Promise<string> {
    const executable = binaryService.getYtDlpPath();

    const result = await processService.run(executable, ['--version']);

    if (result.exitCode !== 0) {
      throw new Error(result.stderr);
    }

    return result.stdout.trim();
  }

  public async getVideoInfo(url: string) {
    const executable = binaryService.getYtDlpPath();

    const result = await processService.run(executable, ['-J', url]);

    if (result.exitCode !== 0) {
      throw new Error(result.stderr);
    }

    const json = JSON.parse(result.stdout) as YtDlpVideoInfo;

    return videoMapper.map(json);
  }
}

export const ytDlpService = new YtDlpService();
