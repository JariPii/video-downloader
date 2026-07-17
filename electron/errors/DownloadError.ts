import { DownloadErrorCode } from '../enums/DownloadErrorCode';

export class DownloadError extends Error {
  constructor(
    public readonly code: DownloadErrorCode,
    message: string,
    public readonly retryable = false,
  ) {
    super(message);
    this.name = 'DownloadError';
  }
}
