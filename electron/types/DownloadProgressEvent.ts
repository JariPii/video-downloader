import { DownloadProgress } from './DownloadProgress';

export interface DownloadProgressEvent extends DownloadProgress {
  downloadId: string;
}

export interface DownloadCompletedEvent {
  downloadId: string;
}

export interface DownloadCancelledEvent {
  downloadId: string;
}

export interface DownloadFailedEvent {
  downloadId: string;
  message: string;
}
