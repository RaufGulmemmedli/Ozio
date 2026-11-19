'use client';

/**
 * "Kuryerin çantası" parts (`kuryerin-cantasi-esas.html`): the intro strip, the item card, the
 * sticky mini cart, the confirm modal and the success view.
 *
 * Every amount rendered here comes from the mock: the item's own `price`/`oldPrice`, and the
 * quote's `delivery`, `saving` and `total`. The only arithmetic is the drawn `N × name` label,
 * which is a count, not money.
 *
 * `// TODO(store):` the grid would reuse `<ProductCard>` from `@/modules/store` (agent M3), which
 * does not exist yet — `import { ProductCard } from '@/modules/store'`. It would also need a
 * "stock left + struck old price + stepper" variant, which the catalogue card does not have, so
 * the drawn card is built locally for now.
 */
import { useId, type ReactNode } from 'react';
import { useLocale, useTranslations } from 'next-intl';

import { cn } from '@/core/lib/cn';
import { useFormat } from '@/core/i18n';
import { Badge, Button, Modal, QuantityStepper } from '@/shared/ui';
import { CircleCheck, Plus, ShoppingBag } from '@/shared/lucide';

import { pick, type BagItem, type BagQuote, type BagReceipt } from '../data/models';
import { BAG_ITEM_LOOK } from './icons';
import { ShopCard, ShopCardTitle, ShopPanel, SummaryRow } from './shop-chrome';

/** The dark intro strip above the grid. */
export function BagIntro() {
  const t = useTranslations('courier_shop');
  return (
    <ShopPanel padding={28} className="flex-row items-center gap-5 rounded-card">
      <span
        aria-hidden="true"
        className="flex size-16 shrink-0 items-center justify-center rounded-lg bg-white/[0.12]"
      >
        <ShoppingBag size={32} className="text-on-block" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="text-[20px] font-extrabold leading-tight">{t('bag.intro.title')}</span>
        <span className="text-label text-on-block/75">{t('bag.intro.body')}</span>
      </span>
    </ShopPanel>
  );
}

export interface BagItemCardProps {
  item: BagItem;
  quantity: number;
  onAdd: () => void;
  onQuantityChange: (next: number) => void;
}

/** 3-up card: tinted icon tile 140, discount badge, name, stock left, price pair, stepper. */
export function BagItemCard({ item, quantity, onAdd, onQuantityChange }: BagItemCardProps) {
  const t = useTranslations('courier_shop');
  const locale = useLocale();
  const { money } = useFormat();
  const look = BAG_ITEM_LOOK[item.kind];
  const Icon = look.icon;
  const name = pick(item.name, locale);
  const soldOut = item.stock === 0;

  return (
    <article className="flex w-full flex-col gap-[14px] rounded-card bg-surface p-4">
      <span
        aria-hidden="true"
        className={cn('flex h-[140px] w-full items-center justify-center rounded-lg', look.tint)}
      >
        <Icon size={56} className={look.ink} />
      </span>

      {item.discountPct > 0 ? (
        <Badge tone="brand" className="bg-brand-soft text-brand">
          {t('bag.discount', { percent: item.discountPct })}
        </Badge>
      ) : null}

      <h3 className="m-0 text-body-sm font-bold leading-tight text-ink">{name}</h3>
      <p className="m-0 text-micro font-medium text-ink3">
        {soldOut ? t('bag.soldOut') : t('bag.stockLeft', { count: item.stock })}
      </p>

      <div className="mt-auto flex w-full flex-row items-center justify-between gap-3">
        <span className="flex flex-row items-end gap-2">
          <span className="text-[18px] font-extrabold leading-none text-ink">
            {money(item.price)}
          </span>
          {item.oldPrice > item.price ? (
            <s className="text-caption font-medium leading-none text-ink3">
              {money(item.oldPrice)}
            </s>
          ) : null}
        </span>

        {quantity > 0 ? (
          <QuantityStepper
            size="compact"
            value={quantity}
            min={0}
            max={item.stock}
            onChange={onQuantityChange}
            decreaseLabel={t('bag.decrease', { name })}
            increaseLabel={t('bag.increase', { name })}
            removeLabel={t('bag.remove', { name })}
            valueAnnouncement={(v) => t('bag.quantityAnnounce', { name, count: v })}
          />
        ) : (
          // The drawn add button is a 40px brand circle; `<IconButton>` has no brand tone and no
          // 40 size, and 44 is kept below md for the touch-target rule.
          <button
            type="button"
            disabled={soldOut}
            aria-label={t('bag.add', { name })}
            onClick={onAdd}
            className={cn(
              'flex size-11 shrink-0 items-center justify-center rounded-pill bg-brand text-on-cta md:size-10',
              'transition-colors hover:bg-brand-dark active:scale-[.97]',
              soldOut && 'cursor-not-allowed opacity-40',
            )}
          >
            <Plus size={18} aria-hidden="true" />
          </button>
        )}
      </div>
    </article>
  );
}

