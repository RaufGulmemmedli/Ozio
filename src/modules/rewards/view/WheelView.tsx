'use client';

/**
 * N1 — `Web · Çarx` (`wheel.html`), its result modal (`wheel-result.html`), its loading skeleton
 * (`wheel-loading.html`) and the daily-limit state (`wheel-limit-reached.html`).
 *
 * How a spin works, in order:
 *   1. the user presses "Fırlat" (or the hub);
 *   2. for the 2nd spin of the day a confirm dialog states the cost first;
 *   3. `useSpin()` posts to `/api/mock/rewards/wheel/spin` — **the handler draws the prize**;
 *   4. the answer carries `index`, and only then does `<PrizeWheel>` animate to that slice;
 *   5. when the wheel stops the result modal opens and `aria-live` announces the prize.
 *
 * The 1/2 counter and the "no spins left" state are whatever the API last said; nothing is counted
 * in the browser.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';

import { cn } from '@/core/lib/cn';
import { useFormat } from '@/core/i18n';
import { Link } from '@/core/i18n/navigation';
import { useFailureMessage } from '@/core/i18n/failure-message';
import { paths } from '@/core/routes';
import { ChevronRight, Sparkles, Trophy } from '@/shared/lucide';
import { EmptyState, ErrorState } from '@/shared/states';
import { Button, ConfirmDialog, Modal } from '@/shared/ui';

import { LinkButton } from '../components/link-button';
import { PrizeWheel, spinRevealDelayMs } from '../components/prize-wheel';
import { RewardsPage } from '../components/rewards-page';
import { StateCard } from '../components/state-card';
import {
  wheelCanSpin,
  wheelNextCost,
  wheelNextIsPaid,
  wheelPrizeIsMoney,
  type WheelDay,
  type WheelSegment,
  type WheelSpinResult,
  type WheelState,
} from '../data/models/wheel';
import { useSpin, useWheel } from '../hooks/use-wheel';
import { useAutoSpinPreview } from '../hooks/use-rewards-preview';
import { WheelSkeleton } from './WheelSkeleton';

/* ------------------------------------------------------------------ pieces */

function DayDot({ day, label }: { day: WheelDay; label: string }) {
  const isToday = day.state === 'today';
  return (
    <div className="flex flex-col items-center gap-1.5">
      <span
        className={cn(
          'flex size-9 items-center justify-center rounded-pill text-label font-extrabold',
          day.state === 'done' && 'bg-success text-white',
          isToday && 'bg-brand text-white',
          day.state === 'pending' && 'bg-surface2 text-ink3',
        )}
      >
        {isToday && day.streak !== null ? day.streak : null}
      </span>
      <span className={cn('text-micro font-semibold', isToday ? 'text-ink' : 'text-ink3')}>
        {label}
      </span>
    </div>
  );
}

