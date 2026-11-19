'use client';

/**
 * Sold-by-weight selector (`rKZ0u` → `v17N8W` / `Weight Row` / `Quick`): the "ÇƏKİ SEÇİN" label,
 * the stepper, the 0,5 / 1 / 1,5 / 2 kq preset chips and the packing note.
 *
 * Units: the catalog sends `stock` / `min_order_quantity` / `max_order_quantity` in **grams**, the
 * cart takes the quantity in the **product unit (1 = 1 kg)**. Everything in this component is in
 * kilograms — the gram ↔ unit conversion is the cart repository's job, never this module's.
 *
 * The step is **0,1 kg** (`WEIGHT_STEP_KG`), matching what `app-product-weight.html` prints
 * ("Addım 0,1 kq") and what `screens/app-catalog.md` validates ("multiples of 0.1, min 0.1").
 * The preset chips (0,5 / 1 / 1,5 / 2 kq) are a separate control, not the step. The note is still
 * rendered from the live step rather than a literal, so copy can never contradict the control.
 */
import { useTranslations } from 'next-intl';

import { useFormat } from '@/core/i18n';
import { cn } from '@/core/lib/cn';
import { Chip, QuantityStepper } from '@/shared/ui';

import { GRAMS_PER_KG, type QuantityBounds } from '../data/models/product-detail';

export interface WeightSelectorProps {
  /** Selected weight in **kilograms**. */
  value: number;
  onChange: (next: number) => void;
  bounds: QuantityBounds;
  presets: readonly number[];
  disabled?: boolean;
  className?: string;
}

export function WeightSelector({
  value,
  onChange,
  bounds,
  presets,
  disabled = false,
  className,
}: WeightSelectorProps) {
  const t = useTranslations('product');
  const { kg } = useFormat();
  /** `fmt.kg` takes grams (it formats catalog figures), so kilograms are scaled up for it. */
  const asKg = (kilos: number) => kg(kilos * GRAMS_PER_KG);

  return (
    <div className={cn('flex w-full flex-col gap-4', className)}>
      <p className="text-caption font-bold tracking-[1px] text-ink3">{t('weight.title')}</p>

      <div className="flex flex-row flex-wrap items-center gap-3">
        <QuantityStepper
          value={value}
          min={bounds.min}
          max={bounds.max}
          step={bounds.step}
          unit="kg"
          formatValue={asKg}
          valueAnnouncement={(v) => t('quantity.announce', { value: asKg(v) })}
          onChange={onChange}
          disabled={disabled}
          decreaseLabel={t('quantity.decrease')}
          increaseLabel={t('quantity.increase')}
        />

        {presets.length > 0 ? (
          <div
            role="group"
            aria-label={t('weight.presetLabel')}
            className="flex flex-row flex-wrap gap-2"
          >
            {presets.map((preset) => (
              <Chip
                key={preset}
                selected={Math.abs(preset - value) < 0.001}
                disabled={disabled}
                onClick={() => onChange(preset)}
              >
                {asKg(preset)}
              </Chip>
            ))}
          </div>
        ) : null}
      </div>

      <p className="text-caption leading-[18px] text-ink2">
        {t('weight.note', { step: asKg(bounds.step) })}
      </p>
    </div>
  );
}
