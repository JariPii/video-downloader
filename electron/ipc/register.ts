import { registerAppIpc } from './app';
import { registerDialogIpc } from './dialog';
import { registerYtDlpIpc } from './ytdlp';
import { registerFfmpegIpc } from './ffmpeg';
import { registerSettingsIpc } from './settings';
import { registerHistoryIpc } from './history';

export function registerIpc(): void {
  registerAppIpc();
  registerDialogIpc();
  registerYtDlpIpc();
  registerFfmpegIpc();
  registerSettingsIpc();
  registerHistoryIpc();
}
