'use client';

/**
 * `/viral/wishlists/new` — V3 "Kampaniya yarat" (`v3-viral-campaign-create.html`, frame `a9yoQI`).
 * See `WishlistsView` for the full frame → route table.
 *
 * Layout from the export: a white form card (radius 28, padding 32, gap 24) with four numbered
 * sections — "1. Hədiyyə seç" (a 2-column grid of product options; the selected one is
 * `brand-soft` with a `circle-check`), a `line` hairline, "2. Münasibət" (three chips), another
 * hairline, "3. Tarix" and "4. Mesaj" — and a 400-wide dark preview card with a 120 thumb, the
 * product at 24/800, "Hədəf: 480 ₼ · Ad günü · 30 Noy", a yellow progress bar, the quoted message
 * and the brand "Kampaniya yarat".
 *
 * Required: a product and a date — and **the handler enforces that**. The 422 it answers with is
 * mapped onto the fields; the submit button is not disabled on a client-side verdict.
 *
 * TODO(search): picking a gift should use the catalogue search from `@/modules/search` (agent M4)
 * — `import { ProductSearchField } from '@/modules/search'` — so a wishlist can target any product
 * instead of the five demo gifts. That module does not exist yet (`src/modules/search/` is
 * absent), and the mock's catalogue is exactly these five, so the drawn picker is what ships.
 */
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useEffect } from 'react';
import { z } from 'zod';

import { useFailureMessage, useFormat } from '@/core/i18n';
import { useRouter } from '@/core/i18n/navigation';
import { cn } from '@/core/lib/cn';
import { isValidation } from '@/core/network';
import { paths } from '@/core/routes';
import { PageHeader } from '@/shared/layout';
import { CircleAlert, CircleCheck } from '@/shared/lucide';
import { ErrorState } from '@/shared/states';
import {
  applyFieldErrors,
  Button,
  Chip,
  Form,
  FormField,
  Input,
  Progress,
  Textarea,
  toast,
  useOzioForm,
} from '@/shared/ui';

import { GiftThumb } from '../components/gift-thumb';
import { ViralDemoBanner } from '../components/viral-demo-banner';
import { OCCASIONS, type Occasion } from '../data/models/wishlist';
import { useCreateWishlist, useGiftProducts } from '../hooks/use-wishlists';
import { WishlistNewSkeleton } from './WishlistNewSkeleton';

/**
 * Deliberately permissive: the mock owns the "product and date are required" rule and answers 422,
 * which is what the fields display. The schema only shapes the values.
 */
const schema = z.object({
  productId: z.string(),
  occasion: z.string(),
  targetDate: z.string(),
  message: z.string(),
});

type Values = z.infer<typeof schema>;

