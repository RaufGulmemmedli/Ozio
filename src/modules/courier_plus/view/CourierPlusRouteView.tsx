'use client';

/**
 * `/courier-plus/route` — `Yolüstü kuryer · Marşrut` (`I6kivj`).
 *
 * A real `react-hook-form` + `zod` form: Haradan / Haraya, the departure-time chips (08:00–09:30
 * plus "Başqa" → a free time field) and the five transport tiles, next to the dark "Necə işləyir"
 * panel. Saving switches courier mode on (server-side) and goes to the matches.
 *
 * The form is its own component so it mounts **after** the saved route has loaded: RHF reads
 * `defaultValues` once, and re-syncing a live query into a dirty form is exactly the bug that
 * pattern avoids.
 *
 * The address fields offer the user's **saved addresses** as quick picks via `useAddresses()` from
 * `@/modules/address`; this module never reads addresses itself.
 * // TODO(address): `<AddressPicker>` from `@/modules/address` is a single *delivery*-address
 * // chip, so it cannot express a from → to pair. When that module grows a field-level picker,
 * // swap the two `<Input>`s for it.
 */
import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { useFailureMessage } from '@/core/i18n/failure-message';
import { useRouter } from '@/core/i18n/navigation';
import { cn } from '@/core/lib/cn';
import { paths } from '@/core/routes';
import { useAddresses } from '@/modules/address';
import { MapPin, Navigation, Package, Wallet } from '@/shared/lucide';
import { Bone, Shimmer } from '@/shared/skeleton';
import { ErrorState, InlineNotice } from '@/shared/states';
import { Button, Form, FormField, Input, toast, useOzioForm } from '@/shared/ui';

import { CpInfoPanel, CpInfoStep } from '../components/CpPrimitives';
import { CpScreen } from '../components/CpScreen';
import { CpTransportIcon } from '../components/CpTransportIcon';
import { CP_ADVERTISED_MAX_DETOUR, CP_DEPART_PRESETS } from '../data/courier_plus.fixtures';
import {
  CP_TRANSPORTS,
  clockToMinutes,
  minutesToClock,
  type CpRoute,
  type CpTransport,
} from '../data/models/courier-plus';
import { useCourierPlusRoute, useSaveCourierPlusRoute } from '../hooks/use-courier-plus';

/* ------------------------------------------------------------------ schema */

interface RouteFormValues {
  from: string;
  to: string;
  departAt: string;
  transport: CpTransport;
}

const TIME_PATTERN = /^\d{1,2}:\d{2}$/;

function schemaFor(messages: { required: string; tooShort: string; same: string; time: string }) {
  return z
    .object({
      from: z.string().trim().min(1, messages.required).min(4, messages.tooShort),
      to: z.string().trim().min(1, messages.required).min(4, messages.tooShort),
      departAt: z
        .string()
        .regex(TIME_PATTERN, messages.time)
        .refine((v) => clockToMinutes(v) !== null, messages.time),
      transport: z.enum(CP_TRANSPORTS),
    })
    .refine((v) => v.from.trim().toLowerCase() !== v.to.trim().toLowerCase(), {
      path: ['to'],
      message: messages.same,
    });
}

/* ------------------------------------------------------------------ the dark panel */

function CpRouteInfoPanel() {
  const t = useTranslations('courier_plus');
  return (
    <CpInfoPanel title={t('route.how')} titleId="cp-how">
      <CpInfoStep icon={Navigation} title={t('route.how1.title')} body={t('route.how1.body')} />
      <CpInfoStep
        icon={Package}
        title={t('route.how2.title')}
        body={t('route.how2.body', { minutes: CP_ADVERTISED_MAX_DETOUR })}
      />
      <CpInfoStep icon={Wallet} title={t('route.how3.title')} body={t('route.how3.body')} />
    </CpInfoPanel>
  );
}

/* ------------------------------------------------------------------ the form */

