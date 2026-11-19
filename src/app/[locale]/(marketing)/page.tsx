import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { resolveLocale } from '@/core/i18n';
import { paths } from '@/core/routes';
import { Container } from '@/shared/layout/container';
import { Section } from '@/shared/layout/section';
import {
  BentoGrid,
  CtaLink,
  DownloadPanel,
  Faq,
  Hero,
  HeroVisual,
  HowSteps,
  JsonLd,
  MarketSection,
  ProductCard,
  SectionHeader,
  StampCard,
  StatsPanel,
  TenPanel,
  TrustRow,
  appLinks,
  faqJsonLd,
  homeBento,
  homeFaq,
  homeMarketChips,
  homeProducts,
  homeStats,
  homeSteps,
  jsonLdGraph,
  marketingMetadata,
  mobileApplicationJsonLd,
  organizationJsonLd,
  webSiteJsonLd,
} from '@/modules/marketing';

/**
 * `/` — Landing home, design node `M0HxE` (dark `hcufa`, tablet `RfOSA`,
 * mobile `cZWDS`).
 *
 * Section order from `screens/landing.md`: Nav · Hero · Stats · Ecosystem · How ·
 * Ten · Market · FAQ · Download · Footer. Nav and Footer come from the
 * `(marketing)` layout.
 *
 * **Prefetch: SSG.** 02-routing.md offers "SSG, ISR 3600 (partner logos / stats
 * from `v1/ozio-partners`, `v1/sliders/images` optional)". Both of those are
 * `auth: bearer`, so a logged-out page must not call them — the figures are
 * static content from the export instead, and the page is fully prerendered.
 *
 * **SEO:** title/description from `meta.home.*`, a per-locale OG image from
 * `opengraph-image.tsx`, `hreflang` az/ru/en + `x-default` = az, and an
 * `Organization` + `WebSite` + `MobileApplication` + `FAQPage` `@graph`.
 */

export const dynamic = 'force-static';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const meta = await getTranslations({ locale, namespace: 'meta' });

  return marketingMetadata({
    path: paths.landing,
    locale,
    title: meta('home.title'),
    description: meta('home.description'),
  });
}

export default async function LandingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  setRequestLocale(raw);
  const locale = resolveLocale(raw);

  const t = await getTranslations('marketing');
  const meta = await getTranslations('meta');

  const faqItems = homeFaq.map((id) => ({
    id: `faq-${id}`,
    question: t(`home.faq.q${id}`),
    answer: t(`home.faq.a${id}`),
  }));

  const graph = jsonLdGraph([
    organizationJsonLd(locale, meta('home.description')),
    webSiteJsonLd(locale, 'Ozio'),
    ...mobileApplicationJsonLd({
      name: 'Ozio',
      description: meta('home.description'),
      appStoreUrl: appLinks.appStore,
      googlePlayUrl: appLinks.googlePlay,
    }),
    faqJsonLd(faqItems.map(({ question, answer }) => ({ question, answer }))),
  ]);

  return (
    <main id="main" className="flex-1">
      <JsonLd json={graph} />

      {/* 2 — Hero `OhxsB` */}
      <Hero
        eyebrow={t('home.hero.eyebrow')}
        title={t('home.hero.title')}
        lead={t('home.hero.lead')}
        actions={
          <>
            <CtaLink href={paths.login} variant="brand">
              {t('cta.download')}
            </CtaLink>
            <CtaLink href={paths.home} variant="ghost">
              {t('cta.webStart')}
            </CtaLink>
          </>
        }
        below={<TrustRow>{t('home.hero.trust')}</TrustRow>}
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
              cashbackValue: t('home.chip.cashback.value'),
              cashbackLabel: t('home.chip.cashback.label'),
              tenValue: t('home.chip.ten.value'),
              tenTitle: t('home.chip.ten.title'),
              tenMeta: t('home.chip.ten.meta'),
            }}
          />
        }
      />

      {/* 3 — Stats `mGwhL` (padding 0/120, no top rhythm of its own) */}
      <StatsPanel
        label={t('home.stats.label')}
        stats={homeStats.map((stat) => ({
          id: stat.id,
          value: t(`home.stats.${stat.id}.value`),
          label: t(`home.stats.${stat.id}.label`),
          shortLabel: t(`home.stats.${stat.id}.short`),
          highlight: stat.highlight,
        }))}
      />

      {/* 4 — Ecosystem `n0vTGQ` */}
      <Section aria-labelledby="ecosystem-title" contained={false}>
        <Container>
          <SectionHeader
            id="ecosystem-title"
            eyebrow={t('home.ecosystem.eyebrow')}
            title={t('home.ecosystem.title')}
            lead={t('home.ecosystem.lead')}
          />
        </Container>
        <Container>
          <BentoGrid
            items={homeBento.map((item) => ({
              ...item,
              kicker: t(`home.bento.${item.id}.kicker`),
              title: t(`home.bento.${item.id}.title`),
              text: t(`home.bento.${item.id}.text`),
            }))}
          />
        </Container>
      </Section>

      {/* 5 — How `CopsG` */}
      <Section aria-labelledby="how-title">
        <SectionHeader
          id="how-title"
          align="center"
          eyebrow={t('home.how.eyebrow')}
          title={t('home.how.title')}
        />
        <HowSteps
          steps={homeSteps.map((id) => ({
            id,
            title: t(`home.how.${id}.title`),
            text: t(`home.how.${id}.text`),
          }))}
        />
      </Section>

      {/* 6 — Ten `DKz2n` */}
      <TenPanel
        className="pt-[var(--oz-section-y)]"
        id="ten-title"
        eyebrow={t('home.ten.eyebrow')}
        title={t('home.ten.title')}
        text={t('home.ten.text')}
        actions={
          <CtaLink href={paths.ten} variant="brand" size="lg">
            {t('home.ten.cta')}
          </CtaLink>
        }
        aside={
          <StampCard
            title={t('home.ten.cardTitle')}
            progress={t('home.ten.progress')}
            label={t('home.ten.stampsLabel')}
          />
        }
      />

      {/* 7 — Market `YEPSp` */}
      <MarketSection
        id="market-title"
        eyebrow={t('home.market.eyebrow')}
        title={t('home.market.title')}
        chips={homeMarketChips.map((chip, index) => ({
          id: chip.id,
          href: chip.href,
          label: t(`home.market.chips.${chip.id}`),
          active: index === 0,
        }))}
      >
        {homeProducts.map((product) => (
          <ProductCard
            key={product.id}
            name={t(`home.products.${product.id}.name`)}
            meta={t(`home.products.${product.id}.meta`)}
            price={t(`home.products.${product.id}.price`)}
            category={product.category}
            tag={product.discount ? t('home.products.discount') : undefined}
            href={paths.market}
            actionLabel={t('home.products.openInApp')}
          />
        ))}
      </MarketSection>

      {/* 8 — FAQ `e52M7m`, the `#faq` anchor the nav and footer link to */}
      <Faq
        anchor="faq"
        eyebrow={t('home.faq.eyebrow')}
        title={t('home.faq.title')}
        items={faqItems}
      />

      {/* 9 — Download `YOqDs` */}
      <DownloadPanel
        className="pt-[var(--oz-section-y)]"
        title={t('download.title')}
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
