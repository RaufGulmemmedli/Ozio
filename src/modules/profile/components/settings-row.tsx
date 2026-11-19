'use client';

/**
 * `<SettingsRow>` — the row the profile menu, the settings card and the help channel list are all
 * built from (`Row · Məlumatlarım`, `Link · Aktiv cihazlar`, `Channel · Zəng et` in the exports).
 *
 * Measured from `app-profil.html`: height 80, padding-inline 28, gap 16, a 44px `surface2` circle
 * holding a 20px icon, label 16/600 `ink`, sub 13/400 `ink2`, optional trailing value 14/500
 * `ink2` and a 20px chevron. Rows are separated by a 1px `line` divider, and the list sits in a
 * `surface` / r28 card with 8px vertical padding.
 *
 * Every row is a **real control**: `href` renders a locale-aware `<Link>`, `onClick` a `<button>`,
 * and a `control` (a `<Switch>`, a tag…) renders a plain row whose own control owns the semantics.
 */
import type { ReactNode } from 'react';

import { cn } from '@/core/lib/cn';
import { Link } from '@/core/i18n/navigation';
import { ChevronRight, type LucideIcon } from '@/shared/lucide';

export type SettingsRowTone = 'default' | 'danger';

export interface SettingsRowProps {
  icon?: LucideIcon;
  label: ReactNode;
  /** Second line, 13/400 `ink2`. */
  sub?: ReactNode;
  /** Right-aligned value before the chevron ("Azərbaycanca", "Sistem"). */
  value?: ReactNode;
  /** Internal destination (locale-aware). */
  href?: string;
  /** External / protocol destination (`tel:`, `mailto:`) — rendered as a plain `<a>`. */
  externalHref?: string;
  onClick?: () => void;
  /** A `<Switch>` or badge rendered instead of the chevron; the row itself stays inert. */
  control?: ReactNode;
  /** Hides the chevron on rows that do not navigate. */
  hideChevron?: boolean;
  tone?: SettingsRowTone;
  disabled?: boolean;
  className?: string;
}

const ICON_WRAP = 'grid size-11 shrink-0 place-items-center rounded-pill bg-surface2';

export function SettingsRow({
  icon: Icon,
  label,
  sub,
  value,
  href,
  externalHref,
  onClick,
  control,
  hideChevron = false,
  tone = 'default',
  disabled = false,
  className,
}: SettingsRowProps) {
  const interactive = Boolean(href || externalHref || onClick) && !disabled;

  const body = (
    <>
      {Icon ? (
        <span className={ICON_WRAP} aria-hidden="true">
          <Icon size={20} className={tone === 'danger' ? 'text-brand' : 'text-ink'} />
        </span>
      ) : null}

      <span className="flex min-w-0 flex-1 flex-col gap-0.5 text-left">
        <span
          className={cn(
            'truncate text-body font-semibold',
            tone === 'danger' ? 'text-brand' : 'text-ink',
          )}
        >
          {label}
        </span>
        {sub ? <span className="text-caption font-normal text-ink2">{sub}</span> : null}
      </span>

      {value ? (
        <span className="shrink-0 text-label font-medium text-ink2">{value}</span>
      ) : null}

      {control}

      {!control && !hideChevron ? (
        <ChevronRight size={20} aria-hidden="true" className="shrink-0 text-ink3" />
      ) : null}
    </>
  );

  const shell = cn(
    'flex min-h-[72px] w-full items-center gap-4 px-5 py-4 md:min-h-20 md:px-7 md:py-0',
    'transition-colors duration-[var(--oz-dur-fast)] ease-[var(--oz-ease-out)]',
    interactive && 'hover:bg-bg focus-visible:bg-bg',
    disabled && 'opacity-50',
    className,
  );

  if (href && !disabled) {
    return (
      <Link href={href} className={shell}>
        {body}
      </Link>
    );
  }

  if (externalHref && !disabled) {
    return (
      <a href={externalHref} className={shell}>
        {body}
      </a>
    );
  }

  if (onClick && !disabled) {
    return (
      <button type="button" onClick={onClick} className={shell}>
        {body}
      </button>
    );
  }

  return <div className={shell}>{body}</div>;
}

/** The `surface` / r28 card the rows live in; children are divided by a 1px `line`. */
export function SettingsRowGroup({
  children,
  label,
  as = 'div',
  className,
}: {
  children: ReactNode;
  /** Accessible name of the list ("Profil menyusu"). */
  label?: string;
  /** `nav` for a group of links, `div` for a group of toggles. */
  as?: 'nav' | 'div';
  className?: string;
}) {
  const Tag = as;
  return (
    <Tag
      aria-label={label}
      className={cn(
        'flex w-full flex-col overflow-hidden rounded-xl bg-surface py-2',
        '[&>*+*]:border-t [&>*+*]:border-line',
        className,
      )}
    >
      {children}
    </Tag>
  );
}
