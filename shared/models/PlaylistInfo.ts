export interface PlaylistInfo {
  id: string;
  title: string;
  uploader: string;
  thumbnail: string;
  videoCount: number;
  videos: PlaylistVideo[];
}

export interface PlaylistVideo {
  id: string;
  title: string;
  url: string;
  duration: number;
  thumbnail: string;
}
