'use client';

/**
 * "Limiti tənzimlə" (`limits-editor-drawer.html`, node `oo39h`) — a 520-wide **right drawer** over
 * the member page, not a page of its own. `/family-limits/[id]/edit` exists only as the direct-hit
 * fallback and renders the member page with this drawer already open.
 *
 * Layout from the export: the title 24/800 + `Ad · Rol` 14/400, the "Limit aktivdir" switch row
 * (`bg` fill, radius 20, padding 20), the Həftəlik / Aylıq segmented rail, the 5 ₼ −/+ stepper
 * with the amount at 44/800, the category chip toggles, and the brand "Yadda saxla" CTA at the
 * bottom. With the switch off, everything below it dims and is disabled — exactly as drawn.
 *
 * `react-hook-form` + `zod` through `Form`; `<Drawer>` traps focus and restores it on close.
 */
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo } from 'react';
import { z } from 'zod';

import { cn } from '@/core/lib/cn';
import { useFailureMessage, useFormat } from '@/core/i18n';
import { Minus, Plus } from '@/shared/lucide';
import {
  Button,
  Drawer,
  Form,
  Switch,
  applyFieldErrors,
  toast,
  useOzioForm,
} from '@/shared/ui';

import { CategoryChips } from './category-chips';
import {
  LIMIT_CATEGORIES,
  LIMIT_STEP_AZN,
  draftFrom,
  type LimitCategory,
  type LimitMember,
  type LimitPeriod,
} from '../data/models/limit-member';
import { useSaveFamilyLimit } from '../hooks/use-family-limits';

const MAX_LIMIT_AZN = 500;

interface EditorValues {
  enabled: boolean;
  period: LimitPeriod;
  limit: number;
  categories: LimitCategory[];
}

const schemaFor = (messages: { step: string; max: string }) =>
  z.object({
    enabled: z.boolean(),
    period: z.enum(['weekly', 'monthly']),
    limit: z
      .number()
      .min(0, messages.step)
      .max(MAX_LIMIT_AZN, messages.max)
      .refine((v) => v % LIMIT_STEP_AZN === 0, messages.step),
    categories: z.array(z.enum(LIMIT_CATEGORIES as readonly [LimitCategory, ...LimitCategory[]])),
  });

const PERIODS: readonly LimitPeriod[] = ['weekly', 'monthly'];

export interface LimitEditorDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: LimitMember;
}

