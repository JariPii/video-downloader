import { DownloadProgress } from '../types/DownloadProgress';

export class ProgressService {
  private readonly regex =
    /^\[download\]\s+([\d.]+)%\s+of\s+.+?\s+at\s+(.+?)\s+ETA\s+(\d+:\d+)$/;

  public parse(line: string): DownloadProgress | null {
    const text = line.trim();

    const match = this.regex.exec(text);

    if (!match) {
      return null;
    }

    return {
      percent: parseFloat(match[1]),
      speed: match[2].trim(),
      eta: match[3].trim(),
    };
  }
}

export const progressService = new ProgressService();
