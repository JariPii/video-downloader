import { PlaylistInfo } from '@/shared/models/PlaylistInfo';
import { VideoInfo } from '@/shared/models/VideoInfo';
import { ytDlpService } from './YtDlpService';
import { DownloadSelection } from '@/shared/models/DownloadSelection';
import { downloadQueueService } from './DownloadQueueService';

export class PlaylistService {
  public async enqueue(
    playlist: PlaylistInfo,
    formatId: string,
    outputFolder: string,
  ): Promise<void> {
    for (const item of playlist.videos) {
      const video = await ytDlpService.getVideoInfo(item.url);

      const selection: DownloadSelection = {
        downloadId: crypto.randomUUID(),
        url: video.webpageUrl,
        formatId,
        outputFolder,
        formats: video.formats,
        title: video.title,
        uploader: video.uploader,
        thumbnail: video.thumbnail,
        duration: video.duration,
      };

      await downloadQueueService.enqueue(selection);
    }
  }
}

export const playlistService = new PlaylistService();
