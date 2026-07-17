import { DownloadSelection } from '@/shared/models/DownloadSelection';
import { VideoFormat } from '@/shared/models/VideoFormat';
import { formatService } from '@/shared/services/FormatService';

export class YtDlpArgumentService {
  public buildInfoArguments(url: string): string[] {
    return [...this.buildCommonArguments(), '-J', url];
  }

  public buildDownloadArguments(
    selection: DownloadSelection,
    selectedFormat: VideoFormat,
  ): string[] {
    const outputTemplate = selection.filename
      ? `${selection.outputFolder}\\${selection.filename}.%(ext)s`
      : `${selection.outputFolder}\\%(title)s.%(ext)s`;

    let formatArgument = selectedFormat.id;

    const isVideoOnly =
      formatService.hasVideo(selectedFormat) &&
      !formatService.hasAudio(selectedFormat);

    if (isVideoOnly) {
      const bestAudio = formatService.getBestAudio(selection.formats);

      if (!bestAudio) {
        throw new Error('No compatible audio format found');
      }

      formatArgument = `${selectedFormat.id}+${bestAudio.id}`;
    }

    return [
      ...this.buildCommonArguments(),
      '-f',
      formatArgument,
      '-o',
      outputTemplate,
      selection.url,
    ];
  }

  public buildInfoArgumentsWithCookies(url: string, browser: string): string[] {
    return [
      ...this.buildCommonArguments(),
      '--cookies-from-browser',
      browser,
      '-J',
      url,
    ];
  }

  private buildCommonArguments(): string[] {
    return ['--newline'];
  }
}

export const ytDlpArgumentService = new YtDlpArgumentService();
