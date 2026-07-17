import { DownloadHistoryItem } from '@/shared/models/DownloadHistoryItem';
import { app } from 'electron';
import path from 'node:path';
import { promises as fs } from 'node:fs';

export class HistoryService {
  private readonly filePath = path.join(
    app.getPath('userData'),
    'history.json',
  );

  public async getAll(): Promise<DownloadHistoryItem[]> {
    try {
      const json = await fs.readFile(this.filePath, 'utf8');
      return JSON.parse(json) as DownloadHistoryItem[];
    } catch {
      return [];
    }
  }

  public async add(item: DownloadHistoryItem): Promise<void> {
    const history = await this.getAll();

    history.unshift(item);

    await this.save(history);
  }

  public async clear(): Promise<void> {
    await this.save([]);
  }

  private async save(history: DownloadHistoryItem[]): Promise<void> {
    await fs.writeFile(this.filePath, JSON.stringify(history, null, 2), 'utf8');
  }
}
export const historyService = new HistoryService();
