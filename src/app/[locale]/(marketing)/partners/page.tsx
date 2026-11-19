import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { paths } from '@/core/routes';
import { Section } from '@/shared/layout/section';
import {
  CtaLink,
  DownloadPanel,
  Hero,
  JsonLd,
  PartnerGrid,
  SectionHeader,
  TenPanel,
  absoluteUrl,
  itemListJsonLd,
  jsonLdGraph,
  marketingMetadata,
  partnerSamples,
} from '@/modules/marketing';
import { resolveLocale } from '@/core/i18n';

/**
 * `/partners` — design node `i8NW9` (`landing-partnyorlar.html`).
 *
 * Sections: Nav · Hero `fJM0a` · Partner Grid `jxh78` · Partner CTA `HT9YS` ·
 * Footer.
 *
 * **Prefetch: ISR 3600** (02-routing.md: "ISR 3600 (`v1/ozio-partners`)"), kept
 * as the declared cadence even though nothing is fetched: `PartnersPartners` is
 * `auth: bearer`, so a logged-out page must not call it. The twelve partners are
 * the export's examples (see `content/landing.ts`) and the live directory is
 * linked at `/market/partners`.
 *
 * **Deliberate deviation from the export:** the hero's search field and the
 * category chips are not rendered as controls. They would filter twelve
 * hardcoded rows — a search box that cannot find the other 108 partners is worse
 * than a link to the real directory, which is what ships instead.
 *
 * **The partner application form is also not rendered as a form.** The screen
 * spec marks its endpoint `TODO backend` (`POST /partner-requests`, absent from
 * the API), so the section keeps its copy and sends applicants to `/contact`
 * with the "Partnyorluq" subject preselected — a route that really delivers.
 *
 * **SEO:** `meta.partners.*` + an `ItemList` JSON-LD over the partner cards.
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
    path: paths.partners,
    locale,
    title: meta('partners.title'),
    description: meta('partners.description'),
  });
}

export default async function PartnersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  setRequestLocale(raw);
  const locale = resolveLocale(raw);

  const t = await getTranslations('marketing');

  const partners = partnerSamples.map((partner) => ({
    id: partner.id,
    name: t(`partners.list.${partner.id}`),
    initial: partner.initial,
    cashback: t('partners.card.cashback', { rate: partner.rate }),
    meta: t('partners.card.meta', {
      category: t(`partners.categories.${partner.category}`),
      branches: partner.branches,
    }),
  }));

  return (
    <main id="main" className="flex-1">
      <JsonLd
        json={jsonLdGraph([
          itemListJsonLd(
            t('partners.grid.title'),
            partners.map((partner) => ({
              name: partner.name,
              description: `${partner.cashback} · ${partner.meta}`,
              url: absoluteUrl(paths.partners, locale),
            })),
          ),
        ])}
      />

      <Hero
        eyebrowStyle="kicker"
        eyebrow={t('partners.hero.eyebrow')}
        title={t('partners.hero.title')}
        lead={t('partners.hero.lead')}
        actions={
          <>
            <CtaLink href={paths.marketPartners} variant="brand">
              {t('partners.grid.inApp')}
            </CtaLink>
            <CtaLink href={paths.login} variant="ghost">
              {t('cta.download')}
            </CtaLink>
          </>
        }
      />

      <Section aria-labelledby="partners-title" flush>
        <SectionHeader
          id="partners-title"
          title={t('partners.grid.title')}
          lead={t('partners.grid.meta', { count: partners.length })}
        />
        <PartnerGrid
          partners={partners}
          href={paths.marketPartners}
          linkLabel={t('partners.grid.inApp')}
        />
      </Section>

      {/* Partner CTA `HT9YS` — copy intact, destination is the contact route */}
      <TenPanel
        className="pt-[var(--oz-section-y)]"
        id="partner-cta-title"
        eyebrow={t('partners.cta.eyebrow')}
        title={t('partners.cta.title')}
        text={t('partners.cta.text')}
        actions={
          <>
            <CtaLink href={`${paths.contact}?topic=partnership`} variant="brand" size="lg">
              {t('partners.cta.submit')}
            </CtaLink>
            <CtaLink href={paths.contact} variant="ghostOnDark" size="lg">
              {t('contact.channels.email.value')}
            </CtaLink>
          </>
        }
        aside={
          <div className="flex flex-col gap-3 rounded-modal bg-surface p-6 md:p-8">
            <p className="m-0 text-body font-semibold text-ink">{t('partners.cta.hint')}</p>
            <p className="m-0 text-body-sm leading-6 text-ink2">{t('partners.cta.note')}</p>
          </div>
        }
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
