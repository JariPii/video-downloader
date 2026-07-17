'use client';

import { Button } from '@/components/ui/button';

interface DownloadPanelProps {
  outputFolder: string;
  onSelectFolder(): void;
}

const DownloadPanel = ({
  outputFolder,
  onSelectFolder,
}: DownloadPanelProps) => {
  return (
    <div>
      <Button onClick={onSelectFolder}>Choose folder</Button>
      <p>{outputFolder || 'No folder selected'}</p>
    </div>
  );
};

export default DownloadPanel;
