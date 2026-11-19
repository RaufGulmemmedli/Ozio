'use client';

/**
 * PS1 "App · Profil · Redaktə" — `/profile/edit` (`app-profil-redakte.html`, frame `XYT1g`).
 *
 * The export draws seven controls; the API has a home for three of them:
 *
 *  | drawn                | stored by the API                                                   |
 *  |----------------------|---------------------------------------------------------------------|
 *  | Ad + Soyad           | yes — joined into the single verified `name` field                  |
 *  | Doğum tarixi         | yes — `birth_date` (wire format is a guess, see models/profile-update) |
 *  | Cins                 | yes — `gender` (accepted values are a guess)                        |
 *  | Mobil nömrə          | read-only by design ("contact support to change it")                |
 *  | E-poçt               | **NO FIELD EXISTS** → rendered disabled with a note                 |
 *  | Profil şəkli uploader| **NO FIELD EXISTS** → no uploader; the initial tile + a note        |
 *
 * `POST v1/file/upload` is unverified AND the profile has nothing to attach an upload to, so this
 * screen never calls it. 422 `fieldErrors` from the (unverified) PUT are mapped onto the form.
 */
import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { cn } from '@/core/lib/cn';
import { calendarNames, useFormat } from '@/core/i18n';
import { useLocaleKey } from '@/core/query';
import { useFailureMessage } from '@/core/i18n/failure-message';
import { useRouter } from '@/core/i18n/navigation';
import { paths } from '@/core/routes';
import type { Failure } from '@/core/network';
import {
  Button,
  DateField,
  Form,
  FormField,
  Input,
  SegmentedControl,
  confirmDialog,
  toast,
  useOzioForm,
} from '@/shared/ui';
import { ErrorState } from '@/shared/states';
import { CircleAlert, CircleCheck, ShieldCheck } from '@/shared/lucide';
import { PageHeader } from '@/shared/layout';

import { ProfileAvatar } from '../components/profile-avatar';
import { splitName, type Gender } from '../data/models/profile';
import { mapFieldErrorPath, type ProfileEditValues } from '../data/models/profile-update';
import { useProfile } from '../hooks/use-profile';
import { useUpdateProfile } from '../hooks/use-update-profile';
import { ProfileEditSkeleton } from './ProfileEditSkeleton';