export function WishlistNewView() {
  const t = useTranslations('viral');
  const { money, date } = useFormat();
  const failureMessage = useFailureMessage();
  const router = useRouter();

  const products = useGiftProducts();
  const create = useCreateWishlist();

  const form = useOzioForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { productId: '', occasion: 'birthday', targetDate: '', message: '' },
  });

  const values = form.watch();
  const picked = products.data?.items.find((product) => product.id === values.productId) ?? null;

  useEffect(() => {
    if (create.error && isValidation(create.error)) {
      // The handler names `product_id` / `target_date`; the form fields are camelCase.
      applyFieldErrors(
        form,
        create.error.fieldErrors.map((entry) => ({
          path:
            entry.path === 'product_id'
              ? 'productId'
              : entry.path === 'target_date'
                ? 'targetDate'
                : entry.path,
          message: entry.message,
        })),
      );
    }
  }, [create.error, form]);

  const header = (
    <>
      <PageHeader
        title={t('create.title')}
        subtitle={t('create.subtitle')}
        backHref={paths.viralWishlists}
        backLabel={t('crumb.wishlists')}
      />
      <ViralDemoBanner />
    </>
  );

  if (products.isPending) {
    return (
      <>
        {header}
        <WishlistNewSkeleton />
      </>
    );
  }

  if (products.isError) {
    return (
      <>
        {header}
        <ErrorState
          failure={products.error}
          title={t('error.title')}
          message={t('error.body')}
          retryLabel={t('error.retry')}
          onRetry={() => void products.refetch()}
          retrying={products.isFetching}
        />
      </>
    );
  }

  return (
    <>
      {header}

      <Form
        form={form}
        onSubmit={(data) =>
          create.mutate(
            {
              product_id: data.productId,
              occasion: data.occasion,
              target_date: data.targetDate,
              message: data.message.trim(),
            },
            {
              onSuccess: (wishlist) => {
                toast.success(t('create.done'));
                router.push(paths.viralWishlist(wishlist.id));
              },
            },
          )
        }
        className="flex w-full flex-col gap-8 lg:flex-row"
      >
        <div className="flex min-w-0 flex-1 flex-col gap-6 rounded-xl bg-surface p-6 lg:p-8">
          {/* 1 — the gift */}
          <fieldset className="flex w-full flex-col gap-4">
            <legend className="text-body font-extrabold text-ink">{t('create.step1')}</legend>

            <div
              role="radiogroup"
              aria-label={t('create.step1')}
              className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2"
            >
              {(products.data?.items ?? []).map((product) => {
                const selected = product.id === values.productId;
                return (
                  <button
                    key={product.id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => form.setValue('productId', product.id, { shouldValidate: true })}
                    className={cn(
                      'flex flex-row items-center gap-[14px] rounded-card p-[14px] text-left',
                      'transition-colors duration-[var(--oz-dur-fast)]',
                      selected ? 'bg-brand-soft' : 'bg-surface2 hover:bg-line',
                    )}
                  >
                    <GiftThumb
                      icon={product.icon}
                      size={56}
                      tone="white"
                      radiusClassName="rounded-md"
                    />
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="truncate text-body-sm font-bold text-ink">
                        {product.name}
                      </span>
                      <span className="text-caption text-ink3">{money(product.price)}</span>
                    </span>
                    {selected ? (
                      <CircleCheck size={22} aria-hidden="true" className="shrink-0 text-brand" />
                    ) : null}
                  </button>
                );
              })}
            </div>

            {form.formState.errors.productId ? (
              <p role="alert" className="text-caption text-brand">
                {String(form.formState.errors.productId.message ?? '')}
              </p>
            ) : null}
          </fieldset>

          <span aria-hidden="true" className="h-px w-full bg-line" />

          {/* 2 — the occasion */}
          <fieldset className="flex w-full flex-col gap-4">
            <legend className="text-body font-extrabold text-ink">{t('create.step2')}</legend>
            <div className="flex flex-row flex-wrap gap-2.5">
              {OCCASIONS.map((occasion: Occasion) => (
                <Chip
                  key={occasion}
                  selected={values.occasion === occasion}
                  onClick={() => form.setValue('occasion', occasion)}
                >
                  {t(`occasion.${occasion}`)}
                </Chip>
              ))}
            </div>
          </fieldset>

          <span aria-hidden="true" className="h-px w-full bg-line" />

          {/* 3 and 4 — the date and the message */}
          <div className="grid w-full grid-cols-1 gap-5 sm:grid-cols-2">
            <FormField form={form} name="targetDate" label={t('create.step3')}>
              {({ field, state }) => (
                <Input {...field} state={state} type="date" variant="compact" />
              )}
            </FormField>

            <FormField form={form} name="message" label={t('create.step4')}>
              {({ field, state }) => (
                <Textarea
                  {...field}
                  state={state}
                  rows={3}
                  placeholder={t('create.messagePlaceholder')}
                />
              )}
            </FormField>
          </div>
        </div>

        {/* The dark preview column. */}
        <aside
          aria-labelledby="wishlist-preview"
          className="flex w-full flex-col gap-[18px] rounded-bento bg-block p-7 lg:w-[400px] lg:shrink-0"
        >
          <h2 id="wishlist-preview" className="text-label font-bold text-on-block">
            {t('create.preview')}
          </h2>

          <GiftThumb
            icon={picked?.icon ?? 'bike'}
            size={120}
            tone="onBlock"
            radiusClassName="rounded-xl"
          />

          <p className="text-h3 font-extrabold text-on-block">
            {picked ? picked.name : t('create.previewEmpty')}
          </p>

          <p className="text-label text-on-block2">
            {t('create.previewMeta', {
              target: picked ? money(picked.price) : money(0),
              occasion: t(`occasion.${(values.occasion || 'birthday') as Occasion}`),
              date: values.targetDate ? date(values.targetDate, 'dayMonth') : '—',
            })}
          </p>

          <Progress
            value={0}
            max={100}
            height={10}
            tone="yellow"
            label={t('create.preview')}
            valueText={t('percent', { value: 0 })}
          />

          {values.message.trim() ? (
            <p className="text-label text-on-block2">
              {t('create.previewQuote', { message: values.message.trim() })}
            </p>
          ) : null}

          {create.error && !isValidation(create.error) ? (
            <p
              role="alert"
              className="flex w-full flex-row items-start gap-2 rounded-md bg-brand-soft p-3 text-caption text-brand"
            >
              <CircleAlert size={16} aria-hidden="true" className="mt-px shrink-0" />
              {failureMessage(create.error)}
            </p>
          ) : null}

          <Button type="submit" variant="brand" size="xl" fullWidth loading={create.isPending}>
            {t('create.submit')}
          </Button>
        </aside>
      </Form>
    </>
  );
}
