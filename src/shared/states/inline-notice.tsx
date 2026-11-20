import type { ReactNode } from 'react';

import { cn } from '@/core/lib/cn';
import { Loader, type LucideIcon } from '@/shared/lucide';
import { Link } from '@/core/i18n/navigation';

/* ========================================================================== *
 * StateButton — a minimal pill button for the state components.
 * TODO(ui): replace every use with <Button> from '@/shared/ui' (agent F7).
 * ========================================================================== */

export type StateButtonVariant = 'primary' | 'brand' | 'soft' | 'white';

const BUTTON_VARIANT: Record<StateButtonVariant, string> = {
  primary: 'bg-cta text-on-cta',
  brand: 'bg-brand text-white',
  soft: 'bg-surface2 text-ink',
  white: 'bg-surface text-ink border border-line',
};

export type StateButtonProps = {
  children: ReactNode;
  /** Renders a locale-aware link instead of a button. */
  href?: string;
  onClick?: () => void;
  variant?: StateButtonVariant;
  /** 52 (default), 46 or 40 high — the three button heights in the states frames. */
  size?: 52 | 46 | 40;
  loading?: boolean;
  disabled?: boolean;
  block?: boolean;
  type?: 'button' | 'submit';
  autoFocus?: boolean;
  className?: string;
};

export function StateButton({
  children,
  href,
  onClick,
  variant = 'primary',
  size = 52,
  loading = false,
  disabled = false,
  block = false,
  type = 'button',
  autoFocus = false,
  className,
}: StateButtonProps) {
  const classes = cn(
    'inline-flex flex-row items-center justify-center gap-[10px] rounded-pill px-7',
    'text-body font-semibold transition-colors',
    BUTTON_VARIANT[variant],
    block ? 'w-full' : 'w-fit',
    (disabled || loading) && 'pointer-events-none opacity-60',
    className,
  );

  const content = (
    <>
      {loading ? <Loader aria-hidden="true" size={18} className="oz-spinner" /> : null}
      {children}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={classes} style={{ height: size }}>
        {content}
      </Link>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      autoFocus={autoFocus}
      aria-busy={loading || undefined}
      className={classes}
      style={{ height: size }}
    >
      {content}
    </button>
  );
}

/* ========================================================================== *
 * InlineNotice — the banner look from components.md §Banners.
 * Height 56, padding 0/20, radius 16, gap 12, icon 20, text 14/500,
 * action 14/700. Used for the store-closed / out-of-stock / out-of-zone
 * states: it never changes the route.
 * ========================================================================== */

export type InlineNoticeTone = 'info' | 'warning' | 'error' | 'success' | 'note';

const NOTICE_TONE: Record<InlineNoticeTone, { box: string; icon: string; action: string }> = {
  info: { box: 'bg-sky-soft text-ink', icon: 'text-sky', action: 'text-sky' },
  warning: { box: 'bg-yellow text-on-yellow', icon: 'text-on-yellow', action: 'text-on-yellow' },
  error: { box: 'bg-brand-soft text-ink', icon: 'text-brand', action: 'text-brand' },
  success: { box: 'bg-success-soft text-ink', icon: 'text-success', action: 'text-success' },
  note: { box: 'bg-warn-soft text-ink', icon: 'text-warn', action: 'text-ink' },
};

export type InlineNoticeProps = {
  tone?: InlineNoticeTone;
  icon?: LucideIcon;
  /** Bold lead-in rendered before `body` on the same line. */
  title?: ReactNode;
  body?: ReactNode;
  /** Trailing text action (14/700). Ignored when `actionSlot` is given. */
  actionLabel?: ReactNode;
  onAction?: () => void;
  actionHref?: string;
  /** Anything richer than a text action (a `StateButton`, a chip row…). */
  actionSlot?: ReactNode;
  /**
   * Let the body wrap over several lines (height grows, padding becomes
   * 14/20) — the out-of-zone warning card in the address form.
   */
  multiline?: boolean;
  /** Default: `alert` for `error`, `status` otherwise. */
  role?: 'status' | 'alert' | 'note';
  className?: string;
  children?: ReactNode;
};

export function InlineNotice({
  tone = 'info',
  icon: Icon,
  title,
  body,
  actionLabel,
  onAction,
  actionHref,
  actionSlot,
  multiline = false,
  role,
  className,
  children,
}: InlineNoticeProps) {
  const palette = NOTICE_TONE[tone];
  const resolvedRole = role ?? (tone === 'error' ? 'alert' : 'status');

  return (
    <div
      role={resolvedRole}
      aria-live={resolvedRole === 'alert' ? 'assertive' : 'polite'}
      className={cn(
        'flex w-full flex-row gap-3 rounded-[16px]',
        /*
         * A multiline notice WRAPS; a single-line one cannot (it is a fixed 56 tall).
         *
         * The action is `shrink-0`, so on a phone a wide one took its width out of the text and
         * left a two-word column: the store-closed banner rendered "Məhsulları / səbətə əlavə /
         * edə bilərsiniz —" down the left of a 190px "Açılanda xəbər ver" button. With
         * `flex-wrap` and a basis on the text, the action drops to its own line as soon as the
         * row cannot hold both, and the text gets the full width back.
         */
        multiline ? 'flex-wrap items-start px-5 py-[14px]' : 'h-[56px] items-center px-5',
        palette.box,
        className,
      )}
    >
      {Icon ? (
        <Icon aria-hidden="true" size={20} className={cn('shrink-0', palette.icon, multiline && 'mt-px')} />
      ) : null}

      <div
        className={cn(
          'min-w-0 flex-1 text-label font-medium',
          // ~192px: below that the row wraps rather than squeezing the copy into a column.
          multiline ? 'flex basis-48 flex-col gap-1' : 'truncate',
        )}
      >
        {title ? <span className="font-bold">{title}</span> : null}
        {title && body && !multiline ? ' ' : null}
        {body ? <span>{body}</span> : null}
        {children}
      </div>

      {actionSlot ??
        (actionLabel ? (
          actionHref ? (
            <Link
              href={actionHref}
              className={cn('shrink-0 text-label font-bold', palette.action)}
            >
              {actionLabel}
            </Link>
          ) : (
            <button
              type="button"
              onClick={onAction}
              className={cn('shrink-0 text-label font-bold', palette.action)}
            >
              {actionLabel}
            </button>
          )
        ) : null)}
    </div>
  );
}
