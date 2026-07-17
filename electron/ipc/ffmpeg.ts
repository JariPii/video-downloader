import { ipcMain } from 'electron';
import { ffmpegService } from '../services/FfmpegService';

export function registerFfmpegIpc(): void {
  ipcMain.handle('ffmpeg:getVersion', () => {
    return ffmpegService.getVersion();
  });

  ipcMain.handle('ffmpeg:getProbeVersion', () => {
    return ffmpegService.getProbeVersion();
  });
}
