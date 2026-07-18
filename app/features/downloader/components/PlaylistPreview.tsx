import { PlaylistInfo } from '@/shared/models/PlaylistInfo';

// interface PlaylistPreviewProps {
//   items: PlaylistPreviewItem[];
//   onToggle: (id: string) => void;
// }

interface PlaylistPreviewProps {
  playlist: PlaylistInfo;
  selectedVideos: Set<string>;
  onToggle: (id: string) => void;
}

const PlaylistPreview = ({
  playlist,
  selectedVideos,
  onToggle,
}: PlaylistPreviewProps) => {
  return (
    <div className='mt-6 rounded-lg border bg-white'>
      <div className='border-b px-4 py-3'>
        <h2 className='text-lg font-semibold'>{playlist.title}</h2>
        <p>{playlist.videoCount} videos</p>
      </div>

      <div className='divide-y max-h-125 overflow-y-auto'>
        {playlist.videos.map((video, index) => (
          <div
            key={`${video.id}-${index}`}
            className='flex items-center gap-4 p-3'
          >
            <input
              type='checkbox'
              checked={selectedVideos.has(video.id)}
              onChange={() => onToggle(video.id)}
            />

            <img src={video.thumbnail} alt={video.title} className='rounded' />

            <div className='flex-1'>
              <div className='font-medium'>{video.title}</div>

              <div className='text-sm text-gray-500'>
                {Math.floor(video.duration / 60)} min
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PlaylistPreview;
