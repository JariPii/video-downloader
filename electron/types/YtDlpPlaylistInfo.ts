export interface YtDlpPlaylistInfo {
  id: string;
  title: string;
  uploader?: string;
  thumbnail?: string;
  playlist_count?: number;
  entries: YtDlpPlaylistVideo[];
}

export interface YtDlpPlaylistVideo {
  id: string;
  title: string;
  url?: string;
  duration?: number;
  thumbnails?: {
    url: string;
    width?: number;
    height?: number;
  }[];
}
