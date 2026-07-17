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

  async function startDownload(
    video: VideoInfo,
    formatId: string,
    outputFolder: string,
  ) {
    const downloadId = crypto.randomUUID();

    const selectedFormat = formatService.findById(video.formats, formatId);

    if (!selectedFormat) {
      throw new Error('Selected format was not found.');
    }

    addJob({
      id: downloadId,
      title: video.title,
      extension: selectedFormat.extension,
      resolution: selectedFormat.resolution,
      filesize: selectedFormat.filesize,
      outputFolder,
      status: 'queued',
      progress: {
        percent: 0,
        speed: '',
        eta: '',
      },
    });

    try {
      const result = await window.electron.ytdlp.download({
        downloadId,
        url: video.webpageUrl,
        formatId,
        outputFolder,
        formats: video.formats,
        title: video.title,
        uploader: video.uploader,
        thumbnail: video.thumbnail,
        duration: video.duration,
      });

      if (result === 'completed') {
        const history = await window.electron.history.get();

        setHistory(history);
      }
    } catch (error) {
      console.error(error);
    }
  }

  async function handleDownload() {
    if (!videoInfo || !selectedFormatId || !outputFolder) {
      return;
    }

    await startDownload(videoInfo, selectedFormatId, outputFolder);
  }

  async function handleCancel(downloadId: string) {
    await window.electron.ytdlp.cancel(downloadId);
  }

  async function handleDownloadAgain(item: DownloadHistoryItem) {
    try {
      const info = (await window.electron.ytdlp.getVideoInfo(
        item.url,
      )) as VideoInfo;

      const formatExists = formatService.findById(info.formats, item.formatId);

      if (!formatExists) {
        window.alert(
          [
            'The saved format is no longer available',
            '',
            'The video has probably been updated since it was downloaded.',
            'Please select a new format and download it manually',
          ].join('\n'),
        );

        return;
      }

      await startDownload(info, item.formatId, item.outputFolder);
    } catch (error) {
      console.error(error);
      window.alert('Failed to retrieve the latest information for this video.');
    }
  }

  async function handleRemoveFromHistory(id: string) {
    await window.electron.history.remove(id);

    const history = await window.electron.history.get();

    setHistory(history);
  }

  async function handleClearHistory() {
    const confirmed = window.confirm(
      'Are you sure you want to clear the download history?',
    );

    if (!confirmed) {
      return;
    }
    await window.electron.history.clear();

    setHistory([]);
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

        <HistoryList
          items={history}
          onDownloadAgain={handleDownloadAgain}
          onRemove={handleRemoveFromHistory}
          onClear={handleClearHistory}
        />
      </main>
    </div>
  );
}
