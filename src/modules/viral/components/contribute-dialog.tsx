'use client';

/**
 * `Dialog · İştirak et` from `v-states-dialogs.html` (440 wide → `<Modal size="s">` would be too
 * narrow, so `m`).
 *
 * Measured: `bg` fill, radius 32, padding 28, gap 16 — a 36×36 close circle, the chips 5 ₼ / 10 ₼ /
 * 20 ₼ / Digər at 40 high, a 52-high amount field with a `₼` suffix and a full-width dark
 * "20 ₼ ödə".
 *
 * **Nothing is charged.** The mock stores a `simulated` row; the footnote says so, and the amount
 * is validated by the handler (non-positive, or above the target, comes back as a 422 on
 * `amount`).
 */
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { useFailureMessage, useFormat } from '@/core/i18n';
import { isValidation, type Failure } from '@/core/network';
import { CircleAlert } from '@/shared/lucide';
import { Button, Chip, Field, Input, Modal } from '@/shared/ui';

import { CONTRIBUTION_CHIPS } from '../data/viral.fixtures';

export interface ContributeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (amount: number) => void;
  busy?: boolean;
  failure?: Failure | null;
}

export function ContributeDialog({
  open,
  onOpenChange,
  onSubmit,
  busy = false,
  failure = null,
}: ContributeDialogProps) {
  const t = useTranslations('viral');

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      size="m"
      title={t('contribute.title')}
      closeLabel={t('contribute.close')}
    >
      {/*
        The body is a child mounted only while the dialog is open, so its amount state starts
        fresh on every open without an effect resetting it on close.
      */}
      {open ? (
        <ContributeForm onSubmit={onSubmit} busy={busy} failure={failure} />
      ) : null}
    </Modal>
  );
}

function ContributeForm({
  onSubmit,
  busy,
  failure,
}: Pick<ContributeDialogProps, 'onSubmit'> & { busy: boolean; failure: Failure | null }) {
  const t = useTranslations('viral');
  const { money } = useFormat();
  const failureMessage = useFailureMessage();

  // The export shows "20 ₼" preselected.
  const [preset, setPreset] = useState<number | 'custom'>(CONTRIBUTION_CHIPS[2]);
  const [custom, setCustom] = useState('');

  const amount = preset === 'custom' ? Number(custom.replace(',', '.')) : preset;
  const valid = Number.isFinite(amount) && amount > 0;

  // The 422 lands on the amount field; anything else goes to the strip below.
  const fieldError =
    failure && isValidation(failure)
      ? failure.fieldErrors.find((entry) => entry.path === 'amount')?.message
      : undefined;

  return (
    <div className="flex w-full flex-col gap-4">
      <div
        role="group"
        aria-label={t('contribute.amountLabel')}
        className="flex flex-row flex-wrap gap-2.5"
      >
        {CONTRIBUTION_CHIPS.map((value) => (
          <Chip
            key={value}
            selected={preset === value}
            onClick={() => setPreset(value)}
            disabled={busy}
          >
            {money(value)}
          </Chip>
        ))}
        <Chip selected={preset === 'custom'} onClick={() => setPreset('custom')} disabled={busy}>
          {t('contribute.other')}
        </Chip>
      </div>

      <Field
        label={t('contribute.amountLabel')}
        state={fieldError ? 'error' : 'default'}
        helper={fieldError}
        htmlFor="viral-contribute-amount"
      >
        <Input
          id="viral-contribute-amount"
          variant="compact"
          inputMode="decimal"
          value={preset === 'custom' ? custom : String(preset)}
          disabled={busy || preset !== 'custom'}
          state={fieldError ? 'error' : 'default'}
          trailing={<span className="text-body text-ink3">₼</span>}
          onChange={(event) => setCustom(event.target.value)}
        />
      </Field>

      {failure && !fieldError ? (
        <p
          role="alert"
          className="flex w-full flex-row items-start gap-2 rounded-md bg-brand-soft p-3 text-caption text-brand"
        >
          <CircleAlert size={16} aria-hidden="true" className="mt-px shrink-0" />
          {failureMessage(failure)}
        </p>
      ) : null}

      <Button
        variant="primary"
        size="xl"
        fullWidth
        loading={busy}
        disabled={!valid}
        onClick={() => {
          if (valid) onSubmit(Math.round(amount * 100) / 100);
        }}
      >
        {t('contribute.submit', { amount: valid ? money(amount) : money(0) })}
      </Button>

      <p className="text-caption text-ink3">{t('contribute.note')}</p>
    </div>
  );
}
