import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { paths } from '@/core/routes';
import { Section } from '@/shared/layout/section';
import { MapPlaceholder } from '@/shared/media/map-placeholder';
import {
  CtaLink,
  DownloadPanel,
  Hero,
  HeroVisual,
  HowSteps,
  InfoPanel,
  MarketSection,
  ProductCard,
  SectionHeader,
  StatsPanel,
  TileGrid,
  deliveryCategories,
  deliveryDistricts,
  deliveryProducts,
  deliverySteps,
  marketingMetadata,
} from '@/modules/marketing';

/**
 * `/delivery` — design node `FU0ZJ` (`landing-market.html`), the "Ozio Market"
 * marketing page.
 *
 * Sections: Nav · Hero `pbV5y` · Stats `Vca6I` · Categories `l69lqE` ·
 * Delivery Zone `f3wLT` · How `V2J5dE` · Featured `Zapng` · Fees `Zbiim` ·
 * CTA `i7AfVj` · Footer.
 *
 * **Prefetch: ISR 3600** (02-routing.md: `v1/stores`, `v1/categories/stores`).
 * Nothing is fetched: `GET /stores` is one of BUILD-CONTRACT's **known dead
 * paths**, the catalogue endpoints are store-scoped and need a store id, and the
 * product rows need a bearer token. So the counts, prices and fee figures are the
 * export's sample data — which the page says out loud, as the design does
 * ("NÜMUNƏ MƏLUMAT", "Rəqəmlər zonadan və vaxtdan asılıdır").
 *
 * **The zone address check is not rendered as an input.** The real check is a
 * store/zone lookup that needs lat+lng (`stores/search`) and a session; a box
 * that always answers "we don't know" is worse than the district list plus the
 * in-app link, which is what ships.
 */

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const meta = await getTranslations({ locale, namespace: 'meta' });

  return marketingMetadata({
    path: paths.delivery,
    locale,
    title: meta('delivery.title'),
    description: meta('delivery.description'),
  });
}

