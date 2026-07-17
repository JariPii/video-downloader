import { formatService } from '@/shared/services/FormatService';
import { DownloadSelection } from '../../shared/models/DownloadSelection';
import { binaryService } from './BinaryService';
import { processService } from './ProcessService';
import { RunningProcess } from '../types/RunningProcess';
import { historyService } from './HistoryService';
import { VideoFormat } from '@/shared/models/VideoFormat';

export type DownloadResult = 'completed' | 'cancelled';

export class DownloadService {
  private readonly downloads = new Map<string, RunningProcess>();
  private readonly cancelled = new Set<string>();

  public async download(
    selection: DownloadSelection,
    onProgress?: (line: string) => void,
  ): Promise<DownloadResult> {
    const executable = binaryService.getYtDlpPath();

    const outputTemplate = selection.filename
      ? `${selection.outputFolder}\\${selection.filename}.%(ext)s`
      : `${selection.outputFolder}\\%(title)s.%(ext)s`;

    const selectedFormat = formatService.findById(
      selection.formats,
      selection.formatId,
    );

    if (!selectedFormat) {
      throw new Error('Selected format was not found');
    }

    let formatArgument = selection.formatId;

    const isVideoOnly =
      formatService.hasVideo(selectedFormat) &&
      !formatService.hasAudio(selectedFormat);

    const isAudioOnly =
      !formatService.hasVideo(selectedFormat) &&
      formatService.hasAudio(selectedFormat);

    const isCombined =
      formatService.hasVideo(selectedFormat) &&
      formatService.hasAudio(selectedFormat);

    if (isVideoOnly) {
      const bestAudio = formatService.getBestAudio(selection.formats);

      if (!bestAudio) {
        throw new Error('No compatible audio format found');
      }

      formatArgument = `${selectedFormat.id}+${bestAudio.id}`;
    }

    const args = [
      '--newline',
      '-f',
      formatArgument,
      '-o',
      outputTemplate,
      selection.url,
    ];

    const running = processService.start(executable, args, {
      onStdout: onProgress,
      onStderr: onProgress,
    });

    this.downloads.set(selection.downloadId, running);

    try {
      const exitCode = await running.completed;

      if (this.cancelled.has(selection.downloadId)) {
        this.cancelled.delete(selection.downloadId);
        return 'cancelled';
      }

      if (exitCode !== 0) {
        throw new Error(`yt-dlp exited with code ${exitCode}`);
      }

      await this.saveHistory(selection, selectedFormat);

      return 'completed';
    } finally {
      this.downloads.delete(selection.downloadId);
    }
  }

  public async cancel(downloadId: string): Promise<void> {
    const running = this.downloads.get(downloadId);

    if (!running) {
      return;
    }

    this.cancelled.add(downloadId);

    await processService.kill(running.process);
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
