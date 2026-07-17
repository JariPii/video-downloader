import { DownloadErrorCode } from '../enums/DownloadErrorCode';
import { DownloadError } from '../errors/DownloadError';

export class DownloadErrorMapper {
  public map(error: string): DownloadError {
    const message = error.toLowerCase();

    if (message.includes('429') || message.includes('too many requests')) {
      return new DownloadError(
        DownloadErrorCode.RateLimited,
        'Tjänsten begraänsar för närvarande anslutningen. Försök igen senare',
        true,
      );
    }

    if (
      message.includes('sign in to confirm') ||
      message.includes('cookies') ||
      message.includes('login required')
    ) {
      return new DownloadError(
        DownloadErrorCode.AuthenticationRequired,
        'Den här tjänsten kräver att du är inloggad i webläsaren',
        true,
      );
    }

    if (message.includes('video unavailable')) {
      return new DownloadError(
        DownloadErrorCode.VideoUnavailable,
        'Videon är inte tillgänglig',
      );
    }

    if (message.includes('private video')) {
      return new DownloadError(
        DownloadErrorCode.PrivateVideo,
        'Videon är privat',
      );
    }

    if (
      message.includes('unsupported url') ||
      message.includes('unsupported site')
    ) {
      return new DownloadError(
        DownloadErrorCode.UnsupportedUrl,
        'Den angivna länken stöds inte',
      );
    }

    if (
      message.includes('not available in your country') ||
      message.includes('geo')
    ) {
      return new DownloadError(
        DownloadErrorCode.GeoRestricted,
        'Videon är inte tillgänglig i ditt land',
      );
    }

    if (
      message.includes('age-restricted') ||
      message.includes('age restricted')
    ) {
      return new DownloadError(
        DownloadErrorCode.AgeRestricted,
        'Videon har åldersbegränsning',
      );
    }

    if (
      message.includes('live stream is offline') ||
      message.includes('this live event will begin')
    ) {
      return new DownloadError(
        DownloadErrorCode.LiveStreamOffline,
        'Livesändningen är inte tillgänglig just nu.',
      );
    }

    if (message.includes('copyright') || message.includes('copyright claim')) {
      return new DownloadError(
        DownloadErrorCode.CopyrightBlocked,
        'Videon kan inte laddas ner på grund av upphosrätt.',
      );
    }

    if (
      message.includes('network') ||
      message.includes('connection') ||
      message.includes('timed out') ||
      message.includes('timeout')
    ) {
      return new DownloadError(
        DownloadErrorCode.NetworkError,
        'Ett nätverksfel uppstod',
      );
    }

    return new DownloadError(
      DownloadErrorCode.Unknown,
      error.trim() || 'Ett okänt fel uppstod',
    );
  }
}

export const downloadErrorMapper = new DownloadErrorMapper();
