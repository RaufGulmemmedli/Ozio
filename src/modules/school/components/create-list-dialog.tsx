'use client';

/**
 * `Dialog · Siyahı yarat` from `sc-states-dialogs.html`.
 *
 * Measured: 480 wide (→ `<Modal size="m">`), `bg` fill, radius 32, padding 28, gap 16; a 36×36
 * close circle top right; three fields — "Sinif" / "Məktəb" / "Məhsullar (hər sətirdə biri)", the
 * last a 100-high textarea — and a full-width 52-high dark "Yarat və paylaş".
 *
 * Validation lives in the handler: an empty class name or an empty product list comes back as a
 * 422 and is mapped onto the fields with `applyFieldErrors`. The submit button is never disabled
 * on a client-side verdict.
 */
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useEffect } from 'react';
import { z } from 'zod';

import { useFailureMessage } from '@/core/i18n';
import { isValidation, type Failure } from '@/core/network';
import { CircleAlert } from '@/shared/lucide';
import {
  applyFieldErrors,
  Button,
  Form,
  FormField,
  Input,
  Modal,
  Textarea,
  useOzioForm,
} from '@/shared/ui';

import type { CreateClassListBody } from '../data/school.repository';

/**
 * Deliberately permissive: the handler owns the rules (a class name and at least one product),
 * and its 422 is what the fields display. The schema only shapes the values.
 */
const schema = z.object({
  title: z.string(),
  school: z.string(),
  lines: z.string(),
});

type Values = z.infer<typeof schema>;

export interface CreateListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (body: CreateClassListBody) => void;
  busy?: boolean;
  failure?: Failure | null;
}

export function CreateListDialog({
  open,
  onOpenChange,
  onSubmit,
  busy = false,
  failure = null,
}: CreateListDialogProps) {
  const t = useTranslations('school');
  const failureMessage = useFailureMessage();

  const form = useOzioForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { title: '', school: '', lines: '' },
  });

  // A 422 names the offending field (`title` / `lines`), so it lands on the control itself.
  useEffect(() => {
    if (failure && isValidation(failure)) applyFieldErrors(form, failure.fieldErrors);
  }, [failure, form]);

  useEffect(() => {
    if (!open) form.reset({ title: '', school: '', lines: '' });
  }, [form, open]);

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      size="m"
      title={t('create.title')}
      closeLabel={t('create.close')}
    >
      <Form
        form={form}
        onSubmit={(values) =>
          onSubmit({
            title: values.title.trim(),
            school: values.school.trim(),
            lines: values.lines
              .split('\n')
              .map((line) => line.trim())
              .filter((line) => line.length > 0),
          })
        }
        className="flex w-full flex-col gap-4"
      >
        <FormField form={form} name="title" label={t('create.class')}>
          {({ field, state }) => (
            <Input
              {...field}
              state={state}
              variant="compact"
              placeholder={t('create.classPlaceholder')}
              disabled={busy}
            />
          )}
        </FormField>

        <FormField form={form} name="school" label={t('create.school')}>
          {({ field, state }) => (
            <Input
              {...field}
              state={state}
              variant="compact"
              placeholder={t('create.schoolPlaceholder')}
              disabled={busy}
            />
          )}
        </FormField>

        <FormField form={form} name="lines" label={t('create.products')}>
          {({ field, state }) => (
            <Textarea
              {...field}
              state={state}
              rows={4}
              placeholder={t('create.productsPlaceholder')}
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
          {t('create.submit')}
        </Button>
      </Form>
    </Modal>
  );
}
