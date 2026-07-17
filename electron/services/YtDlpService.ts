import { YtDlpVideoInfo } from '../types/YtDlpVideoInfo';
import { binaryService } from './BinaryService';
import { processService } from './ProcessService';
import { videoMapper } from '../mappers/VideoMapper';
import { ytDlpArgumentService } from './YtDlpArgumentService';
import { retryService } from './RetryService';
import { DownloadError } from '../errors/DownloadError';
import { downloadErrorMapper } from '../mappers/DownloadErrorMapper';
import { DownloadErrorCode } from '../enums/DownloadErrorCode';

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
    const browsers = ['chrome', 'edge', 'firefox', 'brave'];

    try {
      return await this.runInfo(ytDlpArgumentService.buildInfoArguments(url));
    } catch (error) {
      if (
        !(error instanceof DownloadError) ||
        error.code !== DownloadErrorCode.AuthenticationRequired
      ) {
        throw error;
      }
    }

    for (const browser of browsers) {
      try {
        return await this.runInfo(
          ytDlpArgumentService.buildInfoArgumentsWithCookies(url, browser),
        );
      } catch (error) {
        if (
          error instanceof DownloadError &&
          error.code === DownloadErrorCode.AuthenticationRequired
        ) {
          continue;
        }

        throw error;
      }
    }

    throw new DownloadError(
      DownloadErrorCode.AuthenticationRequired,
      'Ingen kompatibel webläsare med giltiga cookies kunde användas.',
      false,
    );
    // let args = ytDlpArgumentService.buildInfoArguments(url);
    // try {
    //   return await this.runInfo(args);
    // } catch (error) {
    //   if (
    //     error instanceof DownloadError &&
    //     error.code === DownloadErrorCode.AuthenticationRequired
    //   ) {
    //     args = ytDlpArgumentService.buildInfoArgumentsWithCookies(
    //       url,
    //       'chrome',
    //     );
    //     return await this.runInfo(args);
    //   }

    //   throw error;
    // }
  }

  private async runInfo(args: string[]) {
    const executable = binaryService.getYtDlpPath();

    try {
      return await retryService.execute(
        async () => {
          const result = await processService.run(executable, args);

          if (result.exitCode !== 0) {
            throw downloadErrorMapper.map(result.stderr);
          }

          const json = JSON.parse(result.stdout) as YtDlpVideoInfo;

          return videoMapper.map(json);
        },
        1,
        2000,
        (error) => error instanceof DownloadError && error.retryable,
      );
    } catch (error) {
      if (error instanceof DownloadError) {
        throw error;
      }

      if (error instanceof Error) {
        throw downloadErrorMapper.map(error.message);
      }

      throw error;
    }
  }
}

export const ytDlpService = new YtDlpService();
