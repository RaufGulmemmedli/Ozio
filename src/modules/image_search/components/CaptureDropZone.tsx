'use client';

/**
 * `Drop Zone` node: `surface` / `rounded-bento`, 460 tall on desktop, padding 40, centred column at
 * gap 20 — disc 96 (`brand-soft`), 26/800 title, 15/400 `ink2` hint, then the two 52-high buttons.
 *
 * Capture is pure browser: a hidden `<input type="file" accept="image/*" capture="environment">`
 * plus drag-and-drop and paste. No backend is involved, and nothing is uploaded.
 *
 * TODO(core): `@/shared/lucide` carries no `Upload` / `ImageUp` glyph, and the barrel is the only
 * place `lucide-react` may be imported — so the export's upload mark is the `Download` glyph turned
 * 180°, which is the same shape.
 */
import { useCallback, useEffect, useId, useRef, useState, type DragEvent } from 'react';

import { cn } from '@/core/lib/cn';
import { Button } from '@/shared/ui';
import { Camera, Download } from '@/shared/lucide';

import { ACCEPT_ATTRIBUTE } from '../data/image-frame';

export interface CaptureDropZoneProps {
  title: string;
  hint: string;
  dropActiveLabel: string;
  pickLabel: string;
  cameraLabel: string;
  /** Disabled while a frame is being validated / downscaled. */
  busy?: boolean;
  /** `undefined` hides the camera button (no `getUserMedia` on this device). */
  onCamera?: () => void;
  onFile: (file: File) => void;
  /** Already-localized validation message, rendered with `role="alert"`. */
  error?: string | null;
  /**
   * Hands the caller a function that opens the file dialog, so the camera sheet's
   * "pick a photo instead" fallback can reach this hidden input.
   */
  onRegisterPicker?: (open: () => void) => void;
}

export function CaptureDropZone({
  title,
  hint,
  dropActiveLabel,
  pickLabel,
  cameraLabel,
  busy = false,
  onCamera,
  onFile,
  error,
  onRegisterPicker,
}: CaptureDropZoneProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const openPicker = useCallback(() => inputRef.current?.click(), []);

  useEffect(() => {
    onRegisterPicker?.(openPicker);
  }, [onRegisterPicker, openPicker]);

  const takeFirst = useCallback(
    (files: FileList | null | undefined) => {
      const file = files?.[0];
      if (file) onFile(file);
    },
    [onFile],
  );

  const onDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragging(false);
      takeFirst(e.dataTransfer?.files);
    },
    [takeFirst],
  );

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      onPaste={(e) => takeFirst(e.clipboardData?.files)}
      className={cn(
        'flex min-w-0 flex-1 flex-col items-center justify-center gap-5 rounded-bento bg-surface p-7 text-center md:p-10',
        'min-h-[360px] transition-colors duration-[var(--oz-dur-base)] ease-[var(--ease-out)] md:min-h-[460px]',
        dragging && 'bg-brand-soft outline-2 outline-offset-[-2px] outline-dashed outline-brand',
      )}
    >
      <span
        aria-hidden="true"
        className="flex size-24 shrink-0 items-center justify-center rounded-pill bg-brand-soft text-brand"
      >
        <Download size={44} className="rotate-180" />
      </span>

      <p className="m-0 text-h3 font-extrabold text-ink md:text-[26px]">
        {dragging ? dropActiveLabel : title}
      </p>
      <p className="m-0 max-w-[420px] text-body-sm text-ink2">{hint}</p>

      <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
        <Button
          type="button"
          variant="primary"
          size="xl"
          loading={busy}
          leadingIcon={<Download size={18} className="rotate-180" aria-hidden="true" />}
          onClick={openPicker}
        >
          {pickLabel}
        </Button>
        {onCamera ? (
          <Button
            type="button"
            variant="white"
            size="xl"
            disabled={busy}
            leadingIcon={<Camera size={18} aria-hidden="true" />}
            onClick={onCamera}
          >
            {cameraLabel}
          </Button>
        ) : null}
      </div>

      {error ? (
        <p role="alert" className="m-0 text-body-sm font-semibold text-brand">
          {error}
        </p>
      ) : null}

      {/*
        `capture="environment"` makes a phone open the rear camera straight from the picker; on a
        desktop it is ignored and the normal file dialog appears. The input is the only thing that
        reads the user's files, and its value is cleared after every pick.
      */}
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={ACCEPT_ATTRIBUTE}
        capture="environment"
        className="sr-only"
        aria-label={pickLabel}
        onChange={(e) => {
          takeFirst(e.target.files);
          e.target.value = '';
        }}
      />
    </div>
  );
}
