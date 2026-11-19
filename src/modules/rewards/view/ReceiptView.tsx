'use client';

/**
 * N5 — the digital receipt, print-friendly.
 *
 * This is the **only** screen in the module that reads the real API (`GET v2/orders/{id}`), and the
 * order-detail shape is `live: 'unverified'`: the success body has never been observed, so
 * `parseReceipt` reads every documented alias, every amount defaults to 0 and a payload it cannot
 * read renders the "no receipt" state instead of a half-filled sheet. Treat the field names as a
 * guess until the endpoint is confirmed.
 *
 * It issues no request of its own: `useOrder` from `@/modules/orders` owns
 * `GET v2/orders/{id}`, and `receiptFromOrder` maps its `OrderDetail` into a `Receipt`.
 *
 * Print: `receipt.module.css` drops the shell chrome and the on-screen controls inside
 * `@media print`; the sheet itself prints as plain black on white.
 */
import { useTranslations } from 'next-intl';

import { cn } from '@/core/lib/cn';
import { useFormat } from '@/core/i18n';
import { useFailureMessage } from '@/core/i18n/failure-message';
import { paths } from '@/core/routes';
import { FileText } from '@/shared/lucide';
import { EmptyState, ErrorState } from '@/shared/states';
import { Button } from '@/shared/ui';

import { LinkButton } from '../components/link-button';
import { RewardsPage } from '../components/rewards-page';
import { StateCard } from '../components/state-card';
import { receiptIsEmpty } from '../data/models/receipt';
import { useReceipt } from '../hooks/use-receipt';
import { ReceiptSkeleton } from './ReceiptSkeleton';
import styles from './receipt.module.css';

function MetaRow({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div className={cn('flex flex-row items-start justify-between gap-6', styles.row)}>
      <span className="shrink-0 text-caption text-ink3">{label}</span>
      <span className="text-right text-label font-semibold text-ink">{value}</span>
    </div>
  );
}

function AmountRow({
  label,
  value,
  tone = 'default',
}: {
  label: string;
  value: string;
  tone?: 'default' | 'total' | 'bonus';
}) {
  return (
    <div className={cn('flex flex-row items-center justify-between gap-6', styles.row)}>
      <span
        className={cn(
          tone === 'total' ? 'text-h4 font-extrabold text-ink' : 'text-label text-ink2',
        )}
      >
        {label}
      </span>
      <span
        className={cn(
          tone === 'total' && 'text-h3 font-extrabold text-ink',
          tone === 'bonus' && 'text-label font-bold text-success',
          tone === 'default' && 'text-label font-semibold text-ink',
        )}
      >
        {value}
      </span>
    </div>
  );
}

export function ReceiptView({ orderId }: { orderId: string }) {
  const t = useTranslations('rewards');
  const format = useFormat();
  const failureMessage = useFailureMessage();

  const { order: query, receipt } = useReceipt(orderId);

  const crumbs = [
    { label: t('receipt.crumbOrders'), href: paths.orders },
    { label: t('receipt.crumb') },
  ];

  const page = (children: React.ReactNode, action?: React.ReactNode) => (
    <RewardsPage
      crumbs={crumbs}
      crumbsLabel={t('receipt.crumbOrders')}
      title={t('receipt.title')}
      subtitle={t('receipt.subtitle', { order: orderId })}
      demoModule={t('demo.module')}
      action={action}
      className="print:gap-4"
    >
      {children}
    </RewardsPage>
  );

  if (query.isPending) {
    return page(<ReceiptSkeleton label={t('loading')} />);
  }

  if (query.isError || !receipt) {
    return page(
      <StateCard>
        <ErrorState
          failure={query.error}
          title={t('receipt.error.title')}
          message={query.error ? failureMessage(query.error) : t('error.body')}
          retryLabel={t('retry')}
          onRetry={() => query.refetch()}
          secondaryAction={
            <LinkButton href={paths.order(orderId)} tone="soft">
              {t('receipt.crumbOrders')}
            </LinkButton>
          }
        />
      </StateCard>,
    );
  }

  if (receiptIsEmpty(receipt)) {
    return page(
      <StateCard>
        <EmptyState
          icon={FileText}
          title={t('receipt.empty.title')}
          body={t('receipt.empty.body')}
          action={
            <LinkButton href={paths.order(orderId)}>{t('receipt.crumbOrders')}</LinkButton>
          }
        />
      </StateCard>,
    );
  }

  return page(
    <section
      className={cn(
        'flex w-full max-w-[760px] flex-col gap-6 rounded-xl bg-surface p-6 md:p-8',
        styles.sheet,
      )}
    >
      <div className="flex flex-col gap-1.5">
        <h2 className="text-h3 font-extrabold text-ink">
          {receipt.storeName || t('receipt.title')}
        </h2>
        <p className="text-label text-ink2">
          {t('receipt.subtitle', { order: receipt.orderId || orderId })}
        </p>
      </div>

      <div className="flex flex-col gap-3 border-t border-line pt-5">
        <MetaRow label={t('receipt.store')} value={receipt.storeName} />
        <MetaRow label={t('receipt.address')} value={receipt.deliveryAddress} />
        <MetaRow label={t('receipt.payment')} value={receipt.paymentMethod} />
        <MetaRow
          label={t('receipt.date')}
          value={receipt.createdAt ? format.date(receipt.createdAt, 'long') : ''}
        />
      </div>

      {receipt.lines.length > 0 ? (
        <div className="flex flex-col gap-3 border-t border-line pt-5">
          <h3 className="text-body font-extrabold text-ink">{t('receipt.items')}</h3>
          <ul className="flex flex-col gap-2.5">
            {receipt.lines.map((line, index) => (
              <li
                key={`${line.name}-${index}`}
                className={cn('flex flex-row items-start justify-between gap-6', styles.row)}
              >
                <span className="min-w-0 text-body-sm text-ink">
                  {line.quantity > 1 ? (
                    <span className="text-ink3">{t('receipt.qty', { qty: line.quantity })} </span>
                  ) : null}
                  {line.name}
                </span>
                <span className="shrink-0 text-body-sm font-bold text-ink">
                  {format.money(line.total)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="flex flex-col gap-3 border-t border-line pt-5">
        <AmountRow label={t('receipt.itemsTotal')} value={format.money(receipt.itemsTotal)} />
        {receipt.deliveryFee !== 0 ? (
          <AmountRow label={t('receipt.deliveryFee')} value={format.money(receipt.deliveryFee)} />
        ) : null}
        {receipt.serviceFee !== 0 ? (
          <AmountRow label={t('receipt.serviceFee')} value={format.money(receipt.serviceFee)} />
        ) : null}
        {receipt.discount !== 0 ? (
          <AmountRow
            label={t('receipt.discount')}
            value={`−${format.money(receipt.discount)}`}
          />
        ) : null}
        <div className="border-t border-line pt-3">
          <AmountRow
            label={t('receipt.payable')}
            value={format.money(receipt.payable)}
            tone="total"
          />
        </div>
        {receipt.bonusEarned !== 0 ? (
          <AmountRow
            label={t('receipt.bonusEarned')}
            value={`+${format.money(receipt.bonusEarned)}`}
            tone="bonus"
          />
        ) : null}
      </div>

      <p className="border-t border-line pt-5 text-caption text-ink3">{t('receipt.footer')}</p>
    </section>,
    <Button
      variant="primary"
      size="lg"
      className="print:hidden"
      leadingIcon={<FileText size={18} aria-hidden="true" />}
      onClick={() => window.print()}
    >
      {t('receipt.print')}
    </Button>,
  );
}
