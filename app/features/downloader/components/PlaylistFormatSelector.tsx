import { PlaylistQuality } from '@/shared/models/PlaylistQuality';

interface PlaylistFormatSelectorProps {
  value: PlaylistQuality;
  onChange(value: PlaylistQuality): void;
}

const PlaylistFormatSelector = ({
  value,
  onChange,
}: PlaylistFormatSelectorProps) => {
  return (
    <div className='mt-4'>
      <label htmlFor='' className='block mb-2 font-medium'>
        Playlist quality
      </label>

      <select
        value={value}
        onChange={(e) => onChange(e.target.value as PlaylistQuality)}
        className='border rounded p-2'
      >
        <option value='best'>Best Video + Audio</option>
        <option value='1080'>1080p</option>
        <option value='720'>720p</option>
        <option value='480'>480p</option>
        <option value='audio'>Audio only</option>
      </select>
    </div>
  );
};

export default PlaylistFormatSelector;
