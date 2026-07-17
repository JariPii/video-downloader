import { formatService } from '@/shared/services/FormatService';
import { DownloadSelection } from '../../shared/models/DownloadSelection';
import { binaryService } from './BinaryService';
import { processService } from './ProcessService';
import { RunningProcess } from '../types/RunningProcess';
import { historyService } from './HistoryService';
import { VideoFormat } from '@/shared/models/VideoFormat';
import { ytDlpArgumentService } from './YtDlpArgumentService';
import { logService } from './LogService';
import { LogLevel } from '../enums/LogLevel';
import { LogCategory } from '../enums/LogCategory';
import { downloadErrorMapper } from '../mappers/DownloadErrorMapper';
import { DownloadError } from '../errors/DownloadError';

export type DownloadResult = 'completed' | 'cancelled';

export class DownloadService {
  private readonly downloads = new Map<string, RunningProcess>();
  private readonly cancelled = new Set<string>();

  public async download(
    selection: DownloadSelection,
    onProgress?: (line: string) => void,
  ): Promise<DownloadResult> {
    const executable = binaryService.getYtDlpPath();

    const selectedFormat = formatService.findById(
      selection.formats,
      selection.formatId,
    );

    if (!selectedFormat) {
      throw new Error('Selected format was not found');
    }

    logService.log(LogLevel.Info, LogCategory.Download, `Download started`, {
      downloadId: selection.downloadId,
      title: selection.title,
      url: selection.url,
    });

    const args = ytDlpArgumentService.buildDownloadArguments(
      selection,
      selectedFormat,
    );

    const running = processService.start(executable, args, {
      onStdout: onProgress,
      onStderr: onProgress,
    });

    this.downloads.set(selection.downloadId, running);

    try {
      const result = await running.completed;
      const exitCode = result.exitCode;

      if (this.cancelled.has(selection.downloadId)) {
        this.cancelled.delete(selection.downloadId);

        logService.log(
          LogLevel.Info,
          LogCategory.Download,
          `Download cancelled`,
          {
            downloadId: selection.downloadId,
            title: selection.title,
          },
        );

        return 'cancelled';
      }

      if (exitCode !== 0) {
        const downloadError = downloadErrorMapper.map(result.stderr);

        logService.log(
          LogLevel.Error,
          LogCategory.Download,
          `Download failed`,
          {
            downloadId: selection.downloadId,
            title: selection.title,
            exitCode,
            errorCode: downloadError.code,
          },
          downloadError,
        );

        throw downloadError;
      }

      await this.saveHistory(selection, selectedFormat);

      logService.log(
        LogLevel.Info,
        LogCategory.Download,
        `Download completed`,
        {
          downloadId: selection.downloadId,
          title: selection.title,
        },
      );

      return 'completed';
    } catch (error) {
      const downloadError =
        error instanceof DownloadError
          ? error
          : downloadErrorMapper.map(
              error instanceof Error ? error.message : String(error),
            );

      logService.log(
        LogLevel.Error,
        LogCategory.Download,
        `Download failed`,
        {
          downloadId: selection.downloadId,
          title: selection.title,
          errorCode: downloadError.code,
        },
        downloadError,
      );

      throw downloadError;
    } finally {
      this.downloads.delete(selection.downloadId);
    }
  }

  public async cancel(downloadId: string): Promise<void> {
    const running = this.downloads.get(downloadId);

    if (!running) {
      logService.warning(
        LogCategory.Download,
        'Cancel requested for unknown download',
        {
          downloadId,
        },
      );
      return;
    }

    logService.log(LogLevel.Info, LogCategory.Download, `Cancelling download`, {
      downloadId,
    });

    this.cancelled.add(downloadId);

    try {
      await processService.kill(running.process);

      logService.info(LogCategory.Download, 'Download process terminated', {
        downloadId,
      });
    } catch (error) {
      this.cancelled.delete(downloadId);

      logService.error(
        LogCategory.Download,
        'Failed to cancel download',
        error,
        {
          downloadId,
        },
      );

      throw error;
    }
  }

  private async saveHistory(
    selection: DownloadSelection,
    selectedFormat: VideoFormat,
  ): Promise<void> {
    await historyService.add({
      id: selection.downloadId,
      title: selection.title,
      uploader: selection.uploader,
      thumbnail: selection.thumbnail,
      duration: selection.duration,
      url: selection.url,
      formatId: selection.formatId,
      extension: selectedFormat.extension,
      resolution: selectedFormat.resolution,
      outputFolder: selection.outputFolder,
      downloadedAt: new Date().toISOString(),
    });
  }
}

export const downloadService = new DownloadService();
