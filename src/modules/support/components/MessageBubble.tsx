'use client';

/**
 * `Msg Mine` / `Msg Support` nodes: `brand` + white text for the user, `bg` + `ink` for the agent,
 * padding 12/16, gap 4, text 15/400 at line-height 21 and max 420 wide, with the 11/400 time line.
 *
 * The export draws radius 22, which is between `rounded-lg` (20) and `rounded-card` (24); the token
 * wins (BUILD-CONTRACT rule 1), so these are `rounded-card`.
 */
import { cn } from '@/core/lib/cn';

import type { SupportAuthor } from '../data/models/support-message';

export interface MessageBubbleProps {
  from: SupportAuthor;
  text: string;
  /** `HH:mm`, already formatted by the caller through `useFormat().date`. */
  time: string;
  /** Screen-reader prefix, e.g. "Sən" / "Ozio dəstək". */
  authorLabel: string;
  /** "Saat 14:20" — the time, spelled out for assistive tech. */
  timeLabel: string;
}

export function MessageBubble({ from, text, time, authorLabel, timeLabel }: MessageBubbleProps) {
  const mine = from === 'me';

  return (
    <li className={cn('flex w-full flex-row', mine ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'flex w-fit max-w-[min(420px,85%)] flex-col gap-1 rounded-card px-4 py-3',
          mine ? 'bg-brand text-white' : 'bg-bg text-ink',
        )}
      >
        <span className="sr-only">{authorLabel}</span>
        <p className="m-0 whitespace-pre-wrap break-words text-body-sm leading-[21px]">{text}</p>
        <span
          className={cn('text-nano', mine ? 'text-white/70' : 'text-ink3')}
          aria-label={timeLabel}
        >
          {time}
        </span>
      </div>
    </li>
  );
}

/** The agent's typing indicator — three dots, no spinner (spinners live inside buttons only). */
export function TypingBubble({ label }: { label: string }) {
  return (
    <li className="flex w-full flex-row justify-start">
      <div className="flex w-fit flex-row items-center gap-1.5 rounded-card bg-bg px-4 py-3">
        <span className="sr-only">{label}</span>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            aria-hidden="true"
            className="size-2 animate-pulse rounded-pill bg-ink3"
            style={{ animationDelay: `${i * 160}ms` }}
          />
        ))}
      </div>
    </li>
  );
}
