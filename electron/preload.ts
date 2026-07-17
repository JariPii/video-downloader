import { contextBridge, ipcRenderer } from 'electron';
import { DownloadSelection } from '../shared/models/DownloadSelection';
import {
  DownloadProgressEvent,
  DownloadCancelledEvent,
  DownloadCompletedEvent,
  DownloadFailedEvent,
} from './types/DownloadProgressEvent';
import { DownloadHistoryItem } from '@/shared/models/DownloadHistoryItem';

function subscribe<T>(
  channel: string,
  callback: (event: T) => void,
): () => void {
  const listener = (_event: Electron.IpcRendererEvent, event: T) => {
    callback(event);
  };

  ipcRenderer.on(channel, listener);

  return () => {
    ipcRenderer.removeListener(channel, listener);
  };
}

contextBridge.exposeInMainWorld('electron', {
  app: {
    getVersion: () => ipcRenderer.invoke('app:getVersion'),
  },

  dialog: {
    selectFolder: () => ipcRenderer.invoke('dialog:selectFolder'),
  },

  ytdlp: {
    getVersion: () => ipcRenderer.invoke('ytdlp:getVersion'),

    getVideoInfo: (url: string) =>
      ipcRenderer.invoke('ytdlp:getVideoInfo', url),

    download: (selection: DownloadSelection) =>
      ipcRenderer.invoke('ytdlp:download', selection),

    cancel: (downloadId: string) =>
      ipcRenderer.invoke('ytdlp:cancel', downloadId),

    onProgress: (callback: (progress: DownloadProgressEvent) => void) =>
      subscribe('ytdlp:progress', callback),

    onCompleted: (callback: (event: DownloadCompletedEvent) => void) =>
      subscribe('ytdlp:completed', callback),

    onCancelled: (callback: (event: DownloadCancelledEvent) => void) =>
      subscribe('ytdlp:cancelled', callback),

    onFailed: (callback: (event: DownloadFailedEvent) => void) =>
      subscribe('ytdlp:failed', callback),
  },

  ffmpeg: {
    getVersion: () => ipcRenderer.invoke('ffmpeg:getVersion'),

    getProbeVersion: () => ipcRenderer.invoke('ffmpeg:getProbeVersion'),
  },

  settings: {
    get: () => ipcRenderer.invoke('settings:get'),
    setOutputFolder: (outputFolder: string) =>
      ipcRenderer.invoke('settings:setOutputFolder', outputFolder),
  },

  history: {
    get: () => ipcRenderer.invoke('history:get'),
    add: (item: DownloadHistoryItem) => ipcRenderer.invoke('history:add', item),
    clear: () => ipcRenderer.invoke('history:clear'),
  },
});
