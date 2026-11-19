'use client';

/**
 * `/orders/success` — "Sifarişin qəbul olundu!".
 *
 * The owner sent a phone frame; this builds it as a web page rather than a phone column pinned to
 * the middle of a 1440 screen. One markup, three widths:
 *
 *  - **phone**: the frame itself — a full-bleed brand surface carrying the check disc, the
 *    headline, the order number and the delivery card, with the money and the actions stacked
 *    under it.
 *  - **tablet**: the same order, but the brand surface becomes a rounded card with a gutter.
 *  - **desktop (`lg`)**: two columns — the brand hero takes the free width, the money and the
 *    actions move into a 400-wide side card, which is the pairing `app-order-accepted.html`
 *    (`PJ9Wp`) draws and the shape every other app screen uses at that width.
 *
 * **It does not read the API.** `POST v2/orders` is unverified and the old version re-read
 * `GET v2/orders/{id}` to prove the order existed — which meant this screen could show "could not
 * confirm" at the one moment a customer must be reassured. Everything printed comes from the
 * query the checkout hands over (`order`, `total`, `bonus`, `payment`, `eta`, `streak`), so the
 * confirmation always renders; the demo note at the end says so.
 */

import { useTranslations } from 'next-intl';

import { useFormat } from '@/core/i18n';
import { Link } from '@/core/i18n/navigation';
import { cn } from '@/core/lib/cn';
import { paths } from '@/core/routes';
import { Bike, Check, Flame, Gift } from '@/shared/lucide';

export interface OrderSuccessViewProps {
  /** `?order=` — the order number to print. */
  orderId: string | null;
  /** `?total=` in AZN. */
  total: number | null;
  /** `?bonus=` in AZN — the cashback strip is hidden when there is none. */
  bonus: number | null;
  /** `?payment=` — only `cash` and `card` are printed; anything else falls back to cash. */
  payment: 'cash' | 'card';
  /** `?eta=` — free text estimate; the default is "Ən qısa zamanda". */
  eta: string | null;
  /** `?streak=` — weeks; the chip is hidden below 2. */
  streak: number | null;
}

/** The four states the bar shows. A fresh order is always at the first one. */
const STEPS = ['accepted', 'packing', 'onTheWay', 'delivered'] as const;

const ACTION_BASE =
  'flex h-14 w-full flex-row items-center justify-center gap-2.5 rounded-pill text-body font-bold ' +
  'transition-transform duration-[var(--oz-dur-fast)] active:scale-[.98]';

export function OrderSuccessView({
  orderId,
  total,
  bonus,
  payment,
  eta,
  streak,
}: OrderSuccessViewProps) {
  const t = useTranslations('orders');
  const { money } = useFormat();

  return (
    <div className="flex w-full flex-col gap-5 lg:flex-row lg:items-start lg:gap-6">
      {/* ------------------------------------------------------------------ hero */}
      <section
        className={cn(
          // Phone: edge to edge, cancelling the shell's 20px content padding.
          '-mx-5 flex w-[calc(100%+40px)] flex-col bg-brand px-5 pb-9 pt-8 text-white',
          // Tablet up: a card again.
          'sm:mx-0 sm:w-full sm:rounded-bento sm:px-9 sm:py-10',
          // Desktop: it takes whatever the side column leaves.
          'lg:min-w-0 lg:flex-1',
        )}
      >
        <span
          aria-hidden="true"
          className="grid size-20 place-items-center rounded-pill bg-white sm:size-[88px]"
        >
          <Check size={40} strokeWidth={3} className="text-brand" />
        </span>

        <h1 className="mt-6 text-[36px] font-extrabold leading-[1.05] tracking-[-1px] sm:text-[44px] lg:text-[52px]">
          {t('success.title')}
        </h1>

        {orderId ? (
          <p className="mt-3 text-h4 font-bold text-white/70">
            {t('success.orderNo', { no: orderId })}
          </p>
        ) : null}

        {/* estimate + progress */}
        <div
          aria-label={t('success.progressLabel')}
          role="group"
          className="mt-7 w-full rounded-card bg-white p-5 text-ink sm:p-6 lg:max-w-[560px]"
        >
          <div className="flex w-full flex-row items-start justify-between gap-4">
            <div className="flex min-w-0 flex-col gap-1">
              <span className="text-label font-medium text-ink2">{t('success.etaLabel')}</span>
              <span className="text-h3 font-extrabold leading-tight text-ink sm:text-[28px]">
                {eta ?? t('success.etaSoon')}
              </span>
            </div>
            <span
              aria-hidden="true"
              className="grid size-14 shrink-0 place-items-center rounded-pill bg-yellow"
            >
              <Bike size={26} className="text-on-yellow" />
            </span>
          </div>

          <ol className="mt-5 grid w-full grid-cols-4 gap-2">
            {STEPS.map((step, index) => (
              <li key={step} className="flex min-w-0 flex-col gap-2">
                <span
                  aria-hidden="true"
                  className={cn(
                    'h-1.5 w-full rounded-pill',
                    // Only the first is reached: the order has just been placed.
                    index === 0 ? 'bg-brand' : 'bg-surface2',
                  )}
                />
                <span
                  className={cn(
                    'truncate text-caption font-bold',
                    index === 0 ? 'text-ink' : 'text-ink3',
                  )}
                >
                  {t(`success.step.${step}`)}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ------------------------------------------------------- money + actions */}
      <aside
        className={cn(
          'flex w-full flex-col gap-4 rounded-bento bg-surface p-5 sm:p-6',
          'lg:w-[400px] lg:shrink-0',
        )}
      >
        {bonus !== null && bonus > 0 ? (
          <p className="flex w-full flex-row items-center gap-3 rounded-card bg-yellow px-4 py-3.5 text-on-yellow">
            <Gift size={22} aria-hidden="true" className="shrink-0" />
            <span className="text-body-sm font-bold">
              {t('success.bonusStrip', { amount: money(bonus) })}
            </span>
          </p>
        ) : null}

        {total !== null ? (
          <p className="flex w-full flex-row items-baseline justify-between gap-4 border-b border-line pb-4">
            <span className="text-body font-medium text-ink2">
              {payment === 'card' ? t('success.payableCard') : t('success.payableCash')}
            </span>
            <span className="shrink-0 text-h3 font-extrabold tabular-nums text-ink">
              {money(total)}
            </span>
          </p>
        ) : null}

        {streak !== null && streak >= 2 ? (
          <p className="flex flex-row justify-center">
            <span className="inline-flex flex-row items-center gap-2 rounded-pill bg-yellow px-4 py-2 text-label font-bold text-on-yellow">
              <Flame size={18} aria-hidden="true" />
              {t('success.streak', { weeks: streak })}
            </span>
          </p>
        ) : null}

        <div className="flex w-full flex-col gap-3">
          <Link href={paths.invite} className={cn(ACTION_BASE, 'bg-ink text-bg')}>
            <Gift size={20} aria-hidden="true" />
            {t('success.sendToFriend')}
          </Link>

          <Link
            href={orderId ? paths.order(orderId) : paths.orders}
            className={cn(ACTION_BASE, 'bg-brand text-on-cta')}
          >
            <Bike size={20} aria-hidden="true" />
            {t('success.track')}
          </Link>

          <Link
            href={paths.home}
            className={cn(
              ACTION_BASE,
              'border-[1.5px] border-line text-ink hover:border-ink3 active:scale-100',
            )}
          >
            {t('success.backHome')}
          </Link>
        </div>

        <p className="text-center text-caption font-normal text-ink3">{t('success.demoNote')}</p>
      </aside>
    </div>
  );
}
