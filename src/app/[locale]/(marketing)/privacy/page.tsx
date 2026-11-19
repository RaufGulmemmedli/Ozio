import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { resolveLocale } from '@/core/i18n';
import { paths } from '@/core/routes';
import { Section } from '@/shared/layout/section';
import {
  LegalDoc,
  PageIntro,
  marketingMetadata,
  privacySections,
} from '@/modules/marketing';
import { getLegalDocument } from '@/modules/marketing/lib/legal-document';

/**
 * `/privacy` — design node `ogihP`, the privacy half of the export's combined
 * page (the `#mexfiyyet` anchor the footer used to point at is now its own
 * indexable route, per 02-routing.md).
 *
 * **Prefetch: ISR 86400**, same source and same sanitising path as `/terms`; see
 * that page and `lib/legal-document.ts`. The upstream endpoint returns one
 * document, so when it answers both routes render it and only the on-page intro
 * differs — which is correct: it is one policy text, published under two
 * canonical URLs the way the route table defines them.
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
    path: paths.privacy,
    locale,
    title: meta('privacy.title'),
    description: meta('privacy.description'),
  });
}

export default async function PrivacyPage({
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
        title={t('legal.privacy.title')}
        lead={t('legal.privacy.sub')}
      />

      <Section gap={24}>
        <LegalDoc
          tocLabel={t('legal.tocLabel')}
          tocHeading={t('legal.toc')}
          html={document?.html ?? null}
          offlineNotice={document ? undefined : t('legal.offline')}
          sections={privacySections.map((section) => ({
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
