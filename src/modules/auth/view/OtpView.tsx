'use client';

/**
 * A2 / AU2-AU5 — `/otp` (`otp-kod.html`, wrong code `otp-yanlis-kod.html`, attempt limit
 * `otp-cehd-limiti.html`).
 *
 * States, all in this one view:
 *   · **sending** — the code request is still in flight (arriving from `/login`)
 *   · **sent** — default: 6 empty cells, autofocus, paste, `autocomplete="one-time-code"`
 *   · **resend countdown** — "Yenidən göndər · 0:24", 59 s client cooldown (`Retry-After` wins)
 *   · **wrong code** (AU3) — `kind: 'wrongCode'`: cells tinted `brand-soft`, 2px `brand` border,
 *     shake, error row, and the "Nömrəni dəyiş" escape hatch
 *   · **attempt limit** (AU5) — `kind: 'rateLimited'`: the locked panel. The block duration is
 *     server data: the countdown card only appears when a `Retry-After` arrived
 *   · **wrong number** — "Nömrəni dəyiş" → `/login` with the number pre-filled
 *
 * Export: cells 64 high, radius 14, 1.5 `line` border, digit 26/700, gap 10 · submit pill 60 ·
 * resend row 14/400 `ink2` + 14/700 `brand` · locked card `block` radius 20 padding 20 with a
 * 52px `yellow` lock tile, label 13/400 at 70% and a 32/800 value.
 */
import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';

import { useRouter } from '@/core/i18n';
import { cn } from '@/core/lib/cn';
import { formatAzDisplay } from '@/core/lib/phone';
import { paths } from '@/core/routes';
import { useSession } from '@/core/session';
import { InlineNotice } from '@/shared/states';
import { CircleAlert, Lock } from '@/shared/lucide';
import { Button, OtpInput } from '@/shared/ui';

import styles from '../auth.module.css';
import { OTP_LENGTH, RESEND_COOLDOWN_SECONDS } from '../auth.constants';
import { AuthHeading } from '../components/AuthHeading';
import { BackLink } from '../components/BackLink';
import type { AuthFailure } from '../data/auth.remote';
import { useAuthDestination } from '../hooks/use-auth-destination';
import { useHydratedAuthFlow } from '../hooks/use-auth-flow';
import { useAuthMessage } from '../hooks/use-auth-message';
import { useRequestOtp, useVerifyOtp } from '../hooks/use-auth-mutations';
import { useResendCooldown } from '../hooks/use-resend-cooldown';

