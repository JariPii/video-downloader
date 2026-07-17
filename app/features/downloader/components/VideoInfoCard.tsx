/* eslint-disable @next/next/no-img-element */
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { VideoInfo } from '@/shared/models/VideoInfo';

interface VideoInfoCardProps {
  videoInfo: VideoInfo;
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

const VideoInfoCard = ({ videoInfo }: VideoInfoCardProps) => {
  return (
    <Card className='flex flex-row items-center'>
      {/* <div className='h-50'> */}
      <img
        src={videoInfo.thumbnail}
        alt={videoInfo.title}
        className='h-auto w-50'
      />
      {/* </div> */}
      <CardContent className=''>
        <h2 className='font-bold'>{videoInfo.title}</h2>
        <div>
          <p>Uploader: {videoInfo.uploader}</p>
          <p>Duration: {formatDuration(videoInfo.duration)}</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default VideoInfoCard;