function CpRouteForm({ route }: { route: CpRoute }) {
  const t = useTranslations('courier_plus');
  const router = useRouter();
  const failureMessage = useFailureMessage();
  const save = useSaveCourierPlusRoute();
  const addresses = useAddresses();
  const [customTime, setCustomTime] = useState(false);

  const schema = useMemo(
    () =>
      schemaFor({
        required: t('route.errors.required'),
        tooShort: t('route.errors.tooShort'),
        same: t('route.errors.same'),
        time: t('route.errors.time'),
      }),
    [t],
  );

  const form = useOzioForm<RouteFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      from: route.from,
      to: route.to,
      departAt: minutesToClock(route.departMinutes),
      transport: route.transport,
    },
  });

  const departAt = form.watch('departAt');
  const transport = form.watch('transport');
  const presetHit = CP_DEPART_PRESETS.some((m) => minutesToClock(m) === departAt);
  const timeFieldOpen = customTime || !presetHit;
  const savedAddresses = addresses.data ?? [];

  return (
    <Form
      form={form}
      className="flex w-full min-w-0 flex-col items-start gap-5 rounded-xl bg-surface p-6 md:p-8"
      onSubmit={(values) => {
        save.mutate(
          {
            from: values.from,
            to: values.to,
            departMinutes: clockToMinutes(values.departAt) ?? route.departMinutes,
            transport: values.transport,
          },
          {
            onSuccess: () => {
              toast.success({ title: t('route.saved') });
              router.push(paths.courierPlusMatches);
            },
          },
        );
      }}
    >
      {save.error ? (
        <InlineNotice tone="error" className="w-full" body={failureMessage(save.error)} />
      ) : null}

      <div className="flex w-full flex-col gap-5 md:flex-row">
        <FormField<RouteFormValues, 'from'> name="from" label={t('route.from')} className="w-full">
          {({ field, state }) => (
            <Input
              {...field}
              value={field.value}
              variant="compact"
              state={state}
              autoComplete="off"
              placeholder={t('route.fromPlaceholder')}
              containerClassName="rounded-[16px] border-transparent bg-surface2"
            />
          )}
        </FormField>

        <FormField<RouteFormValues, 'to'> name="to" label={t('route.to')} className="w-full">
          {({ field, state }) => (
            <Input
              {...field}
              value={field.value}
              variant="compact"
              state={state}
              autoComplete="off"
              placeholder={t('route.toPlaceholder')}
              containerClassName="rounded-[16px] border-transparent bg-surface2"
            />
          )}
        </FormField>
      </div>

      {savedAddresses.length > 0 ? (
        <div className="flex w-full flex-col gap-2">
          <p className="m-0 text-caption font-bold text-ink3">{t('route.from')}</p>
          <div className="flex flex-row flex-wrap gap-2">
            {savedAddresses.slice(0, 4).map((address) => (
              <button
                key={address.id}
                type="button"
                onClick={() =>
                  form.setValue('from', address.line, { shouldDirty: true, shouldValidate: true })
                }
                className="flex min-h-11 max-w-[280px] flex-row items-center gap-2 rounded-pill bg-surface2 px-4 py-2.5 text-label font-medium text-ink2 hover:bg-line"
              >
                <MapPin size={16} aria-hidden="true" className="shrink-0 text-brand" />
                <span className="min-w-0 truncate">{address.line}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {/* Çıxış vaxtı */}
      <fieldset className="m-0 flex w-full flex-col gap-2.5 border-0 p-0">
        <legend className="mb-0 p-0 text-caption font-bold text-ink3">{t('route.departAt')}</legend>
        <div className="flex w-full flex-row flex-wrap gap-2.5">
          {CP_DEPART_PRESETS.map((minutes) => {
            const label = minutesToClock(minutes);
            const active = !customTime && departAt === label;
            return (
              <button
                key={minutes}
                type="button"
                aria-pressed={active}
                onClick={() => {
                  setCustomTime(false);
                  form.setValue('departAt', label, { shouldDirty: true, shouldValidate: true });
                }}
                className={cn(
                  'flex h-11 flex-row items-center rounded-pill px-5 text-label',
                  active
                    ? 'bg-cta font-bold text-on-cta'
                    : 'bg-surface2 font-medium text-ink2 hover:bg-line',
                )}
              >
                {label}
              </button>
            );
          })}
          <button
            type="button"
            aria-pressed={timeFieldOpen}
            onClick={() => setCustomTime(true)}
            className={cn(
              'flex h-11 flex-row items-center rounded-pill px-5 text-label',
              timeFieldOpen
                ? 'bg-cta font-bold text-on-cta'
                : 'bg-surface2 font-medium text-ink2 hover:bg-line',
            )}
          >
            {t('route.otherTime')}
          </button>
        </div>

        {timeFieldOpen ? (
          <FormField<RouteFormValues, 'departAt'>
            name="departAt"
            label={t('route.otherTimeLabel')}
            className="w-full md:max-w-[220px]"
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
        ) : null}
      </fieldset>

      {/* Nəqliyyat */}
      <fieldset className="m-0 flex w-full flex-col gap-3 border-0 p-0">
        <legend className="mb-0 p-0 text-caption font-bold text-ink3">
          {t('route.transport')}
        </legend>
        <div
          role="radiogroup"
          aria-label={t('route.transport')}
          className="grid w-full grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5"
        >
          {CP_TRANSPORTS.map((option) => {
            const active = transport === option;
            return (
              <button
                key={option}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() =>
                  form.setValue('transport', option, { shouldDirty: true, shouldValidate: true })
                }
                className={cn(
                  'flex min-h-[96px] flex-col items-center justify-center gap-2 rounded-lg p-4 text-label font-bold',
                  active
                    ? 'bg-brand-soft text-brand outline outline-2 -outline-offset-1 outline-brand'
                    : 'bg-surface2 text-ink hover:bg-line',
                )}
              >
                <CpTransportIcon
                  transport={option}
                  size={26}
                  className={active ? 'text-brand' : 'text-ink2'}
                />
                {t(`transport.${option}`)}
              </button>
            );
          })}
        </div>
      </fieldset>

      <Button type="submit" variant="brand" size="2xl" loading={save.isPending}>
        {t('route.activate')}
      </Button>
    </Form>
  );
}

/* ------------------------------------------------------------------ the screen */

export function CourierPlusRouteView() {
  const t = useTranslations('courier_plus');
  const failureMessage = useFailureMessage();
  const route = useCourierPlusRoute();

  const header = (
    <CpScreen
      crumbs={[{ label: t('crumb.module'), href: paths.courierPlus }, { label: t('crumb.route') }]}
      title={t('route.title')}
      subtitle={t('route.subtitle')}
    />
  );

  return (
    <>
      {header}

      <div className="flex w-full flex-col gap-6 lg:flex-row">
        {route.isPending ? (
          <Shimmer
            label={t('loading')}
            className="flex w-full flex-col items-start gap-5 rounded-xl bg-surface p-6 md:p-8"
          >
            {[0, 1].map((i) => (
              <div key={i} className="flex w-full flex-col gap-1.5">
                <Bone w={80} h={12} r="xs" />
                <Bone w="100%" h={52} r={16} />
              </div>
            ))}
            <Bone w={120} h={13} r="xs" />
            <div className="flex w-full flex-row flex-wrap gap-2.5">
              {[0, 1, 2, 3, 4].map((i) => (
                <Bone key={i} w={96} h={44} r="pill" />
              ))}
            </div>
            <Bone w={120} h={13} r="xs" />
            <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {[0, 1, 2, 3, 4].map((i) => (
                <Bone key={i} w="100%" h={96} r="lg" />
              ))}
            </div>
            <Bone w={280} h={56} r="pill" />
          </Shimmer>
        ) : route.isError ? (
          <div className="w-full rounded-xl bg-surface p-6 md:p-8">
            <ErrorState
              failure={route.error}
              title={t('home.error.title')}
              message={failureMessage(route.error)}
              retryLabel={t('retry')}
              onRetry={() => void route.refetch()}
            />
          </div>
        ) : (
          <CpRouteForm route={route.data} />
        )}

        <CpRouteInfoPanel />
      </div>
    </>
  );
}
