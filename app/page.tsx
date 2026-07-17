'use client';
import DownloadButton from '@/app/features/downloader/components/DownloadButton';
import DownloadPanel from '@/app/features/downloader/components/DownloadPanel';
import FormatSelector from '@/app/features/downloader/components/FormatSelector';
import UrlForm from '@/app/features/downloader/components/UrlForm';
import VideoInfoCard from '@/app/features/downloader/components/VideoInfoCard';
import { VideoInfo } from '@/shared/models/VideoInfo';
import { formatService } from '@/shared/services/FormatService';
import { useEffect, useState } from 'react';
import { useDownloadQueue } from './features/downloader/hooks/useDownloadQueue';
import DownloadQueue from './features/downloader/components/DownloadQueue';
import { DownloadHistoryItem } from '@/shared/models/DownloadHistoryItem';
import HistoryList from './features/downloader/components/HistoryList';

export default function Home() {
  const [outputFolder, setOutputFolder] = useState('');
  const [url, setUrl] = useState('');
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedFormatId, setSelectedFormatId] = useState('');
  const [history, setHistory] = useState<DownloadHistoryItem[]>([]);

  // const { jobs, addJob, setCompleted, setFailed } = useDownloadQueue();
  const { jobs, addJob, removeJob } = useDownloadQueue();

  useEffect(() => {
    async function loadSettings() {
      const settings = await window.electron.settings.get();

      setOutputFolder(settings.outputFolder);

      const history = await window.electron.history.get();

      setHistory(history);
    }

    void loadSettings();
  }, []);

  async function handleGetVideoInfo() {
    if (!url.trim()) {
      return;
    }

    try {
      setLoading(true);

      const info = await window.electron.ytdlp.getVideoInfo(url);

      setVideoInfo(info as VideoInfo);
    } finally {
      setLoading(false);
    }
  }

  async function handleSelectFolder() {
    const folder = await window.electron.dialog.selectFolder();

    if (!folder) {
      return;
    }

    setOutputFolder(folder);
  }

  async function handleDownload() {
    if (!videoInfo || !selectedFormatId || !outputFolder) {
      return;
    }

    const downloadId = crypto.randomUUID();

    const selectedFormat = formatService.findById(
      videoInfo.formats,
      selectedFormatId,
    );

    if (!selectedFormat) {
      return;
    }

    addJob({
      id: downloadId,
      title: videoInfo.title,
      extension: selectedFormat.extension,
      resolution: selectedFormat.resolution,
      filesize: selectedFormat.filesize,
      outputFolder,
      status: 'pending',
      progress: {
        percent: 0,
        speed: '',
        eta: '',
      },
    });

    // try {
    const result = await window.electron.ytdlp.download({
      downloadId,
      url: videoInfo.webpageUrl,
      formatId: selectedFormatId,
      outputFolder,
      formats: videoInfo.formats,
      title: videoInfo.title,
      uploader: videoInfo.uploader,
      thumbnail: videoInfo.thumbnail,
      duration: videoInfo.duration,
    });

    if (result === 'completed') {
      const history = await window.electron.history.get();

      setHistory(history);
    }
    //   setCompleted(downloadId);
    // } catch (error) {
    //   console.error(error);
    //   setFailed(downloadId);
    // }
  }

  async function handleCancel(downloadId: string) {
    await window.electron.ytdlp.cancel(downloadId);
  }

  return (
    <div className='h-screen bg-gray-100 p-10'>
      <main className=''>
        <div className='p-2 bg-gray-300'>
          <UrlForm
            url={url}
            loading={loading}
            onUrlChange={setUrl}
            onSubmit={handleGetVideoInfo}
          />
        </div>
        {videoInfo && <VideoInfoCard videoInfo={videoInfo} />}

        {videoInfo && (
          <FormatSelector
            combinedFormats={formatService.getCombinedFormats(
              videoInfo.formats,
            )}
            videoFormats={formatService.getVideoFormats(videoInfo.formats)}
            audioFormats={formatService.getAudioFormats(videoInfo.formats)}
            selectedFormatId={selectedFormatId}
            onChange={setSelectedFormatId}
          />
        )}

        <DownloadPanel
          outputFolder={outputFolder}
          onSelectFolder={handleSelectFolder}
        />

        <DownloadButton
          disabled={!videoInfo || !selectedFormatId || !outputFolder}
          onClick={handleDownload}
        />

        {/* <DownloadProgress /> */}

        <DownloadQueue
          jobs={jobs}
          onCancel={handleCancel}
          onRemove={removeJob}
        />

        <HistoryList items={history} />
      </main>
    </div>
  );
}
