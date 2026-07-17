export interface VideoFormat {
  id: string;
  extension: string;
  resolution: string;
  fps?: number;
  videoCodec: string;
  audioCodec: string;
  filesize?: number;
}
