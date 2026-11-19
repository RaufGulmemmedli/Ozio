'use client';

/**
 * The modal wrapper that **dynamically** loads the camera code.
 *
 * `next/dynamic` with `ssr: false` keeps `getUserMedia`, the `<video>` element and the capture
 * canvas in their own chunk, fetched the first time the user presses "Kameradan çək" — the capture
 * screen itself stays free of them.
 */
import dynamic from 'next/dynamic';

import { Modal } from '@/shared/ui';

import type { CameraCaptureLabels } from './CameraCapture';

const CameraCapture = dynamic(() => import('./CameraCapture'), {
  ssr: false,
  // A one-line status while the chunk arrives: no spinner, no skeleton for a 3-element sheet.
  loading: () => null,
});

export interface CameraSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  closeLabel: string;
  labels: CameraCaptureLabels;
  onCapture: (frame: Blob) => void;
  onPickFile: () => void;
}

export function CameraSheet({
  open,
  onOpenChange,
  title,
  closeLabel,
  labels,
  onCapture,
  onPickFile,
}: CameraSheetProps) {
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      size="l"
      closeLabel={closeLabel}
    >
      {open ? (
        <CameraCapture
          labels={labels}
          onCapture={(frame) => {
            onOpenChange(false);
            onCapture(frame);
          }}
          onCancel={() => onOpenChange(false)}
          onPickFile={() => {
            onOpenChange(false);
            onPickFile();
          }}
        />
      ) : null}
    </Modal>
  );
}
