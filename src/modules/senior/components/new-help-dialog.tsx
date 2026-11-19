'use client';

/**
 * "Yeni sorğu" (`senior-neighbor-new-dialog.html`, node `CBQtA`) — a 600-wide dialog over the
 * neighbour board, which is why `/senior/neighbor/new` is a direct-hit fallback rather than a
 * screen of its own.
 *
 * Layout from the export: the title 24/800 + close, one question line, three kind tiles (selected
 * `brand-soft` with a `brand` stroke), the 96-high note field, the yellow bonus note, then
 * Ləğv et / Sorğunu göndər.
 *
 * `react-hook-form` + `zod`; `<Modal>` traps focus and restores it on close.
 */
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo } from 'react';
import { z } from 'zod';

import { cn } from '@/core/lib/cn';
import { useFailureMessage, useFormat } from '@/core/i18n';
import type { Failure } from '@/core/network';
import { HeartPulse, Info, ShoppingBasket, Trash2, type LucideIcon } from '@/shared/lucide';
import { Button, Form, FormField, Modal, Textarea, useOzioForm } from '@/shared/ui';

import { DEFAULT_BONUS, HELP_NOTE_MAX_LENGTH } from '../data/senior.fixtures';
import { HELP_KINDS, type HelpKind } from '../data/models/help-request';

const KIND_ICON: Readonly<Record<HelpKind, LucideIcon>> = {
  medicine: HeartPulse,
  groceries: ShoppingBasket,
  trash: Trash2,
};

interface NewHelpValues {
  kind: HelpKind;
  note: string;
}

const schemaFor = (tooLong: string) =>
  z.object({
    kind: z.enum(HELP_KINDS as readonly [HelpKind, ...HelpKind[]]),
    note: z.string().max(HELP_NOTE_MAX_LENGTH, tooLong),
  });

export interface NewHelpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  submitting: boolean;
  failure?: Failure | null;
  onSubmit: (values: { kind: HelpKind; note: string }) => void;
}

export function NewHelpDialog({
  open,
  onOpenChange,
  submitting,
  failure,
  onSubmit,
}: NewHelpDialogProps) {
  const t = useTranslations('senior');
  const tc = useTranslations('common');
  const { money, number } = useFormat();
  const failureMessage = useFailureMessage();

  const schema = useMemo(
    () => schemaFor(t('help.new.errors.noteTooLong', { max: number(HELP_NOTE_MAX_LENGTH) })),
    [t, number],
  );

  const form = useOzioForm<NewHelpValues>({
    resolver: zodResolver(schema),
    defaultValues: { kind: 'medicine', note: '' },
  });

  // A cancelled draft must not come back the next time the dialog opens.
  useEffect(() => {
    if (open) form.reset({ kind: 'medicine', note: '' });
  }, [open, form]);

  const kind = form.watch('kind');
  const note = form.watch('note') ?? '';

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={t('help.new.title')}
      size="l"
      className="[--oz-modal-w:600px]"
      closeLabel={tc('close')}
    >
      <Form
        form={form}
        onSubmit={(values) => onSubmit({ kind: values.kind, note: values.note })}
        className="flex flex-col gap-5"
      >
        <p className="text-body-sm text-ink2">{t('help.new.question')}</p>

        <FormField<NewHelpValues, 'kind'> name="kind">
          {({ field }) => (
            <div
              role="radiogroup"
              aria-label={t('help.new.question')}
              className="grid w-full grid-cols-1 gap-3 sm:grid-cols-3"
            >
              {HELP_KINDS.map((value) => {
                const Icon = KIND_ICON[value];
                const selected = value === kind;
                return (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => field.onChange(value)}
                    onBlur={field.onBlur}
                    className={cn(
                      'flex min-h-[112px] flex-col items-center justify-center gap-3 rounded-lg p-[18px] text-center',
                      'transition-colors duration-[var(--oz-dur-fast)]',
                      selected ? 'bg-brand-soft ring-2 ring-brand' : 'bg-bg',
                    )}
                  >
                    <Icon
                      aria-hidden="true"
                      size={32}
                      className={cn('shrink-0', selected ? 'text-brand' : 'text-ink')}
                    />
                    <span className="text-label font-bold text-ink">
                      {t(`help.kind.${value}`)}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </FormField>

        <FormField<NewHelpValues, 'note'>
          name="note"
          label={t('help.new.noteLabel')}
          helper={t('help.new.noteCounter', {
            count: number(note.length),
            max: number(HELP_NOTE_MAX_LENGTH),
          })}
        >
          {({ field, state }) => (
            <Textarea
              {...field}
              state={state}
              rows={3}
              maxLength={HELP_NOTE_MAX_LENGTH}
              placeholder={t(`help.new.notePlaceholder.${kind}`)}
              className="min-h-24"
            />
          )}
        </FormField>

        <p className="flex flex-row items-center gap-[10px] rounded-md bg-yellow px-4 py-3 text-label font-semibold text-on-yellow">
          <Info aria-hidden="true" size={18} className="shrink-0" />
          {t('help.new.bonusNote', { amount: money(DEFAULT_BONUS) })}
        </p>

        {failure ? (
          <p role="alert" className="text-label font-semibold text-brand">
            {failureMessage(failure)}
          </p>
        ) : null}

        <div className="flex flex-row flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="soft"
            size="xl"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            {tc('cancel')}
          </Button>
          <Button type="submit" variant="brand" size="xl" loading={submitting}>
            {t('help.new.submit')}
          </Button>
        </div>
      </Form>
    </Modal>
  );
}