/** az / ru / en letters, space, apostrophe and hyphen. */
const NAME_RE = /^[\p{L}\p{M}][\p{L}\p{M}\s'’-]*$/u;
const MIN_AGE_YEARS = 14;

type FormValues = {
  firstName: string;
  lastName: string;
  birthDate: string;
  gender: Gender;
};

function buildSchema(messages: {
  required: string;
  name: string;
  min: string;
  max: string;
  birthDate: string;
}) {
  const namePart = z
    .string()
    .trim()
    .min(1, messages.required)
    .min(2, messages.min)
    .max(40, messages.max)
    .regex(NAME_RE, messages.name);

  return z.object({
    firstName: namePart,
    lastName: z.union([z.literal(''), namePart]),
    birthDate: z
      .string()
      .refine((value) => {
        if (!value) return true;
        const date = new Date(`${value}T00:00:00Z`);
        if (Number.isNaN(date.getTime())) return false;
        const now = Date.now();
        if (date.getTime() > now) return false;
        const minBirth = new Date(now);
        minBirth.setUTCFullYear(minBirth.getUTCFullYear() - MIN_AGE_YEARS);
        return date.getTime() <= minBirth.getTime();
      }, messages.birthDate),
    gender: z.enum(['male', 'female', 'unspecified']),
  });
}

/**
 * Weekday / month names for `<DateField>` — no hardcoded copy.
 *
 * `calendarNames()` rather than `new Intl.DateTimeFormat(locale, …)` here: the browser accepts
 * `az-AZ` and then formats it with CLDR root data, so the direct call filled the month dropdown
 * with "M1 … M12". `calendarNames` writes az out and keeps `Intl` for ru/en.
 */
function useCalendarLabels(locale: string, labels: { prev: string; next: string; calendar: string }) {
  return useMemo(() => {
    const { months, weekdays } = calendarNames(locale);
    return {
      // copied out of the readonly tables — <DatePicker> takes mutable arrays
      weekdays: [...weekdays],
      months: [...months],
      prevMonth: labels.prev,
      nextMonth: labels.next,
      calendar: labels.calendar,
    };
  }, [locale, labels.prev, labels.next, labels.calendar]);
}

export function ProfileEditView() {
  const t = useTranslations('profile');
  const tv = useTranslations('validation');
  const format = useFormat();
  const locale = useLocaleKey();
  const failureMessage = useFailureMessage();
  const router = useRouter();

  const query = useProfile();
  const update = useUpdateProfile();
  const profile = query.data ?? null;
  const [serverNotice, setServerNotice] = useState<string | null>(null);

  const schema = useMemo(
    () =>
      buildSchema({
        required: tv('required'),
        name: tv('name'),
        min: tv('min', { min: 2 }),
        max: tv('max', { max: 40 }),
        birthDate: tv('birthDate'),
      }),
    [tv],
  );

  const initial = useMemo<FormValues>(() => {
    const { firstName, lastName } = splitName(profile?.name);
    return {
      firstName,
      lastName,
      birthDate: profile?.birthDate ?? '',
      gender: profile?.gender ?? 'unspecified',
    };
  }, [profile?.name, profile?.birthDate, profile?.gender]);

  const form = useOzioForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: initial,
  });
  const {
    formState: { errors, isDirty, isValid },
  } = form;

  // The form mounts before `profile/me` answers, so re-seed it once the data lands.
  useEffect(() => {
    form.reset(initial);
  }, [form, initial]);

  // Native "leave this page?" guard — the App Router has no route-leave hook, so the Cancel
  // button asks with `confirmDialog` and the browser covers reloads / tab closes.
  useEffect(() => {
    if (!isDirty) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [isDirty]);

  const calendar = useCalendarLabels(locale, {
    prev: t('edit.datePrev'),
    next: t('edit.dateNext'),
    calendar: t('edit.dateCalendar'),
  });

  const errorCount = Object.keys(errors).length;

  const header = (
    <PageHeader
      title={t('edit.title')}
      backHref={paths.profile}
      backLabel={t('edit.breadcrumb')}
    />
  );

  if (query.isPending) {
    return (
      <>
        {header}
        <ProfileEditSkeleton label={t('loading')} />
      </>
    );
  }

  if (query.isError || !profile) {
    return (
      <>
        {header}
        <ErrorState
          failure={query.error}
          title={t('error.title')}
          message={query.error ? failureMessage(query.error) : undefined}
          onRetry={() => void query.refetch()}
          retryLabel={t('retry')}
        />
      </>
    );
  }

  const cancel = async () => {
    if (isDirty) {
      const leave = await confirmDialog({
        title: t('edit.unsaved'),
        confirmLabel: t('edit.unsavedLeave'),
        cancelLabel: t('edit.unsavedStay'),
      });
      if (!leave) return;
    }
    router.push(paths.profile);
  };

  const onSubmit = async (values: FormValues) => {
    setServerNotice(null);
    const payload: ProfileEditValues = {
      firstName: values.firstName,
      lastName: values.lastName,
      birthDate: values.birthDate ? values.birthDate : null,
      gender: values.gender,
    };
    try {
      await update.mutateAsync(payload);
      toast.success({ title: t('edit.saved') });
      form.reset({ ...values });
      router.push(paths.profile);
    } catch (error) {
      // 422 carries `data: [{path, message}]` → `Failure.fieldErrors`. The server's paths are
      // unknown for this endpoint, so `mapFieldErrorPath` accepts every plausible alias; anything
      // it cannot place is shown in the banner rather than swallowed.
      const failure = error as Failure;
      let matched = 0;
      for (const entry of failure.fieldErrors ?? []) {
        const field = mapFieldErrorPath(entry.path);
        if (!field) continue;
        matched += 1;
        form.setError(field, { type: 'server', message: entry.message });
      }
      if (matched === 0) setServerNotice(failureMessage(failure));
    }
  };

  // Client-side completeness over the fields the API can actually store.
  const filled = [
    initial.firstName.trim().length > 0,
    profile.phone !== null,
    initial.birthDate.length > 0,
    initial.gender !== 'unspecified',
  ];
  const completeness = Math.round((filled.filter(Boolean).length / filled.length) * 100);

  return (
    <>
      {header}

      <div className="flex w-full flex-col gap-6 lg:flex-row lg:gap-6">
        <Form
          form={form}
          onSubmit={onSubmit}
          className="flex min-w-0 flex-1 flex-col gap-7 rounded-xl bg-surface p-5 md:p-8"
        >
          {errorCount > 0 || serverNotice ? (
            <div
              role="alert"
              className="flex w-full items-center gap-3 rounded-md bg-brand-soft px-[18px] py-3.5"
            >
              <CircleAlert size={20} aria-hidden="true" className="shrink-0 text-brand-dark" />
              <p className="m-0 text-label font-semibold text-brand-dark">
                {serverNotice ?? t('edit.errorBanner', { count: errorCount })}
              </p>
            </div>
          ) : null}

          {/* "Profil şəkli" — the initial tile only: the profile has no image field and
              `POST v1/file/upload` has nothing to attach to, so there is no uploader. */}
          <div className="flex flex-wrap items-center gap-5">
            <ProfileAvatar profile={profile} size={80} />
            <div className="flex min-w-[200px] flex-1 flex-col gap-1">
              <p className="m-0 text-body font-bold text-ink">{t('edit.photo.label')}</p>
              <p className="m-0 text-caption font-normal text-ink2">{t('edit.photo.hint')}</p>
              <p className="m-0 text-caption font-normal text-ink3">
                {t('edit.photo.unavailable')}
              </p>
            </div>
          </div>

          <div className="grid w-full grid-cols-1 gap-5 md:grid-cols-2">
            <FormField<FormValues, 'firstName'> name="firstName" label={t('edit.firstName')} required>
              {({ field, state }) => (
                <Input
                  {...field}
                  id={field.name}
                  value={field.value}
                  state={state}
                  containerClassName="bg-bg"
                  autoComplete="given-name"
                />
              )}
            </FormField>

            <FormField<FormValues, 'lastName'> name="lastName" label={t('edit.lastName')}>
              {({ field, state }) => (
                <Input
                  {...field}
                  id={field.name}
                  value={field.value}
                  state={state}
                  containerClassName="bg-bg"
                  autoComplete="family-name"
                />
              )}
            </FormField>
          </div>

          <div className="grid w-full grid-cols-1 gap-5 md:grid-cols-2">
            {/* Phone is immutable: the design marks it verified and points at support. */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor="profile-phone"
                className="text-caption font-semibold text-ink2"
              >
                {t('edit.phone')}
              </label>
              <Input
                id="profile-phone"
                value={profile.phone ?? ''}
                readOnly
                disabled
                trailing={
                  <span className="flex items-center gap-1.5">
                    <CircleCheck size={18} aria-hidden="true" className="text-success" />
                    <span className="text-caption font-semibold text-success">
                      {t('edit.phoneVerified')}
                    </span>
                  </span>
                }
              />
              <p className="m-0 text-caption font-normal text-ink3">{t('edit.phoneHint')}</p>
            </div>

            {/* E-poçt is drawn by the design but the API has NO email field — disabled + a note. */}
            <div className="flex flex-col gap-2">
              <label htmlFor="profile-email" className="text-caption font-semibold text-ink2">
                {t('edit.email')}
              </label>
              <Input id="profile-email" value="" disabled readOnly placeholder="—" />
              <p className="m-0 text-caption font-normal text-ink3">
                {t('edit.emailUnavailable')}
              </p>
            </div>
          </div>

          <div className="grid w-full grid-cols-1 gap-5 md:grid-cols-2">
            <FormField<FormValues, 'birthDate'> name="birthDate" label={t('edit.birthDate')}>
              {({ field, state }) => (
                <DateField
                  value={field.value ? new Date(`${field.value}T00:00:00Z`) : null}
                  onChange={(date) => field.onChange(date.toISOString().slice(0, 10))}
                  display={field.value ? format.date(`${field.value}T00:00:00Z`) : undefined}
                  placeholder={t('edit.birthDatePlaceholder')}
                  max={new Date()}
                  labels={calendar}
                  state={state}
                  aria-label={t('edit.birthDate')}
                />
              )}
            </FormField>

            <FormField<FormValues, 'gender'> name="gender" label={t('edit.gender')}>
              {({ field }) => (
                <SegmentedControl
                  value={field.value}
                  onValueChange={(next) => field.onChange(next as Gender)}
                  label={t('edit.gender')}
                  fullWidth
                  options={[
                    { value: 'male', label: t('edit.genderMale') },
                    { value: 'female', label: t('edit.genderFemale') },
                    { value: 'unspecified', label: t('edit.genderUnspecified') },
                  ]}
                />
              )}
            </FormField>
          </div>

          <div className="flex w-full flex-wrap items-center justify-end gap-3">
            <Button variant="ghost" onClick={() => void cancel()} className="border-transparent">
              {t('cancel')}
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={update.isPending}
              disabled={!isDirty || !isValid}
            >
              {t('edit.save')}
            </Button>
          </div>
        </Form>

        {/* ------------------------------------------------------------------ side cards */}
        <div className="flex w-full flex-col gap-5 lg:w-[340px] lg:shrink-0">
          <div className="flex flex-col gap-3.5 rounded-xl bg-block p-6 md:p-7">
            <ShieldCheck size={28} aria-hidden="true" className="text-on-block" />
            <h2 className="m-0 text-h4 font-extrabold text-on-block">{t('edit.tip.title')}</h2>
            <p className="m-0 text-label font-normal leading-[1.5] text-on-block2">
              {t('edit.tip.text')}
            </p>
          </div>

          <div className="flex flex-col gap-3 rounded-xl bg-surface p-6 md:p-7">
            <div className="flex items-center justify-between gap-3">
              <h2 className="m-0 text-body-sm font-bold text-ink">
                {t('edit.completeness.label')}
              </h2>
              <span className="text-body-sm font-extrabold text-brand">
                {format.percentPoints(completeness, { maximumFractionDigits: 0 })}
              </span>
            </div>
            <div
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={completeness}
              aria-label={t('edit.completeness.label')}
              className="h-2.5 w-full overflow-hidden rounded-pill bg-surface2"
            >
              <div
                className={cn('h-full rounded-pill bg-brand transition-[width]')}
                style={{ width: `${completeness}%` }}
              />
            </div>
            <p className="m-0 text-caption font-normal leading-5 text-ink2">
              {completeness >= 100 ? t('edit.completeness.full') : t('edit.completeness.hint')}
            </p>
          </div>
        </div>
      </div>

    </>
  );
}
