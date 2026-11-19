'use client';

/**
 * PS7 / P3 "App · Kömək" — `/help` (`app-komek.html`, frame `gohEo`).
 *
 * **Guest-reachable**: the single network read is `GET v1/privacy-policies`, which is
 * `auth: none`, so nothing on this page needs a bearer token.
 *
 * There is no FAQ/help endpoint anywhere in the API (a documented GAP), so the questions, the
 * topics and the contact details are static localized content; search filters them client-side.
 * The legal block renders the policy HTML, sanitized in `data/models/policy.ts`.
 */
import { useDeferredValue, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';

import { cn } from '@/core/lib/cn';
import { useFlag } from '@/core/config';
import { useLocaleKey } from '@/core/query';
import { useFailureMessage } from '@/core/i18n/failure-message';
import { paths } from '@/core/routes';
import {
  Timer,
  CreditCard,
  Headphones,
  Mail,
  Package,
  Phone,
  Search,
  Shield,
  Wallet,
} from '@/shared/lucide';
import { Accordion, Button, Chip, Input } from '@/shared/ui';
import { EmptyState, ErrorState } from '@/shared/states';
import { Bone, Shimmer } from '@/shared/skeleton';

import { PolicyProse } from '../components/policy-prose';
import { SettingsRow, SettingsRowGroup } from '../components/settings-row';
import { pickPolicy } from '../data/models/policy';
import { usePrivacyPolicies } from '../hooks/use-privacy-policies';

const SUPPORT_PHONE = '*1020';
const SUPPORT_EMAIL = 'help@ozio.az';

type TopicId = 'orders' | 'payment' | 'cashback' | 'account';

/** The four topic cards from the export, with the FAQ entries that belong to each. */
const TOPICS: ReadonlyArray<{ id: TopicId; icon: typeof Package; tint: string; questions: readonly number[] }> = [
  { id: 'orders', icon: Package, tint: 'bg-brand-soft text-brand', questions: [2, 5] },
  { id: 'payment', icon: CreditCard, tint: 'bg-sky-soft text-sky', questions: [4] },
  { id: 'cashback', icon: Wallet, tint: 'bg-success-soft text-success', questions: [1, 3, 6] },
  { id: 'account', icon: Shield, tint: 'bg-violet-soft text-violet', questions: [] },
];

const ALL_QUESTIONS = [1, 2, 3, 4, 5, 6] as const;

export function HelpView() {
  const t = useTranslations('profile');
  const locale = useLocaleKey();
  const failureMessage = useFailureMessage();
  const policies = usePrivacyPolicies();
  const supportChat = useFlag('supportChat');

  const [term, setTerm] = useState('');
  const [topic, setTopic] = useState<TopicId | 'all'>('all');
  const deferred = useDeferredValue(term);

  const items = useMemo(() => {
    const needle = deferred.trim().toLocaleLowerCase('az-AZ');
    const allowed =
      topic === 'all'
        ? ALL_QUESTIONS
        : (TOPICS.find((entry) => entry.id === topic)?.questions ?? []);
    return ALL_QUESTIONS.filter((n) => allowed.includes(n))
      .map((n) => ({
        value: `faq-${n}`,
        question: t(`help.faq.q${n}`),
        answer: t(`help.faq.a${n}`),
      }))
      .filter(
        (item) =>
          needle.length === 0 ||
          item.question.toLocaleLowerCase('az-AZ').includes(needle) ||
          item.answer.toLocaleLowerCase('az-AZ').includes(needle),
      );
  }, [deferred, t, topic]);

  const policy = policies.data ? pickPolicy(policies.data, locale) : null;

  return (
    <>

      {/* ------------------------------------------------------------------- search hero */}
      <section className="flex w-full flex-col gap-5 rounded-bento bg-block p-6 md:p-10">
        <h1 className="m-0 text-[28px] font-extrabold leading-[1.2] tracking-[-0.02em] text-on-block md:text-h2 lg:text-h1-app">
          {t('help.title')}
        </h1>
        <p className="m-0 max-w-[720px] text-body font-normal text-on-block2">
          {t('help.subtitle')}
        </p>
        <Input
          variant="pill"
          value={term}
          onChange={(event) => setTerm(event.target.value)}
          placeholder={t('help.search.placeholder')}
          aria-label={t('help.search.label')}
          leadingIcon={<Search size={22} aria-hidden="true" className="text-ink3" />}
          containerClassName="h-15 bg-surface"
        />
      </section>

      {/* ----------------------------------------------------------------------- topics */}
      <section aria-label={t('help.topics.label')} className="flex w-full flex-col gap-3">
        <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {TOPICS.map(({ id, icon: Icon, tint, questions }) => {
            const active = topic === id;
            return (
              <button
                key={id}
                type="button"
                aria-pressed={active}
                onClick={() => setTopic(active ? 'all' : id)}
                className={cn(
                  'flex flex-col items-start gap-[18px] rounded-xl bg-surface p-6 text-left',
                  'transition-[background-color,box-shadow] duration-[var(--oz-dur-fast)] ease-[var(--oz-ease-out)]',
                  'hover:bg-surface2',
                  active && 'ring-2 ring-brand',
                )}
              >
                <span className={cn('grid size-13 place-items-center rounded-pill', tint)}>
                  <Icon size={24} aria-hidden="true" />
                </span>
                <span className="flex flex-col gap-0.5">
                  <span className="text-[18px] font-extrabold text-ink">{t(`help.topic.${id}`)}</span>
                  <span className="text-caption font-normal text-ink2">
                    {t('help.topics.count', { count: questions.length })}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
        {topic !== 'all' ? (
          <Chip selected onClick={() => setTopic('all')} className="w-fit">
            {t('help.topics.all')}
          </Chip>
        ) : null}
      </section>

      {/* ------------------------------------------------------------- faq + contact ----- */}
      <div className="flex w-full flex-col gap-6 lg:flex-row lg:gap-6">
        <section className="flex min-w-0 flex-1 flex-col gap-2">
          <h2 className="m-0 text-[22px] font-extrabold text-ink">{t('help.faq.title')}</h2>
          {items.length === 0 ? (
            <EmptyState
              panel
              icon={Search}
              title={t('help.faq.empty')}
              body={t('help.faq.emptyBody')}
              titleAs="h3"
            />
          ) : (
            <div className="w-full rounded-xl bg-surface px-5 md:px-8">
              <Accordion items={items} itemClassName="last:border-b-0" />
            </div>
          )}

          {/* ------------------------------------------------------------- legal text ---- */}
          <section className="mt-4 flex w-full flex-col gap-3 rounded-xl bg-surface p-5 md:p-8">
            <h2 className="m-0 text-[22px] font-extrabold text-ink">{t('help.legal.title')}</h2>
            {policies.isPending ? (
              <Shimmer label={t('loading')} className="flex w-full flex-col gap-3">
                <Bone w="40%" h={20} r="sm" />
                <Bone w="100%" h={14} r="xs" />
                <Bone w="96%" h={14} r="xs" />
                <Bone w="88%" h={14} r="xs" />
                <Bone w="92%" h={14} r="xs" />
              </Shimmer>
            ) : policies.isError ? (
              <ErrorState
                compact
                failure={policies.error}
                title={t('help.legal.error')}
                message={policies.error ? failureMessage(policies.error) : undefined}
                onRetry={() => void policies.refetch()}
                retryLabel={t('retry')}
              />
            ) : policy ? (
              <PolicyProse html={policy.html} />
            ) : (
              <p className="m-0 text-body-sm font-normal text-ink2">{t('help.legal.empty')}</p>
            )}
          </section>
        </section>

        <aside className="flex w-full flex-col gap-4 lg:w-[380px] lg:shrink-0">
          <section className="flex flex-col gap-4 rounded-xl bg-yellow p-6 md:p-7">
            <span className="grid size-13 place-items-center rounded-pill bg-block">
              <Headphones size={24} aria-hidden="true" className="text-on-block" />
            </span>
            <h2 className="m-0 text-[22px] font-extrabold text-on-yellow">
              {t('help.contact.title')}
            </h2>
            <p className="m-0 text-label font-normal leading-[1.5] text-on-yellow/80">
              {t('help.contact.text')}
            </p>
            {supportChat ? (
              <Button as="a" href={paths.support} variant="primary" fullWidth>
                {t('help.contact.chat')}
              </Button>
            ) : (
              <Button
                as="a"
                href={`tel:${SUPPORT_PHONE}`}
                variant="primary"
                fullWidth
                leadingIcon={<Phone size={20} aria-hidden="true" />}
              >
                {t('help.contact.call')}
              </Button>
            )}
          </section>

          <SettingsRowGroup className="px-0">
            <SettingsRow
              icon={Phone}
              label={t('help.contact.call')}
              value={t('help.contact.callValue')}
              externalHref={`tel:${SUPPORT_PHONE}`}
              hideChevron
            />
            <SettingsRow
              icon={Mail}
              label={t('help.contact.email')}
              value={SUPPORT_EMAIL}
              externalHref={`mailto:${SUPPORT_EMAIL}`}
              hideChevron
            />
            <SettingsRow
              icon={Timer}
              label={t('help.contact.hours')}
              value={t('help.contact.hoursValue')}
              hideChevron
            />
          </SettingsRowGroup>
        </aside>
      </div>
    </>
  );
}
