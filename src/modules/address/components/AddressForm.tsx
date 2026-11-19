'use client';

/**
 * The "Yeni ünvan" form panel (`Form Panel`, `app-yeni-unvan.html`): `surface` r36, padding 28,
 * gap 18 — title 26/800, the kind chips, Küçə, the Bina / Mərtəbə / Mənzil row, the courier-note
 * textarea, the "Əsas ünvan et" switch, then the 56-high submit.
 *
 * Fields come from the **verified read shape**: `type` (the address line), `person_name`, `phone`,
 * `road`, `building_name`, `entrance_number`, `floor`, `apartment_room`, `address_details`,
 * `address_type`.
 *
 * `react-hook-form` + `zod` through `@/shared/ui`'s `Form` / `FormField`; a 422 is mapped onto the
 * fields with `applyFieldErrors`.
 */
import { useEffect, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { cn } from '@/core/lib/cn';
import { normalizeToE164 } from '@/core/lib/phone';
import type { Failure } from '@/core/network';
import {
  Button,
  Chip,
  Form,
  FormField,
  Input,
  PhoneInput,
  Switch,
  Textarea,
  applyFieldErrors,
  useOzioForm,
} from '@/shared/ui';
import { OutOfZoneNotice } from '@/shared/states';

import { ADDRESS_KINDS, type AddressInput, type AddressKind, type LatLng } from '../data/models/address';

/** Limits from the screen spec (app-places.md §7 "Validation"). */
const LIMITS = { line: 160, road: 120, building: 10, floor: 4, apartment: 10, note: 200 } as const;

const digits = /^[0-9]*$/;

export interface AddressFormValues {
  kind: AddressKind;
  line: string;
  road: string;
  buildingName: string;
  floor: string;
  apartmentRoom: string;
  entranceNumber: string;
  personName: string;
  phone: string;
  details: string;
  makeDefault: boolean;
}

function schemaFor(messages: {
  required: string;
  tooLong: (max: number) => string;
  digitsOnly: string;
  phone: string;
}) {
  return z.object({
    kind: z.enum(['home', 'office', 'other']),
    line: z.string().trim().min(1, messages.required).max(LIMITS.line, messages.tooLong(LIMITS.line)),
    road: z.string().trim().min(1, messages.required).max(LIMITS.road, messages.tooLong(LIMITS.road)),
    buildingName: z
      .string()
      .trim()
      .min(1, messages.required)
      .max(LIMITS.building, messages.tooLong(LIMITS.building)),
    floor: z
      .string()
      .trim()
      .max(LIMITS.floor, messages.tooLong(LIMITS.floor))
      .refine((v) => v === '' || digits.test(v), messages.digitsOnly),
    apartmentRoom: z.string().trim().max(LIMITS.apartment, messages.tooLong(LIMITS.apartment)),
    entranceNumber: z
      .string()
      .trim()
      .max(LIMITS.floor, messages.tooLong(LIMITS.floor))
      .refine((v) => v === '' || digits.test(v), messages.digitsOnly),
    personName: z.string().trim().max(80, messages.tooLong(80)),
    phone: z
      .string()
      .trim()
      .refine((v) => v === '' || normalizeToE164(v) !== null, messages.phone),
    details: z.string().trim().max(LIMITS.note, messages.tooLong(LIMITS.note)),
    makeDefault: z.boolean(),
  });
}

/** What the form hands back: the write input plus whether it should become the delivery address. */
export type AddressFormSubmit = AddressInput & { makeSelected: boolean };

export interface AddressFormProps {
  /** Pre-fill (edit flow), or the reverse-geocoded line from the map picker. */
  initial?: Partial<AddressFormValues>;
  /** The pin's point. `null` saves the address without coordinates. */
  point: LatLng | null;
  /**
   * `true` when the chosen point is outside the delivery zone (UN7). Saving is blocked, the submit
   * is replaced by the disabled "Zonadan kənar ünvan saxlanmır" and the secondary action re-focuses
   * the map.
   */
  outOfZone?: boolean;
  onPickAnother?: () => void;
  onZoneMap?: () => void;
  onSubmit: (input: AddressFormSubmit) => void | Promise<void>;
  submitting?: boolean;
  /** The failure of the last submit — a 422 is mapped onto the fields. */
  failure?: Failure | null;
  /** Compact variant for the modal (no card chrome; the modal already provides it). */
  bare?: boolean;
  title?: string;
  /**
   * Heading level for `title`. The form's title is the page heading on `/addresses/pick` and
   * `/addresses/new` (the export draws no other one), so those pass `h1`; inside a modal the
   * dialog owns the title and `title` is omitted entirely.
   */
  titleAs?: 'h1' | 'h2';
  className?: string;
}

export function AddressForm({
  initial,
  point,
  outOfZone = false,
  onPickAnother,
  onZoneMap,
  onSubmit,
  submitting = false,
  failure = null,
  bare = false,
  title,
  titleAs: Title = 'h2',
  className,
}: AddressFormProps) {
  const t = useTranslations('address');

  const schema = useMemo(
    () =>
      schemaFor({
        required: t('form.errors.required'),
        tooLong: (max) => t('form.errors.tooLong', { max }),
        digitsOnly: t('form.errors.digitsOnly'),
        phone: t('form.errors.phone'),
      }),
    [t],
  );

  const form = useOzioForm<AddressFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      kind: 'home',
      line: '',
      road: '',
      buildingName: '',
      floor: '',
      apartmentRoom: '',
      entranceNumber: '',
      personName: '',
      phone: '',
      details: '',
      makeDefault: false,
      ...initial,
    },
  });

  // The map's reverse-geocoded line keeps the two in sync while the user has not typed over it.
  useEffect(() => {
    if (!initial) return;
    for (const [key, value] of Object.entries(initial) as [keyof AddressFormValues, never][]) {
      if (value === undefined) continue;
      if (form.getFieldState(key).isDirty) continue;
      form.setValue(key, value, { shouldDirty: false, shouldValidate: false });
    }
    // `form` is stable; `initial` identity drives this.
  }, [initial, form]);

  useEffect(() => {
    if (!failure) return;
    const unmatched = applyFieldErrors(form, failure.fieldErrors);
    if (unmatched.length > 0) {
      form.setError('root', { type: 'server', message: unmatched.map((e) => e.message).join(' ') });
    }
  }, [failure, form]);

  const kind = form.watch('kind');
  const makeDefault = form.watch('makeDefault');
  const rootError = form.formState.errors.root?.message;

  return (
    <Form
      form={form}
      onSubmit={(values) =>
        onSubmit({
          line: values.line,
          kind: values.kind,
          road: values.road || null,
          buildingName: values.buildingName || null,
          entranceNumber: values.entranceNumber || null,
          floor: values.floor || null,
          apartmentRoom: values.apartmentRoom || null,
          personName: values.personName || null,
          phone: normalizeToE164(values.phone),
          details: values.details || null,
          point,
          makeSelected: values.makeDefault,
        })
      }
      className={cn(
        'flex w-full flex-col gap-[18px]',
        !bare && 'rounded-bento bg-surface p-7',
        className,
      )}
    >
      {outOfZone ? (
        <OutOfZoneNotice
          title={t('outOfZone.title')}
          body={t('outOfZone.body')}
          actionSlot={
            onZoneMap ? (
              <button
                type="button"
                onClick={onZoneMap}
                className="shrink-0 rounded-pill bg-cta px-[18px] py-2.5 text-label font-bold text-on-cta"
              >
                {t('outOfZone.seeZones')}
              </button>
            ) : undefined
          }
        />
      ) : null}

      {title ? (
        <Title className="m-0 text-[26px] font-extrabold tracking-[-0.02em] text-ink">{title}</Title>
      ) : null}

      {/* Kind chips */}
      <fieldset className="m-0 flex w-full flex-col gap-2 border-0 p-0">
        <legend className="mb-2 p-0 text-caption font-semibold text-ink2">{t('form.kind')}</legend>
        <div className="flex flex-row flex-wrap gap-2">
          {ADDRESS_KINDS.map((option) => (
            <Chip
              key={option}
              selected={kind === option}
              aria-pressed={kind === option}
              onClick={() => form.setValue('kind', option, { shouldDirty: true })}
            >
              {t(`kind.${option}`)}
            </Chip>
          ))}
        </div>
      </fieldset>

      <FormField<AddressFormValues, 'line'> name="line" label={t('form.line')} required>
        {({ field, state }) => (
          <Input
            {...field}
            value={field.value}
            state={state}
            variant="compact"
            maxLength={LIMITS.line}
            placeholder={t('form.linePlaceholder')}
          />
        )}
      </FormField>

      <FormField<AddressFormValues, 'road'> name="road" label={t('form.road')} required>
        {({ field, state }) => (
          <Input {...field} value={field.value} state={state} variant="compact" maxLength={LIMITS.road} />
        )}
      </FormField>

      <div className="flex w-full flex-row gap-3">
        <FormField<AddressFormValues, 'buildingName'>
          name="buildingName"
          label={t('form.building')}
          required
          className="flex-1"
        >
          {({ field, state }) => (
            <Input {...field} value={field.value} state={state} variant="compact" maxLength={LIMITS.building} />
          )}
        </FormField>
        <FormField<AddressFormValues, 'floor'> name="floor" label={t('form.floor')} className="flex-1">
          {({ field, state }) => (
            <Input
              {...field}
              value={field.value}
              state={state}
              variant="compact"
              inputMode="numeric"
              maxLength={LIMITS.floor}
            />
          )}
        </FormField>
        <FormField<AddressFormValues, 'apartmentRoom'>
          name="apartmentRoom"
          label={t('form.apartment')}
          className="flex-1"
        >
          {({ field, state }) => (
            <Input {...field} value={field.value} state={state} variant="compact" maxLength={LIMITS.apartment} />
          )}
        </FormField>
      </div>

      <div className="flex w-full flex-row gap-3">
        <FormField<AddressFormValues, 'entranceNumber'>
          name="entranceNumber"
          label={t('form.entrance')}
          className="flex-1"
        >
          {({ field, state }) => (
            <Input
              {...field}
              value={field.value}
              state={state}
              variant="compact"
              inputMode="numeric"
              maxLength={LIMITS.floor}
            />
          )}
        </FormField>
        <FormField<AddressFormValues, 'personName'>
          name="personName"
          label={t('form.personName')}
          className="flex-1"
        >
          {({ field, state }) => (
            <Input {...field} value={field.value} state={state} variant="compact" maxLength={80} />
          )}
        </FormField>
      </div>

      <FormField<AddressFormValues, 'phone'> name="phone" label={t('form.phone')}>
        {({ field, state }) => (
          <PhoneInput
            name={field.name}
            value={field.value}
            onBlur={field.onBlur}
            onChange={(next) => field.onChange(next.digits)}
            state={state}
            variant="compact"
          />
        )}
      </FormField>

      <FormField<AddressFormValues, 'details'>
        name="details"
        label={t('form.note')}
        helper={t('form.noteHelper')}
      >
        {({ field, state }) => (
          <Textarea
            {...field}
            value={field.value}
            state={state}
            rows={3}
            maxLength={LIMITS.note}
            placeholder={t('form.notePlaceholder')}
            className="min-h-[88px]"
          />
        )}
      </FormField>

      <Switch
        checked={makeDefault}
        onCheckedChange={(next) => form.setValue('makeDefault', next, { shouldDirty: true })}
        label={t('form.makeDefault')}
      />

      {rootError ? (
        <p role="alert" className="m-0 text-label font-semibold text-brand">
          {rootError}
        </p>
      ) : null}

      {point === null ? (
        <p className="m-0 text-caption text-ink3">{t('form.noPointHint')}</p>
      ) : null}

      <div className="mt-auto flex w-full flex-col gap-3">
        {outOfZone ? (
          <>
            <Button type="button" size="2xl" fullWidth disabled>
              {t('outOfZone.saveBlocked')}
            </Button>
            {onPickAnother ? (
              <Button type="button" variant="ghost" size="lg" fullWidth onClick={onPickAnother}>
                {t('outOfZone.pickAnother')}
              </Button>
            ) : null}
          </>
        ) : (
          <Button type="submit" variant="brand" size="2xl" fullWidth loading={submitting}>
            {t('form.submit')}
          </Button>
        )}
      </div>
    </Form>
  );
}
