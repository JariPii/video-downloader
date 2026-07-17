import { VideoFormat } from './VideoFormat';

export interface DownloadSelection {
  downloadId: string;
  url: string;
  outputFolder: string;
  formatId: string;
  formats: VideoFormat[];
  title: string;
  uploader: string;
  thumbnail: string;
  duration: number;
  filename?: string;
}
