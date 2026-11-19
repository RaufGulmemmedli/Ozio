'use client';

/**
 * `/home` as a guest — the AU8 state of `html/app-states/app-qonaq-rejimi.html`.
 *
 * Shows the guest banner + the two locked cards (`Ozio kartı`, `Sifarişlərim`) instead of the Ozio
 * card and the stat tiles, then the guest frame's own sections: `Qlobal kuponlar`
 * (`GET v1/coupons/global`, one of the three guest-safe calls) and `Çox alınanlar`.
 *
 * No account-bound request is fired here: `profile/me`, `v2/orders`, `ten-carts`,
 * `bonus/transactions`, `sliders/images` and `profile/address` are all disabled for a guest by
 * their own hooks (`enabled: authenticated`). `ozio-plus/categories` and `lotteries/active` — the
 * other two guest calls in the matrix — belong to the partners and lottery modules.
 *
 * Browse endpoints are called by guests in the UI, but server-side guest acceptance is
 * **unverified**: a 401 therefore renders the sign-in prompt, never an error card.
 */
import { useTranslations } from 'next-intl';

import { paths } from '@/core/routes';
import { ShoppingBasket, Ticket } from '@/shared/lucide';
import { EmptyState } from '@/shared/states';

import {
  CouponCard,
  GuestHero,
  ProductGrid,
  SectionBlock,
  SectionHead,
  LinkButton,
} from '../components';
import { couponEndClock, isUsableCoupon, type Coupon } from '../data/models';
import { useFeaturedProducts, useGlobalCoupons } from '../hooks';
import { ProductsSkeleton } from './HomeSkeleton';
import { CouponRowSkeleton } from './OffersSkeleton';

export function GuestHomeView() {
  const t = useTranslations('home');
  const coupons = useGlobalCoupons();
  const products = useFeaturedProducts();

  const usable = (coupons.data?.items ?? []).filter(isUsableCoupon).slice(0, 3);

  const signInPrompt = (title: string, body: string) => (
    <EmptyState
      compact
      panel
      icon={ShoppingBasket}
      title={title}
      body={body}
      titleAs="p"
      action={
        <LinkButton href={`${paths.login}?next=${encodeURIComponent(paths.home)}`} variant="primary" size="lg">
          {t('guest.signIn')}
        </LinkButton>
      }
    />
  );

  return (
    <div className="flex w-full flex-col gap-8">
      <GuestHero
        labels={{
          bannerTitle: t('guest.bannerTitle'),
          bannerBody: t('guest.bannerBody'),
          signIn: t('guest.signIn'),
          register: t('guest.register'),
          cardTitle: t('guest.cardTitle'),
          cardBody: t('guest.cardBody'),
          ordersTitle: t('guest.ordersTitle'),
          ordersBody: t('guest.ordersBody'),
        }}
      />

      <div className="flex w-full flex-col gap-1.5">
        <h1 className="text-[28px] font-bold tracking-[-0.5px] text-ink lg:text-h1-app">
          {t('guest.greeting')}
        </h1>
        <p className="text-label text-ink2 lg:text-body-sm">{t('guest.greetingBody')}</p>
      </div>

      {/* Qlobal kuponlar — one of the three guest-safe calls. */}
      <section aria-labelledby="guest-coupons" className="flex w-full flex-col gap-4">
        <SectionHead
          titleId="guest-coupons"
          title={t('coupons.title')}
          actionLabel={t('coupons.seeAll')}
          actionHref={paths.coupons}
        />
        <SectionBlock
          pending={coupons.isPending}
          skeleton={<CouponRowSkeleton />}
          error={coupons.isError ? coupons.error : null}
          onRetry={coupons.refetch}
          retryLabel={t('retry')}
          empty={usable.length === 0}
          emptyIcon={Ticket}
          emptyTitle={t('coupons.emptyTitle')}
          emptyBody={t('coupons.emptyBody')}
          loginPrompt={signInPrompt(t('coupons.guestTitle'), t('coupons.guestBody'))}
        >
          <div className="grid w-full grid-cols-1 gap-5 lg:grid-cols-3">
            {usable.map((coupon, index) => (
              <CouponCard
                key={coupon.id}
                coupon={coupon}
                index={index}
                valueLabel={couponValueLabel(coupon, t)}
                conditionLabel={coupon.description ?? coupon.title}
                expiryLabel={coupon.endDate ? t('coupons.expiry', { date: couponEndClock(coupon) || coupon.endDate.slice(0, 10) }) : null}
                copyLabel={t('coupons.code')}
              />
            ))}
          </div>
        </SectionBlock>
      </section>

      {/* Çox alınanlar (the guest frame's product rail) */}
      <section aria-labelledby="guest-products" className="flex w-full flex-col gap-5">
        <SectionHead
          titleId="guest-products"
          title={t('guest.productsTitle')}
          actionLabel={t('products.seeAll')}
          actionHref={paths.market}
        />
        <SectionBlock
          pending={products.isPending}
          skeleton={<ProductsSkeleton />}
          error={products.isError ? products.error : null}
          onRetry={products.refetch}
          retryLabel={t('retry')}
          empty={(products.data ?? []).length === 0}
          emptyIcon={ShoppingBasket}
          emptyTitle={t('products.emptyTitle')}
          emptyBody={t('products.emptyBody')}
          emptyAction={
            <LinkButton href={paths.market} variant="primary" size="lg">
              {t('products.emptyCta')}
            </LinkButton>
          }
          loginPrompt={signInPrompt(t('products.guestTitle'), t('products.guestBody'))}
        >
          <ProductGrid products={products.data ?? []} cols={4} />
        </SectionBlock>
      </section>
    </div>
  );
}

/**
 * `discount_type` is `percent | cashback | fixed`, and **cashback is a percentage too** — so only
 * `fixed` is money (api/coupons.md). Nothing is computed here: the server value is just labelled.
 */
export function couponValueLabel(
  coupon: Coupon,
  t: (key: string, values?: Record<string, string | number>) => string,
): string {
  if (coupon.discountType === 'fixed') return t('coupons.valueFixed', { value: coupon.discountValue });
  if (coupon.discountType === 'percent' || coupon.discountType === 'cashback') {
    return t('coupons.valuePercent', { value: coupon.discountValue });
  }
  return coupon.title;
}
