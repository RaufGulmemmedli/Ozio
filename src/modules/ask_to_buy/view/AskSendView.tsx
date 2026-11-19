'use client';

/**
 * `/ask-to-buy/send` — "Valideynə göndər" (`ask-send.html`, node `Xx7D4`).
 *
 * Layout from the export: Page Header → demo notice → Columns (gap 32). The left column holds the
 * recipient card (title 20/700 + two 20-radius parent tiles, the selected one `brand-soft` with a
 * check glyph) and the note card (a 120-high `bg` textarea, radius 14, plus a `0 / 140` counter).
 * The right column is the 400-wide basket summary: item rows 15/400 ↔ 15/600, a `line` divider,
 * `Cəmi` 16/600 beside 28/800, the brand pill CTA and the 24-hour expiry note.
 *
 * `react-hook-form` + `zod` through `Form` / `FormField`; the basket itself is read-only (it is
 * the person's cart in a real build), so only the recipient and the note are fields.
 *
 * Money is never computed here: `draftTotal` and each `lineTotal` arrive from the mock API.
 */
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo } from 'react';
import { z } from 'zod';

import { cn } from '@/core/lib/cn';
import { useFailureMessage, useFormat, useRouter } from '@/core/i18n';
import { paths } from '@/core/routes';
import { PageHeader } from '@/shared/layout';
import { CircleCheck } from '@/shared/lucide';
import { DemoBanner, EmptyState, ErrorState } from '@/shared/states';
import { Breadcrumbs, Button, Form, FormField, Textarea, applyFieldErrors, toast, useOzioForm } from '@/shared/ui';

import { LinkButton } from '../components/link-button';
import { NOTE_MAX_LENGTH } from '../data/ask_to_buy.fixtures';
import { useAskContext, useSendAsk } from '../hooks/use-ask-to-buy';
import { AskSendSkeleton } from './AskSendSkeleton';

interface SendFormValues {
  parentId: string;
  note: string;
}

const schemaFor = (messages: { parent: string; tooLong: string }) =>
  z.object({
    parentId: z.string().min(1, messages.parent),
    note: z.string().max(NOTE_MAX_LENGTH, messages.tooLong),
  });

