import { DownloadResult } from '@/electron/services/DownloadService';
import {
  DownloadCancelledEvent,
  DownloadCompletedEvent,
  DownloadFailedEvent,
  DownloadProgressEvent,
} from '@/electron/types/DownloadProgressEvent';
import { DownloadHistoryItem } from '@/shared/models/DownloadHistoryItem';
import { DownloadSelection } from '@/shared/models/DownloadSelection';

export {};

declare global {
  interface Window {
    electron: {
      app: {
        getVersion(): Promise<string>;
      };

      dialog: {
        selectFolder(): Promise<string | null>;
      };

      ytdlp: {
        getVersion(): Promise<string>;
        getVideoInfo(url: string): Promise<unknown>;
        download(selection: DownloadSelection): Promise<DownloadResult>;
        cancel(downloadId: string): Promise<void>;
        onProgress(
          callback: (progress: DownloadProgressEvent) => void,
        ): () => void;
        onCompleted(
          callback: (event: DownloadCompletedEvent) => void,
        ): () => void;
        onCancelled(
          callback: (event: DownloadCancelledEvent) => void,
        ): () => void;
        onFailed(callback: (event: DownloadFailedEvent) => void): () => void;
      };

      ffmpeg: {
        getVersion(): Promise<string>;
        getProbeVersion(): Promise<string>;
      };

      settings: {
        get(): Promise<{
          outputFolder: string;
        }>;
        setOutputFolder(outputFolder: string): Promise<void>;
      };

      history: {
        get: () => Promise<DownloadHistoryItem[]>;
        add: (item: DownloadHistoryItem) => Promise<void>;
        clear: () => Promise<void>;
      };
    };
  }
}
