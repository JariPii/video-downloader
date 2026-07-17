import { ipcMain } from 'electron';
import { historyService } from '../services/HistoryService';
import { DownloadHistoryItem } from '@/shared/models/DownloadHistoryItem';

export function registerHistoryIpc(): void {
  ipcMain.handle('history:get', async () => {
    return historyService.getAll();
  });

  ipcMain.handle('history:add', async (_event, item: DownloadHistoryItem) => {
    await historyService.add(item);
  });

  ipcMain.handle('history:clear', async () => {
    await historyService.clear();
  });

  ipcMain.handle('history:remove', async (_event, id: string) => {
    await historyService.remove(id);
  });
}