export interface BagMiniCartProps {
  items: readonly BagItem[];
  quote: BagQuote;
  /** `true` while a new quote is being fetched — the CTA shows its in-button spinner. */
  pricing?: boolean;
  onCheckout: () => void;
}

/** The sticky 380 panel: lines, free delivery, saving, total, CTA. */
export function BagMiniCart({ items, quote, pricing = false, onCheckout }: BagMiniCartProps) {
  const t = useTranslations('courier_shop');
  const locale = useLocale();
  const { money } = useFormat();
  const titleId = useId();
  const empty = quote.lines.length === 0;

  return (
    <ShopCard aria-labelledby={titleId} className="gap-4">
      <ShopCardTitle id={titleId}>{t('bag.cart.title')}</ShopCardTitle>

      {empty ? (
        <p className="m-0 text-label text-ink2">{t('bag.cart.empty')}</p>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-4 p-0">
          {quote.lines.map((line) => {
            const item = items.find((row) => row.id === line.id);
            return (
              <li key={line.id} className="flex flex-row items-center justify-between gap-3">
                <span className="min-w-0 flex-1 text-label font-medium text-ink2">
                  {t('bag.cart.line', {
                    count: line.quantity,
                    name: pick(item?.name, locale),
                  })}
                </span>
                <span className="shrink-0 text-label font-bold text-ink">{money(line.amount)}</span>
              </li>
            );
          })}
        </ul>
      )}

      <SummaryRow label={t('bag.cart.delivery')} value={money(quote.delivery)} />
      <SummaryRow label={t('bag.cart.saving')} value={money(quote.saving)} />
      <SummaryRow label={t('bag.cart.total')} value={money(quote.total)} emphasis />

      <Button
        variant="brand"
        size="2xl"
        disabled={empty}
        loading={pricing && !empty}
        onClick={onCheckout}
        leadingIcon={<ShoppingBag size={18} aria-hidden="true" />}
      >
        {t('bag.cart.cta')}
      </Button>
    </ShopCard>
  );
}

export interface BagConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quote: BagQuote;
  submitting: boolean;
  onConfirm: () => void;
}

/** `kuryerin-cantasi-tesdiq-modali.html` — "Kuryer hazırlaşır?", the total, Geri / Təsdiqlə. */
export function BagConfirmModal({
  open,
  onOpenChange,
  quote,
  submitting,
  onConfirm,
}: BagConfirmModalProps) {
  const t = useTranslations('courier_shop');
  const { money } = useFormat();

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      size="m"
      title={t('bag.confirm.title')}
      description={t('bag.confirm.body', { count: quote.itemCount })}
      closeLabel={t('common.close')}
      footer={
        <>
          <Button
            variant="soft"
            size="lg"
            className="flex-1"
            onClick={() => {
              onOpenChange(false);
            }}
          >
            {t('common.back')}
          </Button>
          <Button
            variant="brand"
            size="lg"
            className="flex-1"
            loading={submitting}
            onClick={onConfirm}
          >
            {t('common.confirm')}
          </Button>
        </>
      }
    >
      <SummaryRow label={t('bag.confirm.payment')} value={money(quote.total)} emphasis />
      <p className="m-0 text-caption text-ink3">{t('demo.noCharge')}</p>
    </Modal>
  );
}

/** `kuryerin-cantasi-ugurlu.html` — the receipt view the bag screen switches to. */
export function BagSuccess({
  receipt,
  action,
}: {
  receipt: BagReceipt;
  action?: ReactNode;
}) {
  const t = useTranslations('courier_shop');
  const { money } = useFormat();

  return (
    <section className="flex w-full flex-col items-center gap-4 rounded-card bg-surface px-6 py-12 text-center md:p-16">
      <span
        aria-hidden="true"
        className="flex size-24 shrink-0 items-center justify-center rounded-lg bg-success"
      >
        <CircleCheck size={48} className="text-white" />
      </span>
      <h2 className="m-0 text-h2 font-extrabold text-ink">{t('bag.success.title')}</h2>
      <p className="m-0 max-w-[480px] text-body text-ink2">
        {t('bag.success.body', { count: receipt.itemCount })}
      </p>
      <Badge tone="success">{t('bag.success.payment', { amount: money(receipt.total) })}</Badge>
      {receipt.simulated ? (
        <p className="m-0 text-caption text-ink3">{t('demo.noCharge')}</p>
      ) : null}
      {action}
    </section>
  );
}
