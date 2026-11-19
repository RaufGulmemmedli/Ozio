'use client';

/**
 * V7's capture zone — the two states the board draws for it:
 * `State · Çeki çərçivəyə sal` ("Kamera yoxdur? Çekin şəklini yüklə.") and, while a scan runs,
 * `State · Çek skan olunur…`.
 *
 * The capture itself:
 *  - `<input type="file" accept="image/*" capture="environment">` is the primary path. On a phone
 *    that opens the rear camera directly; on a desktop it is the file picker. It needs no
 *    permission prompt at all, which is why it is the default.
 *  - "Kameranı aç" is the **explicit user action** that asks for camera permission. Only then is
 *    `<CameraPreview>` imported — a dynamic import, so `getUserMedia`, the video element and the
 *    frame-grab code stay out of the app-shell bundle.
 *  - a denial (or any `getUserMedia` error) falls back to the file input and says so, rather than
 *    leaving a dead button.
 *
 * The picked image is downscaled in a canvas by `useReceiptScan` before it is handed over, and the
 * preview's object URL is revoked by that hook — including on unmount.
 */
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { useRef, useState } from 'react';

import { cn } from '@/core/lib/cn';
import { Camera, ScanLine } from '@/shared/lucide';
import { Button } from '@/shared/ui';

/**
 * Dynamically imported, `ssr: false`: the camera module touches `navigator.mediaDevices` and must
 * not reach the server bundle or the first paint.
 */
const CameraPreview = dynamic(() => import('./camera-preview').then((m) => m.CameraPreview), {
  ssr: false,
  loading: () => (
    <div
      aria-hidden="true"
      className="h-[260px] w-full animate-pulse rounded-xl bg-surface2"
    />
  ),
});

export interface ReceiptDropzoneProps {
  /** Hands over the raw capture; the caller downscales it. */
  onPick: (file: Blob) => void;
  /** `true` while the canvas work or the scan request is running. */
  busy?: boolean;
  /** The downscaled preview, when there is one. */
  previewUrl?: string | null;
}

export function ReceiptDropzone({ onPick, busy = false, previewUrl = null }: ReceiptDropzoneProps) {
  const t = useTranslations('viral');
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [over, setOver] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraDenied, setCameraDenied] = useState(false);

  const take = (files: FileList | null) => {
    const file = files?.[0];
    if (file && file.type.startsWith('image/')) onPick(file);
  };

  return (
    <section
      aria-labelledby="receipt-capture"
      onDragOver={(event) => {
        event.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(event) => {
        event.preventDefault();
        setOver(false);
        take(event.dataTransfer.files);
      }}
      className={cn(
        'flex w-full flex-col items-center gap-[14px] rounded-xl bg-surface p-8 text-center',
        'border-[1.5px] border-dashed transition-colors duration-[var(--oz-dur-fast)]',
        over ? 'border-brand bg-brand-soft/40' : 'border-line',
      )}
    >
      {cameraOpen ? (
        <CameraPreview
          onCapture={(blob) => {
            setCameraOpen(false);
            onPick(blob);
          }}
          onClose={() => setCameraOpen(false)}
          onDenied={() => {
            setCameraOpen(false);
            setCameraDenied(true);
          }}
        />
      ) : (
        <>
          <span
            aria-hidden="true"
            className="flex size-16 items-center justify-center rounded-pill bg-brand-soft"
          >
            <Camera size={28} className="text-brand" />
          </span>

          <h2 id="receipt-capture" className="text-body-l font-extrabold text-ink">
            {t('scan.prompt.title')}
          </h2>
          <p className="max-w-[320px] text-label text-ink2">
            {cameraDenied ? t('scan.prompt.denied') : t('scan.prompt.body')}
          </p>

          {previewUrl ? (
            // The downscaled copy, straight from the canvas, shown from a `blob:` object URL.
            // `next/image` is deliberately not used: its optimizer only handles remote or public
            // paths, and routing this through it would mean handing the capture to a server — the
            // one thing this screen must never do.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt={t('scan.preview.alt')}
              className="max-h-[220px] w-auto rounded-lg border border-line object-contain"
            />
          ) : null}

          <div className="flex flex-row flex-wrap items-center justify-center gap-3">
            <Button
              variant="primary"
              size="md"
              loading={busy}
              leadingIcon={<ScanLine size={18} aria-hidden="true" />}
              onClick={() => inputRef.current?.click()}
            >
              {t('scan.prompt.action')}
            </Button>

            {!cameraDenied ? (
              <Button
                variant="soft"
                size="md"
                disabled={busy}
                leadingIcon={<Camera size={18} aria-hidden="true" />}
                onClick={() => setCameraOpen(true)}
              >
                {t('scan.prompt.camera')}
              </Button>
            ) : null}
          </div>

          <p className="text-caption text-ink3">{t('scan.prompt.privacy')}</p>
        </>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        // The rear camera on a phone; the ordinary picker everywhere else.
        capture="environment"
        className="sr-only"
        aria-label={t('scan.prompt.action')}
        onChange={(event) => {
          take(event.target.files);
          event.target.value = '';
        }}
      />
    </section>
  );
}
