'use client';

/**
 * The chrome every `courier_plus` screen repeats, in the drawn order:
 * `Demo Banner` → `Page Header` (crumb 13/600 `ink3` + H1 + subtitle) → the screen's sections.
 *
 * It renders a **fragment**, so the sections stay direct children of `<AppShell>`'s content
 * column and inherit its 32px gap — the export's `Content` gap.
 *
 * The demo banner is on every state, loading and error included (screens/mock-parcel-courier.md
 * "Global rules"), which is why it lives here and not inside a success branch.
 */
import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';

import { Link } from '@/core/i18n/navigation';
import { DemoBanner } from '@/shared/states';
import { PageHeader } from '@/shared/layout';

export interface CpCrumb {
  label: string;
  href?: string;
}

export interface CpScreenProps {
  crumbs: readonly CpCrumb[];
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
}

export function CpScreen({ crumbs, title, subtitle, actions, children }: CpScreenProps) {
  const t = useTranslations('courier_plus');

  return (
    <>
      <DemoBanner module="courier_plus" title={t('demo.title')} body={t('demo.body')} />

      <PageHeader
        title={title}
        subtitle={subtitle}
        actions={actions}
        breadcrumbs={
          crumbs.length > 0 ? (
            <nav aria-label={t('crumb.label')}>
              <ol className="m-0 flex list-none flex-row flex-wrap items-center gap-1.5 p-0 text-caption font-semibold text-ink3">
                {crumbs.map((crumb, index) => (
                  <li key={`${crumb.label}-${index}`} className="flex flex-row items-center gap-1.5">
                    {index > 0 ? <span aria-hidden="true">/</span> : null}
                    {crumb.href ? (
                      <Link href={crumb.href} className="hover:text-ink">
                        {crumb.label}
                      </Link>
                    ) : (
                      <span aria-current={index === crumbs.length - 1 ? 'page' : undefined}>
                        {crumb.label}
                      </span>
                    )}
                  </li>
                ))}
              </ol>
            </nav>
          ) : undefined
        }
      />

      {children}
    </>
  );
}
