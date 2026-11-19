'use client';

/**
 * `/courier-plus/hub/register` — `Yolüstü kuryer · Anbar qeydiyyatı` (`A2S51h`).
 *
 * `react-hook-form` + `zod`: Ünvan, Açılış / Bağlanış saatı and the capacity chips (5/10/20/30),
 * next to the dark "Nə qazanırsan?" panel whose 0,30 ₼ comes from the **server** (`overview`), not
 * from this file. Registering goes straight to the hub panel.
 */
import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { MANAT, useFormat } from '@/core/i18n';
import { useFailureMessage } from '@/core/i18n/failure-message';
import { useRouter } from '@/core/i18n/navigation';
import { cn } from '@/core/lib/cn';
import { paths } from '@/core/routes';
import { Bone, Shimmer } from '@/shared/skeleton';
import { InlineNotice } from '@/shared/states';
import { Button, Form, FormField, Input, toast, useOzioForm } from '@/shared/ui';

import { CpInfoPanel } from '../components/CpPrimitives';
import { CpScreen } from '../components/CpScreen';
import { CP_HUB_CAPACITIES } from '../data/courier_plus.fixtures';
import { clockToMinutes, minutesToClock, type CpHubProfile } from '../data/models/courier-plus';
import {
  useCourierPlusHubProfile,
  useCourierPlusOverview,
  useRegisterCourierPlusHub,
} from '../hooks/use-courier-plus';

interface HubFormValues {
  address: string;
  openAt: string;
  closeAt: string;
  capacity: number;
}

const TIME_PATTERN = /^\d{1,2}:\d{2}$/;

function schemaFor(messages: { required: string; address: string; time: string; order: string }) {
  return z
    .object({
      address: z.string().trim().min(1, messages.required).min(6, messages.address),
      openAt: z.string().regex(TIME_PATTERN, messages.time),
      closeAt: z.string().regex(TIME_PATTERN, messages.time),
      capacity: z.number().int().positive(),
    })
    .refine(
      (v) => {
        const open = clockToMinutes(v.openAt);
        const close = clockToMinutes(v.closeAt);
        return open !== null && close !== null && close > open;
      },
      { path: ['closeAt'], message: messages.order },
    );
}

