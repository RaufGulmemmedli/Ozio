'use client';

/**
 * One method row on `/topup` (`topup-method.html` → `Method Bank kartı ilə` / `Method Kassada`).
 *
 * Measured: `surface` card, radius 28, padding 28, gap 20; a 64 icon disc (radius 999,
 * `brand-soft` for the card method, `sky-soft` for the till), title 20/700 with an optional
 * `yellow` tag pill (padding 4/10, 12/700), body 14/400/20 `ink2`, and a 22 chevron in `ink3`.
 *
 * The whole row is the link, so the hit target is the card — not just the title.
 */
import type { ReactNode } from 'react';

import { Link } from '@/core/i18n/navigation';
import { cn } from '@/core/lib/cn';
import { ChevronRight } from '@/shared/lucide';

export type MethodTone = 'brand' | 'sky';

const DISC_TONE: Record<MethodTone, string> = {
  brand: 'bg-brand-soft text-brand',
  sky: 'bg-sky-soft text-sky',
};

export interface TopupMethodRowProps {
  href: string;
  icon: ReactNode;
  tone: MethodTone;
  title: string;
  /** The "Dərhal" pill. */
  tag?: string;
  body: string;
  className?: string;
}

export function TopupMethodRow({
  href,
  icon,
  tone,
  title,
  tag,
  body,
  className,
}: TopupMethodRowProps) {
  return (
    <Link
      href={href}
      className={cn(
        'group flex w-full shrink-0 flex-row items-center gap-5 rounded-xl bg-surface p-5 md:p-7',
        'transition-[transform,background-color] duration-[var(--oz-dur-base)] ease-out',
        'hover:-translate-y-0.5 active:scale-[.995]',
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'flex size-14 shrink-0 items-center justify-center rounded-pill md:size-16',
          DISC_TONE[tone],
        )}
      >
        {icon}
      </span>

      <span className="flex min-w-0 flex-1 flex-col items-start gap-1.5">
        <span className="flex flex-row items-center gap-[10px]">
          <span className="text-body-l font-bold text-ink md:text-h4">{title}</span>
          {tag ? (
            <span className="shrink-0 rounded-pill bg-yellow px-[10px] py-1 text-micro font-bold text-on-yellow">
              {tag}
            </span>
          ) : null}
        </span>
        <span className="text-label leading-5 text-ink2">{body}</span>
      </span>

      <ChevronRight
        aria-hidden="true"
        size={22}
        className="shrink-0 text-ink3 transition-colors group-hover:text-ink"
      />
    </Link>
  );
}
