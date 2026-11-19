import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { paths } from '@/core/routes';
import { Section } from '@/shared/layout/section';
import {
  CtaLink,
  DownloadPanel,
  Faq,
  Hero,
  HowSteps,
  JsonLd,
  SectionHeader,
  StampCard,
  TenPanel,
  TileGrid,
  faqJsonLd,
  jsonLdGraph,
  marketingMetadata,
  tenGifts,
} from '@/modules/marketing';
import { Gift } from '@/shared/lucide';

/**
 * `/ten` — design node `K7QsW` (`landing-10-lar.html`), the 10-lar programme.
 *
 * Sections: Nav · Hero `UMKjm` · Monthly Gifts `ebKD1` · Rules `DuHo1` ·
 * Lottery `glPni` · FAQ `zVBSa` · CTA `hcsiQ` · Footer.
 *
 * **Prefetch: SSG** (02-routing.md). `PartnersTenCarts` and the rewards list are
 * both `auth: bearer`, so the November gift list and the "7 / 10" card are the
 * export's sample content; the page says "nümunə siyahı", as the design does.
 *
 * **SEO:** `meta.ten.*`. 02-routing.md asks only for plain metadata here, but the
 * page genuinely has an FAQ block, so it also emits `FAQPage` — the same
 * questions a visitor sees, nothing invented.
 */

export const dynamic = 'force-static';

const FAQ_IDS = ['1', '2', '3', '4'] as const;
const RULE_STEPS = ['step1', 'step2', 'step3'] as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const meta = await getTranslations({ locale, namespace: 'meta' });

  return marketingMetadata({
    path: paths.ten,
    locale,
    title: meta('ten.title'),
    description: meta('ten.description'),
  });
}

export default async function TenPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('marketing');

  const faqItems = FAQ_IDS.map((id) => ({
    id: `ten-faq-${id}`,
    question: t(`ten.faq.q${id}`),
    answer: t(`ten.faq.a${id}`),
  }));

  return (
    <main id="main" className="flex-1">
      <JsonLd
        json={jsonLdGraph([
          faqJsonLd(faqItems.map(({ question, answer }) => ({ question, answer }))),
        ])}
      />

      <Hero
        eyebrowStyle="kicker"
        eyebrow={t('ten.hero.eyebrow')}
        title={t('ten.hero.title')}
        lead={t('ten.hero.lead')}
        actions={
          <>
            <CtaLink href={paths.login} variant="brand">
              {t('ten.hero.start')}
            </CtaLink>
            <CtaLink href="#rules" variant="ghost" external>
              {t('ten.hero.rules')}
            </CtaLink>
          </>
        }
        visual={
          <div className="w-full min-[1200px]:w-[560px] min-[1200px]:shrink-0">
            <StampCard
              title={t('ten.card.title')}
              progress={t('ten.card.progress')}
              label={t('home.ten.stampsLabel')}
              hint={t('ten.card.hint')}
            />
          </div>
        }
      />

      {/* Monthly Gifts `ebKD1` */}
      <Section aria-labelledby="gifts-title" flush>
        <SectionHeader
          id="gifts-title"
          eyebrow={t('ten.gifts.eyebrow')}
          title={t('ten.gifts.title')}
          lead={t('ten.gifts.note')}
        />
        <TileGrid
          columns={3}
          items={tenGifts.map((id) => ({
            id,
            icon: Gift,
            title: t(`ten.gifts.${id}.title`),
            text: t(`ten.gifts.${id}.text`),
          }))}
        />
      </Section>

      {/* Rules `DuHo1` — numbered 1/2/3 here, not 01/02/03 */}
      <Section id="rules" aria-labelledby="rules-title">
        <SectionHeader
          id="rules-title"
          align="center"
          eyebrow={t('ten.rules.eyebrow')}
          title={t('ten.rules.title')}
          titleClassName="text-center"
        />
        <p className="mx-auto m-0 max-w-[560px] text-center text-body leading-6 text-ink2">
          {t('ten.rules.lead')}
        </p>
        <HowSteps
          pad={false}
          steps={RULE_STEPS.map((id) => ({
            id,
            title: t(`ten.rules.${id}.title`),
            text: t(`ten.rules.${id}.text`),
          }))}
        />
      </Section>

      {/* Lottery `glPni` — the ticket mock is decorative sample data */}
      <TenPanel
        className="pt-[var(--oz-section-y)]"
        id="lottery-title"
        eyebrow={t('ten.lottery.eyebrow')}
        title={t('ten.lottery.title')}
        text={t('ten.lottery.text')}
        actions={
          <CtaLink href={paths.lotteryRules} variant="brand" size="lg">
            {t('ten.lottery.cta')}
          </CtaLink>
        }
        aside={
          <div
            aria-hidden
            className="flex overflow-hidden rounded-modal bg-surface"
          >
            <div className="flex min-w-0 flex-1 flex-col gap-2 p-6 md:p-8">
              <span className="text-caption font-bold uppercase tracking-[0.115em] text-brand">
                {t('ten.ticket.brand')}
              </span>
              <span className="text-h4 font-bold text-ink">{t('ten.ticket.draw')}</span>
              <span className="text-h3 font-extrabold text-ink tabular-nums">
                {t('ten.ticket.number')}
              </span>
            </div>
            <div className="flex w-[120px] shrink-0 flex-col items-center justify-center gap-1 border-l-2 border-dashed border-line bg-surface2 p-4 text-center">
              <span className="text-caption text-ink2">{t('ten.ticket.stubLabel')}</span>
              <span className="text-body font-bold text-ink">{t('ten.ticket.stubDate')}</span>
              <span className="text-nano text-ink3">{t('ten.ticket.stubNote')}</span>
            </div>
          </div>
        }
      />

      <Faq
        anchor="ten-faq"
        eyebrow={t('ten.faq.eyebrow')}
        title={t('ten.faq.title')}
        items={faqItems}
      />

      {/* CTA `hcsiQ` */}
      <DownloadPanel
        className="pt-[var(--oz-section-y)]"
        title={t('ten.cta.title')}
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