export function OtpView() {
  const t = useTranslations('auth');
  const router = useRouter();
  const message = useAuthMessage();
  const { afterOtp } = useAuthDestination();

  const flow = useHydratedAuthFlow();
  const setAuthenticated = useSession((s) => s.setAuthenticated);
  const hydrateSession = useSession((s) => s.hydrate);

  const verify = useVerifyOtp();
  const resend = useRequestOtp();
  const cooldown = useResendCooldown(RESEND_COOLDOWN_SECONDS);

  const [code, setCode] = useState('');
  const [failure, setFailure] = useState<AuthFailure | null>(null);
  /** A failed *resend* never locks the screen — it only reports and re-arms the cooldown. */
  const [resendNotice, setResendNotice] = useState<string | null>(null);
  const [shakeKey, setShakeKey] = useState(0);
  const lastSubmitted = useRef<string | null>(null);

  const phone = flow.e164 ?? (flow.digits ? `${flow.dialCode}${flow.digits}` : null);
  const display = formatAzDisplay(phone);

  // No phone in the flow (a direct hit on /otp, or the tab was reopened) → start over.
  useEffect(() => {
    if (flow.hydrated && !phone) router.replace(paths.login);
  }, [flow.hydrated, phone, router]);

  // Narrowed per state so the JSX below never has to re-check for `null`.
  const lockedFailure = failure !== null && failure.kind === 'rateLimited' ? failure : null;
  const wrongCodeFailure = failure !== null && failure.kind === 'wrongCode' ? failure : null;
  const otherFailure = failure !== null && !lockedFailure && !wrongCodeFailure ? failure : null;

  const submit = async (value: string) => {
    if (!phone || lockedFailure) return;
    if (value.length !== OTP_LENGTH) return;
    if (lastSubmitted.current === value && verify.isPending) return;
    lastSubmitted.current = value;
    setFailure(null);

    try {
      const outcome = await verify.mutateAsync({ phone, code: value });

      // The handler has set the cookies; seed the store, then let it hydrate the real profile.
      setAuthenticated({
        id: null,
        name: null,
        phone,
        isRegistered: !outcome.needsRegistration,
        gender: null,
        birthDate: null,
        refCode: null,
        bonus: null,
        bonusTotal: null,
        cardNumber: null,
        activeOrderCount: 0,
      });
      void hydrateSession();

      // The number has done its job; it must not outlive the flow.
      if (!outcome.needsRegistration) flow.clear();
      router.replace(afterOtp(outcome.needsRegistration));
    } catch (thrown) {
      const next = thrown as AuthFailure;
      setFailure(next);
      if (next.kind === 'rateLimited' && next.retryAfterSeconds !== null) {
        cooldown.start(next.retryAfterSeconds);
      }
      if (next.kind === 'wrongCode') {
        setShakeKey((n) => n + 1);
        setCode('');
      }
    }
  };

  const onResend = async () => {
    if (!phone || cooldown.active || resend.isPending) return;
    setFailure(null);
    setResendNotice(null);
    setCode('');
    try {
      await resend.mutateAsync(phone);
      cooldown.start();
    } catch (thrown) {
      const next = thrown as AuthFailure;
      // `Retry-After` always wins over the 59 s client cooldown (03-auth-session.md).
      cooldown.start(next.retryAfterSeconds ?? RESEND_COOLDOWN_SECONDS);
      if (next.kind === 'rateLimited') {
        // "Too many requests" on the resend path is a throttle, not a wrong-code lockout:
        // the cooldown above is the whole remedy, so the code field stays usable.
        setResendNotice(message(next));
      } else {
        setFailure(next);
      }
    }
  };

  const changeNumber = () => router.replace(paths.login);

  /* ------------------------------------------------------------------ AU5 locked */

  if (lockedFailure) {
    return (
      <main id="main" className="flex w-full flex-col gap-6">
        <BackLink onClick={changeNumber}>{t('back')}</BackLink>
        <AuthHeading
          title={t('otp.locked.title')}
          subtitle={
            lockedFailure.hasServerMessage
              ? lockedFailure.message
              : t('otp.locked.subtitle', { phone: display })
          }
        />

        <OtpInput
          length={OTP_LENGTH}
          value={code}
          disabled
          aria-label={t('otp.input.label')}
          cellLabel={(index, total) => t('otp.input.cell', { index: index + 1, total })}
        />

        {/* The block duration is server data — the card only appears when `Retry-After` said so. */}
        {cooldown.active ? (
          <div className="flex w-full items-center gap-4 rounded-lg bg-block p-5">
            <span className="flex size-13 shrink-0 items-center justify-center rounded-pill bg-yellow">
              <Lock aria-hidden="true" className="size-6 text-on-yellow" />
            </span>
            <span className="flex flex-1 flex-col gap-0.5">
              <span className="text-caption font-normal text-on-block/70">
                {t('otp.locked.countdown')}
              </span>
              <span
                role="timer"
                aria-live="off"
                className="text-h2 font-extrabold tabular-nums text-on-block"
              >
                {cooldown.label}
              </span>
            </span>
          </div>
        ) : null}

        <Button
          type="button"
          size="3xl"
          fullWidth
          disabled={cooldown.active}
          onClick={() => {
            setFailure(null);
            setCode('');
          }}
        >
          {t('otp.locked.retry')}
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="3xl"
          fullWidth
          onClick={() => router.push(paths.support)}
        >
          {t('otp.locked.support')}
        </Button>

        <ChangeNumberRow onChange={changeNumber} />
      </main>
    );
  }

  /* ----------------------------------------------------------------- default / AU3 */

  return (
    <main id="main" className="flex w-full flex-col gap-6">
      <BackLink href={paths.login}>{t('back')}</BackLink>

      <AuthHeading
        title={t('otp.title')}
        subtitle={t('otp.subtitle', { phone: display, length: OTP_LENGTH })}
      />

      {otherFailure ? (
        <InlineNotice tone="error" role="alert" body={message(otherFailure)} multiline />
      ) : null}

      <div key={shakeKey} className={cn('w-full', wrongCodeFailure && styles.shake)}>
        <OtpInput
          length={OTP_LENGTH}
          value={code}
          error={wrongCodeFailure !== null}
          autoFocus
          disabled={verify.isPending}
          aria-label={t('otp.input.label')}
          cellLabel={(index, total) => t('otp.input.cell', { index: index + 1, total })}
          onChange={(value) => {
            setCode(value);
            if (failure) setFailure(null);
            if (resendNotice) setResendNotice(null);
          }}
          onComplete={(value) => void submit(value)}
          // The wrong-code cells are tinted `brand-soft` in the export; <OtpInput> only
          // switches the border, so the fill is applied from here.
          className={wrongCodeFailure ? '[&_input]:bg-brand-soft' : undefined}
        />
      </div>

      {wrongCodeFailure ? (
        <p role="alert" className="flex w-fit items-center gap-2 text-label font-semibold text-brand">
          <CircleAlert aria-hidden="true" className="size-4 shrink-0" />
          {message(wrongCodeFailure)}
        </p>
      ) : null}

      <Button
        type="button"
        size="3xl"
        fullWidth
        loading={verify.isPending}
        disabled={code.length !== OTP_LENGTH}
        onClick={() => void submit(code)}
      >
        {t('otp.submit')}
      </Button>

      {resendNotice ? (
        <InlineNotice tone="warning" role="status" body={resendNotice} multiline />
      ) : null}

      <div className="flex w-full items-center justify-center gap-1.5 text-label">
        <span className="font-normal text-ink2">
          {resend.isPending ? t('otp.resend.sending') : t('otp.resend.prompt')}
        </span>
        <button
          type="button"
          onClick={() => void onResend()}
          disabled={cooldown.active || resend.isPending}
          aria-live="polite"
          className={cn(
            'rounded-sm font-bold text-brand',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand',
            (cooldown.active || resend.isPending) && 'cursor-not-allowed text-ink3',
          )}
        >
          {cooldown.active
            ? t('otp.resend.countdown', { time: cooldown.label })
            : t('otp.resend.action')}
        </button>
      </div>

      <ChangeNumberRow onChange={changeNumber} />
    </main>
  );
}

/** "Nömrə səhvdir? Nömrəni dəyiş" (`otp-yanlis-kod.html` `E1WZR`). */
function ChangeNumberRow({ onChange }: { onChange: () => void }) {
  const t = useTranslations('auth');
  return (
    <div className="flex w-full items-center justify-center gap-1.5 text-label">
      <span className="font-normal text-ink2">{t('otp.wrongNumber.prompt')}</span>
      <button
        type="button"
        onClick={onChange}
        className="rounded-sm font-bold text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      >
        {t('otp.wrongNumber.action')}
      </button>
    </div>
  );
}
