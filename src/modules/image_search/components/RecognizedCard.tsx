'use client';

/**
 * `Recognized` node: `surface` / `rounded-xl`, padding 20, row gap 24 — the captured frame at 140
 * and `rounded-lg`, the "AI tanıdı · {n}% əminlik" line, the query at 28/800, the label chips
 * (active = `cta`, the rest `bg`), and the Düzəlt / Yenidən çək actions.
 *
 * Tapping a chip re-searches with that label, which is what makes the **real** catalog query
 * change; the chips themselves are the only thing the mock produced.
 */
import { cn } from '@/core/lib/cn';
import { Button } from '@/shared/ui';
import { Camera, Pencil } from '@/shared/lucide';

import { labelPercent, type RecognizedLabel } from '../data/models/recognition';

/** The shell every variant of this card (loaded and skeleton) shares, so nothing shifts. */
export const RECOGNIZED_CARD_CLASS =
  'flex w-full flex-col items-start gap-5 rounded-xl bg-surface p-5 md:flex-row md:items-center md:gap-6';

export interface RecognizedCardProps {
  photoUrl: string | null;
  photoAlt: string;
  /** "AI tanıdı". */
  aiLabel: string;
  /** "{percent}% əminlik", or `null` for a hand-typed query. */
  confidenceLabel: string | null;
  /** The active query — a label name, or what the user typed. */
  query: string;
  /** "Sənin sorğun" when the query was typed by hand. */
  customLabel?: string | null;
  labels: readonly RecognizedLabel[];
  activeQuery: string | null;
  chipsLabel: string;
  /** `{name} · {percent}%`, already formatted by the caller. */
  formatChip: (label: RecognizedLabel) => string;
  onSelectLabel: (label: RecognizedLabel) => void;
  editLabel: string;
  onEdit: () => void;
  retakeLabel: string;
  onRetake: () => void;
}

export function RecognizedCard({
  photoUrl,
  photoAlt,
  aiLabel,
  confidenceLabel,
  query,
  customLabel,
  labels,
  activeQuery,
  chipsLabel,
  formatChip,
  onSelectLabel,
  editLabel,
  onEdit,
  retakeLabel,
  onRetake,
}: RecognizedCardProps) {
  return (
    <section className={RECOGNIZED_CARD_CLASS} aria-label={aiLabel}>
      <div className="size-[120px] shrink-0 overflow-hidden rounded-lg bg-surface2 md:size-[140px]">
        {photoUrl ? (
          // A local object URL — the frame never left the browser, so this is not a CDN image.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoUrl} alt={photoAlt} className="size-full object-cover" draggable={false} />
        ) : null}
      </div>

      <div className="flex min-w-0 flex-1 flex-col items-start gap-2.5">
        <p className="m-0 flex flex-row flex-wrap items-center gap-2.5">
          <span className="text-caption font-extrabold text-violet">
            {customLabel ?? aiLabel}
          </span>
          {confidenceLabel ? (
            <span className="text-caption text-ink3">{confidenceLabel}</span>
          ) : null}
        </p>

        <p className="m-0 text-h3 font-extrabold text-ink md:text-[28px]">{query}</p>

        {labels.length > 0 ? (
          <ul
            aria-label={chipsLabel}
            className="m-0 flex list-none flex-row flex-wrap gap-2 p-0"
          >
            {labels.map((label) => {
              const active = activeQuery === label.name;
              return (
                <li key={`${label.name}-${labelPercent(label)}`}>
                  <button
                    type="button"
                    aria-pressed={active}
                    onClick={() => onSelectLabel(label)}
                    className={cn(
                      'flex h-9 min-h-9 items-center rounded-pill px-4 text-caption font-bold',
                      'transition-colors duration-[var(--oz-dur-fast)] ease-[var(--ease-out)]',
                      active
                        ? 'bg-cta text-on-cta'
                        : 'bg-bg text-ink hover:bg-surface2',
                    )}
                  >
                    {formatChip(label)}
                  </button>
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>

      <div className="flex w-full shrink-0 flex-col gap-2.5 sm:w-auto sm:flex-row md:flex-col">
        <Button
          type="button"
          variant="white"
          size="xl"
          leadingIcon={<Pencil size={18} aria-hidden="true" />}
          onClick={onEdit}
        >
          {editLabel}
        </Button>
        <Button
          type="button"
          variant="white"
          size="xl"
          leadingIcon={<Camera size={18} aria-hidden="true" />}
          onClick={onRetake}
        >
          {retakeLabel}
        </Button>
      </div>
    </section>
  );
}
