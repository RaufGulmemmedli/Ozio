'use client';

/**
 * `/lottery/tickets/[id]` — "Lotereya · Bilet" (`app-lotereya-bilet.html`, frame `oOZso`).
 *
 * Layout: Back Link → Detail Row (gap 32) with the big ticket card on the left and the
 * 400-wide right column holding the "Çəkiliş mərhələləri" timeline card (radius 36,
 * padding 32, gap 22; 36px dots) plus "Daha bilet al" (brand 52) and "Paylaş" (soft 52).
 *
 * Changes forced by the API:
 *   · "Daha bilet al" cannot buy anything — there is no ticket-purchase endpoint and
 *     tickets are earned from receipts, so it explains how (`details.amount`) and links to
 *     the market;
 *   · the timeline's "Nəticələr elan olunur 1 Dek" step keeps its place but carries **no
 *     date**: no endpoint sends a results-announcement date;
 *   · the "Ödəniş 2,00 ₼ bonus" fact is gone (see `<LotteryTicketCard>`).
 */
import { useTranslations } from 'next-intl';

import { useFailureMessage, useFormat } from '@/core/i18n';
import { Link } from '@/core/i18n/navigation';
import { shareOrCopy } from '@/core/lib/clipboard';
import { cn } from '@/core/lib/cn';
import { paths } from '@/core/routes';
import { ArrowLeft, Check, SearchX, Share2 } from '@/shared/lucide';
import { EmptyState, ErrorState } from '@/shared/states';
import { Button, toast } from '@/shared/ui';

import { LinkButton } from '../components/link-button';
import { LotteryTicketCard } from '../components/lottery-ticket-card';
import { useNow } from '../components/use-now';
import { useActiveLottery, useLotteryDetails, useTicket } from '../hooks/use-lottery';
import { TicketDetailSkeleton } from './TicketDetailSkeleton';

export interface TicketDetailViewProps {
  id: string;
  variant?: 'page' | 'modal';
}

interface Step {
  key: string;
  title: string;
  date: string | null;
  state: 'done' | 'current' | 'todo';
}

