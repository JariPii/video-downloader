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
import { PlaylistInfo } from '@/shared/models/PlaylistInfo';
import PlaylistFormatSelector from './features/downloader/components/PlaylistFormatSelector';
import { PlaylistQuality } from '@/shared/models/PlaylistQuality';
import PlaylistPreview from './features/downloader/components/PlaylistPreview';
import { urlService } from '@/electron/services/UrlService';
// import { PlaylistPreviewItem } from '@/shared/models/PlaylistPreviewItem';

export default function Home() {
  const [outputFolder, setOutputFolder] = useState('');
  const [url, setUrl] = useState('');
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  // const [playlistInfo, setPlaylistInfo] = useState<PlaylistInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedFormatId, setSelectedFormatId] = useState('');
  const [history, setHistory] = useState<DownloadHistoryItem[]>([]);
  const [playlistQuality, setPlaylistQuality] =
    useState<PlaylistQuality>('best');
  // const [playlistItems, setPlaylistItems] = useState<PlaylistPreviewItem[]>([]);
  const [playlist, setPlaylist] = useState<PlaylistInfo | null>(null);
  const [selectedVideos, setSelectedVideos] = useState<Set<string>>(new Set());

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

  // function isPlaylistUrl(url: string): boolean {
  //   try {
  //     const parsed = new URL(url);

  //     return parsed.searchParams.has('list');
  //   } catch {
  //     return false;
  //   }
  // }

  async function handleGetVideoInfo() {
    if (!url.trim()) {
      return;
    }

    try {
      setLoading(true);

      if (urlService.isPlaylist(url)) {
        const playlist = await window.electron.ytdlp.getPlaylistInfo(url);

        console.log(
          'playlist.videos',
          playlist.videos.map((v) => ({
            id: v.id,
            title: v.title,
          })),
        );

        const duplicateIds = playlist.videos.filter(
          (video, index, array) =>
            array.findIndex((v) => v.id === video.id) !== index,
        );

        console.log('Duplicate videos', duplicateIds);
        console.log('Duplicate count', duplicateIds.length);

        setPlaylist(playlist);
        setVideoInfo(null);

        return;
      }

      const info = await window.electron.ytdlp.getVideoInfo(url);
      setPlaylist(null);

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

  function createDownloadJob(
    video: VideoInfo,
    formatId: string,
    outputFolder: string,
  ): string {
    const downloadId = crypto.randomUUID();

    const selectedFormat = formatService.findById(video.formats, formatId);

    if (!selectedFormat) {
      throw new Error('Selected format was not found');
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

    return downloadId;
  }

  async function startDownload(
    downloadId: string,
    video: VideoInfo,
    formatId: string,
    outputFolder: string,
  ) {
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

  async function startPlaylistDownload(
    playlist: PlaylistInfo,
    quality: PlaylistQuality,
    outputFolder: string,
  ) {
    if (!playlist) {
      return;
    }

    const seen = new Set<string>();

    const videosToDownload = playlist.videos.filter((video) => {
      if (!selectedVideos.has(video.id)) {
        return false;
      }

      if (seen.has(video.id)) {
        return false;
      }

      seen.add(video.id);
      return true;
    });

    if (videosToDownload.length === 0) {
      window.alert('Please select at least on video');
      return;
    }

    for (const item of videosToDownload) {
      const info = (await window.electron.ytdlp.getVideoInfo(
        item.url,
      )) as VideoInfo;

      const format = formatService.findBestPlaylistFormat(
        info.formats,
        quality,
      );

      if (!format) {
        continue;
      }

      const downloadId = createDownloadJob(info, format.id, outputFolder);

      await startDownload(downloadId, info, format.id, outputFolder);
    }
  }

  async function handleDownload() {
    if (!outputFolder) {
      return;
    }

    if (videoInfo) {
      if (!selectedFormatId) {
        return;
      }

      const downloadId = createDownloadJob(
        videoInfo,
        selectedFormatId,
        outputFolder,
      );

      await startDownload(
        downloadId,
        videoInfo,
        selectedFormatId,
        outputFolder,
      );

      return;
    }

    if (playlist) {
      await startPlaylistDownload(playlist, playlistQuality, outputFolder);

      return;
    }
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

      const downloadId = createDownloadJob(
        info,
        item.formatId,
        item.outputFolder,
      );

      await startDownload(downloadId, info, item.formatId, item.outputFolder);
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

  // function handleTogglePlaylistItem(id: string) {
  //   setPlaylistItems((items) =>
  //     items.map((item) =>
  //       item.id === id
  //         ? {
  //             ...item,
  //             selected: !item.selected,
  //           }
  //         : item,
  //     ),
  //   );
  // }

  function togglePlaylistVideo(id: string) {
    setSelectedVideos((current) => {
      const next = new Set(current);

      if (next.has(id)) {
        next.delete(id);
      } else next.add(id);

      return next;
    });
  }

  function selectAllVideos() {
    if (!playlist) {
      return;
    }

    setSelectedVideos(new Set(playlist.videos.map((video) => video.id)));
  }

  function clearSelectedVideos() {
    setSelectedVideos(new Set());
  }

  // async function handlePlaylistDownload() {
  //   if (!playlist || !outputFolder) {
  //     return;
  //   }

  //   const videosToDownload = playlist.videos.filter((video) =>
  //     selectedVideos.has(video.id),
  //   );

  //   if (videosToDownload.length === 0) {
  //     window.alert('Please select at least one video.');
  //     return;
  //   }

  //   for (const video of videosToDownload) {
  //     try {
  //       const info = (await window.electron.ytdlp.getVideoInfo(
  //         video.url,
  //       )) as VideoInfo;

  //       const bestFormat = formatService.getCombinedFormats(info.formats)[0];

  //       if (!bestFormat) {
  //         continue;
  //       }

  //       await startDownload(info, bestFormat.id, outputFolder);
  //     } catch (error) {
  //       console.error(`Failed to retrieve information for ${video.title}`);
  //     }
  //   }
  // }

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

        {playlist && (
          <PlaylistPreview
            playlist={playlist}
            selectedVideos={selectedVideos}
            onToggle={togglePlaylistVideo}
          />
        )}

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

        {playlist && (
          <PlaylistFormatSelector
            value={playlistQuality}
            onChange={setPlaylistQuality}
          />
        )}

        <DownloadPanel
          outputFolder={outputFolder}
          onSelectFolder={handleSelectFolder}
        />

        <DownloadButton
          disabled={
            (!videoInfo && !playlist) ||
            (videoInfo && !selectedFormatId) ||
            !outputFolder
          }
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
