import { PlaylistInfo, PlaylistVideo } from '@/shared/models/PlaylistInfo';
import {
  YtDlpPlaylistInfo,
  YtDlpPlaylistVideo,
} from '../types/YtDlpPlaylistInfo';

export class PlaylistMapper {
  public map(json: YtDlpPlaylistInfo): PlaylistInfo {
    return {
      id: json.id,
      title: json.title,
      uploader: json.uploader ?? '',
      thumbnail: json.thumbnail ?? '',
      videoCount: json.playlist_count ?? json.entries?.length ?? 0,
      videos: json.entries.map((entry) => this.mapVideo(entry)),
    };
  }

  private mapVideo(entry: YtDlpPlaylistVideo): PlaylistVideo {
    return {
      id: entry.id,
      title: entry.title,
      url: entry.url ?? `https://www.youtube.com/watch?v=${entry.id}`,
      duration: entry.duration ?? 0,
      thumbnail: entry.thumbnails?.[0]?.url ?? '',
    };
  }
}

export const playlistMapper = new PlaylistMapper();
