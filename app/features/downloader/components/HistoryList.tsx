'use client';

import { DownloadHistoryItem } from '@/shared/models/DownloadHistoryItem';

interface HistoryListProps {
  items: DownloadHistoryItem[];
}

const HistoryList = ({ items }: HistoryListProps) => {
  if (items.length === 0) {
    return (
      <div className='mt-8'>
        <h2 className='text-lg font-semibold'>History</h2>
        <p className='text-gray-500'>Now downloads yet.</p>
      </div>
    );
  }
  return (
    <div className='mt-8 space-y-4'>
      <h2 className='text-lg font-semibold'>History</h2>

      {items.map((item) => (
        <div key={item.id} className='rounded-lg border bg-white p-4 shadow-sm'>
          <div className='flex gap-4'>
            {item.thumbnail && (
              <img
                src={item.thumbnail}
                alt={item.title}
                className='h-20 w-32 rounded object-cover'
              />
            )}

            <div className='flex-1'>
              <h3 className='font-medium'>{item.title}</h3>
              <p className='text-sm text-gray-500'>{item.uploader}</p>
              <div className='mt-2 text-sm text-gray-500'>
                <div>
                  {item.resolution} - {item.extension}
                </div>
                <div>{new Date(item.downloadedAt).toLocaleString()}</div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default HistoryList;
