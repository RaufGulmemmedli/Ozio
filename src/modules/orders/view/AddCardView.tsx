'use client';

/**
 * OD2 · `/checkout/add-card` — "Yeni kart" (`app-new-card.html` `F6efV`).
 *
 * **Deliberate deviation from the export, for a security reason.** The export draws a full card
 * form (number / holder / expiry / CVV) with a live card preview, but `POST v1/payment/save-card`
 * takes **no card data**: it returns the bank's own card-binding page (`redirect_url` /
 * `custom_url`), where the card is typed. api/orders.md and the brief are explicit — never post a
 * PAN or CVV to this API. So this screen keeps the export's layout (form panel + 480 card preview +
 * the "3D Secure ilə qorunur" note) but the panel explains the hand-off and its single button starts
 * it; the card artwork is a non-interactive placeholder.
 *
 * On return from the bank page the cards list is re-read (the gateway's return flag is unknown —
 * api/payment.md says to confirm it with the backend), see `useRefetchCardsOnReturn`.
 */
import { useTranslations } from 'next-intl';
import { useFailureMessage } from '@/core/i18n';
import { paths } from '@/core/routes';
import { CreditCard, Lock, ShieldCheck } from '@/shared/lucide';
import { Button, Card, toast } from '@/shared/ui';
import { InlineNotice } from '@/shared/states';
import { PageHeader } from '@/shared/layout';
import { useAddCard } from '../hooks/use-saved-cards';

export interface AddCardViewProps {
  /** `true` inside the intercepted `@modal` slot: the page chrome is the modal's. */
  inModal?: boolean;
}

export function AddCardView({ inModal = false }: AddCardViewProps) {
  const t = useTranslations('payment');
  const failureMessage = useFailureMessage();
  const add = useAddCard();

  const start = () => {
    add.mutate(undefined, {
      onError: (failure) => {
        toast.error({ title: t('newCard.failed'), body: failureMessage(failure) });
      },
    });
  };

  return (
    <div className="flex w-full flex-col gap-6">
      {inModal ? null : (
        <PageHeader
          title={t('newCard.title')}
          subtitle={t('newCard.subtitle')}
          backHref={paths.checkoutPayment}
          backLabel={t('newCard.back')}
        />
      )}

      <div className="flex w-full flex-col gap-6 lg:flex-row">
        <Card
          tone="surface"
          radius="xl"
          className="flex min-w-0 flex-1 flex-col gap-[22px] p-8"
        >
          <div className="flex flex-col gap-2">
            <h2 className="m-0 text-h4 font-extrabold text-ink">{t('newCard.gatewayTitle')}</h2>
            <p className="m-0 text-body text-ink2">{t('newCard.gatewayBody')}</p>
          </div>

          <ol className="m-0 flex list-none flex-col gap-3 p-0">
            {(['step1', 'step2', 'step3'] as const).map((step, index) => (
              <li key={step} className="flex items-start gap-3">
                <span
                  aria-hidden="true"
                  className="flex size-7 shrink-0 items-center justify-center rounded-pill bg-surface2 text-caption font-bold text-ink"
                >
                  {index + 1}
                </span>
                <span className="text-body-sm text-ink">{t(`newCard.${step}`)}</span>
              </li>
            ))}
          </ol>

          <InlineNotice
            tone="info"
            multiline
            icon={Lock}
            title={t('newCard.pciTitle')}
            body={t('newCard.pciBody')}
          />

          <Button
            variant="primary"
            size="xl"
            fullWidth
            onClick={start}
            loading={add.isPending}
            leadingIcon={<CreditCard size={20} aria-hidden="true" />}
          >
            {t('newCard.submit')}
          </Button>
        </Card>

        <div className="flex w-full shrink-0 flex-col gap-4 lg:w-[480px]">
          {/* The card artwork from the export (`V0b7FP`): block, r32, 290 high, padding 32. */}
          <Card
            tone="block"
            radius="modal"
            aria-hidden="true"
            className="flex h-[290px] w-full flex-col justify-between border-transparent p-8"
          >
            <div className="flex items-start justify-between">
              <span className="h-[42px] w-14 rounded-sm bg-yellow" />
              <CreditCard size={28} className="text-on-block2" />
            </div>
            <span className="text-[28px] font-semibold tracking-[0.05em] text-on-block">
              •••• •••• •••• ••••
            </span>
            <div className="flex items-end justify-between gap-6">
              <span className="flex flex-col gap-1">
                <span className="text-nano font-bold tracking-[0.09em] text-on-block3">
                  {t('newCard.holder')}
                </span>
                <span className="text-body font-semibold text-on-block">••••</span>
              </span>
              <span className="flex flex-col gap-1">
                <span className="text-nano font-bold tracking-[0.09em] text-on-block3">
                  {t('newCard.expiry')}
                </span>
                <span className="text-body font-semibold text-on-block">••/••</span>
              </span>
            </div>
          </Card>

          <p className="m-0 flex items-start gap-2.5 px-2 text-caption text-ink2">
            <ShieldCheck size={18} aria-hidden="true" className="shrink-0" />
            {t('newCard.secureNote')}
          </p>
        </div>
      </div>
    </div>
  );
}
