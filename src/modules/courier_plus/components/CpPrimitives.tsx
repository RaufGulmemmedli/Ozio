'use client';

/**
 * The small drawn pieces every `courier_plus` screen reuses. Measurements come from
 * `web-handoff/html/mock-parcel-courier/yolustu-kuryer-*.html`; every colour is a token.
 *
 * - `CpCard` — white card, radius 28, padding 24, gap 16 (`Route Card`, `Hub Card`, …)
 * - `CpCardTitle` — 18/800 ink
 * - `CpInfoRow` — label 14/500 ink2 ↔ value 14/700 ink (`Row Haradan` …)
 * - `CpBalanceHero` — dark hero, radius 36, padding 40: 64/800 amount + 32/700 yellow ₼
 * - `CpStatTile` — the hub panel's 4 tiles (`Tile Bu gün komissiya`)
 * - `CpInfoPanel` / `CpInfoStep` — the dark 400-wide "Necə işləyir" column
 * - `CpPlaceBlock` — 48 brand-soft tile + title/label pair used by the match card
 */
import type { ReactNode } from 'react';

import { MANAT, useFormat } from '@/core/i18n';
import { cn } from '@/core/lib/cn';
import type { LucideIcon } from '@/shared/lucide';

/* ------------------------------------------------------------------ card */

export function CpCard({
  children,
  className,
  as: Tag = 'section',
  ...rest
}: {
  children: ReactNode;
  className?: string;
  as?: 'section' | 'div' | 'article';
  'aria-labelledby'?: string;
}) {
  return (
    <Tag
      {...rest}
      className={cn('flex w-full flex-col items-start gap-4 rounded-xl bg-surface p-6', className)}
    >
      {children}
    </Tag>
  );
}

export function CpCardTitle({
  children,
  id,
  as: Tag = 'h2',
  className,
}: {
  children: ReactNode;
  id?: string;
  as?: 'h2' | 'h3';
  className?: string;
}) {
  return (
    <Tag id={id} className={cn('m-0 text-[18px] font-extrabold leading-tight text-ink', className)}>
      {children}
    </Tag>
  );
}

/** Card title + an optional status pill on the right. */
export function CpCardHeader({
  title,
  titleId,
  tag,
  titleAs,
}: {
  title: ReactNode;
  titleId?: string;
  tag?: ReactNode;
  titleAs?: 'h2' | 'h3';
}) {
  return (
    <div className="flex w-full flex-row items-center justify-between gap-3">
      <CpCardTitle id={titleId} as={titleAs}>
        {title}
      </CpCardTitle>
      {tag}
    </div>
  );
}

/* ------------------------------------------------------------------ rows */

/** One `label ↔ value` line of a summary card. Rendered as a `<div>` row inside a `<dl>`. */
export function CpInfoRow({ label, value }: { label: ReactNode; value: ReactNode }) {
  return (
    <div className="flex w-full flex-row items-center justify-between gap-4">
      <dt className="min-w-0 text-label font-medium text-ink2">{label}</dt>
      <dd className="m-0 min-w-0 truncate text-right text-label font-bold text-ink">{value}</dd>
    </div>
  );
}

export function CpInfoRows({ children, className }: { children: ReactNode; className?: string }) {
  return <dl className={cn('m-0 flex w-full flex-col gap-4', className)}>{children}</dl>;
}

/* ------------------------------------------------------------------ hero */

export interface CpBalanceHeroProps {
  label: string;
  amount: number;
  /** The line under the amount (month summary). */
  note?: ReactNode;
  /** Right-hand or bottom slot — the hero CTA. */
  action?: ReactNode;
  children?: ReactNode;
  className?: string;
  labelId?: string;
}

/**
 * `Balance Hero` (`uVeqa`, `Z1KKa`): `block` fill, radius 36, padding 40, gap 16.
 * The amount is split the way the design draws it — 64/800 digits, then a 32/700 `yellow` ₼ — so
 * the digits come from `useFormat().number`, never from a hand-written string.
 */
