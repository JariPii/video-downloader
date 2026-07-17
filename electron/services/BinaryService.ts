import { app } from 'electron';
import { existsSync } from 'node:fs';
import path from 'node:path';

export class BinaryService {
  public getYtDlpPath(): string {
    return this.resolveBinary('yt-dlp.exe');
  }

  public getFfmpegPath(): string {
    return this.resolveBinary('ffmpeg.exe');
  }

  public getFfprobePath(): string {
    return this.resolveBinary('ffprobe.exe');
  }

  private resolveBinary(fileName: string): string {
    const binaryPath = app.isPackaged
      ? path.join(process.resourcesPath, 'binaries', fileName)
      : path.join(process.cwd(), 'resources', 'binaries', fileName);

    if (!existsSync(binaryPath)) {
      throw new Error(`Binary not found: ${binaryPath}`);
    }

    return binaryPath;
  }
  // public getYtDlpPath(): string {
  //   return app.isPackaged
  //     ? path.join(process.resourcesPath, 'binaries', 'yt-dlp.exe')
  //     : path.join(process.cwd(), 'resources', 'binaries', 'yt-dlp.exe');
  // }

  // public getFfmpegPath(): string {
  //   return app.isPackaged
  //     ? path.join(process.resourcesPath, 'binaries', 'ffmpeg.exe')
  //     : path.join(process.cwd(), 'resources', 'binaries', 'ffmpeg.exe');
  // }

  // public getFfprobePath(): string {
  //   return app.isPackaged
  //     ? path.join(process.resourcesPath, 'binaries', 'ffprobe.exe')
  //     : path.join(process.cwd(), 'resources', 'binaries', 'ffprobe.exe');
  // }
}

export const binaryService = new BinaryService();
