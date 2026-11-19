'use client';

/**
 * The page chrome every rewards screen shares (`screens/mock-rewards-savings.md` "Shared page
 * chrome"): breadcrumb "Kart və bonus / <page>", the 36/800 title, a 15/400 subtitle and the yellow
 * "Demo rejim" pill in the actions row.
 *
 * `<AppShell>` already owns `<main>` and the horizontal padding, so this only adds the 32px content
 * gap and the 8px top inset from the export.
 *
 * The non-dismissible `<DemoBanner>` sits above the header — BUILD-CONTRACT "Mock modules" asks for
 * it on every mock screen, and the design's pill is its compact form inside the header.
 */
import type { ReactNode } from 'react';

import { cn } from '@/core/lib/cn';
import { Breadcrumbs, type BreadcrumbItem } from '@/shared/ui';
import { DemoBanner } from '@/shared/states';

import { DemoPill } from './demo-pill';

export interface RewardsPageProps {
  crumbs: BreadcrumbItem[];
  crumbsLabel: string;
  title: string;
  subtitle: string;
  /** Localized module name for the demo banner body. */
  demoModule: string;
  /** A 48-high dark button on the right of the header (only the savings-jar screens use it). */
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function RewardsPage({
  crumbs,
  crumbsLabel,
  title,
  subtitle,
  demoModule,
  action,
  children,
  className,
}: RewardsPageProps) {
  return (
    <div className={cn('flex w-full flex-col gap-8 pt-2', className)}>
      <DemoBanner module={demoModule} className="print:hidden" />

      <div className="flex w-full flex-col items-start gap-4 pt-4 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 flex-col gap-1.5">
          <Breadcrumbs items={crumbs} label={crumbsLabel} className="print:hidden" />
          <h1 className="m-0 text-[28px] font-extrabold leading-[1.15] tracking-[-0.02em] text-ink md:text-h2 lg:text-h1-app">
            {title}
          </h1>
          <p className="m-0 text-body-sm text-ink2">{subtitle}</p>
        </div>

        <div className="flex shrink-0 flex-row items-center gap-3">
          <DemoPill className="print:hidden" />
          {action}
        </div>
      </div>

      {children}
    </div>
  );
}
