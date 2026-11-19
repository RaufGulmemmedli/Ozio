'use client';

/**
 * `Chat Head` node: 48 `brand` avatar with the headset glyph, "Ozio dəstək" at 17/800 and the
 * status row (8 px `success` dot + 13/400 `ink3`), padding 18/24 over a hairline.
 *
 * The status is the design's copy ("Onlayn · ~2 dəq cavab"); the "Demo rejim" notice at the top of
 * the page is what tells the user it is a scripted agent, not a person.
 */
import type { ReactNode } from 'react';

import { Headphones } from '@/shared/lucide';

export interface ChatHeaderProps {
  name: string;
  status: string;
  /** Trailing slot — e.g. the "Söhbəti təmizlə" action. */
  actions?: ReactNode;
}

export function ChatHeader({ name, status, actions }: ChatHeaderProps) {
  return (
    <header className="flex w-full shrink-0 flex-row items-center gap-[14px] border-b border-line px-5 py-4 md:px-6">
      <span
        aria-hidden="true"
        className="flex size-12 shrink-0 items-center justify-center rounded-pill bg-brand text-white"
      >
        <Headphones size={24} />
      </span>
      <span className="flex min-w-0 flex-col gap-[3px]">
        <span className="truncate text-body-l font-extrabold text-ink">{name}</span>
        <span className="flex flex-row items-center gap-1.5">
          <span aria-hidden="true" className="size-2 shrink-0 rounded-pill bg-success" />
          <span className="truncate text-caption text-ink3">{status}</span>
        </span>
      </span>
      {actions ? <span className="ml-auto shrink-0">{actions}</span> : null}
    </header>
  );
}