export function AskSendView() {
  const t = useTranslations('ask_to_buy');
  const tc = useTranslations('common');
  const { money, number } = useFormat();
  const failureMessage = useFailureMessage();
  const router = useRouter();

  const context = useAskContext();
  const send = useSendAsk();

  const schema = useMemo(
    () =>
      schemaFor({
        parent: t('send.errors.parent'),
        tooLong: t('send.errors.noteTooLong', { max: NOTE_MAX_LENGTH }),
      }),
    [t],
  );

  const form = useOzioForm<SendFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { parentId: '', note: '' },
  });

  // Memoised so the effect below does not see a fresh array identity on every render.
  const parents = useMemo(() => context.data?.parents ?? [], [context.data]);
  const items = context.data?.draftItems ?? [];

  // Pre-select the first family member once the pickers have loaded, unless one was chosen.
  // This writes into the form, not into React state, so it is not a cascading render.
  useEffect(() => {
    const first = parents[0]?.id;
    if (!first) return;
    if (form.getValues('parentId').length > 0) return;
    form.setValue('parentId', first, { shouldDirty: false, shouldValidate: false });
  }, [parents, form]);

  useEffect(() => {
    if (!send.error) return;
    const unmatched = applyFieldErrors(form, send.error.fieldErrors);
    if (unmatched.length > 0) {
      form.setError('root', { type: 'server', message: unmatched.map((e) => e.message).join(' ') });
    }
  }, [send.error, form]);

  const selectedId = form.watch('parentId');
  const note = form.watch('note') ?? '';
  const rootError = form.formState.errors.root?.message;

  const header = (
    <>
      <PageHeader
        title={t('send.title')}
        subtitle={t('send.subtitle')}
        breadcrumbs={
          <Breadcrumbs
            label={t('breadcrumb.label')}
            items={[
              { label: t('breadcrumb.profile'), href: paths.profile },
              { label: t('breadcrumb.module'), href: paths.askToBuy },
              { label: t('send.title') },
            ]}
          />
        }
      />
      <DemoBanner module={t('title')} body={t('demo.body')} />
    </>
  );

  if (context.isPending) {
    return (
      <>
        {header}
        <AskSendSkeleton />
      </>
    );
  }

  if (context.isError) {
    return (
      <>
        {header}
        <ErrorState
          failure={context.error}
          title={t('send.error.title')}
          message={failureMessage(context.error)}
          retryLabel={tc('retry')}
          retrying={context.isRefetching}
          onRetry={() => context.refetch()}
          className="min-h-[460px] justify-center rounded-xl bg-surface p-7"
        />
      </>
    );
  }

  if (items.length === 0 || parents.length === 0) {
    return (
      <>
        {header}
        <EmptyState
          icon={CircleCheck}
          title={t('send.empty.title')}
          body={t('send.empty.body')}
          action={
            <LinkButton href={paths.cart} variant="primary" size="xl">
              {t('send.empty.action')}
            </LinkButton>
          }
          className="min-h-[460px] justify-center rounded-xl bg-surface p-7"
        />
      </>
    );
  }

  const onSubmit = (values: SendFormValues) => {
    send.mutate(
      { parentId: values.parentId, note: values.note },
      {
        onSuccess: (request) => {
          toast.success({ title: t('send.toast', { reference: request.reference }) });
          router.push(paths.askToBuyRequest(request.id));
        },
      },
    );
  };

  return (
    <>
      {header}

      <Form
        form={form}
        onSubmit={onSubmit}
        className="flex w-full flex-col items-start gap-8 lg:flex-row"
      >
        <div className="flex w-full min-w-0 flex-1 flex-col gap-6">
          <section
            aria-labelledby="ask-recipient"
            className="flex w-full flex-col items-start gap-[18px] rounded-xl bg-surface p-7"
          >
            <h2 id="ask-recipient" className="text-h4 font-bold text-ink">
              {t('send.recipient')}
            </h2>

            <FormField<SendFormValues, 'parentId'> name="parentId">
              {({ field, error }) => (
                <div className="flex w-full flex-col gap-2">
                  <div
                    role="radiogroup"
                    aria-label={t('send.recipient')}
                    aria-invalid={error ? true : undefined}
                    className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2"
                  >
                    {parents.map((parent) => {
                      const selected = parent.id === selectedId;
                      return (
                        <button
                          key={parent.id}
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          onClick={() => field.onChange(parent.id)}
                          onBlur={field.onBlur}
                          className={cn(
                            'flex min-h-20 w-full flex-row items-center gap-[14px] rounded-lg p-5 text-start',
                            'transition-colors duration-[var(--oz-dur-fast)]',
                            selected ? 'bg-brand-soft ring-2 ring-brand' : 'bg-bg',
                          )}
                        >
                          <span
                            aria-hidden="true"
                            className={cn(
                              'flex size-12 shrink-0 items-center justify-center rounded-pill text-body-l font-bold',
                              selected ? 'bg-brand text-white' : 'bg-surface2 text-ink2',
                            )}
                          >
                            {parent.name.trim().charAt(0).toLocaleUpperCase('az')}
                          </span>
                          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                            <span className="truncate text-[17px] font-bold text-ink">
                              {parent.name}
                            </span>
                            <span className="truncate text-label text-ink2">
                              {parent.relationLabel}
                            </span>
                          </span>
                          {selected ? (
                            <CircleCheck aria-hidden="true" size={24} className="shrink-0 text-brand" />
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                  {error ? (
                    <p role="alert" className="text-label font-semibold text-brand">
                      {error}
                    </p>
                  ) : null}
                </div>
              )}
            </FormField>
          </section>

          <section
            aria-labelledby="ask-note"
            className="flex w-full flex-col items-start gap-[18px] rounded-xl bg-surface p-7"
          >
            <h2 id="ask-note" className="text-h4 font-bold text-ink">
              {t('send.noteTitle')}
            </h2>
            <FormField<SendFormValues, 'note'>
              name="note"
              className="w-full"
              helper={t('send.noteCounter', {
                count: number(note.length),
                max: number(NOTE_MAX_LENGTH),
              })}
            >
              {({ field, state }) => (
                <Textarea
                  {...field}
                  state={state}
                  maxLength={NOTE_MAX_LENGTH}
                  rows={4}
                  placeholder={t('send.notePlaceholder')}
                  className="min-h-[120px]"
                />
              )}
            </FormField>
          </section>
        </div>

        <section
          aria-labelledby="ask-basket"
          className="flex w-full shrink-0 flex-col items-start gap-4 rounded-xl bg-surface p-7 lg:w-[400px]"
        >
          <h2 id="ask-basket" className="text-h4 font-bold text-ink">
            {t('send.basket')}
          </h2>

          <dl className="flex w-full flex-col gap-4">
            {items.map((item) => (
              <div key={item.id} className="flex w-full flex-row items-start justify-between gap-4">
                <dt className="min-w-0 text-body-sm text-ink2">
                  {item.name} × {item.unit ? `${number(item.qty)} ${item.unit}` : number(item.qty)}
                </dt>
                <dd className="shrink-0 text-body-sm font-semibold text-ink">
                  {money(item.lineTotal)}
                </dd>
              </div>
            ))}
          </dl>

          <div className="h-px w-full bg-line" />

          <div className="flex w-full flex-row items-center justify-between gap-4">
            <span className="text-body font-semibold text-ink">{t('summary.total')}</span>
            <span className="text-h3 font-extrabold text-ink">
              {money(context.data?.draftTotal ?? 0)}
            </span>
          </div>

          {rootError ? (
            <p role="alert" className="text-label font-semibold text-brand">
              {rootError}
            </p>
          ) : null}

          <Button type="submit" variant="brand" size="xl" fullWidth loading={send.isPending}>
            {t('send.submit')}
          </Button>

          <p className="text-caption text-ink3">{t('send.expiry')}</p>
        </section>
      </Form>
    </>
  );
}
