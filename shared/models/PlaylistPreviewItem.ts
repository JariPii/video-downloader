import { VideoFormat } from './VideoFormat';

export interface PlaylistPreviewItem {
  id: string;
  title: string;
  uploader: string;
  duration: number;
  thumbnail: string;
  webpageUrl: string;

  formats: VideoFormat[];

  selected: boolean;
}