export function CpBalanceHero({
  label,
  amount,
  note,
  action,
  children,
  className,
  labelId,
}: CpBalanceHeroProps) {
  const f = useFormat();
  return (
    <section
      aria-labelledby={labelId}
      className={cn(
        'flex w-full flex-col items-start gap-4 rounded-bento bg-block p-7 md:p-10',
        className,
      )}
    >
      <p id={labelId} className="m-0 text-label font-bold text-on-block/70">
        {label}
      </p>
      <p className="m-0 flex flex-row items-baseline gap-2">
        <span className="text-[40px] font-extrabold leading-none text-on-block md:text-[64px]">
          {f.number(amount, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
        <span className="text-h3 font-bold text-yellow md:text-h2">{MANAT}</span>
      </p>
      {note ? <p className="m-0 text-body-sm font-medium text-on-block/80">{note}</p> : null}
      {children}
      {action}
    </section>
  );
}

/** The three white tiles inside the earnings hero (`Z1KKa`). */
export function CpHeroStat({ label, value }: { label: ReactNode; value: ReactNode }) {
  return (
    <div className="flex w-full flex-row items-center justify-between gap-4 rounded-card bg-surface px-6 py-4">
      <span className="text-label font-semibold text-ink2">{label}</span>
      <span className="text-h3 font-extrabold text-ink">{value}</span>
    </div>
  );
}

/* ------------------------------------------------------------------ tiles */

export interface CpStatTileProps {
  label: ReactNode;
  value: ReactNode;
  /** The first tile of the hub panel row is the dark one. */
  dark?: boolean;
  className?: string;
}

/** `Tile Bu gün komissiya` (`bjCMr`): radius 28, padding 24, gap 8, label 13/600, value 32/800. */
export function CpStatTile({ label, value, dark = false, className }: CpStatTileProps) {
  return (
    <div
      className={cn(
        'flex w-full flex-col items-start gap-2 rounded-xl p-6',
        dark ? 'bg-block' : 'bg-surface',
        className,
      )}
    >
      <span
        className={cn('text-caption font-semibold', dark ? 'text-on-block/70' : 'text-ink2')}
      >
        {label}
      </span>
      <span
        className={cn(
          'text-h3 font-extrabold md:text-h2',
          dark ? 'text-on-block' : 'text-ink',
        )}
      >
        {value}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ dark info panel */

export function CpInfoPanel({
  title,
  titleId,
  children,
  className,
}: {
  title: ReactNode;
  titleId?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <aside
      aria-labelledby={titleId}
      className={cn(
        'flex w-full flex-col items-start gap-5 rounded-bento bg-block p-7 md:p-8 lg:w-[400px] lg:shrink-0',
        className,
      )}
    >
      <h2 id={titleId} className="m-0 text-[22px] font-extrabold leading-tight text-on-block">
        {title}
      </h2>
      {children}
    </aside>
  );
}

/** One row of the dark panel: a 48 translucent tile + title/body. */
export function CpInfoStep({
  icon: Icon,
  title,
  body,
}: {
  icon: LucideIcon;
  title: ReactNode;
  body: ReactNode;
}) {
  return (
    <div className="flex w-full flex-row items-center gap-4">
      <span
        aria-hidden="true"
        className="flex size-12 shrink-0 items-center justify-center rounded-[16px] bg-on-block/12 text-on-block"
      >
        <Icon size={22} />
      </span>
      <span className="flex min-w-0 flex-col gap-1">
        <span className="text-body-sm font-bold text-on-block">{title}</span>
        <span className="text-caption font-normal text-on-block/70">{body}</span>
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ place block */

export interface CpPlaceBlockProps {
  icon: LucideIcon;
  /** The address, 16/800 ink. */
  title: string;
  /** "Götürmə" / "Təhvil", 13/400 ink2. */
  label: string;
}

/** The pick-up / drop-off pair inside a match card (`c9F0G2`). */
export function CpPlaceBlock({ icon: Icon, title, label }: CpPlaceBlockProps) {
  return (
    <div className="flex min-w-0 flex-row items-center gap-3">
      <span
        aria-hidden="true"
        className="flex size-12 shrink-0 items-center justify-center rounded-[16px] bg-brand-soft text-ink"
      >
        <Icon size={20} />
      </span>
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="truncate text-body font-extrabold text-ink">{title}</span>
        <span className="text-caption font-normal text-ink2">{label}</span>
      </span>
    </div>
  );
}
