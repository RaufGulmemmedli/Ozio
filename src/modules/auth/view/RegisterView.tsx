'use client';

/**
 * A3 / RG5-RG6 — `/register` (`qeydiyyat.html`, validation `qeydiyyat-xeta.html`).
 *
 * Export: form column 420, gap 22 · step dots "Qeydiyyat · 1/1" · Ad + Soyad side by side with a
 * 14 gap, then E-poçt and Doğum tarixi full width · inputs 56 high, radius 14, 1px `line`, label
 * 13/600 `ink2` · consent checkbox 22 radius 7 with a 14/400 `ink2` label · submit pill 60.
 *
 * **Abandoning this step signs the user out** — a documented product rule (`api/auth.md` §3:
 * "Abandoning this step must sign the user out (drop the half-made session)"), so the back link
 * calls `signOut()` rather than `router.back()`.
 *
 * The request body is **unverified**; its single definition lives in
 * `data/models/registration.ts`.
 */
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { useRouter } from '@/core/i18n';
import { Link } from '@/core/i18n';
import { usePreview } from '@/core/query';
import { paths } from '@/core/routes';
import { useSession } from '@/core/session';
import { Calendar, Mail } from '@/shared/lucide';
import { InlineNotice } from '@/shared/states';
import {
  Button,
  Checkbox,
  Form,
  FormField,
  Input,
  applyFieldErrors,
  useOzioForm,
} from '@/shared/ui';

import { AuthHeading } from '../components/AuthHeading';
import { BackLink } from '../components/BackLink';
import { MergeCardStep } from '../components/MergeCardStep';
import { StepDots } from '../components/StepDots';
import type { AuthFailure } from '../data/auth.remote';
import {
  REGISTRATION_FIELD_PATHS,
  parseBirthDate,
  type RegistrationDraft,
} from '../data/models/registration';
import { useAuthDestination } from '../hooks/use-auth-destination';
import { useAuthFlow } from '../hooks/use-auth-flow';
import { useAuthMessage } from '../hooks/use-auth-message';
import { useCompleteRegistration } from '../hooks/use-auth-mutations';
import { RegisterSkeleton } from './RegisterSkeleton';

interface RegisterValues extends RegistrationDraft {
  consent: boolean;
}

const LINK =
  'font-semibold text-ink underline decoration-line underline-offset-2 hover:decoration-ink ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand';

/**
 * "Not in the future". The clock is read when the field is validated, not while the schema is
 * being built, so this lives outside the component — a render must not read `Date.now()`.
 */
function isBirthDateNotInFuture(value: string): boolean {
  const iso = parseBirthDate(value);
  return value === '' || iso === null || Date.parse(`${iso}T00:00:00Z`) <= Date.now();
}

