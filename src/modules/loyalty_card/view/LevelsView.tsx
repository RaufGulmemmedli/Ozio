'use client';

/**
 * `/card/levels` — "Səviyyələr" (KT5), node `zsmaD` in
 * `html/app-profile/app-seviyyeler.html`.
 *
 * Content gap 32. Heading `SxIHV` (back link "Kart və bonus" + title 36/800 +
 * subtitle) -> Status `A29AWr` (`block` fill, r28, padding 32, gap 40:
 * "CARİ SƏVİYYƏN" 12/700 +1.5px over the tier in 40/800; the middle column with
 * "Gold səviyyəsinə 120 ₼ qalıb" 15/600, "1 380 / 1 500 ₼" 14/400 and a 10-high
 * track; a `yellow` 40-high percentage pill) -> Levels `ojCxQ` (four tier
 * cards, gap 16) -> Note `ZmQr5` (`info` glyph + 14/400 `ink2`).
 *
 * Below that sits the "Bonus yanır" (KT7) section — app-loyalty.md §9 routes it
 * to `/card/expiring`, which is not a registered path, so it ships here as
 * `#expiring`.
 *
 * **Everything on this screen is MSW fixture data**: the API sends no tier,
 * level, cashback percentage or expiry information at all, which is why the
 * route is behind `flag:loyaltyTiers` and why `<DemoBanner/>` is the first
 * thing in the content.
 */
import { useTranslations } from 'next-intl';

import { Link, useFailureMessage, useFormat } from '@/core/i18n';
import { paths } from '@/core/routes';
import { ArrowLeft, Info } from '@/shared/lucide';
import { DemoBanner, ErrorState } from '@/shared/states';

import { ExpiringBonusSection } from '../components/expiring-bonus-section';
import { LevelUpDialog } from '../components/level-up-dialog';
import { TierCard } from '../components/tier-card';
import { useLevelUp } from '../hooks/use-level-up';
import { useExpiringBonus, useTierLadder } from '../hooks/use-tier-ladder';
import { LOYALTY_DEMO_MODULE } from '../loyalty_card.flags';

import { LevelsSkeleton } from './LevelsSkeleton';

export function LevelsView() {
  const t = useTranslations('loyalty_card');
  const failureMessage = useFailureMessage();
  const { money } = useFormat();

  const { ladder, isPending, isError, error, refetch } = useTierLadder();
  const { expiring, isPending: expiringPending } = useExpiringBonus();
  const levelUp = useLevelUp(ladder);

  const heading = (
    <div className="flex w-full flex-col gap-2.5">
      <Link
        href={paths.card}
        className="flex w-fit items-center gap-2 rounded-sm text-label font-semibold text-ink2 hover:text-ink"
      >
        <ArrowLeft size={18} aria-hidden="true" />
        {t('levels.back')}
      </Link>
      <h1 className="m-0 text-[28px] font-bold leading-[1.2] tracking-[-0.02em] text-ink md:text-h2 lg:text-h1-app lg:font-extrabold">
        {t('levels.title')}
      </h1>
      <p className="m-0 max-w-[720px] text-body text-ink2">{t('levels.subtitle')}</p>
    </div>
  );

  if (isPending) {
    return (
      <>
        <DemoBanner module={LOYALTY_DEMO_MODULE} />
        {heading}
        <LevelsSkeleton />
      </>
    );
  }

  if (isError || !ladder) {
    return (
      <>
        <DemoBanner module={LOYALTY_DEMO_MODULE} />
        {heading}
        <ErrorState
          failure={error}
          title={t('levels.unavailable.title')}
          message={error ? failureMessage(error) : undefined}
          onRetry={refetch}
          retryLabel={t('error.retry')}
        />
      </>
    );
  }

  const current = ladder.tiers.find((tier) => tier.id === ladder.currentTierId);
  const next = ladder.tiers.find((tier) => tier.id === ladder.nextTierId);

  return (
    <>
      <DemoBanner module={LOYALTY_DEMO_MODULE} />

      {heading}

      <section
        aria-label={t('levels.current')}
        className="flex w-full flex-col gap-6 rounded-xl bg-block p-8 lg:flex-row lg:items-center lg:gap-10"
      >
        <div className="flex shrink-0 flex-col gap-1">
          <span className="text-micro font-bold tracking-[1.5px] text-on-block2">
            {t('levels.current')}
          </span>
          <span className="text-[40px] font-extrabold leading-none tracking-[-1px] text-on-block">
            {current?.name ?? ''}
          </span>
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <div className="flex w-full flex-row flex-wrap items-center justify-between gap-2">
            <span className="text-body-sm font-semibold text-on-block">
              {next
                ? t('levels.remaining', { tier: next.name, amount: money(ladder.remaining) })
                : t('levels.reachedTop')}
            </span>
            <span className="oz-num text-label text-on-block2">
              {t('levels.progressValue', {
                spend: money(ladder.spend),
                target: money(ladder.target),
              })}
            </span>
          </div>
          <div
            role="progressbar"
            aria-label={t('levels.progressLabel')}
            aria-valuenow={ladder.progressPercent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuetext={t('levels.progressValue', {
              spend: money(ladder.spend),
              target: money(ladder.target),
            })}
            className="h-[10px] w-full overflow-hidden rounded-[5px] bg-white/12"
          >
            <div
              className="h-full rounded-[5px] bg-brand transition-[width] duration-[var(--oz-dur-slow)] ease-[var(--oz-ease-out)] motion-reduce:transition-none"
              style={{ width: `${ladder.progressPercent}%` }}
            />
          </div>
        </div>

        <span className="flex h-10 shrink-0 items-center rounded-pill bg-yellow px-[18px] text-body font-extrabold text-on-yellow">
          {ladder.progressPercent}%
        </span>
      </section>

      <ul className="m-0 grid w-full list-none grid-cols-1 gap-4 ps-0 sm:grid-cols-2 xl:grid-cols-4">
        {ladder.tiers.map((tier) => (
          <TierCard key={tier.id} tier={tier} />
        ))}
      </ul>

      <p className="m-0 flex w-full flex-row items-start gap-2.5 text-label text-ink2">
        <Info size={18} aria-hidden="true" className="mt-0.5 shrink-0" />
        {t('levels.note')}
      </p>

      {!expiringPending && expiring ? <ExpiringBonusSection expiring={expiring} /> : null}

      <LevelUpDialog open={levelUp.open} tier={levelUp.tier} onAcknowledge={levelUp.acknowledge} />
    </>
  );
}
