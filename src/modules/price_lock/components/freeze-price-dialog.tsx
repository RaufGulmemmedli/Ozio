'use client';

/**
 * PL3 `Qiyməti dondur` — all four variants from `pl2-pl3-history-states-freeze-dialog.html`:
 *
 * | export node           | state here                                    |
 * | `Dialog · Forma`      | the form: product, price, `15 gün`, `1,00 ₼`  |
 * | `Dialog · Göndərilir` | submitting — the button reads `Dondurulur…`   |
 * | `Dialog · Xəta`       | the brand error strip + `Yenidən cəhd et`     |
 * | `Dialog · Uğur`       | `Qiymət donduruldu` + `Kilidlərimə bax`       |
 *
 * `lockDays` and `deposit` come from `GET locks` — the dialog does not hardcode 15 days or 1 ₼.
 * Freezing is mock state only: the deposit is recorded on the row and nothing is charged.
 *
 * The body is mounted only while the dialog is open and keyed on the product, so opening it for a
 * different product starts with clean fields and a clean mutation — no reset effect, no state
 * written during render. `<Modal>` is Radix Dialog, so focus is trapped while it is open and
 * restored to the trigger on close.
 */
import { useId, useState } from 'react';
import { useTranslations } from 'next-intl';

import { useFormat } from '@/core/i18n';
import type { Failure } from '@/core/network';
import { paths } from '@/core/routes';
import { CircleAlert, Snowflake } from '@/shared/lucide';
import { ProductImage } from '@/shared/media';
import { InlineNotice } from '@/shared/states';
import { Button, Input, Modal } from '@/shared/ui';

import { useCreateLock } from '../hooks/use-price-lock';
import { useHref } from '../lib/use-href';

export interface FreezePriceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Pre-filled when the dialog is opened from a product page; editable otherwise. */
  productName?: string;
  price?: number;
  /** `lockDays` / `deposit` from `GET locks` — never hardcoded here. */
  lockDays: number;
  deposit: number;
  /** Shown in place of the success CTA when the dialog is already on `/price-locks`. */
  hideLocksLink?: boolean;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className="text-body-sm text-ink2">{label}</span>
      <span className="text-body-sm font-bold text-ink">{value}</span>
    </div>
  );
}

/** A 422 from the source carries usable copy; anything else gets the drawn fallback. */
function messageFor(failure: Failure | null, fallback: string): string {
  if (failure && failure.hasServerMessage && failure.message.trim()) return failure.message.trim();
  return fallback;
}

export function FreezePriceDialog(props: FreezePriceDialogProps) {
  if (!props.open) return null;
  // Remounted per product, so the fields and the mutation start clean every time.
  return <FreezeDialogBody key={`${props.productName ?? ''}|${props.price ?? ''}`} {...props} />;
}

function FreezeDialogBody({
  onOpenChange,
  productName = '',
  price,
  lockDays,
  deposit,
  hideLocksLink = false,
}: FreezePriceDialogProps) {
  const t = useTranslations('price_lock');
  const { money } = useFormat();
  const href = useHref();
  const create = useCreateLock();
  const nameId = useId();
  const priceId = `${nameId}-price`;

  const [name, setName] = useState(productName);
  const [priceText, setPriceText] = useState(price !== undefined ? String(price) : '');

  const parsedPrice = Number(priceText.replace(',', '.'));
  const valid = name.trim().length > 0 && Number.isFinite(parsedPrice) && parsedPrice > 0;
  const created = create.data ?? null;

  const submit = () => {
    if (!valid) return;
    create.mutate({ productName: name.trim(), price: parsedPrice });
  };

  if (created) {
    return (
      <Modal
        open
        onOpenChange={onOpenChange}
        title={t('freeze.successTitle')}
        description={t('freeze.successBody', {
          product: created.productName,
          price: money(created.lockedPrice),
          days: lockDays,
        })}
        size="s"
        closeLabel={t('close')}
        footer={
          hideLocksLink ? (
            <Button variant="primary" fullWidth onClick={() => onOpenChange(false)}>
              {t('close')}
            </Button>
          ) : (
            <Button as="a" href={href(paths.priceLocks)} variant="primary" fullWidth>
              {t('freeze.successCta')}
            </Button>
          )
        }
      >
        {null}
      </Modal>
    );
  }

  return (
    <Modal
      open
      onOpenChange={onOpenChange}
      title={t('freeze.title')}
      size="s"
      closeLabel={t('close')}
      dismissible={!create.isPending}
      footer={
        <Button
          variant="primary"
          fullWidth
          loading={create.isPending}
          disabled={!valid}
          onClick={submit}
          leadingIcon={<Snowflake size={20} aria-hidden="true" />}
        >
          {create.isPending
            ? t('freeze.submitting')
            : create.isError
              ? t('freeze.retry')
              : t('freeze.submit')}
        </Button>
      }
    >
      <form
        className="flex flex-col gap-[14px]"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <div className="flex items-center gap-3">
          <span className="w-13 shrink-0">
            <ProductImage src={null} alt="" ratio="1/1" radius="inner" fallbackIconSize={22} />
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            {productName ? (
              <>
                <p className="text-body-sm font-bold text-ink">{productName}</p>
                <p className="text-[22px] font-extrabold text-ink">
                  {money(price ?? (Number.isFinite(parsedPrice) ? parsedPrice : 0))}
                </p>
              </>
            ) : (
              <>
                <label htmlFor={nameId} className="sr-only">
                  {t('freeze.pickProduct')}
                </label>
                <Input
                  id={nameId}
                  variant="compact"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder={t('freeze.pickProduct')}
                />
                <label htmlFor={priceId} className="sr-only">
                  {t('freeze.pricePlaceholder')}
                </label>
                <Input
                  id={priceId}
                  variant="compact"
                  value={priceText}
                  onChange={(event) => setPriceText(event.target.value)}
                  inputMode="decimal"
                  placeholder={t('freeze.pricePlaceholder')}
                />
              </>
            )}
          </div>
        </div>

        <Row label={t('freeze.period')} value={t('freeze.periodValue', { days: lockDays })} />
        <Row label={t('freeze.deposit')} value={money(deposit)} />

        {create.isError ? (
          <InlineNotice tone="error" multiline icon={CircleAlert}>
            {messageFor(create.error, t('freeze.failed'))}
          </InlineNotice>
        ) : null}
      </form>
    </Modal>
  );
}
