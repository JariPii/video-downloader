'use client';

import { DownloadProgress } from '@/electron/types/DownloadProgress';
import { DownloadJob } from '@/shared/models/DownloadJob';
import { useEffect, useState } from 'react';

export function useDownloadQueue() {
  const [jobs, setJobs] = useState<DownloadJob[]>([]);

  function addJob(job: DownloadJob) {
    console.log('QUEUE ADD', job.id);
    setJobs((previous) => [...previous, job]);
  }

  function removeJob(id: string) {
    setJobs((previous) => previous.filter((job) => job.id !== id));
  }

  function updateProgress(id: string, progress: DownloadProgress) {
    setJobs((previous) =>
      previous.map((job) => {
        if (job.id !== id) {
          return job;
        }

        return {
          ...job,
          status: 'downloading',
          progress,
        };
      }),
    );
  }

  function setCompleted(id: string) {
    setJobs((previous) =>
      previous.map((job) => {
        if (job.id !== id) {
          return job;
        }

        return {
          ...job,
          status: 'completed',
          progress: {
            percent: 100,
            speed: '',
            eta: '',
          },
        };
      }),
    );
  }

  function setCancelled(id: string) {
    setJobs((previous) =>
      previous.map((job) => {
        if (job.id !== id) {
          return job;
        }

        return {
          ...job,
          status: 'cancelled',
        };
      }),
    );
  }

  function setFailed(id: string) {
    setJobs((previous) =>
      previous.map((job) => {
        if (job.id !== id) {
          return job;
        }

        return {
          ...job,
          status: 'failed',
        };
      }),
    );
  }

  useEffect(() => {
    const unsubscribeProgress = window.electron.ytdlp.onProgress((event) => {
      updateProgress(event.downloadId, {
        percent: event.percent,
        speed: event.speed,
        eta: event.eta,
      });
    });

    const unsubscribeCompleted = window.electron.ytdlp.onCompleted((event) => {
      setCompleted(event.downloadId);
    });

    const unsubscribeCancelled = window.electron.ytdlp.onCancelled((event) => {
      setCancelled(event.downloadId);
    });

    const unsubscribeFailed = window.electron.ytdlp.onFailed((event) => {
      setFailed(event.downloadId);
    });

    return () => {
      unsubscribeProgress();
      unsubscribeCompleted();
      unsubscribeCancelled();
      unsubscribeFailed();
    };
  }, []);

  //   function updateJob(id: string, updater: (job: DownloadJob) => DownloadJob) {
  //     setJobs((previous) =>
  //       previous.map((job) => (job.id === id ? updater(job) : job)),
  //     );
  //   }

  return {
    jobs,
    addJob,
    // updateJob,
    removeJob,
    updateProgress,
    setCompleted,
    setCancelled,
    setFailed,
  };
}
