'use client';

/**
 * `Heading` node: back link (14/500 `ink3`, `arrow-left` 16), `Title Row` = h1 36/800 + the AI
 * pill at gap 14, then the 16/400 `ink2` subtitle.
 *
 * `<PageHeader>` cannot place a badge **inside** the title row, which is what the export does, so
 * this mirrors the export instead of wrapping the shared header. One `h1` per page.
 */
import type { ReactNode } from 'react';
import { Link } from '@/core/i18n';
import { ArrowLeft } from '@/shared/lucide';

import { AiTag } from './AiTag';

export interface ImageSearchHeadingProps {
  backHref: string;
  backLabel: string;
  title: string;
  aiLabel: string;
  subtitle?: ReactNode;
  headingId?: string;
}

export function ImageSearchHeading({
  backHref,
  backLabel,
  title,
  aiLabel,
  subtitle,
  headingId,
}: ImageSearchHeadingProps) {
  return (
    <div className="flex w-full shrink-0 flex-col gap-2.5">
      <Link
        href={backHref}
        className="flex w-fit min-h-11 items-center gap-2 text-label font-medium text-ink3 hover:text-ink md:min-h-0"
      >
        <ArrowLeft aria-hidden="true" size={16} className="shrink-0" />
        {backLabel}
      </Link>

      <div className="flex w-full flex-row flex-wrap items-center gap-[14px]">
        <h1
          id={headingId}
          className="m-0 text-[28px] font-extrabold leading-[1.2] tracking-[-0.02em] text-ink md:text-h2 lg:text-h1-app"
        >
          {title}
        </h1>
        <AiTag label={aiLabel} />
      </div>

      {subtitle ? (
        <p className="m-0 max-w-[720px] text-body leading-[22px] text-ink2">{subtitle}</p>
      ) : null}
    </div>
  );
}