export function LimitEditorDrawer({ open, onOpenChange, member }: LimitEditorDrawerProps) {
  const t = useTranslations('family_limits');
  const tc = useTranslations('common');
  const { number } = useFormat();
  const failureMessage = useFailureMessage();

  const save = useSaveFamilyLimit();

  const schema = useMemo(
    () =>
      schemaFor({
        step: t('editor.errors.step', { step: number(LIMIT_STEP_AZN) }),
        max: t('editor.errors.max', { max: number(MAX_LIMIT_AZN) }),
      }),
    [t, number],
  );

  const form = useOzioForm<EditorValues>({
    resolver: zodResolver(schema),
    defaultValues: draftFrom(member),
  });

  // Re-seed whenever the drawer opens or the member changes, so a cancelled edit is forgotten.
  useEffect(() => {
    if (open) form.reset(draftFrom(member));
  }, [open, member, form]);

  useEffect(() => {
    if (!save.error) return;
    const unmatched = applyFieldErrors(form, save.error.fieldErrors);
    if (unmatched.length > 0) {
      form.setError('root', { type: 'server', message: unmatched.map((e) => e.message).join(' ') });
    }
  }, [save.error, form]);

  const enabled = form.watch('enabled');
  const period = form.watch('period');
  const limit = form.watch('limit');
  const categories = form.watch('categories');
  const rootError = form.formState.errors.root?.message ?? form.formState.errors.limit?.message;

  const step = (delta: number) => {
    const next = Math.min(MAX_LIMIT_AZN, Math.max(0, limit + delta));
    form.setValue('limit', next, { shouldDirty: true, shouldValidate: true });
  };

  const toggleCategory = (category: LimitCategory) => {
    const next = categories.includes(category)
      ? categories.filter((c) => c !== category)
      : LIMIT_CATEGORIES.filter((c) => c === category || categories.includes(c));
    form.setValue('categories', [...next], { shouldDirty: true, shouldValidate: true });
  };

  const onSubmit = (values: EditorValues) => {
    save.mutate(
      { id: member.id, draft: values },
      {
        onSuccess: () => {
          toast.success({ title: t('editor.toast', { name: member.name }) });
          onOpenChange(false);
        },
      },
    );
  };

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      title={t('editor.title')}
      subtitle={t('editor.subtitle', { name: member.name, role: member.role })}
      width={520}
      closeLabel={tc('close')}
      bodyClassName="pt-2"
    >
      <Form form={form} onSubmit={onSubmit} className="flex h-full flex-col gap-6">
        <div className="flex w-full flex-row items-center justify-between gap-5 rounded-lg bg-bg p-5">
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="text-body font-bold text-ink">{t('editor.enabled')}</span>
            <span className="text-caption text-ink2">{t('editor.enabledHint')}</span>
          </div>
          <Switch
            checked={enabled}
            aria-label={t('editor.enabled')}
            onCheckedChange={(next) =>
              form.setValue('enabled', next, { shouldDirty: true, shouldValidate: true })
            }
          />
        </div>

        <fieldset
          disabled={!enabled}
          className={cn('flex flex-col gap-6', !enabled && 'opacity-50')}
        >
          <legend className="sr-only">{t('editor.controls')}</legend>

          <div className="flex flex-col gap-3">
            <span id="limit-period-label" className="text-body-sm font-bold text-ink">
              {t('editor.period')}
            </span>
            <div
              role="radiogroup"
              aria-labelledby="limit-period-label"
              className="flex w-full flex-row items-center gap-1 rounded-pill bg-surface2 p-1"
            >
              {PERIODS.map((value) => {
                const active = value === period;
                return (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() =>
                      form.setValue('period', value, { shouldDirty: true, shouldValidate: true })
                    }
                    className={cn(
                      'flex h-11 flex-1 items-center justify-center rounded-pill text-body-sm font-semibold text-ink2',
                      'transition-[background-color,color] duration-[var(--oz-dur-fast)]',
                      active && 'bg-cta text-on-cta',
                    )}
                  >
                    {t(`period.${value}`)}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <span className="text-body-sm font-bold text-ink">
              {t('editor.amount', { step: number(LIMIT_STEP_AZN) })}
            </span>
            <div className="flex w-full flex-row items-center justify-between gap-4">
              <button
                type="button"
                aria-label={t('editor.decrease', { step: number(LIMIT_STEP_AZN) })}
                disabled={limit <= 0}
                onClick={() => step(-LIMIT_STEP_AZN)}
                className="flex size-13 shrink-0 items-center justify-center rounded-pill bg-surface2 text-ink disabled:opacity-40"
              >
                <Minus aria-hidden="true" size={22} />
              </button>

              <output
                aria-live="polite"
                className="text-center text-[44px] font-extrabold leading-none text-ink"
              >
                {t('editor.amountValue', { amount: number(limit) })}
              </output>

              <button
                type="button"
                aria-label={t('editor.increase', { step: number(LIMIT_STEP_AZN) })}
                disabled={limit >= MAX_LIMIT_AZN}
                onClick={() => step(LIMIT_STEP_AZN)}
                className="flex size-13 shrink-0 items-center justify-center rounded-pill bg-cta text-on-cta disabled:opacity-40"
              >
                <Plus aria-hidden="true" size={22} />
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <span className="text-body-sm font-bold text-ink">{t('editor.categories')}</span>
            <CategoryChips
              value={categories}
              onToggle={toggleCategory}
              disabled={!enabled}
              label={t('editor.categories')}
            />
          </div>
        </fieldset>

        {rootError ? (
          <p role="alert" className="text-label font-semibold text-brand">
            {rootError}
          </p>
        ) : null}
        {save.error && !rootError ? (
          <p role="alert" className="text-label font-semibold text-brand">
            {failureMessage(save.error)}
          </p>
        ) : null}

        <div className="mt-auto flex w-full flex-col gap-3 pt-2">
          <p className="text-caption text-ink3">{t('editor.demoNote')}</p>
          <Button type="submit" variant="brand" size="xl" fullWidth loading={save.isPending}>
            {tc('save')}
          </Button>
        </div>
      </Form>
    </Drawer>
  );
}
