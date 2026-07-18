import { PlaylistQuality } from '../models/PlaylistQuality';
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

  public findBestPlaylistFormat(
    formats: VideoFormat[],
    quality: PlaylistQuality,
  ): VideoFormat | undefined {
    switch (quality) {
      case 'best':
        return this.getBestCombined(formats) ?? this.getBestVideo(formats);

      case '1080':
        const video1080 = this.sortByResolution(
          this.getVideoFormats(formats).filter(
            (format) => this.getPixels(format) <= 1920 * 1080,
          ),
        )[0];
        return (
          video1080 ??
          this.getBestVideo(formats) ??
          this.getBestCombined(formats)
        );

      case '720':
        const video720 = this.sortByResolution(
          this.getVideoFormats(formats).filter(
            (format) => this.getPixels(format) <= 1280 * 720,
          ),
        )[0];
        return (
          video720 ??
          this.getBestVideo(formats) ??
          this.getBestCombined(formats)
        );

      case '480':
        const video480 = this.sortByResolution(
          this.getVideoFormats(formats).filter(
            (format) => this.getPixels(format) <= 854 * 480,
          ),
        )[0];
        return (
          video480 ??
          this.getBestVideo(formats) ??
          this.getBestCombined(formats)
        );

      case 'audio':
        return this.getBestAudio(formats);
    }
  }

  private getPixels(format: VideoFormat): number {
    const parts = format.resolution.split('x');

    if (parts.length !== 2) {
      const resolutionMatch = format.resolution.match(/(\d+)p?/);
      if (!resolutionMatch) {
        return 0;
      }
      const height = Number(resolutionMatch[1]);
      const width = Math.round((height * 16) / 9);
      return width * height;
    }

    const width = Number(parts[0]);
    const height = Number(parts[1]);

    if (isNaN(width) || isNaN(height)) {
      return 0;
    }

    return width * height;
  }
}

export const formatService = new FormatService();
