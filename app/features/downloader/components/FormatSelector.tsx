'use client';

import { VideoFormat } from '@/shared/models/VideoFormat';

interface FormatSelectorProps {
  combinedFormats: VideoFormat[];
  videoFormats: VideoFormat[];
  audioFormats: VideoFormat[];
  selectedFormatId: string;
  onChange(formatId: string): void;
}

const FormatSelector = ({
  combinedFormats,
  audioFormats,
  videoFormats,
  selectedFormatId,
  onChange,
}: FormatSelectorProps) => {
  return (
    <div className='flex flex-col gap-2'>
      <label htmlFor='format'>Format</label>
      <select
        id='format'
        value={selectedFormatId}
        onChange={(e) => onChange(e.target.value)}
        className=''
      >
        <option value=''>Choose format</option>
        <optgroup label='Video + Audio' className='text-black'>
          {combinedFormats.map((format) => (
            <option key={format.id} value={format.id}>
              {format.resolution} - {format.extension}
            </option>
          ))}
        </optgroup>

        <optgroup label='Video only' className='text-black'>
          {videoFormats.map((format) => (
            <option key={format.id} value={format.id}>
              {format.resolution}
              {format.fps ? `${format.fps} FPS` : ''}
              {' - '}
              {format.extension}
            </option>
          ))}
        </optgroup>

        <optgroup label='Audio only' className='text-black'>
          {audioFormats.map((format) => (
            <option key={format.id} value={format.id}>
              {format.extension}
            </option>
          ))}
        </optgroup>
        {/* {formats.map((format) => (
          <option key={format.id} value={format.id} className='text-black'>
            {format.extension} - {format.resolution}
            {format.fps ? ` - ${format.fps} FPS` : ''}
          </option>
        ))} */}
      </select>
    </div>
  );
};

export default FormatSelector;
