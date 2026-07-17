'use client';

import { Button } from '@/components/ui/button';
import { DownloadJob } from '@/shared/models/DownloadJob';
import { stat } from 'fs';

interface DownloadQueueProps {
  jobs: DownloadJob[];
  onCancel(downloadId: string): void;
  onRemove(downloadId: string): void;
}

const statusText: Record<DownloadJob['status'], string> = {
  pending: 'Pending',
  downloading: 'Downloading',
  completed: 'Completed',
  failed: 'Failed',
  cancelled: 'Cancelled',
};

function formatFileSize(bytes?: number): string {
  if (!bytes) {
    return 'Unknown';
  }

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];

  let size = bytes;
  let unit = 0;

  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024;
    unit++;
  }

  return `${size.toFixed(1)} ${units[unit]}`;
}

const DownloadQueue = ({ jobs, onCancel, onRemove }: DownloadQueueProps) => {
  if (jobs.length === 0) {
    return null;
  }

  return (
    <div className='mt-8 w-full max-w-3xl space-y-4'>
      <h2 className='text-lg font-semibold'>Download Queue</h2>

      {jobs.map((job) => (
        <div key={job.id} className='rounded-lg border p-4'>
          <div className='flex items-center justify-between'>
            <div className='font-medium truncate'>{job.title}</div>

            <div className='mt-1 text-xs text-gray-500'>
              <div>Format: {job.extension}</div>
              <div>Resolution: {job.resolution}</div>
              <div>Size: {formatFileSize(job.filesize)}</div>
            </div>

            <div className='text-sm text-gray-500'>
              {statusText[job.status]}
            </div>
          </div>

          {(job.status === 'pending' || job.status === 'downloading') && (
            <Button
              type='button'
              onClick={() => onCancel(job.id)}
              className='rounded bg-red-600 px-3 py-1 text-sm text-white hover:bg-red-700'
            >
              Cancel
            </Button>
          )}

          {(job.status === 'completed' ||
            job.status === 'failed' ||
            job.status === 'cancelled') && (
            <Button
              type='button'
              onClick={() => onRemove(job.id)}
              className='rounded bg-gray-600 px-3 py-1 text-sm text-white hover:bg-gray-700'
            >
              X Remove
            </Button>
          )}

          <div className='mt-3 h-3 w-full overflow-hidden rounded-full bg-gray-300'>
            <div
              className='h-full rounded-full bg-purple-500 transition-all duration-150'
              style={{ width: `${job.progress.percent}%` }}
            />
          </div>

          <div className='mt-2 flex justify-between text-xs text-gray-500'>
            <span>{job.progress.percent.toFixed(1)}%</span>
            <span>{job.progress.speed}</span>
            <span>{job.progress.eta}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DownloadQueue;
