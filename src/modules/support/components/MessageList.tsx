'use client';

/**
 * `Messages` node: padding 24, gap 14, bottom-aligned, with the "Bu gün" day divider at 12/600.
 *
 * Accessibility:
 *  - the list is a `role="log"` with `aria-live="polite"`, so only **new** messages are announced,
 *    never the whole thread again;
 *  - auto-scroll sticks to the bottom only while the user is already near the bottom. Once they
 *    scroll up to read, nothing moves under them — a new message just arrives below.
 */
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';

import { cn } from '@/core/lib/cn';

export interface MessageListProps {
  label: string;
  children: ReactNode;
  /** Changes whenever the thread does, so the effect knows when to consider scrolling. */
  revision: string | number;
  className?: string;
}

/** Treat "within 120 px of the bottom" as "the user is following the conversation". */
const STICK_THRESHOLD_PX = 120;

export function MessageList({ label, children, revision, className }: MessageListProps) {
  const scroller = useRef<HTMLDivElement>(null);
  const [stick, setStick] = useState(true);

  // Keep the flag in sync with where the user actually is.
  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const onScroll = (): void => {
      const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
      setStick(distance <= STICK_THRESHOLD_PX);
    };
    onScroll();
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  // Runs before paint so a new message never shows mid-jump.
  useLayoutEffect(() => {
    const el = scroller.current;
    if (!el || !stick) return;
    el.scrollTop = el.scrollHeight;
    // `stick` is intentionally not re-read here: scrolling up must not trigger a scroll back down.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revision]);

  return (
    <div
      ref={scroller}
      className={cn('min-h-0 w-full flex-1 overflow-y-auto overscroll-contain px-5 py-6 md:px-6', className)}
    >
      <ul
        role="log"
        aria-live="polite"
        aria-relevant="additions"
        aria-label={label}
        className="m-0 flex w-full list-none flex-col justify-end gap-[14px] p-0"
      >
        {children}
      </ul>
    </div>
  );
}

/** `Day` node: centred 12/600 `ink3`. */
export function DayDivider({ label }: { label: string }) {
  return (
    <li className="flex w-full flex-row justify-center">
      <span className="text-micro font-semibold text-ink3">{label}</span>
    </li>
  );
}
