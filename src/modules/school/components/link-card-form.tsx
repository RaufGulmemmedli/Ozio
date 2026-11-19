'use client';

/**
 * Two of the three card states drawn in `sc-states-dialogs.html`:
 *
 * - `Card · Bağlı deyil` — "Kartı bağla", a `surface2` "Bağlı deyil" pill, the "Tələbə bileti №"
 *   field with the `məs. TB-204518` placeholder, a full-width 52-high dark submit and the
 *   13/400 `ink3` hint "Aktiv etmək üçün kartı bağla";
 * - `Card · Xəta` — the same card with a `brand-soft` strip reading "Nömrə ən azı 6 simvol
 *   olmalıdır" and the submit dimmed.
 *
 * **The length rule lives in the handler.** The form posts whatever was typed and renders the
 * 422 the mock answers with; it never pre-judges the number. (`Card · Yoxlanılır` is a separate
 * component because it has no form at all.)
 */
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useEffect } from 'react';
import { z } from 'zod';

import { useFailureMessage } from '@/core/i18n';
import { isValidation, type Failure } from '@/core/network';
import { CircleAlert } from '@/shared/lucide';
import { Bone, Shimmer } from '@/shared/skeleton';
import { applyFieldErrors, Button, Form, FormField, Input, useOzioForm } from '@/shared/ui';

const schema = z.object({ number: z.string() });
type Values = z.infer<typeof schema>;

export interface LinkCardFormProps {
  onSubmit: (number: string) => void;
  busy?: boolean;
  failure?: Failure | null;
  /** The number the export suggests, used as the placeholder. */
  samplePlaceholder: string;
}

export function LinkCardForm({
  onSubmit,
  busy = false,
  failure = null,
  samplePlaceholder,
}: LinkCardFormProps) {
  const t = useTranslations('school');
  const failureMessage = useFailureMessage();

  const form = useOzioForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { number: '' },
  });

  useEffect(() => {
    if (failure && isValidation(failure)) applyFieldErrors(form, failure.fieldErrors);
  }, [failure, form]);

  return (
    <section
      aria-labelledby="link-card"
      className="flex w-full flex-col gap-4 rounded-xl bg-surface p-6"
    >
      <div className="flex flex-row items-center justify-between gap-3">
        <h2 id="link-card" className="text-h4 font-extrabold text-ink">
          {t('link.title')}
        </h2>
        <span className="inline-flex h-7 items-center rounded-pill bg-surface2 px-2.5 text-micro font-bold text-ink2">
          {t('card.state.none')}
        </span>
      </div>

      <p className="text-label text-ink2">{t('link.body')}</p>

      <Form
        form={form}
        onSubmit={(values) => onSubmit(values.number.trim())}
        className="flex w-full flex-col gap-4"
      >
        <FormField form={form} name="number" label={t('link.numberLabel')}>
          {({ field, state }) => (
            <Input
              {...field}
              state={state}
              variant="compact"
              inputMode="text"
              autoComplete="off"
              placeholder={samplePlaceholder}
              disabled={busy}
            />
          )}
        </FormField>

        {failure && !isValidation(failure) ? (
          <p
            role="alert"
            className="flex w-full flex-row items-start gap-2 rounded-md bg-brand-soft p-3 text-caption text-brand"
          >
            <CircleAlert size={16} aria-hidden="true" className="mt-px shrink-0" />
            {failureMessage(failure)}
          </p>
        ) : null}

        <Button type="submit" variant="primary" size="xl" fullWidth loading={busy}>
          {t('link.submit')}
        </Button>
      </Form>

      <p className="text-caption text-ink3">{t('link.hint')}</p>
    </section>
  );
}

/** `Card · Yoxlanılır` — the verifying panel. Ends when the server reports `linked`. */
export function VerifyingCard({ number }: { number: string }) {
  const t = useTranslations('school');

  return (
    <section
      aria-labelledby="verifying-card"
      aria-busy="true"
      className="flex w-full flex-col gap-4 rounded-xl bg-surface p-6"
    >
      <div className="flex flex-row items-center justify-between gap-3">
        <h2 id="verifying-card" className="text-h4 font-extrabold text-ink">
          {t('card.numberLabel', { number })}
        </h2>
        <span className="inline-flex h-7 items-center gap-1.5 rounded-pill bg-yellow px-2.5 text-micro font-bold text-on-yellow">
          <span
            aria-hidden="true"
            className="size-2 animate-pulse rounded-pill bg-on-yellow"
          />
          {t('pending.tag')}
        </span>
      </div>

      <p role="status" className="w-full rounded-lg bg-surface2 p-4 text-label text-ink2">
        {t('pending.body')}
      </p>

      {/* The drawn bone standing in for the action that appears once the card is linked. */}
      <Shimmer className="w-full">
        <Bone w="100%" h={52} r={26} />
      </Shimmer>
    </section>
  );
}