function PrizeLegend({
  segments,
  labels,
  title,
}: {
  segments: WheelSegment[];
  labels: string[];
  title: string;
}) {
  const DOT: Record<WheelSegment['tone'], string> = {
    brand: 'bg-brand',
    yellow: 'bg-yellow',
    sky: 'bg-sky-soft',
    violet: 'bg-violet-soft',
    success: 'bg-success-soft',
  };

  return (
    <section className="flex w-full flex-col gap-4 rounded-xl bg-surface p-6">
      <h2 className="text-body font-extrabold text-ink">{title}</h2>
      <ul className="grid grid-cols-1 gap-x-3 gap-y-2.5 sm:grid-cols-2">
        {segments.map((segment, index) => (
          <li key={segment.id} className="flex min-w-0 flex-row items-center gap-2">
            <span
              aria-hidden="true"
              className={cn('size-[14px] shrink-0 rounded-pill', DOT[segment.tone])}
            />
            <span className="truncate text-caption font-semibold text-ink2">
              {labels[index] ?? segment.label}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* -------------------------------------------------------------------- view */

export function WheelView() {
  const t = useTranslations('rewards');
  const locale = useLocale();
  const format = useFormat();
  const failureMessage = useFailureMessage();

  const query = useWheel();
  const spin = useSpin();

  const [spinToken, setSpinToken] = useState(0);
  const [pending, setPending] = useState<WheelSpinResult | null>(null);
  const [result, setResult] = useState<WheelSpinResult | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [announcement, setAnnouncement] = useState('');

  const board = query.data;

  /** The slice label: money for `bonus` slices, the fixture's wording otherwise. */
  const labelOf = useCallback(
    (segment: WheelSegment) =>
      wheelPrizeIsMoney(segment) ? format.money(segment.value) : segment.label,
    [format],
  );

  const labels = useMemo(
    () => (board?.segments ?? []).map(labelOf),
    [board?.segments, labelOf],
  );

  /**
   * Spin, then reveal. The handler draws the prize, the wheel animates to the slice it named, and
   * the result modal opens once the wheel has stopped — `spinRevealDelayMs()` is 0 under
   * `prefers-reduced-motion`, where the wheel does not animate at all.
   */
  const revealTimer = useRef<number | null>(null);

  const startSpin = useCallback(
    (current: WheelState) => {
      setResult(null);
      setAnnouncement(t('wheel.spinning'));
      spin.mutate(current, {
        onSuccess: (answer) => {
          setPending(answer);
          setSpinToken((token) => token + 1);
          if (revealTimer.current !== null) window.clearTimeout(revealTimer.current);
          revealTimer.current = window.setTimeout(() => {
            revealTimer.current = null;
            setResult(answer);
            setAnnouncement(t('wheel.announce', { prize: labelOf(answer.segment) }));
          }, spinRevealDelayMs());
        },
        onError: () => {
          setAnnouncement('');
        },
      });
    },
    [spin, t, labelOf],
  );

  useEffect(
    () => () => {
      if (revealTimer.current !== null) window.clearTimeout(revealTimer.current);
    },
    [],
  );

  const onSpinPressed = useCallback(() => {
    if (!board || !wheelCanSpin(board) || spin.isPending) return;
    if (wheelNextIsPaid(board)) {
      setConfirmOpen(true);
      return;
    }
    startSpin(board);
  }, [board, spin.isPending, startSpin]);

  // `?preview=result` — spin once on mount so the result modal is screenshot-able from the URL.
  const autoSpin = useAutoSpinPreview();
  const autoSpun = useRef(false);
  useEffect(() => {
    if (!autoSpin || autoSpun.current || !board || !wheelCanSpin(board)) return;
    autoSpun.current = true;
    startSpin(board);
  }, [autoSpin, board, startSpin]);

  /* ---------------------------------------------------------- page states */

  const crumbs = [
    { label: t('crumb.root'), href: paths.card },
    { label: t('wheel.crumb') },
  ];

  const page = (subtitle: string, children: React.ReactNode) => (
    <RewardsPage
      crumbs={crumbs}
      crumbsLabel={t('crumb.root')}
      title={t('wheel.title')}
      subtitle={subtitle}
      demoModule={t('demo.module')}
    >
      {children}
    </RewardsPage>
  );

  if (query.isPending) {
    return page(t('wheel.subtitle'), <WheelSkeleton label={t('loading')} />);
  }

  if (query.isError || !board) {
    return page(
      t('subtitle.error'),
      <StateCard>
        <ErrorState
          failure={query.error}
          title={t('wheel.error.title')}
          message={query.error ? failureMessage(query.error) : t('error.body')}
          retryLabel={t('retry')}
          onRetry={() => query.refetch()}
        />
      </StateCard>,
    );
  }

  if (board.segments.length === 0) {
    return page(
      t('wheel.subtitle'),
      <StateCard>
        <EmptyState
          icon={Sparkles}
          tone="brand"
          title={t('wheel.empty.title')}
          body={t('wheel.empty.body')}
          action={
            <LinkButton href={paths.rewardsMissions}>{t('missions.crumb')}</LinkButton>
          }
        />
      </StateCard>,
    );
  }

  const canSpin = wheelCanSpin(board);
  const cost = wheelNextCost(board);
  const paid = wheelNextIsPaid(board);
  const spinLabel = paid
    ? t('wheel.spin.paid', { cost: format.money(cost) })
    : t('wheel.spin.free');

  return (
    <>
      {page(
        t('wheel.subtitle'),
        <div className="flex w-full flex-col gap-6 lg:flex-row">
          {/* Wheel Block */}
          <section className="flex min-h-[520px] flex-1 flex-col gap-6 overflow-hidden rounded-bento bg-block p-6 md:p-8 lg:min-h-[700px]">
            <div className="flex flex-col gap-1.5">
              <h2 className="text-h3 font-extrabold text-on-block">{t('wheel.block.title')}</h2>
              <p className="text-label text-on-block2">{t('wheel.block.sub')}</p>
            </div>

            <div className="flex flex-1 items-center justify-center pt-6">
              <PrizeWheel
                segments={board.segments}
                labels={labels}
                targetIndex={pending?.index ?? null}
                spinToken={spinToken}
                onSpin={canSpin ? onSpinPressed : undefined}
                spinDisabled={!canSpin || spin.isPending}
                wheelLabel={t('wheel.alt', { labels: labels.join(', ') })}
                hubLabel={t('wheel.hub')}
                hubAriaLabel={spinLabel}
              />
            </div>

            {/* The spin result and the spinning state, announced for screen readers. */}
            <p aria-live="polite" className="sr-only">
              {announcement}
            </p>
          </section>

          {/* Side column */}
          <div className="flex w-full flex-col gap-4 lg:w-[400px] lg:shrink-0">
            <section className="flex w-full flex-col gap-4 rounded-xl bg-surface p-6">
              <div className="flex flex-row items-center justify-between gap-3">
                <h2 className="text-h4 font-extrabold text-ink">{t('wheel.today')}</h2>
                <span className="shrink-0 rounded-pill bg-brand-soft px-3 py-1.5 text-caption font-bold text-brand-dark">
                  {t('wheel.spinCount', { used: board.spinsUsed, max: board.maxSpins })}
                </span>
              </div>

              <div className="flex flex-row items-start justify-between">
                {board.streak.map((day) => (
                  <DayDot key={day.weekday} day={day} label={t(`wheel.day.${day.weekday}`)} />
                ))}
              </div>

              <p className="text-label text-ink2">{t('wheel.streakHint')}</p>
            </section>

            <section className="flex w-full flex-col gap-4 rounded-xl bg-brand p-6">
              <h2 className="text-h4 font-extrabold text-white">
                {canSpin ? t('wheel.next.title') : t('wheel.limit.title')}
              </h2>
              <p className="text-label text-white">
                {canSpin
                  ? paid
                    ? t('wheel.next.body', { cost: format.money(board.paidSpinCost) })
                    : t('wheel.next.free')
                  : t('wheel.limit.body')}
              </p>
              {canSpin ? (
                <button
                  type="button"
                  onClick={onSpinPressed}
                  disabled={spin.isPending}
                  className={cn(
                    'flex h-14 w-full items-center justify-center rounded-pill bg-white',
                    'text-body font-extrabold text-brand-dark transition-opacity',
                    'disabled:opacity-70',
                  )}
                >
                  {spin.isPending ? t('wheel.spinning') : spinLabel}
                </button>
              ) : (
                <span
                  aria-disabled="true"
                  className="flex h-14 w-full items-center justify-center rounded-pill bg-white/20 text-body font-bold text-white"
                >
                  {t('wheel.limit.cta')}
                </span>
              )}
            </section>

            <PrizeLegend
              segments={board.segments}
              labels={labels}
              title={t('wheel.prizes')}
            />

            <Link
              href={paths.notifications}
              className="flex w-full flex-row items-center justify-between gap-3 px-2 py-1 text-label font-bold text-brand-dark hover:underline"
            >
              {t('wheel.feedLink')}
              <ChevronRight size={18} aria-hidden="true" />
            </Link>

            {spin.isError && spin.error ? (
              <ErrorState
                compact
                title={t('wheel.spinFailed')}
                message={failureMessage(spin.error)}
                retryLabel={t('retry')}
                onRetry={() => startSpin(board)}
              />
            ) : null}
          </div>
        </div>,
      )}

      {/* Paid-spin confirm (mobile `wheelPaidTitle/Body/Confirm`). */}
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={t('wheel.paid.title')}
        body={t('wheel.paid.body', { cost: format.money(board.paidSpinCost) })}
        confirmLabel={t('wheel.paid.confirm')}
        cancelLabel={t('wheel.result.ok')}
        icon={Sparkles}
        busy={spin.isPending}
        onConfirm={() => {
          setConfirmOpen(false);
          startSpin(board);
        }}
      />

      {/* Result modal (`wheel-result.html`) */}
      <Modal
        open={result !== null}
        onOpenChange={(open) => {
          if (!open) setResult(null);
        }}
        title={t('wheel.result.title')}
        titleHidden
        hideClose
        size="s"
      >
        {result ? (
          <div className="flex flex-col items-center gap-4 text-center">
            <span
              aria-hidden="true"
              className="flex size-24 items-center justify-center rounded-pill bg-yellow"
            >
              <Trophy size={48} className="text-on-yellow" />
            </span>
            <p className="text-h2 font-extrabold text-ink">{t('wheel.result.title')}</p>
            <p
              className="text-[48px] font-extrabold leading-none tracking-[-0.04em] text-brand md:text-[64px]"
              lang={locale}
            >
              {labelOf(result.segment)}
            </p>
            <p className="max-w-[388px] text-body-sm text-ink2">{t('wheel.result.body')}</p>

            <Button variant="primary" fullWidth size="2xl" onClick={() => setResult(null)}>
              {t('wheel.result.ok')}
            </Button>

            {wheelCanSpin({ ...board, spinsUsed: result.spinsUsed }) ? (
              <button
                type="button"
                onClick={() => {
                  setResult(null);
                  startSpin({ ...board, spinsUsed: result.spinsUsed });
                }}
                className="flex h-11 w-full items-center justify-center text-body-sm font-bold text-brand-dark hover:underline"
              >
                {t('wheel.result.again', { cost: format.money(board.paidSpinCost) })}
              </button>
            ) : null}
          </div>
        ) : null}
      </Modal>
    </>
  );
}
