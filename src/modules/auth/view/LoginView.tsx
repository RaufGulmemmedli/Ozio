'use client';

/**
 * A1 / AU1 — `/login` (`html/auth/giris.html`, dark `html/app-states/web-giris-dark.html`).
 *
 * Export: form column 420 wide, gap 24 · phone field 60 high, radius 14, border 2 · submit pill 60
 * `cta` with a 17/600 label · "və ya" 13/400 `ink3` · ghost pill 60 with a 1.5 `ink` stroke ·
 * legal line 13/400 `ink3` centred. The field carries no visible label in the export, so the
 * accessible name is on the control itself.
 *
 * The phone leaves this screen through `useAuthFlow` (state + sessionStorage) — never the URL.
 */
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { useRouter } from '@/core/i18n';
import { normalizeToE164 } from '@/core/lib/phone';
import { paths } from '@/core/routes';
import { InlineNotice } from '@/shared/states';
import { Button, Form, FormField, PhoneInput, applyFieldErrors, useOzioForm } from '@/shared/ui';

import { DEFAULT_COUNTRY, type CountryOption } from '../auth.constants';
import { AuthHeading } from '../components/AuthHeading';
import { CountrySheet } from '../components/CountrySheet';
import { LegalLine } from '../components/LegalLine';
import type { AuthFailure } from '../data/auth.remote';
import { useAuthDestination, withNext } from '../hooks/use-auth-destination';
import { useAuthFlow } from '../hooks/use-auth-flow';
import { useAuthMessage } from '../hooks/use-auth-message';
import { useContinueAsGuest, useRequestOtp } from '../hooks/use-auth-mutations';

interface LoginValues {
  phone: string;
}

export function LoginView() {
  const t = useTranslations('auth');
  const router = useRouter();
  const message = useAuthMessage();
  const { next } = useAuthDestination();

  const [country, setCountry] = useState<CountryOption>(DEFAULT_COUNTRY);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const setPhone = useAuthFlow((s) => s.setPhone);
  const storedDigits = useAuthFlow((s) => s.digits);
  const hydrateFlow = useAuthFlow((s) => s.hydrate);

  const requestOtp = useRequestOtp();
  const guest = useContinueAsGuest();

  /** 9 national digits for AZ; the other AU6 entries carry their own length. */
  const schema = z.object({
    phone: z
      .string()
      .refine((value) => value.replace(/\D+/gu, '').length === country.nationalLength, {
        message: t('login.phone.invalid'),
      }),
  });

  const form = useOzioForm<LoginValues>({
    resolver: zodResolver(schema),
    // Coming back from "Nömrəni dəyiş" pre-fills the number that was already typed.
    defaultValues: { phone: storedDigits },
  });

  /**
   * Read `sessionStorage` after hydration (never during render, so SSR and the first client render
   * agree) and pre-fill the number — this is what makes "Nömrəni dəyiş" come back with it typed.
   */
  useEffect(() => {
    hydrateFlow();
  }, [hydrateFlow]);

  useEffect(() => {
    if (storedDigits && !form.getValues('phone')) {
      form.setValue('phone', storedDigits);
    }
  }, [form, storedDigits]);

  const onSubmit = async ({ phone }: LoginValues) => {
    setFormError(null);
    const digits = phone.replace(/\D+/gu, '');
    const e164 = normalizeToE164(`${country.dialCode}${digits}`);
    // The BFF normalises as well; sending the dial code keeps a non-AZ choice honest so the
    // server's own 422 ("The number format is incorrect") is what the user sees.
    const wire = e164 ?? `${country.dialCode}${digits}`;

    try {
      await requestOtp.mutateAsync(wire);
    } catch (thrown) {
      const failure = thrown as AuthFailure;
      const unmatched = applyFieldErrors(form, failure.fieldErrors);
      if (failure.fieldErrors.length === 0 || unmatched.length > 0) {
        setFormError(message(failure));
      }
      return;
    }

    setPhone({ dialCode: country.dialCode, digits, e164 });
    router.push(withNext(paths.otp, next));
  };

  const onGuest = async () => {
    setFormError(null);
    try {
      await guest.mutateAsync();
      router.replace(paths.home);
    } catch (thrown) {
      setFormError(message(thrown as AuthFailure));
    }
  };

  const busy = requestOtp.isPending || guest.isPending;

  return (
    <main id="main" className="flex w-full flex-col gap-6">
      <AuthHeading title={t('login.title')} subtitle={t('login.subtitle')} />

      {formError ? <InlineNotice tone="error" role="alert" body={formError} multiline /> : null}

      <Form form={form} onSubmit={onSubmit} className="flex w-full flex-col gap-6">
        <FormField<LoginValues, 'phone'> name="phone">
          {({ field, state }) => (
            <PhoneInput
              variant="lg"
              state={state}
              // The export shows "AZ +994" inside the trigger, not just the dial code.
              dialCode={`${country.iso} ${country.dialCode}`}
              onOpenCountry={() => setSheetOpen(true)}
              countryLabel={t('login.country.open')}
              aria-label={t('login.phone.label')}
              value={field.value}
              disabled={busy}
              autoFocus
              onChange={({ digits }) => field.onChange(digits)}
              onBlur={field.onBlur}
              ref={field.ref}
            />
          )}
        </FormField>

        <Button
          type="submit"
          size="3xl"
          fullWidth
          loading={requestOtp.isPending}
          disabled={guest.isPending}
        >
          {t('login.submit')}
        </Button>
      </Form>

      {/* "və ya" — the export puts the label left of a hairline. */}
      <div className="flex w-full items-center gap-[14px]">
        <span className="text-caption font-normal text-ink3">{t('login.or')}</span>
        <span aria-hidden="true" className="h-px flex-1 bg-line" />
      </div>

      <Button
        type="button"
        variant="ghost"
        size="3xl"
        fullWidth
        loading={guest.isPending}
        disabled={requestOtp.isPending}
        onClick={onGuest}
      >
        {t('login.guest')}
      </Button>

      <LegalLine />

      <CountrySheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        selected={country}
        onSelect={(picked) => {
          setCountry(picked);
          // The required length changes with the country, so re-check what is already typed.
          if (form.formState.isSubmitted) void form.trigger('phone');
        }}
      />
    </main>
  );
}
