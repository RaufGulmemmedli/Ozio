'use client';

/**
 * SC2's "Qiymət cədvəlini yüklə" dropzone.
 *
 * Measured: white card, radius 28, padding 24, gap 20, a 64×64 `#FFD6E1` (= `brand-soft`) chip at
 * radius 20 with `image-up`, title 18/800, body 14/400 `ink2`, a 48-high dark "Şəkil seç" pill.
 *
 * The web variant is a **real file input** (the mock then fakes the OCR). Drag and drop is wired
 * to the same handler. The chosen image is handed straight to the mutation and never stored, so
 * nothing lingers after the upload resolves.
 */
import { useTranslations } from 'next-intl';
import { useRef, useState } from 'react';

import { cn } from '@/core/lib/cn';
import { Button } from '@/shared/ui';

import { ImageUp } from './icons';

export interface UploadDropzoneProps {
  onPick: (file: File) => void;
  busy?: boolean;
  disabled?: boolean;
  /**
   * The file input's `id`, so the empty state's "Şəkil seç" button can open the same picker
   * instead of this screen owning two inputs.
   */
  inputId?: string;
}

export function UploadDropzone({
  onPick,
  busy = false,
  disabled = false,
  inputId,
}: UploadDropzoneProps) {
  const t = useTranslations('school');
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [over, setOver] = useState(false);

  const take = (files: FileList | null) => {
    const file = files?.[0];
    if (file && file.type.startsWith('image/')) onPick(file);
  };

  return (
    <div
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
        'flex w-full flex-col gap-5 rounded-xl bg-surface p-6 sm:flex-row sm:items-center',
        'border-[1.5px] border-dashed transition-colors duration-[var(--oz-dur-fast)]',
        over ? 'border-brand bg-brand-soft/40' : 'border-line',
      )}
    >
      <span
        aria-hidden="true"
        className="flex size-16 shrink-0 items-center justify-center rounded-lg bg-brand-soft"
      >
        <ImageUp size={32} className="text-brand" />
      </span>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="text-body-l font-extrabold text-ink">{t('grades.upload.title')}</p>
        <p className="text-label text-ink2">{t('grades.upload.body')}</p>
      </div>

      <Button
        variant="primary"
        size="lg"
        loading={busy}
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
      >
        {t('grades.upload.action')}
      </Button>

      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept="image/*"
        className="sr-only"
        aria-label={t('grades.upload.action')}
        onChange={(event) => {
          take(event.target.files);
          // Lets the same file be picked twice in a row.
          event.target.value = '';
        }}
      />
    </div>
  );
}