export function TicketDetailView({ id, variant = 'page' }: TicketDetailViewProps) {
  const t = useTranslations('lottery');
  const tc = useTranslations('common');
  const { date, money } = useFormat();
  const failureMessage = useFailureMessage();

  // The timeline's "draw" step flips to done the moment the draw passes; the clock is read from
  // the shared store, never with `Date.now()` during render.
  const now = useNow();

  const active = useActiveLottery();
  const lottery = active.data?.lottery ?? null;
  const details = useLotteryDetails(lottery?.id);
  const ticket = useTicket(lottery?.id, id);

  if (active.isPending || ticket.isPending) return <TicketDetailSkeleton label={tc('loading')} />;

  const failure = active.error ?? ticket.error;
  if (failure) {
    return (
      <ErrorState
        failure={failure}
        title={tc('error.generic.title')}
        message={failureMessage(failure)}
        retryLabel={tc('retry')}
        onRetry={() => (active.isError ? active.refetch() : ticket.refetch())}
        secondaryAction={
          <LinkButton href={paths.lotteryTickets} variant="soft" size="lg">
            {t('tickets.title')}
          </LinkButton>
        }
      />
    );
  }

  if (!ticket.data) {
    return (
      <EmptyState
        icon={SearchX}
        title={t('ticket.notFound.title')}
        body={t('ticket.notFound.body')}
        panel
        action={
          <LinkButton href={paths.lotteryTickets} variant="primary" size="lg">
            {t('tickets.title')}
          </LinkButton>
        }
      />
    );
  }

  const row = ticket.data;
  const draw = details.data ?? null;
  const drawAt = row.drawAt ?? draw?.endsAt ?? null;
  // `now === 0` is "the clock has not been read yet" — the draw has not passed as far as this
  // render knows, which is also what the server would have rendered.
  const drawPassed = drawAt && now > 0 ? drawAt.at.getTime() <= now : false;

  const steps: Step[] = [
    {
      key: 'earned',
      title: t('timeline.earned'),
      date: row.createdAt
        ? `${date(row.createdAt.at, 'dayMonth')}, ${date(row.createdAt.at, 'time')}`
        : null,
      state: 'done',
    },
    {
      key: 'accepted',
      title: t('timeline.accepted'),
      date: row.createdAt ? date(row.createdAt.at, 'dayMonth') : null,
      state: 'done',
    },
    {
      key: 'draw',
      title: t('timeline.draw'),
      date: drawAt ? `${date(drawAt.at, 'dayMonth')}, ${date(drawAt.at, 'time')}` : null,
      state: drawPassed ? 'done' : 'current',
    },
    {
      // No endpoint sends a results-announcement date, so this step has no date.
      key: 'results',
      title: t('timeline.results'),
      date: null,
      state: drawPassed ? 'current' : 'todo',
    },
  ];

  async function handleShare() {
    const label = row.number ? `№ ${row.number}` : row.code;
    const result = await shareOrCopy({
      title: t('ticket.shareTitle'),
      text: t('ticket.shareText', { number: label, draw: draw?.name || lottery?.name || '' }),
      url: typeof window === 'undefined' ? undefined : window.location.href,
    });
    if (result === 'copied') toast.success(t('ticket.shareCopied'));
    else if (result === 'failed') toast.error(t('ticket.shareFailed'));
  }

  return (
    <>
      {variant === 'page' ? (
        <Link
          href={paths.lottery}
          className="flex w-fit flex-row items-center gap-2 text-body-sm font-semibold text-ink2 hover:text-ink"
        >
          <ArrowLeft size={18} aria-hidden="true" />
          {t('title')}
        </Link>
      ) : null}

      <div className="flex w-full flex-col gap-8 lg:flex-row">
        <LotteryTicketCard
          ticket={row}
          details={draw}
          drawName={lottery?.name}
          titleAs={variant === 'modal' ? 'h2' : 'h1'}
          className="min-w-0 flex-1"
        />

        <div className="flex w-full flex-col gap-4 lg:w-[400px] lg:shrink-0">
          <section className="flex w-full flex-col gap-[22px] rounded-bento border border-line bg-surface p-8">
            <h2 className="text-[22px] font-bold text-ink">{t('timeline.title')}</h2>
            <ol className="flex w-full list-none flex-col gap-[22px] p-0">
              {steps.map((step) => (
                <li key={step.key} className="flex w-full flex-row items-center gap-4">
                  <span
                    aria-hidden="true"
                    className={cn(
                      'grid size-9 shrink-0 place-items-center rounded-pill',
                      step.state === 'done'
                        ? 'bg-success text-white'
                        : step.state === 'current'
                          ? 'bg-brand text-white'
                          : 'bg-surface2 text-ink3',
                    )}
                  >
                    {step.state === 'done' ? (
                      <Check size={18} strokeWidth={3} />
                    ) : (
                      <span className="size-2.5 rounded-pill bg-current" />
                    )}
                  </span>
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span
                      className={cn(
                        'text-body',
                        step.state === 'current' ? 'font-extrabold text-ink' : 'font-semibold',
                        step.state === 'todo' ? 'text-ink3' : 'text-ink',
                      )}
                    >
                      {step.title}
                    </span>
                    {step.date ? (
                      <span className="text-caption text-ink3">{step.date}</span>
                    ) : null}
                  </span>
                </li>
              ))}
            </ol>
          </section>

          <section className="flex w-full flex-col gap-3 rounded-bento border border-line bg-surface p-7">
            <h2 className="text-body-l font-bold text-ink">{t('earn.title')}</h2>
            <p className="text-body-sm text-ink2">
              {draw?.amountPerTicket
                ? t('earn.bodyWithAmount', { amount: money(draw.amountPerTicket) })
                : t('earn.body')}
            </p>
            <LinkButton href={paths.market} variant="brand" size="xl" fullWidth>
              {t('earn.action')}
            </LinkButton>
            <Button
              variant="soft"
              size="xl"
              fullWidth
              onClick={handleShare}
              leadingIcon={<Share2 size={18} aria-hidden="true" />}
            >
              {tc('share')}
            </Button>
          </section>
        </div>
      </div>
    </>
  );
}
