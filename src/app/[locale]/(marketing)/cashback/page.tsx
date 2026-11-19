import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { paths } from '@/core/routes';
import { Section } from '@/shared/layout/section';
import { Barcode } from '@/shared/media/barcode';
import {
  CtaLink,
  DownloadPanel,
  Faq,
  Hero,
  HeroVisual,
  HowSteps,
  InfoPanel,
  JsonLd,
  RatesTable,
  SectionHeader,
  TileGrid,
  cashbackCampaigns,
  cashbackRates,
  faqJsonLd,
  jsonLdGraph,
  marketingMetadata,
} from '@/modules/marketing';

/**
 * `/cashback` — design node `j1rKSv` (`landing-keshbek.html`).
 *
 * Sections: Nav · Hero `fvmlP` · Checkout `YwTRH` · Rates `NPqtl` ·
 * Campaigns `I8aWr` · FAQ `Zwf18` · Download `nchC1` · Footer.
 *
 * **Prefetch: SSG** (02-routing.md). The campaign strip could be dynamic
 * (`PartnersPlusCampaigns`), but that endpoint is `auth: bearer`, so the four
 * November cards from the export ship as static content and the page prerenders.
 *
 * **SEO:** `meta.cashback.*` + a `FAQPage` JSON-LD, as 02-routing.md requires.
 */

export const dynamic = 'force-static';

const FAQ_IDS = ['1', '2', '3', '4'] as const;
const CHECKOUT_STEPS = ['step1', 'step2', 'step3'] as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const meta = await getTranslations({ locale, namespace: 'meta' });

  return marketingMetadata({
    path: paths.cashback,
    locale,
    title: meta('cashback.title'),
    description: meta('cashback.description'),
  });
}

export default async function CashbackPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('marketing');

  const faqItems = FAQ_IDS.map((id) => ({
    id: `cashback-faq-${id}`,
    question: t(`cashback.faq.q${id}`),
    answer: t(`cashback.faq.a${id}`),
  }));

  return (
    <main id="main" className="flex-1">
      <JsonLd
        json={jsonLdGraph([faqJsonLd(faqItems.map(({ question, answer }) => ({ question, answer })))])}
      />

      <Hero
        eyebrowStyle="kicker"
        eyebrow={t('cashback.hero.eyebrow')}
        title={t('cashback.hero.title')}
        lead={t('cashback.hero.lead')}
        actions={
          <>
            <CtaLink href={paths.login} variant="brand">
              {t('cta.download')}
            </CtaLink>
            <CtaLink href="#how" variant="ghost" external>
              {t('cashback.hero.secondary')}
            </CtaLink>
          </>
        }
        visual={
          <HeroVisual
            copy={{
              label: t('visual.label'),
              tier: t('card.tier'),
              balanceLabel: t('card.balanceLabel'),
              balance: t('card.balance'),
              cardNumber: t('card.number'),
              orderTitle: t('cashback.toast.value'),
              orderMeta: t('cashback.toast.meta'),
              cashbackValue: t('home.chip.cashback.value'),
              cashbackLabel: t('home.chip.cashback.label'),
              tenValue: t('home.chip.ten.value'),
              tenTitle: t('home.chip.ten.title'),
              tenMeta: t('home.chip.ten.meta'),
            }}
          />
        }
      />

      {/* Checkout `YwTRH` — three steps + the sample card number */}
      {/* `flush`: the hero's own 96 bottom padding is the gap here, as on `/` */}
      <Section id="how" aria-labelledby="checkout-title" flush>
        <SectionHeader
          id="checkout-title"
          align="center"
          eyebrow={t('cashback.checkout.eyebrow')}
          title={t('cashback.checkout.title')}
        />
        <HowSteps
          steps={CHECKOUT_STEPS.map((id) => ({
            id,
            title: t(`cashback.checkout.${id}.title`),
            text: t(`cashback.checkout.${id}.text`),
          }))}
        />
        <InfoPanel
          /* The barcode is a real Code 128 of a FAKE number, as the export notes. */
          aside={
            <Barcode
              value={t('cashback.card.number').replace(/\s/g, '')}
              display={t('cashback.card.number')}
              caption={t('cashback.card.numberLabel')}
            />
          }
          note={t('sample')}
          text={t('cashback.checkout.step2.text')}
          title={t('cashback.card.numberLabel')}
        />
      </Section>

      {/* Rates `NPqtl` */}
      <Section aria-labelledby="rates-title">
        <SectionHeader
          id="rates-title"
          eyebrow={t('cashback.rates.eyebrow')}
          title={t('cashback.rates.title')}
        />
        <RatesTable
          head={{
            category: t('cashback.rates.head.category'),
            partners: t('cashback.rates.head.partners'),
            rate: t('cashback.rates.head.rate'),
          }}
          rows={cashbackRates.map((id) => ({
            id,
            category: t(`cashback.rates.${id}.name`),
            partners: t(`cashback.rates.${id}.partners`),
            rate: t(`cashback.rates.${id}.rate`),
          }))}
          note={t('cashback.rates.note')}
        />
      </Section>

      {/* Campaigns `I8aWr` */}
      <Section aria-labelledby="campaigns-title">
        <SectionHeader
          id="campaigns-title"
          eyebrow={t('cashback.campaigns.eyebrow')}
          title={t('cashback.campaigns.title')}
          lead={t('cashback.campaigns.note')}
        />
        <TileGrid
          columns={4}
          items={cashbackCampaigns.map((id) => ({
            id,
            value: t(`cashback.campaigns.${id}.value`),
            title: t(`cashback.campaigns.${id}.title`),
            text: t(`cashback.campaigns.${id}.text`),
            badge: t(`cashback.campaigns.${id}.period`),
          }))}
        />
      </Section>

      <Faq
        anchor="cashback-faq"
        eyebrow={t('cashback.faq.eyebrow')}
        title={t('cashback.faq.title')}
        items={faqItems}
      />

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
