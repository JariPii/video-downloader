'use client';

import { Button } from '@/components/ui/button';

interface DownloadButtonProps {
  disabled: boolean;
  onClick(): void;
}

const DownloadButton = ({ disabled, onClick }: DownloadButtonProps) => {
  return (
    <Button onClick={onClick} disabled={disabled}>
      Start download
    </Button>
  );
};

export default DownloadButton;
