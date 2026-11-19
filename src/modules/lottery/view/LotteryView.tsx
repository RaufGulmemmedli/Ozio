'use client';

/**
 * `/lottery` — "Lotereya" (`app-lotereya.html`, frame `e8Qeq`).
 *
 * Layout from the export: Page Header → Draw Row (gap 24) with the `block` Active Draw
 * panel (radius 48, padding 48, gap 28) on the left and the 400-wide right column
 * ("Biletlərim" card + ticket panel) on the right → a previous-winners section.
 *
 * ────────────────────────────────────────────────────────────────────────────────────────
 * What the API gives this screen, and what it does not:
 *
 *   `GET v1/lotteries/active`  → `{ticketsCount, activeLottery{id, name, uploads}}`
 *   `GET v1/lotteries/active/details?lottery_id=` → name, `amount`, start/end date,
 *        organiser block, `lottery_prizes[{name, quantity, image}]`
 *   `GET v1/lotteries/tickets?lottery_id=` → the user's tickets (row shape unobserved)
 *
 * NOT rendered, because nothing in the API carries it:
 *   · the "· AKTİV" status half of the yellow draw label — there is no `status` field
 *   · "Baş mükafat 5 000 ₼" as a money figure — a prize has a name and a quantity, never
 *     an amount; the top prize's **name** is shown at that size instead
 *   · "12 480 bilet satılıb" — no global sold-ticket count exists (`ticketsCount` is the
 *     signed-in user's own tickets, which the right column already shows)
 *   · the whole "Bilet al" purchase panel — stepper, "2,00 ₼ bonus / bilet", bonus balance
 *     and the buy button. **There is no ticket-purchase endpoint**, and tickets are earned
 *     from receipts (`details.amount` = the receipt sum that earns one), so the panel
 *     explains how to earn one and links to the market instead of posting anywhere.
 *   · "Əvvəlki qaliblər" with named winners — winners are never sent by any endpoint; the
 *     section keeps its place and carries an honest empty state.
 */
import { useTranslations } from 'next-intl';

import { useFailureMessage, useFormat } from '@/core/i18n';
import { Link } from '@/core/i18n/navigation';
import { paths } from '@/core/routes';
import { ArrowRight, Calendar, FileText, Gift, Trophy } from '@/shared/lucide';
import { EmptyState, ErrorState } from '@/shared/states';
import { PageHeader } from '@/shared/layout';

import { Countdown } from '../components/countdown';
import { LinkButton } from '../components/link-button';
import { PrizeRow } from '../components/prize-card';
import { TicketRow } from '../components/lottery-ticket-card';
import { isDrawDone, totalPrizeCount } from '../data/models/lottery';
import { useActiveLottery, useLotteryDetails, useTickets } from '../hooks/use-lottery';
import { LotterySkeleton } from './LotterySkeleton';

/** How many ticket rows the right column shows before the "all tickets" link. */
const TICKET_PREVIEW = 3;

