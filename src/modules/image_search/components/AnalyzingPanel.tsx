'use client';

/**
 * `image-search-analyzing.html` — the **designed progress treatment**, not a spinner:
 * `Photo Panel` (`surface` / `rounded-bento`, padding 24) holding the captured frame at
 * `rounded-card` with a travelling scan line and four corner brackets, next to the `Progress` card
 * (`surface` / `rounded-xl`, padding 28, gap 18) with the two-step list and "Ləğv et".
 *
 * `role="status"` + `aria-busy` so the state is announced once; the only moving parts are the scan
 * line and the step discs, both of which stop under `prefers-reduced-motion`.
 */
import { cn } from '@/core/lib/cn';
import { Button } from '@/shared/ui';
import { Check, Search } from '@/shared/lucide';

import styles from '../image_search.module.css';

export type StepState = 'done' | 'running' | 'waiting';

export interface AnalyzingPanelProps {
  photoUrl: string | null;
  photoAlt: string;
  heading: string;
  recognize: { title: string; body: string; state: StepState };
  search: { title: string; body: string; state: StepState };
  cancelLabel: string;
  onCancel: () => void;
  /** Visually-hidden announcement, e.g. "Şəkil analiz olunur". */
  busyLabel: string;
}

const DISC: Record<StepState, string> = {
  done: 'bg-success-soft text-success',
  running: 'bg-brand-soft text-brand',
  waiting: 'bg-surface2 text-ink3',
};

function Step({
  title,
  body,
  state,
}: {
  title: string;
  body: string;
  state: StepState;
}) {
  return (
    <li className="flex w-full flex-row items-center gap-[14px]">
      <span
        aria-hidden="true"
        className={cn(
          'flex size-10 shrink-0 items-center justify-center rounded-pill',
          DISC[state],
        )}
      >
        {state === 'done' ? <Check size={20} /> : <Search size={20} />}
      </span>
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="text-body-sm font-bold text-ink">{title}</span>
        <span className="text-caption text-ink2">{body}</span>
      </span>
    </li>
  );
}

export function AnalyzingPanel({
  photoUrl,
  photoAlt,
  heading,
  recognize,
  search,
  cancelLabel,
  onCancel,
  busyLabel,
}: AnalyzingPanelProps) {
  const corner = 'absolute size-8 rounded-sm border-brand';

  return (
    <div
      role="status"
      aria-busy="true"
      className="flex w-full flex-col items-start gap-6 lg:flex-row"
    >
      <span className="sr-only">{busyLabel}</span>

      <div className="flex w-full min-w-0 flex-1 flex-row justify-center rounded-bento bg-surface p-4 md:p-6">
        <div className="relative w-full max-w-[520px] overflow-hidden rounded-card bg-surface2">
          <div className="aspect-[520/400] w-full">
            {photoUrl ? (
              // The frame is a local object URL: it never travelled anywhere, so no <ProductImage>.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photoUrl}
                alt={photoAlt}
                className="size-full object-cover"
                draggable={false}
              />
            ) : null}
          </div>
          <span aria-hidden="true" className={styles.scanVeil} />
          <span aria-hidden="true" className={styles.scanLine} />
          <span aria-hidden="true" className={cn(corner, 'left-4 top-4 border-l-2 border-t-2')} />
          <span aria-hidden="true" className={cn(corner, 'right-4 top-4 border-r-2 border-t-2')} />
          <span aria-hidden="true" className={cn(corner, 'bottom-4 left-4 border-b-2 border-l-2')} />
          <span aria-hidden="true" className={cn(corner, 'bottom-4 right-4 border-b-2 border-r-2')} />
        </div>
      </div>

      <div className="flex w-full shrink-0 flex-col items-start gap-[18px] rounded-xl bg-surface p-7 lg:w-[380px]">
        <h2 className="m-0 text-h4 font-bold text-ink">{heading}</h2>
        <ul className="m-0 flex w-full list-none flex-col gap-[18px] p-0">
          <Step {...recognize} />
          <Step {...search} />
        </ul>
        <Button type="button" variant="white" size="xl" onClick={onCancel}>
          {cancelLabel}
        </Button>
      </div>
    </div>
  );
}
