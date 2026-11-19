'use client';

/**
 * `/topup/card` — "Kartla artır" (`topup-card.html`, node `t0x8M`).
 *
 * The hybrid in one screen:
 *  - **real**: the current balance in the subtitle and the saved-card list;
 *  - **mock**: the limits the amount is validated against, the fee/total in the summary, and the
 *    "payment" — which charges nothing and physically cannot reach the real host.
 *
 * States, all reachable:
 *  - loading → `TopupCardSkeleton` (`topup-card-loading.html`);
 *  - no saved cards → `TopupNoCards` (`topup-card-no-cards.html`) — the live default;
 *  - error → `<ErrorState>` with a retry;
 *  - `?preview=loading|empty|error`, plus `?preview=cards` to seed the drawn three-card list;
 *  - the documented magic amount **13 ₼** always ends on `topup-failed.html`.
 */
import { useTranslations } from 'next-intl';

import { useFailureMessage, useFormat } from '@/core/i18n';
import { paths } from '@/core/routes';
import { PageHeader } from '@/shared/layout';
import { DemoBanner, ErrorState } from '@/shared/states';
import { Form } from '@/shared/ui';

import { TopupAmountCard } from '../components/topup-amount-card';
import { TopupCardPicker } from '../components/topup-card-picker';
import { TopupSummary } from '../components/topup-summary';
import { firstPayableCard, savedCardLabel } from '../data/models/saved-card';
import { useSavedCards } from '../hooks/use-saved-cards';
import { useTopupAccount } from '../hooks/use-topup-account';
import { useTopupForm, type TopupFormValues } from '../hooks/use-topup-form';
import { useTopupLimits } from '../hooks/use-topup-limits';
import { useTopupPay } from '../hooks/use-topup-pay';
import { useTopupQuote } from '../hooks/use-topup-quote';
import { EMPTY_TOPUP_LIMITS } from '../data/models/topup-limits';
import { TopupCardSkeleton } from './topup-card-skeleton';
import { TopupNoCards } from './topup-no-cards';

export function TopupCardView() {
  const t = useTranslations('topup');
  const { money } = useFormat();
  const failureMessage = useFailureMessage();

  const account = useTopupAccount();
  const cards = useSavedCards();
  const limits = useTopupLimits();

  const balance = account.data?.balance ?? 0;
  const cardList = cards.data ?? [];
  const defaultCard = firstPayableCard(cardList);

  const { form, amount, pickQuickAmount, pickCard, cardId } = useTopupForm({
    limits: limits.data ?? EMPTY_TOPUP_LIMITS,
    defaultCardId: defaultCard?.id ?? null,
  });

  // Only quote an amount that already passes the server's own limits — otherwise every keystroke
  // outside the range would fire a request the summary cannot use.
  const quotable = amount !== null && form.formState.errors.amount === undefined ? amount : null;
  const quote = useTopupQuote({ amount: quotable, balance });
  const pay = useTopupPay();

  const selectedCard = cardList.find((card) => card.id === cardId) ?? null;

  const header = (
    <PageHeader
      title={t('card.title')}
      subtitle={t('card.subtitle', { balance: money(balance) })}
      backHref={paths.topup}
      backLabel={t('card.back')}
    />
  );

  if (account.isPending || cards.isPending || limits.isPending) {
    return (
      <>
        {header}
        <TopupCardSkeleton />
      </>
    );
  }

  if (cards.isError || limits.isError) {
    const failure = cards.error ?? limits.error;
    return (
      <>
        {header}
        <DemoBanner module="topup" body={t('demo.method')} />
        <ErrorState
          failure={failure}
          title={t('error.title')}
          message={failure ? failureMessage(failure) : undefined}
          retryLabel={t('error.retry')}
          onRetry={() => {
            void cards.refetch();
            void limits.refetch();
          }}
          retrying={cards.isRefetching || limits.isRefetching}
        />
      </>
    );
  }

  // The live default: no saved cards at all.
  if (cardList.length === 0) {
    return (
      <>
        {header}
        <DemoBanner module="topup" body={t('demo.method')} />
        <TopupNoCards />
      </>
    );
  }

  const onSubmit = (values: TopupFormValues) => {
    const card = cardList.find((row) => row.id === Number(values.cardId));
    if (!card || card.expired) return;
    const value = quote.data?.amount ?? amount;
    if (value === null) return;
    pay.mutate({ amount: value, card, balance });
  };

  const canSubmit =
    quote.data !== undefined && selectedCard !== null && !selectedCard.expired && !quote.isFetching;

  return (
    <>
      {header}
      <DemoBanner module="topup" body={t('demo.method')} />

      <Form
        form={form}
        onSubmit={onSubmit}
        className="flex w-full flex-col items-start gap-6 lg:flex-row"
      >
        <div className="flex min-w-0 flex-1 flex-col items-start gap-6">
          <TopupAmountCard
            form={form}
            limits={limits.data ?? EMPTY_TOPUP_LIMITS}
            amount={amount}
            onPickQuickAmount={pickQuickAmount}
            disabled={pay.isPending}
          />

          <TopupCardPicker
            cards={cardList}
            selectedId={cardId}
            onSelect={pickCard}
            error={form.formState.errors.cardId?.message}
            disabled={pay.isPending}
          />
        </div>

        <TopupSummary
          quote={quote.data ?? null}
          cardLabel={selectedCard ? savedCardLabel(selectedCard) : ''}
          canSubmit={canSubmit}
          paying={pay.isPending}
          quoteFailed={quote.isError}
        />
      </Form>

      {/* A transport failure on the charge itself (not a decline — that routes to the result
          screen). Announced, so a keyboard user is told without looking. */}
      {pay.isError ? (
        <p role="alert" className="text-body-sm font-medium text-brand">
          {failureMessage(pay.error)}
        </p>
      ) : null}
    </>
  );
}
