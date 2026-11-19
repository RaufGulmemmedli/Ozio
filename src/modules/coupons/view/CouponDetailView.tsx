'use client';

/**
 * `/coupons/[id]` — "Kupon detalı" (`app-kupon-detali.html`, frame `vfhQH`).
 *
 * Measured: Back Link → Detail Row (gap 32): a flex-1 ticket card (radius 36, 1px `line`)
 * made of a `brand` Hero (padding 40, yellow tag 28, value 128/800, title 30/700,
 * sub 16/400 at white/80), a 24-high perforation strip with two 28px notches, and a Body
 * (padding 24/40/40) holding the 4-up facts grid; beside it the 400-wide right column with
 * the `block` "Kassada göstər" panel and the two action buttons.
 *
 * NOT rendered, because `coupons/global` has no field for them:
 *   · the "Şərtlər" bullet list  (no terms / conditions anywhere in the API)
 *   · "Minimum səbət 15,00 ₼"    (no minimum-basket field)
 *   · "Mağaza Ozio Market"       (no partner / store / brand field)
 *   · "İstifadə 1 dəfə"          (no usage-limit field; live `status` is always "unlimit")
 *   · the "Kod 04:52 ... etibarlıdır" countdown (no redemption-token endpoint exists)
 * The facts grid therefore shows the four facts that do exist: validity, channel, state
 * and the code.
 */
import { useTranslations } from 'next-intl';

import { useFailureMessage, useFormat } from '@/core/i18n';
import { Link } from '@/core/i18n/navigation';
import { cn } from '@/core/lib/cn';
import { paths } from '@/core/routes';
import { ArrowLeft, SearchX, Ticket } from '@/shared/lucide';
import { EmptyState, ErrorState } from '@/shared/states';

import { CashierPanel } from '../components/cashier-panel';
import { useCouponValue } from '../components/coupon-value';
import { LinkButton } from '../components/link-button';
import { PerforationHorizontal } from '../components/perforation';
import { couponState, isRedeemableOnline, type Coupon, type CouponState } from '../data/models/coupon';
import { useCoupon } from '../hooks/use-coupons';
import { CouponDetailSkeleton } from './CouponDetailSkeleton';

export interface CouponDetailViewProps {
  id: string;
  /** Inside the intercepted `@modal` route the back link and the heading level change. */
  variant?: 'page' | 'modal';
}

const STATE_PILL: Record<CouponState, string> = {
  active: 'bg-success-soft text-success',
  expiring: 'bg-warn-soft text-warn',
  used: 'bg-surface2 text-ink2',
  expired: 'bg-surface2 text-ink2',
};

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1">
      <dt className="text-caption text-ink3">{label}</dt>
      <dd className="text-[17px] leading-tight font-bold break-words text-ink">{children}</dd>
    </div>
  );
}

