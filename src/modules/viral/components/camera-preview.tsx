'use client';

/**
 * The optional `getUserMedia` preview for the receipt scanner.
 *
 * **This module is only ever reached through a dynamic import** (see `receipt-dropzone.tsx`), and
 * only after the user presses "Kameranı aç". That is the whole point:
 *
 *  - permission is requested on an **explicit user action**, never at mount or on route entry;
 *  - a denial calls `onDenied` so the caller can fall back to the file picker;
 *  - every track is stopped on unmount, so the camera light goes out when the screen does;
 *  - the grabbed frame is a canvas blob handed to the caller in memory. It is never uploaded
 *    anywhere: the caller downscales it and gives it to MSW, which answers inside this page.
 */
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useRef, useState } from 'react';

import { Camera, X } from '@/shared/lucide';
import { Button } from '@/shared/ui';

export interface CameraPreviewProps {
  onCapture: (blob: Blob) => void;
  onClose: () => void;
  /** Called when permission is refused or no camera is available. */
  onDenied: () => void;
}

export function CameraPreview({ onCapture, onClose, onDenied }: CameraPreviewProps) {
  const t = useTranslations('viral');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [ready, setReady] = useState(false);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => {
    let cancelled = false;

    const start = async () => {
      const media = typeof navigator === 'undefined' ? undefined : navigator.mediaDevices;
      if (!media?.getUserMedia) {
        onDenied();
        return;
      }
      try {
        const stream = await media.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => undefined);
        }
        setReady(true);
      } catch {
        // Denied, dismissed, or the device has no camera — the caller falls back to the picker.
        if (!cancelled) onDenied();
      }
    };

    void start();

    return () => {
      cancelled = true;
      stop();
    };
  }, [onDenied, stop]);

  const grab = () => {
    const video = videoRef.current;
    if (!video) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        stop();
        if (blob) onCapture(blob);
      },
      'image/jpeg',
      0.9,
    );
  };

  return (
    <div className="flex w-full flex-col items-center gap-4">
      <div className="relative w-full overflow-hidden rounded-xl bg-block">
        <video
          ref={videoRef}
          playsInline
          muted
          aria-label={t('scan.camera.label')}
          className="h-auto max-h-[320px] w-full object-cover"
        />
        {/* The drawn receipt frame guide. */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-6 rounded-lg border-2 border-dashed border-white/70"
        />
      </div>

      <div className="flex flex-row flex-wrap items-center justify-center gap-3">
        <Button
          variant="primary"
          size="md"
          disabled={!ready}
          leadingIcon={<Camera size={18} aria-hidden="true" />}
          onClick={grab}
        >
          {t('scan.camera.shoot')}
        </Button>
        <Button
          variant="soft"
          size="md"
          leadingIcon={<X size={18} aria-hidden="true" />}
          onClick={() => {
            stop();
            onClose();
          }}
        >
          {t('scan.camera.close')}
        </Button>
      </div>

      <p className="text-caption text-ink3">{t('scan.prompt.privacy')}</p>
    </div>
  );
}