export function LotteryView() {
  const t = useTranslations('lottery');
  const tc = useTranslations('common');
  const { date, money } = useFormat();
  const failureMessage = useFailureMessage();

  const active = useActiveLottery();
  const lottery = active.data?.lottery ?? null;
  const details = useLotteryDetails(lottery?.id);
  const tickets = useTickets(lottery?.id, TICKET_PREVIEW);

  const draw = details.data ?? null;
  const prizes = draw?.prizes ?? [];
  const topPrize = prizes[0] ?? null;
  const done = isDrawDone(draw);

  const header = (
    <PageHeader
      title={t('title')}
      subtitle={t('subtitle')}
      actions={
        <LinkButton href={paths.lotteryRules} variant="soft" size="lg">
          {t('nav.rules')}
        </LinkButton>
      }
    />
  );

  if (active.isPending) {
    return (
      <>
        {header}
        <LotterySkeleton label={tc('loading')} />
      </>
    );
  }

  if (active.isError) {
    return (
      <>
        {header}
        <ErrorState
          failure={active.error}
          title={tc('error.generic.title')}
          message={failureMessage(active.error)}
          retryLabel={tc('retry')}
          onRetry={() => active.refetch()}
        />
      </>
    );
  }

  if (!lottery) {
    return (
      <>
        {header}
        <EmptyState
          icon={Trophy}
          tone="brand"
          title={t('empty.title')}
          body={t('empty.body')}
          panel
          action={
            <LinkButton href={paths.lotteryRules} variant="primary" size="lg">
              {t('nav.rules')}
            </LinkButton>
          }
          secondaryAction={
            <LinkButton href={paths.lotteryResults} variant="soft" size="lg">
              {t('nav.results')}
            </LinkButton>
          }
        />
      </>
    );
  }

  return (
    <>
      {header}

      <div className="flex w-full flex-col gap-6 lg:flex-row">
        {/* Active Draw */}
        <section className="flex min-w-0 flex-1 flex-col justify-center gap-7 rounded-2xl bg-block p-8 md:p-12">
          <span className="inline-flex h-8 w-fit items-center rounded-pill bg-yellow px-4 text-caption font-bold tracking-wide text-on-yellow uppercase">
            {lottery.name || t('draw.fallbackName')}
          </span>

          <div className="flex flex-col gap-1">
            <p className="text-body text-on-block2">{t('draw.topPrize')}</p>
            {/* A prize has no amount in the API — this is its name, at the hero size. */}
            <p className="text-h1 leading-none font-extrabold break-words text-on-block md:text-display">
              {topPrize?.name || lottery.name || t('prizes.unnamed')}
            </p>
            {prizes.length > 1 ? (
              <p className="mt-1 text-h4 font-medium text-on-block">
                {t('draw.morePrizes', { count: totalPrizeCount(prizes.slice(1)) })}
              </p>
            ) : null}
          </div>

          {details.isPending ? null : done ? (
            <p className="text-body-sm text-on-block2">{t('draw.finished')}</p>
          ) : (
            <Countdown target={draw?.endsAt?.at ?? null} />
          )}

          <div className="flex flex-col gap-2">
            {draw?.endsAt ? (
              <p className="flex flex-row items-center gap-[10px] text-body-sm text-on-block2">
                <Calendar size={16} aria-hidden="true" />
                <span>
                  {t('draw.drawDate', {
                    date: date(draw.endsAt.at, 'long'),
                    time: date(draw.endsAt.at, 'time'),
                  })}
                </span>
              </p>
            ) : null}
            {draw?.organizer ? (
              <p className="text-caption text-on-block3">
                {t('draw.organizer', { name: draw.organizer })}
              </p>
            ) : null}
          </div>

          <div className="flex flex-row flex-wrap gap-3">
            <LinkButton href={paths.lotteryPrizes} variant="white" size="lg">
              {t('nav.prizes')}
            </LinkButton>
            <LinkButton href={paths.lotteryResults} variant="ghost" size="lg" className="text-on-block">
              {t('nav.results')}
            </LinkButton>
          </div>
        </section>

        {/* Right column */}
        <div className="flex w-full flex-col gap-4 lg:w-[400px] lg:shrink-0">
          <section className="flex w-full flex-col gap-4 rounded-bento border border-line bg-surface p-7">
            <div className="flex w-full flex-row items-center justify-between gap-3">
              <h2 className="text-[22px] font-bold text-ink">{t('myTickets.title')}</h2>
              <span className="inline-flex h-[30px] shrink-0 items-center rounded-pill bg-brand-soft px-[14px] text-caption font-bold text-brand">
                {t('myTickets.count', { count: active.data?.myTickets ?? 0 })}
              </span>
            </div>

            {tickets.isPending ? (
              <p className="text-body-sm text-ink3">{tc('loading')}</p>
            ) : tickets.error ? (
              <ErrorState
                compact
                failure={tickets.error}
                message={failureMessage(tickets.error)}
                retryLabel={tc('retry')}
                onRetry={() => tickets.refetch()}
              />
            ) : tickets.items.length === 0 ? (
              <p className="text-body-sm text-ink2">
                {draw?.amountPerTicket
                  ? t('myTickets.emptyWithAmount', { amount: money(draw.amountPerTicket) })
                  : t('myTickets.empty')}
              </p>
            ) : (
              <ul className="flex w-full list-none flex-col gap-3 p-0">
                {tickets.items.slice(0, TICKET_PREVIEW).map((ticket) => (
                  <li key={ticket.id}>
                    <TicketRow
                      ticket={ticket}
                      drawName={lottery.name}
                      href={paths.lotteryTicket(ticket.id)}
                    />
                  </li>
                ))}
              </ul>
            )}

            <Link
              href={paths.lotteryTickets}
              className="flex w-fit flex-row items-center gap-2 text-body-sm font-semibold text-brand hover:underline"
            >
              {t('myTickets.seeAll')}
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </section>

          {/*
            The export's "Bilet al" panel (quantity stepper + bonus price + buy button) is
            replaced by this one: there is no purchase endpoint, and a ticket is earned by
            spending `details.amount` in one receipt.
          */}
          <section className="flex w-full flex-col gap-[18px] rounded-bento border border-line bg-surface p-7">
            <h2 className="text-[22px] font-bold text-ink">{t('earn.title')}</h2>
            <p className="text-body-sm text-ink2">
              {draw?.amountPerTicket
                ? t('earn.bodyWithAmount', { amount: money(draw.amountPerTicket) })
                : t('earn.body')}
            </p>
            <LinkButton href={paths.market} variant="brand" size="xl" fullWidth>
              {t('earn.action')}
            </LinkButton>
          </section>
        </div>
      </div>

      {/* Previous winners — no endpoint sends them. */}
      <section className="flex w-full flex-col gap-2 rounded-bento border border-line bg-surface p-8">
        <div className="flex w-full flex-row items-center justify-between gap-3 pb-3">
          <h2 className="text-h3 font-bold text-ink">{t('winners.title')}</h2>
          <Link
            href={paths.lotteryResults}
            className="text-body-sm font-semibold text-brand hover:underline"
          >
            {tc('seeAll')}
          </Link>
        </div>
        <EmptyState
          compact
          icon={Gift}
          title={t('winners.empty.title')}
          body={t('winners.empty.body')}
        />
      </section>

      {draw && (draw.organizer || draw.address || draw.phone || draw.vatNumber) ? (
        <section className="flex w-full flex-col gap-2 rounded-card border border-line bg-surface p-6">
          <h2 className="flex flex-row items-center gap-2 text-body-l font-bold text-ink">
            <FileText size={18} aria-hidden="true" className="text-ink3" />
            {t('organizer.title')}
          </h2>
          <dl className="flex w-full flex-col gap-1 text-body-sm text-ink2">
            {draw.organizer ? (
              <div className="flex flex-row gap-2">
                <dt className="text-ink3">{t('organizer.name')}:</dt>
                <dd>{draw.organizer}</dd>
              </div>
            ) : null}
            {draw.address ? (
              <div className="flex flex-row gap-2">
                <dt className="text-ink3">{t('organizer.address')}:</dt>
                <dd>{draw.address}</dd>
              </div>
            ) : null}
            {draw.phone ? (
              <div className="flex flex-row gap-2">
                <dt className="text-ink3">{t('organizer.phone')}:</dt>
                <dd>{draw.phone}</dd>
              </div>
            ) : null}
            {draw.vatNumber ? (
              <div className="flex flex-row gap-2">
                <dt className="text-ink3">{t('organizer.vat')}:</dt>
                <dd>{draw.vatNumber}</dd>
              </div>
            ) : null}
          </dl>
        </section>
      ) : null}

      {prizes.length > 0 ? (
        <section className="flex w-full flex-col gap-4 rounded-bento border border-line bg-surface p-8">
          <div className="flex w-full flex-row items-center justify-between gap-3">
            <h2 className="text-h3 font-bold text-ink">{t('prizes.title')}</h2>
            <Link
              href={paths.lotteryPrizes}
              className="text-body-sm font-semibold text-brand hover:underline"
            >
              {tc('seeAll')}
            </Link>
          </div>
          <ul className="flex w-full list-none flex-col gap-4 p-0">
            {prizes.slice(0, 4).map((prize, index) => (
              <PrizeRow key={`${prize.name}-${index}`} prize={prize} />
            ))}
          </ul>
        </section>
      ) : null}
    </>
  );
}
