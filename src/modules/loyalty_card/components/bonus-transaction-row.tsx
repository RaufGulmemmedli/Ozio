'use client';

/**
 * One bonus-activity row — node `fnCok` in `app-card-bonus.html`:
 * 1px `line` top border, height 75.5 (py-4), gap 16; a 44x44 `rounded-md` (14)
 * tile tinted `success-soft` with an `arrow-down-left` glyph for an earn and
 * `brand-soft` + `arrow-up-right` for a spend; title 16/600 `ink`, meta 13/400
 * `ink2`, amount 17/700 (`success` for an earn, `ink` for a spend on this
 * screen).
 *
 * The amount always carries its sign as text, never colour alone.
 */
import { useTranslations } from 'next-intl';

import { Link, useFormat } from '@/core/i18n';
import { cn } from '@/core/lib/cn';
import { paths } from '@/core/routes';
import { ArrowDownLeft, ArrowUpRight, ChevronRight } from '@/shared/lucide';

import type { BonusTransaction } from '../data/models/bonus-transaction';

export interface BonusTransactionRowProps {
  transaction: BonusTransaction;
  /** `false` renders a plain row instead of a link to the detail screen. */
  linked?: boolean;
  /** Show the chevron (the list variant on `/card` hides it). */
  chevron?: boolean;
  className?: string;
}

/** `+0,64 ₼` / `−5,00 ₼` — U+2212, the minus the export uses. */
export function signedMoney(amount: number, money: (value: number) => string): string {
  if (amount < 0) return `−${money(Math.abs(amount))}`;
  if (amount > 0) return `+${money(amount)}`;
  return money(0);
}

export function BonusTransactionRow({
  transaction,
  linked = true,
  chevron = false,
  className,
}: BonusTransactionRowProps) {
  const t = useTranslations('loyalty_card');
  const { money, date, relative } = useFormat();

  const isSpend = transaction.direction === 'spend';
  const Glyph = isSpend ? ArrowUpRight : ArrowDownLeft;
  const store = transaction.storeName || t('tx.storeFallback');
  const amount = signedMoney(transaction.signedAmount, money);

  // `created_at` is true UTC on this endpoint, so it is safe to convert.
  const when = transaction.createdAt
    ? isWithinTwoDays(transaction.createdAt)
      ? `${relative(transaction.createdAt)}, ${date(transaction.createdAt, 'time')}`
      : date(transaction.createdAt, 'dayMonth')
    : '';

  const body = (
    <>
      <span
        aria-hidden="true"
        className={cn(
          'flex size-11 shrink-0 items-center justify-center rounded-md',
          isSpend ? 'bg-brand-soft text-brand' : 'bg-success-soft text-success',
        )}
      >
        <Glyph size={20} />
      </span>

      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-body font-semibold text-ink">{store}</span>
        <span className="truncate text-caption text-ink2">
          {when}
          {transaction.isMixed ? (
            <> · {t('tx.earnedAlso', { amount: money(transaction.earnedBonus) })}</>
          ) : null}
        </span>
      </span>

      <span
        className={cn(
          'oz-num shrink-0 text-[17px] font-bold',
          isSpend ? 'text-ink' : 'text-success',
        )}
      >
        {amount}
      </span>

      {chevron ? (
        <ChevronRight size={20} aria-hidden="true" className="shrink-0 text-ink3" />
      ) : null}
    </>
  );

  const shell = cn(
    'flex w-full flex-row items-center gap-4 border-t border-line py-4',
    'first:border-t-0',
    linked && 'rounded-sm transition-colors hover:bg-surface2/60',
    className,
  );

  if (!linked || !transaction.id) {
    return <div className={shell}>{body}</div>;
  }

  return (
    <Link
      href={paths.cardTransaction(transaction.id)}
      aria-label={t('tx.rowLabel', { store, amount })}
      className={shell}
    >
      {body}
    </Link>
  );
}

const TWO_DAYS_MS = 2 * 86_400_000;

function isWithinTwoDays(iso: string): boolean {
  const at = Date.parse(iso);
  if (!Number.isFinite(at)) return false;
  return Date.now() - at < TWO_DAYS_MS;
}
