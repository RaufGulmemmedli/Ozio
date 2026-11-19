/**
 * Two-column information panel, shared by:
 *
 *  · `/delivery` delivery zone `f3wLT` — hours rows + district chips + the map
 *  · `/delivery` fees `Zbiim`         — "NÜMUNƏ MƏLUMAT" + three value rows
 *  · `/cashback` barcode panel        — the card number beside the steps
 *  · `/contact` working hours         — three day/time rows
 *
 * A `surface` panel at radius 36 with 32–40 padding; the left column carries the
 * kicker/title/text and the right one whatever visual the page passes in.
 */
import type { ReactNode } from 'react';

import { cn } from '@/core/lib/cn';

import { brandText, typeEyebrow } from './type';

export interface ValueRow {
  id: string;
  label: string;
  value: string;
}

export interface InfoPanelProps {
  eyebrow?: string;
  title?: string;
  text?: string;
  /** `label` / `value` rows with a 1 px `line` rule between them. */
  rows?: ValueRow[];
  /** Pills under the rows — the delivery districts. */
  chips?: string[];
  /** Right-hand slot: the schematic map, a barcode, a note. */
  aside?: ReactNode;
  /** Small print under the whole panel. */
  note?: string;
  /** `aria-labelledby` target. */
  id?: string;
  className?: string;
}

export function InfoPanel({
  eyebrow,
  title,
  text,
  rows,
  chips,
  aside,
  note,
  id,
  className,
}: InfoPanelProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-8 rounded-bento bg-surface p-6 md:p-8 min-[1200px]:flex-row min-[1200px]:gap-16 min-[1200px]:p-10',
        className,
      )}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-5">
        {eyebrow ? <p className={cn('m-0', brandText, typeEyebrow)}>{eyebrow}</p> : null}
        {title ? (
          <h2
            id={id}
            className="m-0 text-h3 font-extrabold tracking-[-0.02em] text-ink md:text-h2 md:leading-[1.15]"
          >
            {title}
          </h2>
        ) : null}
        {text ? <p className="m-0 text-body leading-6 text-ink2">{text}</p> : null}

        {rows && rows.length > 0 ? (
          <dl className="m-0 flex flex-col">
            {rows.map((row) => (
              <div
                key={row.id}
                className="flex items-center justify-between gap-4 border-b border-line py-4 last:border-0"
              >
                <dt className="m-0 text-body-sm text-ink2">{row.label}</dt>
                <dd className="m-0 text-body font-semibold text-ink tabular-nums">{row.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}

        {chips && chips.length > 0 ? (
          <ul className="m-0 flex list-none flex-wrap gap-2.5 p-0">
            {chips.map((chip) => (
              <li
                key={chip}
                className="inline-flex h-9 items-center rounded-pill bg-surface2 px-4 text-label font-medium text-ink"
              >
                {chip}
              </li>
            ))}
          </ul>
        ) : null}

        {note ? <p className="m-0 text-caption text-ink3">{note}</p> : null}
      </div>

      {aside ? <div className="min-w-0 min-[1200px]:w-[420px] min-[1200px]:shrink-0">{aside}</div> : null}
    </div>
  );
}
