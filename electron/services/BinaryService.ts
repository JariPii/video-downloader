import { app } from 'electron';
import path from 'node:path';

export class BinaryService {
  public getYtDlpPath(): string {
    return app.isPackaged
      ? path.join(process.resourcesPath, 'binaries', 'yt-dlp.exe')
      : path.join(process.cwd(), 'resources', 'binaries', 'yt-dlp.exe');
  }

  public getFfmpegPath(): string {
    return app.isPackaged
      ? path.join(process.resourcesPath, 'binaries', 'ffmpeg.exe')
      : path.join(process.cwd(), 'resources', 'binaries', 'ffmpeg.exe');
  }

  public getFfprobePath(): string {
    return app.isPackaged
      ? path.join(process.resourcesPath, 'binaries', 'ffprobe.exe')
      : path.join(process.cwd(), 'resources', 'binaries', 'ffprobe.exe');
  }
}

export const binaryService = new BinaryService();