function CpHubForm({ profile }: { profile: CpHubProfile | null }) {
  const t = useTranslations('courier_plus');
  const router = useRouter();
  const failureMessage = useFailureMessage();
  const register = useRegisterCourierPlusHub();

  const schema = useMemo(
    () =>
      schemaFor({
        required: t('hubRegister.errors.required'),
        address: t('hubRegister.errors.address'),
        time: t('hubRegister.errors.time'),
        order: t('hubRegister.errors.order'),
      }),
    [t],
  );

  const form = useOzioForm<HubFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      address: profile?.address ?? '',
      openAt: minutesToClock(profile?.openMinutes ?? 9 * 60),
      closeAt: minutesToClock(profile?.closeMinutes ?? 21 * 60),
      capacity: profile?.capacity ?? 10,
    },
  });

  const capacity = form.watch('capacity');

  return (
    <Form
      form={form}
      className="flex w-full min-w-0 flex-col items-start gap-5 rounded-xl bg-surface p-6 md:p-8"
      onSubmit={(values) => {
        register.mutate(
          {
            address: values.address,
            openMinutes: clockToMinutes(values.openAt) ?? 9 * 60,
            closeMinutes: clockToMinutes(values.closeAt) ?? 21 * 60,
            capacity: values.capacity,
          },
          {
            onSuccess: () => {
              toast.success({ title: t('hubRegister.done') });
              router.push(paths.courierPlusHub);
            },
          },
        );
      }}
    >
      {register.error ? (
        <InlineNotice tone="error" className="w-full" body={failureMessage(register.error)} />
      ) : null}

      <FormField<HubFormValues, 'address'>
        name="address"
        label={t('hubRegister.address')}
        className="w-full"
      >
        {({ field, state }) => (
          <Input
            {...field}
            value={field.value}
            variant="compact"
            state={state}
            autoComplete="off"
            placeholder={t('hubRegister.addressPlaceholder')}
            containerClassName="rounded-[16px] border-transparent bg-surface2"
          />
        )}
      </FormField>

      <div className="flex w-full flex-col gap-5 md:flex-row">
        <FormField<HubFormValues, 'openAt'>
          name="openAt"
          label={t('hubRegister.openAt')}
          className="w-full"
        >
          {({ field, state }) => (
            <Input
              {...field}
              value={field.value}
              type="time"
              variant="compact"
              state={state}
              containerClassName="rounded-[16px] border-transparent bg-surface2"
            />
          )}
        </FormField>

        <FormField<HubFormValues, 'closeAt'>
          name="closeAt"
          label={t('hubRegister.closeAt')}
          className="w-full"
        >
          {({ field, state }) => (
            <Input
              {...field}
              value={field.value}
              type="time"
              variant="compact"
              state={state}
              containerClassName="rounded-[16px] border-transparent bg-surface2"
            />
          )}
        </FormField>
      </div>

      <fieldset className="m-0 flex w-full flex-col gap-2.5 border-0 p-0">
        <legend className="mb-0 p-0 text-caption font-bold text-ink3">
          {t('hubRegister.capacity')}
        </legend>
        <div
          role="radiogroup"
          aria-label={t('hubRegister.capacity')}
          className="flex flex-row flex-wrap gap-2.5"
        >
          {CP_HUB_CAPACITIES.map((option) => {
            const active = capacity === option;
            return (
              <button
                key={option}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() =>
                  form.setValue('capacity', option, { shouldDirty: true, shouldValidate: true })
                }
                className={cn(
                  'flex h-11 min-w-[72px] flex-row items-center justify-center rounded-pill px-5 text-label',
                  active
                    ? 'bg-cta font-bold text-on-cta'
                    : 'bg-surface2 font-medium text-ink2 hover:bg-line',
                )}
              >
                {option}
              </button>
            );
          })}
        </div>
      </fieldset>

      <Button type="submit" variant="brand" size="2xl" loading={register.isPending}>
        {t('hubRegister.submit')}
      </Button>
    </Form>
  );
}

export function CourierPlusHubRegisterView() {
  const t = useTranslations('courier_plus');
  const f = useFormat();

  const profile = useCourierPlusHubProfile();
  const overview = useCourierPlusOverview();

  const commission = overview.data?.hubCommission;

  const header = (
    <CpScreen
      crumbs={[{ label: t('crumb.module'), href: paths.courierPlus }, { label: t('crumb.hub') }]}
      title={t('hubRegister.title')}
      subtitle={t('hubRegister.subtitle')}
    />
  );

  return (
    <>
      {header}

      <div className="flex w-full flex-col gap-6 lg:flex-row">
        {profile.isPending ? (
          <Shimmer
            label={t('loading')}
            className="flex w-full flex-col items-start gap-5 rounded-xl bg-surface p-6 md:p-8"
          >
            <div className="flex w-full flex-col gap-1.5">
              <Bone w={80} h={12} r="xs" />
              <Bone w="100%" h={52} r={16} />
            </div>
            <div className="flex w-full flex-col gap-5 md:flex-row">
              {[0, 1].map((i) => (
                <div key={i} className="flex w-full flex-col gap-1.5">
                  <Bone w={100} h={12} r="xs" />
                  <Bone w="100%" h={52} r={16} />
                </div>
              ))}
            </div>
            <Bone w={220} h={13} r="xs" />
            <div className="flex flex-row flex-wrap gap-2.5">
              {[0, 1, 2, 3].map((i) => (
                <Bone key={i} w={72} h={44} r="pill" />
              ))}
            </div>
            <Bone w={220} h={56} r="pill" />
          </Shimmer>
        ) : (
          <CpHubForm profile={profile.data ?? null} />
        )}

        <CpInfoPanel title={t('hubRegister.infoTitle')} titleId="cp-hub-info">
          <p className="m-0 text-h1 font-extrabold leading-none text-yellow">
            {commission === undefined ? MANAT : f.money(commission)}
          </p>
          <p className="m-0 text-label font-normal leading-[21px] text-on-block/80">
            {t('hubRegister.infoBody')}
          </p>
        </CpInfoPanel>
      </div>
    </>
  );
}
