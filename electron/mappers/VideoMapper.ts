import { VideoFormat } from '../../shared/models/VideoFormat';
import { VideoInfo } from '../../shared/models/VideoInfo';
import { YtDlpVideoInfo } from '../types/YtDlpVideoInfo';

export class VideoMapper {
  public map(data: YtDlpVideoInfo): VideoInfo {
    const formats: VideoFormat[] = data.formats.map((format) => ({
      id: format.format_id,

      extension: format.ext,

      resolution:
        format.resolution ?? `${format.width ?? 0}x${format.height ?? 0}`,

      fps: format.fps,

      videoCodec: format.vcodec,

      audioCodec: format.acodec,

      filesize: format.filesize,
    }));

    return {
      id: data.id,

      title: data.title,

      uploader: data.uploader,

      duration: data.duration,

      thumbnail: data.thumbnail,

      webpageUrl: data.webpage_url,

      formats,
    };
  }
}

export const videoMapper = new VideoMapper();
