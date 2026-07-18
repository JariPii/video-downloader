export class UrlService {
  public isPlaylist(url: string): boolean {
    try {
      const parsed = new URL(url);

      if (parsed.searchParams.has('list')) {
        return true;
      }

      if (parsed.pathname.includes('/playlist')) {
        return true;
      }

      return false;
    } catch {
      return false;
    }
  }
}

export const urlService = new UrlService();
