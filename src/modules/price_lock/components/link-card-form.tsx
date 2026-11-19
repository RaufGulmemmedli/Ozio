'use client';

/**
 * PL1's `notLinked` state (`pl1-price-guarantee-not-linked.html`, node `MlQAr`) — a first-class
 * state with its own CTA, **not** an error panel.
 *
 * Left: the brand `Link Card Form` (480, radius 36) with the card-number field and `Kartı bağla`.
 * Right: the four-row staples preview and the "+ daha N məhsul" line.
 *
 * The number is held in local state only for as long as the field is filled in, sent once, and
 * never stored: the source answers with `**** <last4>` and that masked value is all the app ever
 * sees again. A 422 paints the drawn `State · Kart bağlanmadı` copy under the field.
 */
import { useId, useState } from 'react';
import { useTranslations } from 'next-intl';

import { useFormat } from '@/core/i18n';
import type { Failure } from '@/core/network';
import { ProductImage } from '@/shared/media';
import { Button, Card, Input } from '@/shared/ui';

import type { StapleItem } from '../data/models/guarantee';

/** How many staples the drawn preview lists before the "+ daha N" line. */
const PREVIEW_ROWS = 4;

/** `0000 0000 0000 0000` — digits only, grouped in fours. */
function groupDigits(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 16);
  return digits.replace(/(.{4})/g, '$1 ').trim();
}

export interface LinkCardFormProps {
  items: StapleItem[];
  submitting: boolean;
  failure: Failure | null;
  onSubmit: (cardNumber: string) => void;
}

export function LinkCardForm({ items, submitting, failure, onSubmit }: LinkCardFormProps) {
  const t = useTranslations('price_lock');
  const { money } = useFormat();
  const fieldId = useId();
  const errorId = `${fieldId}-error`;
  const [value, setValue] = useState('');

  const digits = value.replace(/\D/g, '');
  const preview = items.slice(0, PREVIEW_ROWS);
  const more = Math.max(0, items.length - preview.length);

  return (
    <div className="flex w-full flex-col gap-5 xl:flex-row xl:gap-8">
      <Card
        tone="brand"
        radius="bento"
        className="flex w-full flex-col gap-[18px] p-8 xl:w-[480px] xl:shrink-0"
      >
        <h2 className="text-[28px] font-extrabold leading-tight text-white">{t('link.title')}</h2>
        <p className="text-body-sm text-white">{t('link.body')}</p>

        <form
          className="flex flex-col gap-[18px]"
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit(digits);
          }}
        >
          <div className="flex flex-col gap-2">
            <label htmlFor={fieldId} className="text-label font-semibold text-white">
              {t('link.label')}
            </label>
            <Input
              id={fieldId}
              value={value}
              onChange={(event) => setValue(groupDigits(event.target.value))}
              placeholder={t('link.placeholder')}
              inputMode="numeric"
              autoComplete="off"
              maxLength={19}
              invalid={failure !== null}
              aria-describedby={failure ? errorId : undefined}
              containerClassName="bg-white"
            />
            {failure ? (
              <p id={errorId} role="alert" className="text-caption font-semibold text-white">
                {t('linkError.body')}
              </p>
            ) : null}
          </div>

          <Button
            type="submit"
            variant="primary"
            fullWidth
            loading={submitting}
            disabled={digits.length < 12}
          >
            {t('link.submit')}
          </Button>
        </form>
      </Card>

      <section aria-labelledby={`${fieldId}-preview`} className="flex min-w-0 flex-1 flex-col gap-4">
        <h2 id={`${fieldId}-preview`} className="text-h4 font-extrabold text-ink">
          {t('link.previewTitle')}
        </h2>
        <Card tone="surface" radius="xl" className="flex flex-col gap-4 p-6">
          <ul className="flex flex-col gap-4">
            {preview.map((item) => (
              <li key={item.id} className="flex items-center gap-3">
                <span className="w-9 shrink-0">
                  <ProductImage src={null} alt="" ratio="1/1" radius="pill" fallbackIconSize={16} />
                </span>
                <span className="min-w-0 flex-1 truncate text-body-sm font-bold text-ink">
                  {item.name}
                </span>
                <span className="text-body font-extrabold text-ink">{money(item.lockedPrice)}</span>
              </li>
            ))}
          </ul>
          {more > 0 ? (
            <p className="text-label font-semibold text-ink3">{t('link.previewMore', { count: more })}</p>
          ) : null}
        </Card>
      </section>
    </div>
  );
}
