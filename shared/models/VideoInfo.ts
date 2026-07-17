import { VideoFormat } from './VideoFormat';

export interface VideoInfo {
  id: string;
  title: string;
  uploader: string;
  duration: number;
  thumbnail: string;
  webpageUrl: string;

  formats: VideoFormat[];
}
