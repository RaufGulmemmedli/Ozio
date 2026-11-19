'use client';

/**
 * PS6 "App · Hesabı sil" — `/account/delete` (`app-hesabi-sil.html`, frame `lTa0r`).
 *
 * The export draws this as a destructive dialog over `/settings`; here it is its own `auth` route,
 * so the dialog's content becomes the page card and the final go-ahead is a second
 * `confirmDialog` — a typed confirmation plus an explicit confirm, as the brief requires.
 *
 * The loss list uses **live** profile values: the bonus balance from `bonus_cards[0].bonus` and
 * the active-coupon count from `v1/promo-code`. The export's third line names a loyalty level;
 * the payload has no level field, so that line names the card and the lottery tickets instead.
 *
 * `DELETE v1/profile/me` is **unverified** (method and path inferred; no body is sent because it
 * is unknown whether one is accepted). Whatever it answers, the session is cleared and the user
 * lands on `/login`.
 */
import { useState } from 'react';
import { useTranslations } from 'next-intl';

import { useFormat } from '@/core/i18n';
import { useFailureMessage } from '@/core/i18n/failure-message';
import { useRouter } from '@/core/i18n/navigation';
import { paths } from '@/core/routes';
import { CircleAlert, Ticket, TriangleAlert, Wallet } from '@/shared/lucide';
import { PageHeader } from '@/shared/layout';
import { Button, Input, confirmDialog } from '@/shared/ui';
import { ErrorState } from '@/shared/states';
import { Bone, Shimmer } from '@/shared/skeleton';

import { primaryCard } from '../data/models/profile';
import { useDeleteAccount } from '../hooks/use-delete-account';
import { useProfile } from '../hooks/use-profile';
import { useProfileStats } from '../hooks/use-profile-counts';

/** Azerbaijani dotted İ; the dotless `SIL` is accepted too. */
const CONFIRM_WORDS = ['SİL', 'SIL'];

const isConfirmed = (value: string): boolean =>
  CONFIRM_WORDS.includes(value.trim().toLocaleUpperCase('az-AZ'));

export function AccountDeleteView() {
  const t = useTranslations('profile');
  const tSettings = useTranslations('settings');
  const format = useFormat();
  const failureMessage = useFailureMessage();
  const router = useRouter();

  const query = useProfile();
  // The loss list quotes live values; a counter that has not answered is simply not listed.
  const stats = useProfileStats(query.data);
  const remove = useDeleteAccount();
  const [word, setWord] = useState('');

  const header = (
    <PageHeader
      title={tSettings('danger.delete')}
      subtitle={tSettings('danger.text')}
      backHref={paths.settings}
      backLabel={tSettings('back')}
    />
  );

  if (query.isPending) {
    return (
      <>
        {header}
        <Shimmer
          label={t('loading')}
          className="flex w-full max-w-[560px] flex-col gap-5 rounded-xl bg-surface p-5 md:p-8"
        >
          <Bone w={64} h={64} r="pill" />
          <Bone w="90%" h={26} r="sm" />
          <Bone w="100%" h={46} r="xs" />
          <Bone w="100%" h={132} r="lg" />
          <Bone w="100%" h={56} r="md" />
          <div className="flex gap-3">
            <Bone w={110} h={52} r="pill" />
            <Bone w={150} h={52} r="pill" />
          </div>
        </Shimmer>
      </>
    );
  }

  if (query.isError || !query.data) {
    return (
      <>
        {header}
        <ErrorState
          failure={query.error}
          title={t('error.title')}
          message={query.error ? failureMessage(query.error) : undefined}
          onRetry={() => void query.refetch()}
          retryLabel={t('retry')}
        />
      </>
    );
  }

  const card = primaryCard(query.data);
  const coupons = stats.coupons;
  const ready = isConfirmed(word) && !remove.isPending;

  const submit = async () => {
    if (!ready) return;
    const confirmed = await confirmDialog({
      title: t('delete.dialog.title'),
      body: t('delete.dialog.body'),
      confirmLabel: t('delete.submit'),
      cancelLabel: t('cancel'),
      destructive: true,
    });
    if (!confirmed) return;
    try {
      await remove.mutateAsync();
      // The hook has already cleared the session; both destructive flows end at /login.
      router.replace(paths.login);
    } catch {
      // The session is untouched and the failure is rendered below the form.
    }
  };

  return (
    <>
      {header}

      <section className="flex w-full max-w-[560px] flex-col gap-5 rounded-xl bg-surface p-5 md:p-8">
        <span className="grid size-16 place-items-center rounded-pill bg-brand-soft">
          <TriangleAlert size={28} aria-hidden="true" className="text-brand" />
        </span>

        <div className="flex flex-col gap-2">
          <h2 className="m-0 text-[26px] font-extrabold leading-[1.2] tracking-[-0.02em] text-ink">
            {t('delete.title')}
          </h2>
          <p className="m-0 text-body-sm font-normal leading-[1.5] text-ink2">
            {t('delete.body')}
          </p>
        </div>

        <ul className="m-0 flex list-none flex-col gap-3.5 rounded-lg bg-bg p-5">
          {card ? (
            <li className="flex items-center gap-3">
              <Wallet size={20} aria-hidden="true" className="shrink-0 text-brand" />
              <span className="text-body-sm font-semibold text-ink">
                {t('delete.loss.balance', { amount: format.money(card.bonus) })}
              </span>
            </li>
          ) : null}
          {coupons !== null ? (
            <li className="flex items-center gap-3">
              <Ticket size={20} aria-hidden="true" className="shrink-0 text-brand" />
              <span className="text-body-sm font-semibold text-ink">
                {t('delete.loss.coupons', { count: coupons })}
              </span>
            </li>
          ) : null}
          <li className="flex items-center gap-3">
            <CircleAlert size={20} aria-hidden="true" className="shrink-0 text-brand" />
            <span className="text-body-sm font-semibold text-ink">{t('delete.loss.card')}</span>
          </li>
        </ul>

        <div className="flex flex-col gap-2">
          <label htmlFor="delete-confirm" className="text-caption font-semibold text-ink2">
            {t('delete.confirmLabel')}
          </label>
          <Input
            id="delete-confirm"
            value={word}
            onChange={(event) => setWord(event.target.value)}
            placeholder={t('delete.confirmPlaceholder')}
            autoComplete="off"
            spellCheck={false}
            containerClassName="bg-bg"
            aria-describedby="delete-confirm-hint"
          />
          <p id="delete-confirm-hint" className="m-0 text-caption font-normal text-ink3">
            {t('delete.confirmHint')}
          </p>
        </div>

        {remove.error ? (
          <p role="alert" className="m-0 text-caption font-semibold text-brand">
            {failureMessage(remove.error)}
          </p>
        ) : null}

        {/* Announced as soon as the screen is reachable: this action is destructive. */}
        <p role="status" className="sr-only">
          {t('delete.announce')}
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <Button as="a" href={paths.settings} variant="ghost" className="border-transparent">
            {t('cancel')}
          </Button>
          <Button
            variant="brand"
            onClick={() => void submit()}
            disabled={!ready}
            loading={remove.isPending}
          >
            {t('delete.submit')}
          </Button>
        </div>
      </section>

    </>
  );
}
