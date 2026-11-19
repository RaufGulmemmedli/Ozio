'use client';

/**
 * `/parcel/new` — "Bağlama · Yeni" (`J8np0`), the one-page version of the mobile 4-step flow.
 *
 * Left column: Götürmə ünvanı, Çatdırılma ünvanı, Bağlama, Ödəniş.
 * Right column: the live quote (`<ParcelQuotePanel>`) and the CTA that opens the confirm modal
 * (`zAw1D`). On submit the mock creates the shipment and we navigate to `/parcel/[id]`.
 *
 * Addresses come from the mock's saved-address list for now. Once the address module ships its
 * public surface this screen swaps the chips for it:
 * // TODO(address): import { useAddresses, AddressPicker } from '@/modules/address';
 */
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { useFormat } from '@/core/i18n';
import { useRouter } from '@/core/i18n/navigation';
import { paths } from '@/core/routes';
import { Banknote, CreditCard, Wallet, type LucideIcon } from '@/shared/lucide';
import { PageHeader } from '@/shared/layout';
import { DemoBanner, ErrorState } from '@/shared/states';
import {
  Breadcrumbs,
  Button,
  Field,
  Input,
  SegmentedControl,
  Switch,
  Textarea,
  toast,
} from '@/shared/ui';

import { ParcelConfirmModal } from '../components/parcel-confirm-modal';
import { ParcelQuotePanel } from '../components/parcel-quote-panel';
import type {
  ParcelPaymentMethod,
  ParcelRules,
  ParcelSizePreset,
} from '../data/models/parcel';
import { useParcelDraft, type ParcelField, type ParcelPointKey } from '../hooks/use-parcel-draft';
import { useCreateParcel, useParcelQuote, useParcelRules } from '../hooks/use-parcels';

import { ParcelNewSkeleton } from './ParcelNewSkeleton';

const METHOD_ICON: Record<ParcelPaymentMethod, LucideIcon> = {
  cash: Banknote,
  card: CreditCard,
  ozioBalance: Wallet,
};

