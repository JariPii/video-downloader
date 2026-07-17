import { ipcMain } from 'electron';
import { settingsService } from '../services/SettingsService';

export function registerSettingsIpc(): void {
  ipcMain.handle('settings:get', () => {
    return settingsService.get();
  });

  ipcMain.handle('settings:setOutputFolder', (_event, outputFolder: string) => {
    settingsService.setOutputFolder(outputFolder);
  });
}
