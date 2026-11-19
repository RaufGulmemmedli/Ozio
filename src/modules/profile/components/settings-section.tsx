'use client';

/**
 * `Section · Dil` / `Section · Mövzu` / … from `app-parametrler.html`: a 220-wide info column
 * (title 18/800, desc 13/400/20) and a controls column, padding-block 28, gap 32, siblings split
 * by a 1px `line`. Below 768 the two columns stack.
 *
 * The whole settings card is `surface` / r28 with padding-inline 32.
 */
import type { ReactNode } from 'react';

import { cn } from '@/core/lib/cn';

export interface SettingsSectionProps {
  title: string;
  description?: ReactNode;
  /** Heading level — the page's `h1` is the page title, so these are `h2` by default. */
  headingAs?: 'h2' | 'h3';
  children: ReactNode;
  className?: string;
}

export function SettingsSection({
  title,
  description,
  headingAs: Heading = 'h2',
  children,
  className,
}: SettingsSectionProps) {
  return (
    <section
      className={cn(
        'flex w-full flex-col gap-5 py-6 md:flex-row md:gap-8 md:py-7',
        className,
      )}
    >
      <div className="flex shrink-0 flex-col gap-1.5 md:w-[220px]">
        <Heading className="m-0 text-[18px] font-extrabold leading-tight text-ink">
          {title}
        </Heading>
        {description ? (
          <p className="m-0 text-caption font-normal leading-5 text-ink2">{description}</p>
        ) : null}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-3">{children}</div>
    </section>
  );
}

/** The card the sections live in; sections are divided by a 1px `line`. */
export function SettingsCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex w-full min-w-0 flex-col rounded-xl bg-surface px-5 py-2 md:px-8',
        '[&>section+section]:border-t [&>section+section]:border-line',
        className,
      )}
    >
      {children}
    </div>
  );
}