export function CouponDetailView({ id, variant = 'page' }: CouponDetailViewProps) {
  const t = useTranslations('coupons');
  const tc = useTranslations('common');
  const { date } = useFormat();
  const failureMessage = useFailureMessage();
  const couponValue = useCouponValue();

  const query = useCoupon(id);
  const coupon: Coupon | null | undefined = query.data;

  if (query.isPending) return <CouponDetailSkeleton label={tc('loading')} />;

  if (query.isError) {
    return (
      <ErrorState
        failure={query.error}
        title={tc('error.generic.title')}
        message={failureMessage(query.error)}
        retryLabel={tc('retry')}
        onRetry={() => query.refetch()}
        secondaryAction={
          <LinkButton href={paths.coupons} variant="soft" size="lg">
            {t('detail.back')}
          </LinkButton>
        }
      />
    );
  }

  if (!coupon) {
    return (
      <EmptyState
        icon={SearchX}
        title={t('detail.notFound.title')}
        body={t('detail.notFound.body')}
        panel
        action={
          <LinkButton href={paths.coupons} variant="primary" size="lg">
            {t('detail.back')}
          </LinkButton>
        }
      />
    );
  }

  const state = couponState(coupon);
  const { value, label } = couponValue(coupon);
  const redeemable = isRedeemableOnline(coupon);
  const Heading = variant === 'modal' ? 'h2' : 'h1';

  return (
    <>
      {variant === 'page' ? (
        <Link
          href={paths.coupons}
          className="flex w-fit flex-row items-center gap-2 text-body-sm font-semibold text-ink2 hover:text-ink"
        >
          <ArrowLeft size={18} aria-hidden="true" />
          {t('detail.back')}
        </Link>
      ) : null}

      {/*
        Container queries, not `lg:` / `md:`.

        Those watch the VIEWPORT, and this view is also rendered inside the 760-wide intercepted
        modal. On a wide screen `lg:` was true there too, so the right column took its fixed
        400px out of 760 and left the ticket ~290 — the headline wrapped one word per line and the
        four-up facts grid (`md:grid-cols-4`) became four columns of one character each. The
        breakpoints below are the width THIS component gets, so the modal stacks and the page
        still splits.
      */}
      <div className="@container w-full">
      <div className="flex w-full flex-col gap-8 @[980px]:flex-row">
        {/* Coupon Ticket */}
        <article className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-bento border border-line bg-surface">
          <div className="flex w-full flex-col gap-4 bg-brand p-6 @[640px]:p-10">
            <span className="inline-flex h-7 w-fit items-center rounded-pill bg-yellow px-3 text-caption font-bold text-on-yellow">
              {label}
            </span>
            <p className="text-hero leading-none font-extrabold text-white">{value}</p>
            <Heading className="text-h3 leading-tight font-bold text-white @[640px]:text-[30px]">
              {coupon.title}
            </Heading>
            {coupon.description ? (
              <p className="max-w-[480px] text-body text-white/80">{coupon.description}</p>
            ) : null}
          </div>

          <PerforationHorizontal />

          <div className="flex w-full flex-col gap-7 px-6 pt-6 pb-8 @[640px]:px-10 @[640px]:pb-10">
            <dl className="grid w-full grid-cols-1 gap-5 @[420px]:grid-cols-2 @[760px]:grid-cols-4">
              <Fact label={t('detail.fact.validUntil')}>
                {coupon.endsAt ? (
                  <time dateTime={coupon.endsAt.raw}>{date(coupon.endsAt.at, 'long')}</time>
                ) : (
                  t('meta.noEnd')
                )}
              </Fact>
              <Fact label={t('detail.fact.channel')}>{t(`channel.${coupon.channel}`)}</Fact>
              <Fact label={t('detail.fact.state')}>
                <span
                  className={cn(
                    'inline-flex h-8 items-center rounded-pill px-[14px] text-label font-bold',
                    STATE_PILL[state],
                  )}
                >
                  {t(`state.${state}`)}
                </span>
              </Fact>
              <Fact label={t('detail.fact.code')}>{coupon.code || '—'}</Fact>
            </dl>

            {/* The API sends no terms text, so the drawn "Şərtlər" list is replaced by the
                one rule that is actually knowable from `type` + `discount_type`. */}
            <p className="text-body-sm text-ink2">
              {redeemable ? t('detail.redeemable') : t('detail.notRedeemable')}
            </p>
          </div>
        </article>

        {/* Right column */}
        <div className="flex w-full flex-col gap-4 @[980px]:w-[400px] @[980px]:shrink-0">
          <CashierPanel code={coupon.code} isQr={coupon.isQr}>
            {/*
              TODO(cart): `import { useCart } from '@/modules/cart'` once that module exposes a
              promo entry point; its barrel exports no promo API today, and the verified route is
              `promo_code` on `POST v2/orders/checkout`, which the cart owns. The code is handed
              over through `/cart?sheet=promo&code=…` meanwhile.
            */}
            {redeemable && coupon.code ? (
              <LinkButton
                href={`${paths.cartPromo}&code=${encodeURIComponent(coupon.code)}`}
                variant="brand"
                size="xl"
                fullWidth
              >
                {t('detail.applyInCart')}
              </LinkButton>
            ) : null}
            {variant === 'page' ? (
              <LinkButton href={paths.coupons} variant="soft" size="xl" fullWidth>
                {t('detail.later')}
              </LinkButton>
            ) : null}
          </CashierPanel>

          {!redeemable ? (
            <p
              role="status"
              className="flex flex-row items-start gap-3 rounded-card border border-line bg-surface p-5 text-body-sm text-ink2"
            >
              <Ticket size={18} aria-hidden="true" className="mt-0.5 shrink-0 text-ink3" />
              {t(`detail.blocked.${state === 'used' ? 'used' : state === 'expired' ? 'expired' : 'offline'}`)}
            </p>
          ) : null}
        </div>
      </div>
      </div>
    </>
  );
}
