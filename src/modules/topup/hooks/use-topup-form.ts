'use client';

/**
 * The amount form: `react-hook-form` + a zod schema **built from the server's limits**.
 *
 * The schema is rebuilt whenever the mock `GET /api/mock/topup/limits` response changes, so:
 *  - no bound (`5`, `200`) is ever written in a component or a schema literal;
 *  - when the server sends `min: null` / `max: null`, that bound is simply not part of the schema,
 *    which is the documented behaviour (api/mock-modules.md §5: neither show nor enforce a range
 *    the backend did not send);
 *  - the messages are localized by the caller and handed in, because zod cannot reach next-intl.
 */
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { z } from 'zod';

import { useFormat } from '@/core/i18n';
import { useOzioForm } from '@/shared/ui';

import { parseAmountInput, type TopupLimits } from '../data/models/topup-limits';

export interface TopupFormValues {
  /** Free text, exactly as typed: "20", "20,00", "20.5". */
  amount: string;
  /** The selected saved card's id, as a string (radio values are strings). */
  cardId: string;
}

export interface UseTopupFormResult {
  form: UseFormReturn<TopupFormValues>;
  /** The parsed amount, or `null` while the field is empty / unparseable. */
  amount: number | null;
  /** Sets the field from a quick-amount chip and revalidates. */
  pickQuickAmount: (value: number) => void;
  /** Selects a saved card. */
  pickCard: (id: number) => void;
  /** The selected card id, or 0 when none is chosen. */
  cardId: number;
}

export interface UseTopupFormArgs {
  limits: TopupLimits;
  /** Pre-selects a card once the real list has loaded. */
  defaultCardId: number | null;
}

export function useTopupForm({ limits, defaultCardId }: UseTopupFormArgs): UseTopupFormResult {
  const t = useTranslations('topup');
  const { money } = useFormat();

  /**
   * The schema is rebuilt whenever the server's bounds — or the locale's copy — change.
   *
   * `useTranslations()` / `useFormat()` return a fresh closure per render, so in practice this
   * memo re-runs on most renders. That is deliberate: reading them through a ref instead would be
   * accessing a ref during render, which `react-hooks/refs` rejects (and the React compiler can
   * miscompile). Building a handful of zod refinements is cheap, and it keeps the error messages
   * correct the instant the language changes.
   */
  const schema = useMemo(() => {
    const { min, max } = limits;
    return z.object({
      amount: z
        .string()
        .trim()
        .superRefine((raw, ctx) => {
          if (raw.length === 0) {
            ctx.addIssue({ code: 'custom', message: t('amount.required') });
            return;
          }
          const value = parseAmountInput(raw);
          if (value === null || value <= 0) {
            ctx.addIssue({ code: 'custom', message: t('amount.invalid') });
            return;
          }
          if (min !== null && value < min) {
            ctx.addIssue({ code: 'custom', message: t('amount.belowMin', { min: money(min) }) });
            return;
          }
          if (max !== null && value > max) {
            ctx.addIssue({ code: 'custom', message: t('amount.aboveMax', { max: money(max) }) });
          }
        }),
      cardId: z
        .string()
        .trim()
        .superRefine((raw, ctx) => {
          if (Number(raw) > 0) return;
          ctx.addIssue({ code: 'custom', message: t('summary.needCard') });
        }),
    });
  }, [limits, t, money]);

  const form = useOzioForm<TopupFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { amount: '', cardId: '' },
  });

  const rawAmount = form.watch('amount');
  const rawCardId = form.watch('cardId');
  const amount = useMemo(() => parseAmountInput(rawAmount ?? ''), [rawAmount]);

  // Pre-select the server's card as soon as the real list arrives, without clobbering a choice the
  // user has already made.
  useEffect(() => {
    if (defaultCardId === null) return;
    if ((form.getValues('cardId') ?? '') !== '') return;
    form.setValue('cardId', String(defaultCardId), { shouldValidate: false });
  }, [defaultCardId, form]);

  // A quick-amount chip is a deliberate choice, so validate straight away rather than on blur.
  const pickQuickAmount = (value: number) => {
    form.setValue('amount', String(value), { shouldValidate: true, shouldDirty: true });
  };

  const pickCard = (id: number) => {
    form.setValue('cardId', String(id), { shouldValidate: true, shouldDirty: true });
  };

  return {
    form,
    amount,
    pickQuickAmount,
    pickCard,
    cardId: Number(rawCardId ?? '') || 0,
  };
}
