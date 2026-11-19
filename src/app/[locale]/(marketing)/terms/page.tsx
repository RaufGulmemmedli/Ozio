import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { resolveLocale } from '@/core/i18n';
import { paths } from '@/core/routes';
import { Section } from '@/shared/layout/section';
import {
  LegalDoc,
  PageIntro,
  marketingMetadata,
  termsSections,
} from '@/modules/marketing';
import { getLegalDocument } from '@/modules/marketing/lib/legal-document';

/**
 * `/terms` — design node `ogihP` (`landing-shertler-mexfilik.html`), the terms
 * half of the export's combined "Şərtlər və Məxfilik" page.
 *
 * **Prefetch: ISR 86400** (02-routing.md). `GET v1/privacy-policies`
 * (`ProfilePrivacyPolicies`) is the only API endpoint the marketing site is
 * allowed to touch — `auth: none`, `live: verified` — and it is read
 * **server-side** through `lib/legal-document.ts`, which keeps the page static by
 * running the call inside a cache scope (see that file). Its `data[].content` is
 * an HTML string and is **sanitized** before rendering; a failure falls back to
 * the static document in `content/legal.ts` plus a `legal.offline` notice.
 */

export const revalidate = 86_400;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const meta = await getTranslations({ locale, namespace: 'meta' });

  return marketingMetadata({
    path: paths.terms,
    locale,
    title: meta('terms.title'),
    description: meta('terms.description'),
  });
}

export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  setRequestLocale(raw);
  const locale = resolveLocale(raw);

  const t = await getTranslations('marketing');
  const document = await getLegalDocument(locale);

  return (
    <main id="main" className="flex-1">
      <PageIntro
        tag={t('legal.updatedAt', { date: t('legal.updatedDate') })}
        title={t('legal.terms.title')}
        lead={t('legal.terms.sub')}
      />

      <Section gap={24}>
        <LegalDoc
          tocLabel={t('legal.tocLabel')}
          tocHeading={t('legal.toc')}
          html={document?.html ?? null}
          offlineNotice={document ? undefined : t('legal.offline')}
          sections={termsSections.map((section) => ({
            section,
            title: t(`legal.sections.${section.id}.title`),
            paragraphs: section.paragraphs.map((key) =>
              t(`legal.sections.${section.id}.${key}`),
            ),
            note: section.note ? t(`legal.sections.${section.id}.note`) : undefined,
          }))}
        />
      </Section>
    </main>
  );
}