export function RegisterView() {
  const t = useTranslations('auth');
  const router = useRouter();
  const message = useAuthMessage();
  const preview = usePreview();
  const { afterRegistration } = useAuthDestination();

  const status = useSession((s) => s.status);
  const signOut = useSession((s) => s.signOut);
  const hydrateSession = useSession((s) => s.hydrate);
  const clearFlow = useAuthFlow((s) => s.clear);

  const register = useCompleteRegistration();
  const [formError, setFormError] = useState<string | null>(null);
  /** RG8 is shown after a successful registration and can be skipped. */
  const [showMerge, setShowMerge] = useState(false);

  const schema = z.object({
    firstName: z.string().trim().min(1, t('register.firstName.required')),
    lastName: z.string().trim().min(1, t('register.lastName.required')),
    // The design treats e-mail as optional but validated once something is typed.
    email: z
      .string()
      .trim()
      .refine((v) => v === '' || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/u.test(v), t('register.email.invalid')),
    birthDate: z
      .string()
      .trim()
      .refine((v) => v === '' || parseBirthDate(v) !== null, t('register.birthDate.invalid'))
      .refine(isBirthDateNotInFuture, t('register.birthDate.invalid')),
    consent: z.boolean().refine((v) => v === true, { message: t('register.consent.required') }),
  });

  const form = useOzioForm<RegisterValues>({
    resolver: zodResolver(schema),
    defaultValues: { firstName: '', lastName: '', email: '', birthDate: '', consent: false },
  });

  // `status === 'unknown'` means the session store has not answered yet → mirror skeleton.
  const loading = status === 'unknown' || preview === 'loading';

  // A guest cannot be here (the edge guard sends them to /login); if the cookie died meanwhile,
  // the session store flips to `guest` and we leave.
  useEffect(() => {
    if (status === 'guest' && preview === null) router.replace(paths.login);
  }, [preview, router, status]);

  const abandon = async () => {
    // Documented product rule: leaving registration drops the half-made session.
    clearFlow();
    await signOut();
    router.replace(paths.login);
  };

  const onSubmit = async (values: RegisterValues) => {
    setFormError(null);
    try {
      await register.mutateAsync({
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        birthDate: values.birthDate,
      });
    } catch (thrown) {
      const failure = thrown as AuthFailure;
      // The 422 paths are unknown, so they are normalised onto the form's own names first.
      const mapped = failure.fieldErrors.map((error) => ({
        ...error,
        path: REGISTRATION_FIELD_PATHS[error.path] ?? error.path,
      }));
      const unmatched = applyFieldErrors(form, mapped);
      if (mapped.length === 0 || unmatched.length > 0) setFormError(message(failure));
      return;
    }

    // Registration also rotates the profile, so re-read it before moving on.
    void hydrateSession();
    clearFlow();
    setShowMerge(true);
  };

  const leaveMerge = () => router.replace(afterRegistration());

  if (showMerge || preview === 'merged') {
    return (
      <main id="main" className="flex w-full flex-col gap-6">
        <MergeCardStep onSkip={leaveMerge} onDone={leaveMerge} />
      </main>
    );
  }

  return (
    <main id="main" className="flex w-full flex-col gap-[22px]">
      <BackLink onClick={() => void abandon()}>{t('back')}</BackLink>
      <StepDots total={2} current={1} label={t('register.step')} />
      <AuthHeading title={t('register.title')} subtitle={t('register.subtitle')} />

      {loading ? (
        <RegisterSkeleton />
      ) : (
        <>
          {formError ? <InlineNotice tone="error" role="alert" body={formError} multiline /> : null}

          <Form form={form} onSubmit={onSubmit} className="flex w-full flex-col gap-[22px]">
            <div className="flex w-full flex-col gap-[22px] md:flex-row md:gap-[14px]">
              <FormField<RegisterValues, 'firstName'>
                name="firstName"
                label={t('register.firstName.label')}
                className="flex-1"
              >
                {({ field, state }) => (
                  <Input
                    {...field}
                    state={state}
                    autoComplete="given-name"
                    autoFocus
                    placeholder={t('register.firstName.placeholder')}
                  />
                )}
              </FormField>

              <FormField<RegisterValues, 'lastName'>
                name="lastName"
                label={t('register.lastName.label')}
                className="flex-1"
              >
                {({ field, state }) => (
                  <Input
                    {...field}
                    state={state}
                    autoComplete="family-name"
                    placeholder={t('register.lastName.placeholder')}
                  />
                )}
              </FormField>
            </div>

            <FormField<RegisterValues, 'email'> name="email" label={t('register.email.label')}>
              {({ field, state }) => (
                <Input
                  {...field}
                  state={state}
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  leadingIcon={<Mail aria-hidden="true" />}
                  placeholder={t('register.email.placeholder')}
                />
              )}
            </FormField>

            {/*
              A plain masked text field, not <DateField>: the export's placeholder is the literal
              `GG.AA.İİİİ` pattern and the error state ("Belə tarix mövcud deyil") is about what
              was typed, which a calendar popover cannot produce.
            */}
            <FormField<RegisterValues, 'birthDate'>
              name="birthDate"
              label={t('register.birthDate.label')}
            >
              {({ field, state }) => (
                <Input
                  {...field}
                  state={state}
                  inputMode="numeric"
                  autoComplete="bday"
                  maxLength={10}
                  leadingIcon={<Calendar aria-hidden="true" />}
                  placeholder={t('register.birthDate.placeholder')}
                  className="tabular-nums"
                  onChange={(event) => field.onChange(maskDate(event.target.value))}
                />
              )}
            </FormField>

            <FormField<RegisterValues, 'consent'> name="consent">
              {({ field, error }) => (
                <Checkbox
                  checked={field.value === true}
                  onCheckedChange={(checked) => field.onChange(checked === true)}
                  onBlur={field.onBlur}
                  aria-invalid={error ? true : undefined}
                  label={t.rich('register.consent.label', {
                    terms: (chunks) => (
                      <Link href={paths.terms} className={LINK}>
                        {chunks}
                      </Link>
                    ),
                    privacy: (chunks) => (
                      <Link href={paths.privacy} className={LINK}>
                        {chunks}
                      </Link>
                    ),
                  })}
                />
              )}
            </FormField>

            <Button type="submit" size="3xl" fullWidth loading={register.isPending}>
              {t('register.submit')}
            </Button>
          </Form>
        </>
      )}
    </main>
  );
}

/** Live mask for `GG.AA.İİİİ`: digits only, dots inserted after the day and the month. */
function maskDate(input: string): string {
  const digits = input.replace(/\D+/gu, '').slice(0, 8);
  const parts = [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4, 8)].filter(Boolean);
  return parts.join('.');
}
