export interface YtDlpFormat {
  format_id: string;
  ext: string;
  resolution?: string;
  width?: number;
  height?: number;
  fps?: number;
  vcodec: string;
  acodec: string;
  filesize?: number;
}

export interface YtDlpVideoInfo {
  id: string;
  title: string;
  uploader: string;
  duration: number;
  thumbnail: string;
  webpage_url: string;
  formats: YtDlpFormat[];
}
