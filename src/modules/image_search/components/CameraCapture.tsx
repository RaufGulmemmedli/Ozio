'use client';

/**
 * The live-camera sheet. **Loaded with `next/dynamic` only** (see `CameraCaptureLazy`), so
 * `getUserMedia`, the `<video>` plumbing and the capture canvas stay out of the app-shell bundle.
 *
 * Rules this component keeps:
 *  - permission is requested **only** after the user opened this sheet by pressing "Kameradan çək";
 *  - a denial is a normal state, not an error — the sheet explains it and the user falls back to the
 *    file picker, which is still on the screen behind;
 *  - every track is stopped and the stream dropped on unmount, so the camera light goes out;
 *  - the shot frame is handed to the caller as a `Blob` and never stored anywhere.
 */
import { useCallback, useEffect, useRef, useState } from 'react';

import { Button } from '@/shared/ui';
import { Camera, CircleAlert } from '@/shared/lucide';

export type CameraState = 'starting' | 'live' | 'denied' | 'unavailable';

export interface CameraCaptureLabels {
  starting: string;
  shoot: string;
  cancel: string;
  deniedTitle: string;
  deniedBody: string;
  unavailableTitle: string;
  unavailableBody: string;
  pickInstead: string;
  videoLabel: string;
}

export interface CameraCaptureProps {
  labels: CameraCaptureLabels;
  onCapture: (frame: Blob) => void;
  onCancel: () => void;
  /** Falls back to the file picker. */
  onPickFile: () => void;
}

export function CameraCapture({ labels, onCapture, onCancel, onPickFile }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [state, setState] = useState<CameraState>('starting');
  const [shooting, setShooting] = useState(false);

  const stop = useCallback(() => {
    const stream = streamRef.current;
    streamRef.current = null;
    if (!stream) return;
    for (const track of stream.getTracks()) track.stop();
  }, []);

  useEffect(() => {
    let cancelled = false;

    const start = async (): Promise<void> => {
      const media = typeof navigator !== 'undefined' ? navigator.mediaDevices : undefined;
      if (!media || typeof media.getUserMedia !== 'function') {
        setState('unavailable');
        return;
      }
      try {
        const stream = await media.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        });
        if (cancelled) {
          for (const track of stream.getTracks()) track.stop();
          return;
        }
        streamRef.current = stream;
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          try {
            await video.play();
          } catch {
            // Autoplay can be refused; the user still sees the frame once it is ready.
          }
        }
        setState('live');
      } catch (e) {
        if (cancelled) return;
        const name = (e as { name?: string } | null)?.name ?? '';
        setState(name === 'NotFoundError' || name === 'OverconstrainedError' ? 'unavailable' : 'denied');
      }
    };

    void start();
    return () => {
      cancelled = true;
      stop();
    };
  }, [stop]);

  const shoot = useCallback(() => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0) return;
    setShooting(true);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => {
          setShooting(false);
          canvas.width = 0;
          canvas.height = 0;
          if (blob) {
            stop();
            onCapture(blob);
          }
        },
        'image/jpeg',
        0.9,
      );
    } catch {
      setShooting(false);
    }
  }, [onCapture, stop]);

  if (state === 'denied' || state === 'unavailable') {
    const denied = state === 'denied';
    return (
      <div role="alert" className="flex flex-col items-center gap-4 py-4 text-center">
        <span
          aria-hidden="true"
          className="flex size-[88px] items-center justify-center rounded-pill bg-brand-soft text-brand"
        >
          <CircleAlert size={40} />
        </span>
        <p className="m-0 text-h4 font-extrabold text-ink">
          {denied ? labels.deniedTitle : labels.unavailableTitle}
        </p>
        <p className="m-0 max-w-[420px] text-body text-ink2">
          {denied ? labels.deniedBody : labels.unavailableBody}
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button type="button" variant="primary" size="xl" onClick={onPickFile}>
            {labels.pickInstead}
          </Button>
          <Button type="button" variant="soft" size="xl" onClick={onCancel}>
            {labels.cancel}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="relative w-full overflow-hidden rounded-card bg-block">
        <video
          ref={videoRef}
          aria-label={labels.videoLabel}
          playsInline
          muted
          className="aspect-[4/3] w-full object-cover"
        />
        {state === 'starting' ? (
          <p
            role="status"
            className="absolute inset-0 m-0 grid place-items-center text-body-sm font-semibold text-on-block"
          >
            {labels.starting}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <Button type="button" variant="soft" size="xl" onClick={onCancel}>
          {labels.cancel}
        </Button>
        <Button
          type="button"
          variant="primary"
          size="xl"
          loading={shooting}
          disabled={state !== 'live'}
          leadingIcon={<Camera size={18} aria-hidden="true" />}
          onClick={shoot}
        >
          {labels.shoot}
        </Button>
      </div>
    </div>
  );
}

export default CameraCapture;