export default async function DeliveryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('marketing');

  return (
    <main id="main" className="flex-1">
      <Hero
        eyebrowStyle="kicker"
        eyebrow={t('delivery.hero.eyebrow')}
        title={t('delivery.hero.title')}
        lead={t('delivery.hero.lead')}
        actions={
          <>
            <CtaLink href={paths.login} variant="brand">
              {t('delivery.hero.order')}
            </CtaLink>
            <CtaLink href={paths.market} variant="ghost">
              {t('delivery.hero.catalog')}
            </CtaLink>
          </>
        }
        below={
          <span className="inline-flex h-9 items-center rounded-pill bg-surface2 px-4 text-label font-semibold text-ink">
            {t('delivery.hero.badge')}
          </span>
        }
        visual={
          <HeroVisual
            copy={{
              label: t('visual.label'),
              tier: t('card.tier'),
              balanceLabel: t('card.balanceLabel'),
              balance: t('card.balance'),
              cardNumber: t('card.number'),
              orderTitle: t('home.chip.order.title'),
              orderMeta: t('home.chip.order.meta'),
              cashbackValue: t('delivery.stats.cashback.value'),
              cashbackLabel: t('home.chip.cashback.label'),
              tenValue: t('home.chip.ten.value'),
              tenTitle: t('home.chip.ten.title'),
              tenMeta: t('home.chip.ten.meta'),
            }}
          />
        }
      />

      {/* Stats `Vca6I` — three figures, not the landing's four */}
      <StatsPanel
        label={t('home.stats.label')}
        stats={(['products', 'time', 'cashback'] as const).map((id) => ({
          id,
          value: t(`delivery.stats.${id}.value`),
          label: t(`delivery.stats.${id}.label`),
          shortLabel: t(`delivery.stats.${id}.label`),
          highlight: id === 'cashback',
        }))}
      />

      {/* Categories `l69lqE` */}
      <Section aria-labelledby="categories-title">
        <SectionHeader
          id="categories-title"
          eyebrow={t('delivery.categories.eyebrow')}
          title={t('delivery.categories.title')}
        />
        <TileGrid
          columns={4}
          items={deliveryCategories.map((category) => ({
            id: category.id,
            icon: category.icon,
            title: t(`delivery.categories.${category.id}`),
            text: t('delivery.categories.count', { count: category.count }),
            href: paths.market,
          }))}
        />
      </Section>

      {/* Delivery Zone `f3wLT` */}
      <Section aria-labelledby="zone-title" gap={24}>
        <InfoPanel
          id="zone-title"
          eyebrow={t('delivery.zone.eyebrow')}
          title={t('delivery.zone.title')}
          text={t('delivery.zone.text')}
          rows={[
            {
              id: 'days',
              label: t('delivery.zone.hours.days'),
              value: t('delivery.zone.hours.daysValue'),
            },
            {
              id: 'intake',
              label: t('delivery.zone.hours.intake'),
              value: t('delivery.zone.hours.intakeValue'),
            },
            {
              id: 'average',
              label: t('delivery.zone.hours.average'),
              value: t('delivery.zone.hours.averageValue'),
            },
          ]}
          chips={deliveryDistricts.map((district) =>
            t(`delivery.zone.districts.${district}`),
          )}
          note={t('delivery.zone.mapNote')}
          aside={
            <MapPlaceholder
              label={t('delivery.zone.title')}
              height={320}
              zones={[
                {
                  id: 'far',
                  label: t('delivery.zone.legend.far'),
                  tone: 'sky',
                  x: 8,
                  y: 10,
                  width: 84,
                  height: 80,
                  radius: 110,
                },
                {
                  id: 'near',
                  label: t('delivery.zone.legend.near'),
                  tone: 'brand',
                  x: 26,
                  y: 28,
                  width: 48,
                  height: 44,
                  radius: 90,
                },
              ]}
              points={[
                {
                  id: 'warehouse',
                  label: t('delivery.zone.legend.warehouse'),
                  kind: 'store',
                  x: 50,
                  y: 50,
                },
              ]}
              legend={[
                { id: 'near', label: t('delivery.zone.legend.near'), tone: 'brand' },
                { id: 'far', label: t('delivery.zone.legend.far'), tone: 'sky' },
              ]}
              pointListLabel={t('delivery.zone.legend.warehouse')}
            />
          }
        />
      </Section>

      {/* How `V2J5dE` — four steps */}
      <Section aria-labelledby="delivery-how-title">
        <SectionHeader
          id="delivery-how-title"
          align="center"
          eyebrow={t('delivery.how.eyebrow')}
          title={t('delivery.how.title')}
        />
        <HowSteps
          steps={deliverySteps.map((id) => ({
            id,
            title: t(`delivery.how.${id}.title`),
            text: t(`delivery.how.${id}.text`),
          }))}
        />
      </Section>

      {/* Featured `Zapng` — 8 cards, 4 across */}
      <MarketSection
        id="featured-title"
        eyebrow={t('delivery.featured.eyebrow')}
        title={t('delivery.featured.title')}
        chips={(['all', 'fresh', 'discount'] as const).map((id, index) => ({
          id,
          href: paths.market,
          label: t(`delivery.featured.chips.${id}`),
          active: index === 0,
        }))}
      >
        {deliveryProducts.map((product, index) => (
          <ProductCard
            key={product.id}
            name={t(`${product.id}.name`)}
            meta={t(`${product.id}.meta`)}
            price={t(`${product.id}.price`)}
            category={product.category}
            tag={
              index === 0
                ? t('delivery.featured.tagDiscount')
                : index === 4
                  ? t('delivery.featured.tagNew')
                  : undefined
            }
            href={paths.market}
            actionLabel={t('home.products.openInApp')}
          />
        ))}
      </MarketSection>

      {/* Fees `Zbiim` — explicitly labelled sample data */}
      <Section aria-labelledby="fees-title" gap={24}>
        <InfoPanel
          id="fees-title"
          eyebrow={t('delivery.fees.eyebrow')}
          title={t('delivery.fees.title')}
          text={t('delivery.fees.note')}
          rows={(['min', 'fee', 'free'] as const).map((id) => ({
            id,
            label: t(`delivery.fees.${id}.label`),
            value: t(`delivery.fees.${id}.value`),
          }))}
        />
      </Section>

      {/* CTA `i7AfVj` */}
      <DownloadPanel
        className="pt-[var(--oz-section-y)]"
        title={t('delivery.cta.title')}
        appStoreLabel={t('cta.appStore')}
        googlePlayLabel={t('cta.googlePlay')}
        appStoreAria={t('cta.appStoreAria')}
        googlePlayAria={t('cta.googlePlayAria')}
        qrCaption={t('download.qr')}
        qrLabel={t('download.qrAlt')}
      />
    </main>
  );
}
