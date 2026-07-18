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
}

export const binaryService = new BinaryService();
