'use client';

/**
 * `List Row` from `smart-list.html`: a round checkbox, title + store line, the price pair and the
 * quantity stepper.
 *
 * The round check is a real `role="checkbox"` button (the design's circle, not a square box), and
 * the stepper is `<QuantityStepper>` from `@/shared/ui` so the +/- behaviour matches the rest of
 * the app.
 */
import { useTranslations } from 'next-intl';

import { cn } from '@/core/lib/cn';
import { useFormat } from '@/core/i18n';
import { Check, Trash2 } from '@/shared/lucide';
import { IconButton, QuantityStepper } from '@/shared/ui';

import { itemDiscounted, type SmartListItem } from '../data/models/smart-list';

export interface SmartListRowProps {
  item: SmartListItem;
  onToggle: (item: SmartListItem) => void;
  onQuantity: (item: SmartListItem, quantity: number) => void;
  onRemove: (item: SmartListItem) => void;
  busy: boolean;
}

export function SmartListRow({ item, onToggle, onQuantity, onRemove, busy }: SmartListRowProps) {
  const t = useTranslations('rewards');
  const tc = useTranslations('common');
  const format = useFormat();
  const discounted = itemDiscounted(item);

  return (
    <li className="flex min-h-[68px] flex-row items-center gap-4 border-t border-line py-2.5 first:border-t-0">
      <button
        type="button"
        role="checkbox"
        aria-checked={item.checked}
        aria-label={t('smartList.toggle', { title: item.title })}
        disabled={busy}
        onClick={() => onToggle(item)}
        className={cn(
          'flex size-[26px] shrink-0 items-center justify-center rounded-pill outline-2 -outline-offset-1',
          item.checked
            ? 'bg-success text-white outline-success'
            : 'bg-transparent text-transparent outline-ink3',
          'disabled:opacity-60',
        )}
      >
        <Check size={16} aria-hidden="true" />
      </button>

      <div className="flex min-w-0 flex-1 flex-col gap-[5px]">
        <p
          className={cn(
            'truncate text-body font-bold',
            item.checked ? 'text-ink3 line-through' : 'text-ink',
          )}
        >
          {item.title}
        </p>
        {item.storeName ? (
          <span className="flex flex-row items-center gap-1.5">
            <span
              aria-hidden="true"
              className="size-2.5 shrink-0 rounded-pill"
              style={{ backgroundColor: item.storeColor ?? 'var(--oz-ink-3)' }}
            />
            <span className="truncate text-caption text-ink2">
              {t('smartList.storeDiscount', { store: item.storeName })}
            </span>
          </span>
        ) : null}
      </div>

      <div className="flex shrink-0 flex-col items-end gap-0.5">
        <span
          className={cn('text-body font-extrabold', discounted ? 'text-success' : 'text-ink')}
        >
          {format.money(item.price ?? 0)}
        </span>
        {discounted && item.oldPrice !== null ? (
          <span className="text-caption text-ink3 line-through">{format.money(item.oldPrice)}</span>
        ) : null}
      </div>

      <QuantityStepper
        value={item.quantity}
        min={1}
        max={99}
        size="compact"
        disabled={busy}
        decreaseLabel={tc('decrease')}
        increaseLabel={tc('increase')}
        onChange={(next) => onQuantity(item, next)}
      />

      <IconButton
        size={36}
        tone="ghost"
        aria-label={t('smartList.remove', { title: item.title })}
        disabled={busy}
        onClick={() => onRemove(item)}
      >
        <Trash2 />
      </IconButton>
    </li>
  );
}
