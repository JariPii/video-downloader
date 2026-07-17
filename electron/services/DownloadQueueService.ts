import { DownloadSelection } from '@/shared/models/DownloadSelection';
import { DownloadResult, downloadService } from './DownloadService';

type ProgressCallback = (line: string) => void;

interface QueueItem {
  selection: DownloadSelection;
  onProgress?: ProgressCallback;
  resolve: (result: DownloadResult) => void;
  reject: (error: unknown) => void;
}

export class DownloadQueueService {
  private readonly queue: QueueItem[] = [];

  private readonly active = new Set<string>();

  private readonly maxConcurrentDls = 1;

  public enqueue(
    selection: DownloadSelection,
    onProgress?: ProgressCallback,
  ): Promise<DownloadResult> {
    return new Promise((resolve, reject) => {
      this.queue.push({
        selection,
        onProgress,
        resolve,
        reject,
      });

      this.startNext();
    });
  }

  public queueLength(): number {
    return this.queue.length;
  }

  public getActiveCount(): number {
    return this.active.size;
  }

  private startNext(): void {
    while (this.active.size < this.maxConcurrentDls && this.queue.length > 0) {
      const item = this.queue.shift();

      if (!item) {
        return;
      }

      this.active.add(item.selection.downloadId);

      void this.run(item);
    }
  }

  private async run(item: QueueItem): Promise<void> {
    try {
      const result = await downloadService.download(
        item.selection,
        item.onProgress,
      );

      item.resolve(result);
    } catch (error) {
      item.reject(error);
    } finally {
      this.active.delete(item.selection.downloadId);

      this.startNext();
    }
  }
}

export const downloadQueueService = new DownloadQueueService();