export function ParcelNewView() {
  const t = useTranslations('parcel');
  const router = useRouter();
  const { money } = useFormat();

  const rulesQuery = useParcelRules();
  const rules = rulesQuery.data;

  const form = useParcelDraft(rules);
  const quote = useParcelQuote(form.draft);
  const create = useCreateParcel();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const issue = (field: ParcelField): string | undefined => {
    const found = form.issues[field];
    return found ? t(found.key, found.values) : undefined;
  };

  const quoteState = !quote.ready
    ? 'idle'
    : quote.isPending
      ? 'loading'
      : quote.isError
        ? 'error'
        : 'ready';

  const openConfirm = () => {
    form.markTouched();
    if (!form.valid) return;
    setConfirmOpen(true);
  };

  const submit = () => {
    if (!quote.data) return;
    create.mutate(
      { draft: form.draft, quote: quote.data },
      {
        onSuccess: (parcel) => {
          setConfirmOpen(false);
          router.push(paths.parcelDetail(parcel.id));
        },
        onError: (failure) => {
          toast.error({ title: t('error.title'), body: failure.message });
        },
      },
    );
  };

  return (
    <>
      <DemoBanner module="parcel" body={t('demo')} />

      <PageHeader
        title={t('new.title')}
        subtitle={t('new.subtitle')}
        breadcrumbs={
          <Breadcrumbs
            items={[
              { label: t('crumb.parcel'), href: paths.parcel },
              { label: t('new.crumb') },
            ]}
          />
        }
        actions={
          <Button as="a" href={paths.parcel} variant="soft" size="2xl">
            {t('new.cancel')}
          </Button>
        }
      />

      {rulesQuery.isPending ? (
        <ParcelNewSkeleton label={t('new.loading')} />
      ) : rulesQuery.isError ? (
        <ErrorState
          failure={rulesQuery.error}
          title={t('error.title')}
          message={t('error.body')}
          retryLabel={t('error.retry')}
          onRetry={() => void rulesQuery.refetch()}
        />
      ) : (
        <form
          className="flex w-full flex-col items-stretch gap-6 lg:flex-row lg:items-start"
          onSubmit={(event) => {
            event.preventDefault();
            openConfirm();
          }}
        >
          <div className="flex min-w-0 flex-1 flex-col gap-6">
            <AddressCard
              side="pickup"
              title={t('new.pickup')}
              rules={rules}
              form={form}
              issue={issue}
            />
            <AddressCard
              side="dropoff"
              title={t('new.dropoff')}
              rules={rules}
              form={form}
              issue={issue}
            />

            {/* Bağlama */}
            <section className="flex w-full flex-col gap-4 rounded-xl bg-surface p-6">
              <h2 className="m-0 text-h4 font-bold text-ink">{t('new.parcel')}</h2>

              <div
                role="radiogroup"
                aria-label={t('new.presetLabel')}
                className="grid w-full grid-cols-2 gap-3 md:grid-cols-4"
              >
                {(rules?.presets ?? []).map((preset) => (
                  <PresetTile
                    key={preset.id}
                    preset={preset}
                    selected={form.selectedPresetId === preset.id}
                    onSelect={() => form.applyPreset(preset)}
                  />
                ))}
              </div>

              <div className="grid w-full grid-cols-2 gap-4 md:grid-cols-4">
                <NumberField
                  label={t('new.length')}
                  value={form.draft.spec.lengthCm}
                  error={issue('spec.lengthCm')}
                  onChange={(v) => form.setSpec({ lengthCm: v })}
                />
                <NumberField
                  label={t('new.width')}
                  value={form.draft.spec.widthCm}
                  error={issue('spec.widthCm')}
                  onChange={(v) => form.setSpec({ widthCm: v })}
                />
                <NumberField
                  label={t('new.height')}
                  value={form.draft.spec.heightCm}
                  error={issue('spec.heightCm')}
                  onChange={(v) => form.setSpec({ heightCm: v })}
                />
                <NumberField
                  label={t('new.weight')}
                  value={form.draft.spec.weightKg}
                  step={0.1}
                  error={issue('spec.weightKg')}
                  onChange={(v) => form.setSpec({ weightKg: v })}
                />
              </div>

              <Field label={t('new.contents')} helper={issue('spec.contents')} state={issue('spec.contents') ? 'error' : 'default'}>
                <Input
                  value={form.draft.spec.contents}
                  placeholder={t('new.contentsHint')}
                  onChange={(e) => form.setSpec({ contents: e.target.value })}
                />
              </Field>

              <div className="flex w-full flex-row items-center justify-between gap-4 rounded-lg bg-surface2 p-4">
                <Switch
                  checked={form.draft.spec.fragile}
                  onCheckedChange={(checked) => form.setSpec({ fragile: checked })}
                  label={t('new.fragile')}
                  description={
                    rules ? t('new.fragileNote', { amount: money(rules.fragileFee) }) : undefined
                  }
                />
              </div>
            </section>

            {/* Ödəniş */}
            <section className="flex w-full flex-col gap-4 rounded-xl bg-surface p-6">
              <h2 className="m-0 text-h4 font-bold text-ink">{t('new.payment')}</h2>

              <SegmentedControl
                label={t('new.payerLabel')}
                value={form.draft.payer}
                onValueChange={(v) => form.setPayer(v === 'recipient' ? 'recipient' : 'sender')}
                options={[
                  { value: 'sender', label: t('new.payerSender') },
                  { value: 'recipient', label: t('new.payerRecipient') },
                ]}
              />

              <div
                role="radiogroup"
                aria-label={t('new.methodLabel')}
                className="grid w-full grid-cols-1 gap-3 md:grid-cols-3"
              >
                {(rules?.paymentMethods ?? []).map((method) => {
                  const Icon = METHOD_ICON[method];
                  const card = rules?.savedCards[0];
                  const meta =
                    method === 'cash'
                      ? t('new.methodCashNote')
                      : method === 'card'
                        ? (card?.mask ?? '')
                        : rules
                          ? money(rules.balance)
                          : '';
                  const disabled = form.draft.payer === 'recipient' && method !== 'cash';
                  return (
                    <MethodTile
                      key={method}
                      icon={Icon}
                      title={t(`new.method${method === 'ozioBalance' ? 'Balance' : method === 'card' ? 'Card' : 'Cash'}`)}
                      meta={meta}
                      selected={form.draft.paymentMethod === method}
                      disabled={disabled}
                      onSelect={() => form.setPaymentMethod(method, card?.id)}
                    />
                  );
                })}
              </div>

              {issue('payment') ? (
                <p role="alert" className="m-0 text-micro font-medium text-brand">
                  {issue('payment')}
                </p>
              ) : null}

              <Field label={t('new.note')}>
                <Textarea
                  value={form.draft.courierNote}
                  placeholder={t('new.noteHint')}
                  rows={3}
                  onChange={(e) => form.setNote(e.target.value)}
                />
              </Field>
            </section>
          </div>

          <ParcelQuotePanel
            quote={quote.data}
            spec={form.draft.spec}
            state={quoteState}
            failure={quote.error}
            canConfirm={form.valid}
            submitting={create.isPending}
            onRetry={() => void quote.refetch()}
            onConfirm={openConfirm}
          />
        </form>
      )}

      <ParcelConfirmModal
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        draft={form.draft}
        quote={quote.data}
        rules={rules}
        submitting={create.isPending}
        onConfirm={submit}
      />
    </>
  );
}

/* ------------------------------------------------------------------ pieces */

type FormApi = ReturnType<typeof useParcelDraft>;

