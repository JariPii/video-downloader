import { registerAppIpc } from './app';
import { registerDialogIpc } from './dialog';
import { registerYtDlpIpc } from './ytdlp';
import { registerFfmpegIpc } from './ffmpeg';
import { registerSettingsIpc } from './settings';
import { registerHistoryIpc } from './history';
import { logService } from '../services/LogService';
import { LogCategory } from '../enums/LogCategory';

export function registerIpc(): void {
  logService.info(LogCategory.App, 'Registering IPC handlers');

  registerAppIpc();
  registerDialogIpc();
  registerYtDlpIpc();
  registerFfmpegIpc();
  registerSettingsIpc();
  registerHistoryIpc();

  logService.info(LogCategory.App, 'IPC handlers registered');
}
