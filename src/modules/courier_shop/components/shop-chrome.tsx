'use client';

/**
 * The chrome every courier-shop screen shares: the mandatory demo banner, the page header with its
 * crumb line, the dark/white summary panels and the centred state card the empty and error frames
 * draw.
 *
 * `<AppShell>` already owns `<main>` and the content column (padding 8/32/48, gap 32), so a screen
 * renders these as plain siblings.
 */
import type { HTMLAttributes, ReactNode } from 'react';
import { useTranslations } from 'next-intl';

import { cn } from '@/core/lib/cn';
import { Link } from '@/core/i18n';
import { PageHeader } from '@/shared/layout';
import { DemoBanner } from '@/shared/states';

export interface ShopScreenProps {
  /** Crumb line, 13/600 `ink3` — e.g. "Kuryer xidmətləri / Kuryerin çantası". */
  crumb: string;
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
}

/**
 * Demo banner + page header + the screen's own content.
 *
 * The banner carries this module's own copy ("Demo məlumatlar: …"), which the design draws on the
 * yellow strip; the shared `<DemoBanner>` paints it with `warn-soft`/`ink` so it stays legible in
 * dark mode, where a fixed `#FFD43B` fill with light ink would not be.
 */
export function ShopScreen({ crumb, title, subtitle, actions, children }: ShopScreenProps) {
  const t = useTranslations('courier_shop');

  return (
    <>
      <DemoBanner title={t('demo.title')} body={t('demo.body')} />
      <PageHeader
        breadcrumbs={<p className="m-0 text-caption font-semibold text-ink3">{crumb}</p>}
        title={title}
        subtitle={subtitle}
        actions={actions}
      />
      {children}
    </>
  );
}

/**
 * The two-column body every data screen uses: content left, a 380 sticky panel right, stacked
 * below 1200 (the export's 1440 frame is the wide case).
 */
export function ShopColumns({
  children,
  aside,
}: {
  children: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <div className="flex w-full flex-col items-start gap-6 lg:flex-row">
      <div className="flex min-w-0 flex-1 flex-col gap-6">{children}</div>
      {aside ? (
        <div className="w-full shrink-0 lg:sticky lg:top-6 lg:w-[380px]">{aside}</div>
      ) : null}
    </div>
  );
}

/** White card, radius 28, padding 24 — the module's default surface. */
export function ShopCard({
  children,
  className,
  as: Tag = 'section',
  ...rest
}: {
  children?: ReactNode;
  className?: string;
  as?: 'section' | 'div';
} & Pick<HTMLAttributes<HTMLElement>, 'aria-labelledby' | 'aria-label'>) {
  return (
    <Tag
      {...rest}
      className={cn('flex w-full flex-col gap-4 rounded-card bg-surface p-6', className)}
    >
      {children}
    </Tag>
  );
}

/** The `block` hero / summary panel: radius 36, padding 32, `on-block` text. */
export function ShopPanel({
  children,
  className,
  padding = 32,
}: {
  children?: ReactNode;
  className?: string;
  padding?: 24 | 28 | 32 | 40;
}) {
  const pad =
    padding === 24 ? 'p-6' : padding === 28 ? 'p-7' : padding === 40 ? 'p-8 md:p-10' : 'p-6 md:p-8';
  return (
    <div
      className={cn(
        'flex w-full flex-col gap-4 rounded-bento bg-block text-on-block',
        pad,
        className,
      )}
    >
      {children}
    </div>
  );
}

/**
 * A pill link styled like `<Button>` (48 high, as every drawn CTA on these screens).
 *
 * `<Button as="a">` renders a raw `<a>`, which would drop the `/ru` · `/en` prefix
 * (`localePrefix: 'as-needed'`), so navigation goes through next-intl's `<Link>` instead.
 */
export function ShopLinkButton({
  href,
  variant = 'primary',
  children,
  className,
}: {
  href: string;
  variant?: 'primary' | 'brand' | 'soft';
  children: ReactNode;
  className?: string;
}) {
  const fill =
    variant === 'brand'
      ? 'bg-brand text-on-cta hover:bg-brand-dark'
      : variant === 'soft'
        ? 'bg-surface2 text-ink hover:bg-line'
        : 'bg-cta text-on-cta hover:opacity-90';
  return (
    <Link
      href={href}
      className={cn(
        'inline-flex h-12 items-center justify-center gap-2 rounded-pill px-6',
        'text-body-sm font-bold transition-colors',
        fill,
        className,
      )}
    >
      {children}
    </Link>
  );
}

/** Card heading, 18/800 — "Məhsul", "Xidmət seç", "Vaxt", "Çantam", "Seçimin". */
export function ShopCardTitle({ children, id }: { children: ReactNode; id?: string }) {
  return (
    <h2 id={id} className="m-0 text-[18px] font-extrabold leading-tight text-ink">
      {children}
    </h2>
  );
}

/** label / value row, 14/500 `ink2` + 14/700 `ink`. `emphasis` is the 16/800 + 20/800 total row. */
export function SummaryRow({
  label,
  value,
  emphasis = false,
  onBlock = false,
  divider = false,
}: {
  label: ReactNode;
  value: ReactNode;
  emphasis?: boolean;
  onBlock?: boolean;
  divider?: boolean;
}) {
  return (
    <div
      className={cn(
        'flex w-full flex-row items-center justify-between gap-3',
        divider && 'border-t border-t-line pt-2.5',
        divider && onBlock && 'border-t-white/15',
      )}
    >
      <span
        className={cn(
          'min-w-0 text-label font-medium',
          onBlock ? 'text-on-block/80' : 'text-ink2',
          emphasis && (onBlock ? 'text-body font-extrabold text-on-block' : 'text-body font-extrabold text-ink'),
        )}
      >
        {label}
      </span>
      <span
        className={cn(
          'shrink-0 font-bold',
          emphasis ? 'text-[20px] font-extrabold' : 'text-label',
          onBlock ? 'text-on-block' : 'text-ink',
        )}
      >
        {value}
      </span>
    </div>
  );
}
