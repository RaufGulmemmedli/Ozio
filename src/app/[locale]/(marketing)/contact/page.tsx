import type { Metadata } from 'next';
import { Suspense } from 'react';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { paths } from '@/core/routes';
import { Container } from '@/shared/layout/container';
import { Section } from '@/shared/layout/section';
import { MapPlaceholder } from '@/shared/media/map-placeholder';
import { Mail, MapPin, Phone } from '@/shared/lucide';
import { BoneTitle } from '@/shared/skeleton/bone-text';
import { ChipRowSkeleton, FormSkeleton } from '@/shared/skeleton/presets';
import { Shimmer } from '@/shared/skeleton/shimmer';
import { ContactForm } from '@/modules/marketing/components/ContactForm';
import {
  CtaLink,
  InfoPanel,
  PageIntro,
  appLinks,
  marketingMetadata,
} from '@/modules/marketing';

/**
 * `/contact` — design node `m2CdOH` (`landing-elaqe.html`).
 *
 * Sections: Nav · Header `wI9NJ` · Main `gOLYl` (form + channel cards +
 * working hours) · Map `f2nyLX` · FAQ shortcut `unzB7` · Footer.
 *
 * **Prefetch: SSG.** The page itself is fully static; only the form talks to the
 * server, and it posts to `POST /api/contact` — the route handler this module
 * owns. Read that file's header for what it does and does not deliver: the API
 * has **no support endpoint**, so nothing forwards the message yet, and the page
 * shows the phone and e-mail channels beside the form for that reason.
 *
 * `?topic=` preselects a subject (the deep link `/partners` uses). It is read in
 * `<ContactForm>` with `useSearchParams()`, not from this page's `searchParams`:
 * a server read would opt the route out of static rendering. `<Suspense>` around
 * the form is what keeps the rest of the page in the prerendered shell.
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
    path: paths.contact,
    locale,
    title: meta('contact.title'),
    description: meta('contact.description'),
  });
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('marketing');
  const common = await getTranslations('common');

  const channels = [
    { id: 'phone', icon: Phone, href: appLinks.phone },
    { id: 'email', icon: Mail, href: appLinks.email },
    { id: 'address', icon: MapPin, href: undefined },
  ] as const;

  return (
    <main id="main" className="flex-1">
      <PageIntro tag={t('contact.tag')} title={t('contact.title')} lead={t('contact.sub')} />

      {/* Main `gOLYl` — form 1fr + a 380 aside at 1200 */}
      <Section gap={24}>
        <div className="flex flex-col gap-6 min-[1200px]:flex-row min-[1200px]:gap-8">
          {/* Mirror skeleton while the `?topic=` read resolves on the client:
              same panel, same two-up first row, same submit height. */}
          <Suspense
            fallback={
              <Shimmer
                label={common('loading')}
                className="min-w-0 flex-1 rounded-modal bg-surface p-6 md:p-8 min-[1200px]:p-10"
              >
                <BoneTitle w={200} />
                <div className="mt-6 flex flex-col gap-5">
                  <FormSkeleton fields={2} cols={2} submit={false} />
                  <ChipRowSkeleton count={5} />
                  <FormSkeleton fields={1} submit />
                </div>
              </Shimmer>
            }
          >
            <ContactForm className="min-w-0 flex-1" />
          </Suspense>

          <aside className="flex flex-col gap-4 min-[1200px]:w-[380px] min-[1200px]:shrink-0">
            {channels.map((channel) => {
              const Icon = channel.icon;
              const value = t(`contact.channels.${channel.id}.value`);
              return (
                <div
                  key={channel.id}
                  className="flex items-start gap-4 rounded-xl bg-surface p-5"
                >
                  <span className="grid size-11 shrink-0 place-items-center rounded-[14px] bg-brand-soft text-brand-dark">
                    <Icon size={20} aria-hidden="true" />
                  </span>
                  <div className="flex min-w-0 flex-col gap-1">
                    <span className="text-micro font-bold uppercase tracking-[0.08em] text-ink3">
                      {t(`contact.channels.${channel.id}.label`)}
                    </span>
                    {channel.href ? (
                      <a
                        href={channel.href}
                        className="text-body font-semibold text-ink transition-colors duration-[var(--oz-dur-fast)] hover:text-brand"
                      >
                        {value}
                      </a>
                    ) : (
                      <span className="text-body font-semibold text-ink">{value}</span>
                    )}
                    <span className="text-caption text-ink2">
                      {t(`contact.channels.${channel.id}.meta`)}
                    </span>
                  </div>
                </div>
              );
            })}

            <InfoPanel
              className="min-[1200px]:flex-col min-[1200px]:gap-5 min-[1200px]:p-6"
              title={t('contact.hours.title')}
              text={t('contact.hours.open')}
              rows={(['weekdays', 'saturday', 'sunday'] as const).map((id) => ({
                id,
                label: t(`contact.hours.${id}`),
                value: t(`contact.hours.${id}Value`),
              }))}
            />
          </aside>
        </div>
      </Section>

      {/* Map `f2nyLX` — the illustrative block, not an embed: no third-party
          script and no remote tiles on an SEO-critical, 90 KB-budgeted route. */}
      <Section aria-labelledby="map-title" gap={24}>
        <InfoPanel
          id="map-title"
          title={t('contact.map.title')}
          text={t('contact.map.address')}
          aside={
            <MapPlaceholder
              label={t('contact.map.title')}
              height={320}
              points={[
                {
                  id: 'office',
                  label: t('contact.map.title'),
                  detail: t('contact.map.address'),
                  kind: 'store',
                  x: 50,
                  y: 48,
                },
              ]}
            />
          }
        />
        <Container>
          <CtaLink href={appLinks.officeMap} variant="ghost" size="lg" external>
            {t('contact.map.route')}
          </CtaLink>
        </Container>
      </Section>

      {/* FAQ shortcut `unzB7` */}
      <Section aria-labelledby="contact-faq-title" gap={24}>
        <div className="flex flex-col items-start gap-5 rounded-bento bg-block p-7 md:flex-row md:items-center md:justify-between md:p-10">
          <div className="flex flex-col gap-2">
            <h2 id="contact-faq-title" className="m-0 text-h3 font-extrabold text-on-block">
              {t('contact.faq.title')}
            </h2>
            <p className="m-0 text-body text-on-block2">{t('contact.faq.text')}</p>
          </div>
          <CtaLink href={`${paths.landing}#faq`} variant="white" size="lg">
            {t('contact.faq.cta')}
          </CtaLink>
        </div>
      </Section>
    </main>
  );
}
