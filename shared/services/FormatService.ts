import { VideoFormat } from '../models/VideoFormat';

export class FormatService {
  public getVideoFormats(formats: VideoFormat[]): VideoFormat[] {
    return formats.filter(
      (format) => this.hasVideo(format) && !this.hasAudio(format),
    );
  }

  public getAudioFormats(formats: VideoFormat[]): VideoFormat[] {
    return formats.filter(
      (format) => !this.hasVideo(format) && this.hasAudio(format),
    );
  }

  public getCombinedFormats(formats: VideoFormat[]): VideoFormat[] {
    return formats.filter(
      (format) => this.hasVideo(format) && this.hasAudio(format),
    );
  }

  public findById(formats: VideoFormat[], id: string): VideoFormat | undefined {
    return formats.find((format) => format.id === id);
  }

  public sortByFileSize(formats: VideoFormat[]): VideoFormat[] {
    return [...formats].sort((a, b) => (b.filesize ?? 0) - (a.filesize ?? 0));
  }

  public hasVideo(format: VideoFormat): boolean {
    return format.videoCodec !== 'none';
  }

  public hasAudio(format: VideoFormat): boolean {
    return format.audioCodec !== 'none';
  }

  public getBestCombined(formats: VideoFormat[]): VideoFormat | undefined {
    return this.sortByResolution(this.getCombinedFormats(formats))[0];
  }

  public getBestVideo(formats: VideoFormat[]): VideoFormat | undefined {
    return this.sortByResolution(this.getVideoFormats(formats))[0];
  }

  public getBestAudio(formats: VideoFormat[]): VideoFormat | undefined {
    return this.sortByFileSize(this.getAudioFormats(formats))[0];
  }

  public sortByResolution(formats: VideoFormat[]): VideoFormat[] {
    return [...formats].sort((a, b) => this.getPixels(b) - this.getPixels(a));
  }

  private getPixels(format: VideoFormat): number {
    const parts = format.resolution.split('x');

    if (parts.length !== 2) {
      return 0;
    }

    return Number(parts[0]) * Number(parts[1]);
  }
}

export const formatService = new FormatService();