function AddressCard({
  side,
  title,
  rules,
  form,
  issue,
}: {
  side: ParcelPointKey;
  title: string;
  rules?: ParcelRules;
  form: FormApi;
  issue: (field: ParcelField) => string | undefined;
}) {
  const t = useTranslations('parcel');
  const point = form.draft[side];
  const hint = side === 'pickup' ? 'new.pickupAddressHint' : 'new.dropoffAddressHint';
  const detailsHint = side === 'pickup' ? 'new.detailsHint' : 'new.dropoffDetailsHint';
  const nameHint = side === 'pickup' ? 'new.nameHint' : 'new.dropoffNameHint';
  const phoneHint = side === 'pickup' ? 'new.phoneHint' : 'new.dropoffPhoneHint';

  const addressError = issue(`${side}.address`);
  const nameError = issue(`${side}.contactName`);
  const phoneError = issue(`${side}.contactPhone`);

  return (
    <section className="flex w-full flex-col gap-4 rounded-xl bg-surface p-6">
      <h2 className="m-0 text-h4 font-bold text-ink">{title}</h2>

      {rules && rules.savedAddresses.length > 0 ? (
        <div className="flex w-full flex-row flex-wrap gap-2" aria-label={t('new.savedAddresses')}>
          {rules.savedAddresses.map((saved) => (
            <button
              key={saved.id}
              type="button"
              onClick={() => form.useSavedAddress(side, saved)}
              className="inline-flex h-9 items-center rounded-pill border border-line bg-surface px-3.5 text-caption font-medium text-ink2 hover:border-ink3 hover:text-ink"
            >
              {saved.title}
            </button>
          ))}
        </div>
      ) : null}

      <Field
        label={t('new.address')}
        helper={addressError}
        state={addressError ? 'error' : 'default'}
      >
        <Input
          value={point.address}
          placeholder={t(hint)}
          onChange={(e) => form.setPoint(side, { address: e.target.value })}
        />
      </Field>

      <Field label={t('new.details')}>
        <Input
          value={point.details}
          placeholder={t(detailsHint)}
          onChange={(e) => form.setPoint(side, { details: e.target.value })}
        />
      </Field>

      <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2">
        <Field
          label={t('new.contactName')}
          helper={nameError}
          state={nameError ? 'error' : 'default'}
        >
          <Input
            value={point.contactName}
            placeholder={t(nameHint)}
            onChange={(e) => form.setPoint(side, { contactName: e.target.value })}
          />
        </Field>
        <Field
          label={t('new.phone')}
          helper={phoneError}
          state={phoneError ? 'error' : 'default'}
        >
          <Input
            type="tel"
            inputMode="tel"
            value={point.contactPhone}
            placeholder={t(phoneHint)}
            onChange={(e) => form.setPoint(side, { contactPhone: e.target.value })}
          />
        </Field>
      </div>
    </section>
  );
}

function PresetTile({
  preset,
  selected,
  onSelect,
}: {
  preset: ParcelSizePreset;
  selected: boolean;
  onSelect: () => void;
}) {
  const t = useTranslations('parcel');
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={[
        'flex flex-col items-start gap-1 rounded-lg bg-surface2 p-4 text-left',
        'outline-offset-[-1px] transition-[outline-color,background-color]',
        selected ? 'outline-2 outline-brand' : 'outline-2 outline-transparent hover:bg-line',
      ].join(' ')}
    >
      <span className="text-h4 font-extrabold text-ink">{preset.code}</span>
      <span className="text-caption text-ink2">
        {t('new.presetDims', {
          l: preset.lengthCm,
          w: preset.widthCm,
          h: preset.heightCm,
        })}
      </span>
      <span className="text-caption text-ink3">
        {t('new.presetMaxWeight', { kg: preset.maxWeightKg })}
      </span>
    </button>
  );
}

function MethodTile({
  icon: Icon,
  title,
  meta,
  selected,
  disabled,
  onSelect,
}: {
  icon: LucideIcon;
  title: string;
  meta: string;
  selected: boolean;
  disabled: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      disabled={disabled}
      onClick={onSelect}
      className={[
        'flex flex-row items-center gap-3 rounded-lg bg-surface2 p-4 text-left',
        'outline-offset-[-1px] transition-[outline-color,background-color]',
        selected ? 'outline-2 outline-brand' : 'outline-2 outline-transparent hover:bg-line',
        disabled ? 'cursor-not-allowed opacity-40' : '',
      ].join(' ')}
    >
      <Icon size={22} aria-hidden="true" className="shrink-0 text-ink2" />
      <span className="flex min-w-0 flex-col">
        <span className="text-label font-bold text-ink">{title}</span>
        {meta ? <span className="truncate text-caption text-ink2">{meta}</span> : null}
      </span>
    </button>
  );
}

function NumberField({
  label,
  value,
  step = 1,
  error,
  onChange,
}: {
  label: string;
  value: number;
  step?: number;
  error?: string;
  onChange: (value: number) => void;
}) {
  return (
    <Field label={label} helper={error} state={error ? 'error' : 'default'}>
      <Input
        type="number"
        inputMode="decimal"
        min={0}
        step={step}
        value={String(value)}
        onChange={(e) => onChange(Number(e.target.value.replace(',', '.')) || 0)}
      />
    </Field>
  );
}
