'use client';

/**
 * `<LotteryTicketCard>` — the big ticket from `app-lotereya-bilet.html` (frame `oOZso`).
 *
 * Measured: `surface`, radius 36, 1px `line`; a `brand` Hero (padding 40, gap 12) with the
 * yellow draw tag 28, the caption 16/400 at white/80, the number 68/800 white and the prize
 * line 18/500 white; the 24-high perforation; then a Body (padding 24/40/40, gap 32) with
 * the facts column (gap 20, two facts per row, label 13/400 `ink3` over value 17/700 `ink`)
 * beside a 156px QR frame.
 *
 * Fields that stay out because `GET v1/lotteries/tickets` never showed them (the test
 * account holds no tickets, so the row shape is unobserved) and because tickets are
 * **earned from receipts, not bought**:
 *   · "Ödəniş 2,00 ₼ bonus"  — there is no purchase and no bonus price for a ticket
 *   · "Baş mükafat 5 000 ₼"  — prizes carry a name and a quantity, never an amount
 * Everything else is rendered only when the parsed row actually carried it.
 */
import { useTranslations } from 'next-intl';

import { useFormat } from '@/core/i18n';
import { Link } from '@/core/i18n/navigation';
import { cn } from '@/core/lib/cn';
import { Ticket } from '@/shared/lucide';
import { QrCodeView } from '@/shared/media';

import type { LotteryDetails, LotteryTicket, LotteryTicketStatus } from '../data/models/lottery';
import { TicketPerforation } from './perforation';

export interface LotteryTicketCardProps {
  ticket: LotteryTicket;
  /** Supplies the draw name and the draw date — the ticket row may carry neither. */
  details?: LotteryDetails | null;
  /** Draw name fallback from `lotteries/active` when details have not loaded. */
  drawName?: string;
  titleAs?: 'h1' | 'h2';
  className?: string;
}

const STATUS_PILL: Record<LotteryTicketStatus, string> = {
  pending: 'bg-success-soft text-success',
  won: 'bg-yellow text-on-yellow',
  lost: 'bg-surface2 text-ink2',
  unknown: 'bg-surface2 text-ink2',
};

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1">
      <dt className="text-caption text-ink3">{label}</dt>
      <dd className="text-[17px] leading-tight font-bold break-words text-ink">{children}</dd>
    </div>
  );
}

export function LotteryTicketCard({
  ticket,
  details,
  drawName,
  titleAs: Title = 'h1',
  className,
}: LotteryTicketCardProps) {
  const t = useTranslations('lottery');
  const { date, money } = useFormat();

  const name = details?.name || drawName || '';
  const number = ticket.number || ticket.code;
  const drawAt = ticket.drawAt ?? details?.endsAt ?? null;

  return (
    <article
      className={cn(
        'flex w-full flex-col overflow-hidden rounded-bento border border-line bg-surface',
        className,
      )}
    >
      <div className="flex w-full flex-col gap-3 bg-brand p-6 md:p-10">
        {name ? (
          <span className="inline-flex h-7 w-fit items-center rounded-pill bg-yellow px-3 text-caption font-bold text-on-yellow">
            {name}
          </span>
        ) : null}
        <p className="text-body text-white/80">{t('ticket.numberCaption')}</p>
        <Title className="text-h1 leading-none font-extrabold break-words text-white md:text-hero">
          {number ? `№ ${number}` : t('ticket.noNumber')}
        </Title>
        {drawAt ? (
          <p className="text-body-l font-medium text-white">
            {t('ticket.drawOn', { date: date(drawAt.at, 'long'), time: date(drawAt.at, 'time') })}
          </p>
        ) : null}
      </div>

      <TicketPerforation />

      <div className="flex w-full flex-col items-start gap-8 px-6 pt-6 pb-8 md:flex-row md:items-center md:px-10 md:pb-10">
        <dl className="flex min-w-0 flex-1 flex-col gap-5">
          <div className="flex w-full flex-col gap-5 sm:flex-row">
            {ticket.createdAt ? (
              <Fact label={t('ticket.fact.earnedAt')}>
                <time dateTime={ticket.createdAt.raw}>
                  {date(ticket.createdAt.at, 'long')}, {date(ticket.createdAt.at, 'time')}
                </time>
              </Fact>
            ) : null}
            <Fact label={t('ticket.fact.status')}>
              <span
                className={cn(
                  'inline-flex h-8 items-center rounded-pill px-[14px] text-label font-bold',
                  STATUS_PILL[ticket.status],
                )}
              >
                {t(`ticket.status.${ticket.status}`)}
              </span>
            </Fact>
          </div>

          <div className="flex w-full flex-col gap-5 sm:flex-row">
            {ticket.code ? <Fact label={t('ticket.fact.code')}>{ticket.code}</Fact> : null}
            {ticket.store ? <Fact label={t('ticket.fact.store')}>{ticket.store}</Fact> : null}
            {ticket.amount !== null ? (
              <Fact label={t('ticket.fact.receipt')}>
                {money(ticket.amount)}
                {ticket.receiptNo ? ` · ${ticket.receiptNo}` : ''}
              </Fact>
            ) : null}
            {ticket.prize ? <Fact label={t('ticket.fact.prize')}>{ticket.prize}</Fact> : null}
          </div>
        </dl>

        {ticket.code ? (
          <QrCodeView
            value={ticket.code}
            label={t('ticket.qrLabel', { code: ticket.code })}
            size={156}
            className="max-w-full shrink-0 rounded-card border border-line"
          />
        ) : null}
      </div>
    </article>
  );
}

/**
 * The 64-high row from the "Biletlərim" panel: `surface2`, radius 20, padding-inline 16,
 * gap 12 — a 36px `brand` disc, the number 15/700 and the draw name 12/400 `ink3`.
 */
export function TicketRow({
  ticket,
  drawName,
  href,
}: {
  ticket: LotteryTicket;
  drawName?: string;
  href?: string;
}) {
  const t = useTranslations('lottery');
  const number = ticket.number || ticket.code || t('ticket.noNumber');

  const content = (
    <>
      <span
        aria-hidden="true"
        className="grid size-9 shrink-0 place-items-center rounded-pill bg-brand text-white"
      >
        <Ticket size={18} aria-hidden="true" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-px text-start">
        <span className="truncate text-body-sm font-bold text-ink">
          {ticket.number ? `№ ${number}` : number}
        </span>
        {drawName ? <span className="truncate text-micro text-ink3">{drawName}</span> : null}
      </span>
    </>
  );

  const shell = 'flex h-16 w-full flex-row items-center gap-3 rounded-lg bg-surface2 px-4';

  if (!href) return <div className={shell}>{content}</div>;

  return (
    <Link href={href} className={cn(shell, 'transition-colors hover:bg-line')}>
      {content}
    </Link>
  );
}

