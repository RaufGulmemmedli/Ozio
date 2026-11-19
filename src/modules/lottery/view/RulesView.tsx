'use client';

/**
 * `/lottery/rules` — "Qaydalar və şərtlər" (LT4). **Guest-visible route.**
 *
 * `GET v1/lotteries/policy` returns `data.content`: one ~4 KB CKEditor HTML string, the
 * full rules text, with **no locale field and no structured sections or dates**. So:
 *   · the page cannot be split into the designed section cards — there is nothing to split
 *     on reliably — it renders as one sanitized prose block instead (`<PolicyHtml>`);
 *   · the text is the same in all three languages, which the page states in one line rather
 *     than pretending it is translated;
 *   · the endpoint needs a bearer token, so a guest sees `<GuestGate>` and the three static
 *     steps, not an error.
 */
import { useLocale, useTranslations } from 'next-intl';
import { useMemo } from 'react';

import { useFailureMessage } from '@/core/i18n';
import { paths } from '@/core/routes';
import { FileText, Info } from '@/shared/lucide';
import { EmptyState, ErrorState, GuestGate, InlineNotice } from '@/shared/states';
import { PageHeader } from '@/shared/layout';
import { Bone, Shimmer } from '@/shared/skeleton';
import { usePreview } from '@/core/query';
import { useIsAuthenticated } from '@/core/session';

import { LinkButton } from '../components/link-button';
import { PolicyHtml } from '../components/policy-html';
import { RulesStrip } from '../components/rules-strip';
import { isPolicyEmpty, sanitizePolicyHtml } from '../lib/sanitize-policy-html';
import { useLotteryPolicy } from '../hooks/use-lottery';


/** The three steps the rules page can state without any server data. */
const HOW_KEYS = ['shop', 'earn', 'watch'] as const;

function RulesSkeleton({ label }: { label?: string }) {
  return (
    <Shimmer className="flex w-full flex-col gap-4 rounded-bento border border-line bg-surface p-8" label={label}>
      <Bone w={240} h={24} r="sm" />
      {Array.from({ length: 10 }, (_, i) => (
        <Bone key={i} w={i % 4 === 3 ? '62%' : '100%'} h={14} r="xs" />
      ))}
    </Shimmer>
  );
}

export function RulesView() {
  const t = useTranslations('lottery');
  const tc = useTranslations('common');
  const locale = useLocale();
  const authenticated = useIsAuthenticated();
  const previewing = usePreview() !== null;
  const failureMessage = useFailureMessage();
  const policy = useLotteryPolicy();

  const howItems = useMemo(
    () =>
      HOW_KEYS.map((key) => ({
        title: t(`rules.how.${key}.title`),
        body: t(`rules.how.${key}.body`),
      })),
    [t],
  );

  const header = (
    <PageHeader
      title={t('rules.title')}
      subtitle={t('rules.subtitle')}
      backHref={paths.lottery}
      backLabel={t('title')}
    />
  );

  // `?preview=` must reach the data states even without a session (BUILD-CONTRACT rule 4).
  if (!authenticated && !previewing) {
    return (
      <>
        {header}
        <RulesStrip heading={t('rules.howTitle')} items={howItems} />
        <GuestGate
          icon={FileText}
          title={t('rules.guest.title')}
          body={t('rules.guest.body')}
          actionLabel={tc('signIn')}
          next={paths.lotteryRules}
        />
      </>
    );
  }

  const sanitized = policy.data ? sanitizePolicyHtml(policy.data.html) : '';

  return (
    <>
      {header}
      <RulesStrip heading={t('rules.howTitle')} items={howItems} />

      {policy.isPending ? (
        <RulesSkeleton label={tc('loading')} />
      ) : policy.isError ? (
        <ErrorState
          failure={policy.error}
          title={tc('error.generic.title')}
          message={failureMessage(policy.error)}
          retryLabel={tc('retry')}
          onRetry={() => policy.refetch()}
        />
      ) : isPolicyEmpty(sanitized) ? (
        <EmptyState
          icon={FileText}
          title={t('rules.empty.title')}
          body={t('rules.empty.body')}
          panel
          action={
            <LinkButton href={paths.lottery} variant="primary" size="lg">
              {t('title')}
            </LinkButton>
          }
        />
      ) : (
        <section className="flex w-full flex-col gap-5 rounded-bento border border-line bg-surface p-6 md:p-8">
          <h2 className="text-h3 font-bold text-ink">{t('rules.fullTitle')}</h2>
          {locale === 'az' ? null : (
            <InlineNotice tone="info" icon={Info}>
              {t('rules.singleLanguage')}
            </InlineNotice>
          )}
          <PolicyHtml html={policy.data?.html ?? ''} />
        </section>
      )}
    </>
  );
}
