'use client';

/**
 * Page chrome for the two savings-jar screens — the same `Page Header` the export draws
 * (breadcrumb / 36-800 title / 15-400 subtitle / yellow "Demo rejim" pill / optional dark action),
 * plus the non-dismissible `<DemoBanner module="savings_jar">` BUILD-CONTRACT asks for.
 *
 * `<AppShell>` owns `<main>` and the horizontal padding, so this only adds the 32px content gap.
 */
import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';

import { cn } from '@/core/lib/cn';
import { FlaskConical } from '@/shared/lucide';
import { DemoBanner } from '@/shared/states';
import { Breadcrumbs, type BreadcrumbItem } from '@/shared/ui';

export interface JarPageProps {
  crumbs: BreadcrumbItem[];
  crumbsLabel: string;
  title: string;
  subtitle: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

/** The export's yellow pill. `<DemoBanner compact>` uses the quieter `warn-soft` tint. */
function DemoPill() {
  const t = useTranslations('common');
  return (
    <span
      aria-hidden="true"
      className="inline-flex w-fit shrink-0 flex-row items-center gap-2 rounded-pill bg-yellow px-[14px] py-2 text-caption font-bold text-on-yellow"
    >
      <FlaskConical size={16} className="shrink-0" />
      {t('demo.title')}
    </span>
  );
}

export function JarPage({
  crumbs,
  crumbsLabel,
  title,
  subtitle,
  action,
  children,
  className,
}: JarPageProps) {
  const t = useTranslations('savings_jar');

  return (
    <div className={cn('flex w-full flex-col gap-8 pt-2', className)}>
      <DemoBanner module={t('demo.module')} />

      <div className="flex w-full flex-col items-start gap-4 pt-4 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 flex-col gap-1.5">
          <Breadcrumbs items={crumbs} label={crumbsLabel} />
          <h1 className="m-0 text-[28px] font-extrabold leading-[1.15] tracking-[-0.02em] text-ink md:text-h2 lg:text-h1-app">
            {title}
          </h1>
          <p className="m-0 text-body-sm text-ink2">{subtitle}</p>
        </div>

        <div className="flex shrink-0 flex-row items-center gap-3">
          <DemoPill />
          {action}
        </div>
      </div>

      {children}
    </div>
  );
}
