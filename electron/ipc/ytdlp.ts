import { BrowserWindow, ipcMain } from 'electron';
import { ytDlpService } from '../services/YtDlpService';
import { downloadService } from '../services/DownloadService';
import { DownloadSelection } from '../../shared/models/DownloadSelection';
import { progressService } from '../services/ProgressService';
import {
  DownloadFailedEvent,
  DownloadProgressEvent,
} from '../types/DownloadProgressEvent';

export function registerYtDlpIpc(): void {
  ipcMain.handle('ytdlp:getVersion', () => {
    return ytDlpService.getVersion();
  });

  ipcMain.handle('ytdlp:getVideoInfo', (_event, url: string) => {
    return ytDlpService.getVideoInfo(url);
  });

  ipcMain.handle(
    'ytdlp:download',
    async (_event, selection: DownloadSelection) => {
      const window = BrowserWindow.fromWebContents(_event.sender);

      try {
        const result = await downloadService.download(selection, (line) => {
          const progress = progressService.parse(line);

          if (!progress) {
            return;
          }

          const payload: DownloadProgressEvent = {
            downloadId: selection.downloadId,
            ...progress,
          };

          window?.webContents.send('ytdlp:progress', payload);
        });

        switch (result) {
          case 'completed':
            window?.webContents.send('ytdlp:completed', {
              downloadId: selection.downloadId,
            });
            break;

          case 'cancelled':
            window?.webContents.send('ytdlp:cancelled', {
              downloadId: selection.downloadId,
            });
            break;
        }
        return result;
      } catch (error) {
        const payload: DownloadFailedEvent = {
          downloadId: selection.downloadId,
          message:
            error instanceof Error ? error.message : 'Unknown download error',
        };

        window?.webContents.send('ytdlp:failed', payload);
      }
    },
  );

  ipcMain.handle('ytdlp:cancel', (_event, downloadId: string) => {
    downloadService.cancel(downloadId);
  });
}
