'use client';

/**
 * Contact form — node `gOLYl` (`screens/landing.md` §`/elaqe`).
 *
 * react-hook-form + zod through `useOzioForm` / `<Form>` / `<FormField>` from
 * `@/shared/ui`, posting to `POST /api/contact` — the one route handler this
 * module owns, because **the API has no support endpoint** (see that file's
 * header for exactly what is and is not delivered).
 *
 * Fields: Ad və soyad, Telefon (`+994` + 9 digits, the login rule), Mövzu as the
 * five chips the export draws, Mesajınız. Inline errors under each field via
 * `<Field>`, a spinner in the submit button while sending, a success panel that
 * replaces the form, and an error banner with retry. A hidden honeypot and the
 * route's per-IP rate limit cover the "honeypot/rate-limit" note in the spec.
 *
 * Nothing the visitor typed is kept after a successful send: the form resets.
 */

import { zodResolver } from '@hookform/resolvers/zod';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useId, useState } from 'react';

import { cn } from '@/core/lib/cn';
import { Link } from '@/core/i18n/navigation';
import { paths } from '@/core/routes';
import { CircleCheck, TriangleAlert } from '@/shared/lucide';
import { Button } from '@/shared/ui/button';
import { Form, FormField, useOzioForm } from '@/shared/ui/form';
import { Input } from '@/shared/ui/input';
import { PhoneInput } from '@/shared/ui/phone-input';
import { Textarea } from '@/shared/ui/textarea';

import { contactTopics, type ContactTopic } from '../content/landing';
import { brandText } from './type';
import { contactSchema, type ContactResponse, type ContactValues } from '../lib/contact-schema';

type Status = 'idle' | 'sending' | 'sent' | 'error' | 'rateLimited';

export interface ContactFormProps {
  /** Fallback subject when the URL carries none. */
  defaultTopic?: ContactTopic;
  className?: string;
}

function isTopic(value: string | null): value is ContactTopic {
  return value !== null && (contactTopics as readonly string[]).includes(value);
}

export function ContactForm({ defaultTopic = 'order', className }: ContactFormProps) {
  const t = useTranslations('marketing');
  const v = useTranslations('validation');
  const common = useTranslations('common');
  const [status, setStatus] = useState<Status>('idle');
  const honeypotId = useId();

  /**
   * `?topic=partnership` — the deep link `/partners` uses. Read here, on the
   * client, rather than from the page's `searchParams`: a server read of
   * `searchParams` would opt `/contact` out of static rendering, and
   * 02-routing.md lists it as SSG. The page wraps this component in `<Suspense>`
   * for the same reason.
   */
  const searchParams = useSearchParams();
  const urlTopic = searchParams.get('topic');
  const initialTopic = isTopic(urlTopic) ? urlTopic : defaultTopic;

  const form = useOzioForm<ContactValues>({
    resolver: zodResolver(
      contactSchema({
        name: v('name'),
        phone: v('phone'),
        message: t('contact.form.messageMin'),
        required: v('required'),
      }),
    ),
    defaultValues: {
      name: '',
      phone: '',
      topic: initialTopic,
      message: '',
      honeypot: '',
    },
  });

  const topic = form.watch('topic');

  async function onSubmit(values: ContactValues) {
    setStatus('sending');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(values),
      });
      const body = (await res.json().catch(() => null)) as ContactResponse | null;

      if (res.ok && body?.ok) {
        form.reset({ name: '', phone: '', topic: initialTopic, message: '', honeypot: '' });
        setStatus('sent');
        return;
      }
      setStatus(body && !body.ok && body.kind === 'rateLimited' ? 'rateLimited' : 'error');
    } catch {
      setStatus('error');
    }
  }

  if (status === 'sent') {
    return (
      <div
        className={cn(
          'flex flex-col items-start gap-4 rounded-modal bg-surface p-7 md:p-10',
          className,
        )}
      >
        <span className="grid size-12 place-items-center rounded-pill bg-success-soft text-success">
          <CircleCheck size={26} aria-hidden="true" />
        </span>
        <h2 className="m-0 text-h3 font-bold text-ink">{t('contact.form.success.title')}</h2>
        <p className="m-0 text-body leading-6 text-ink2">{t('contact.form.success.text')}</p>
        <Button variant="ghost" size="lg" onClick={() => setStatus('idle')}>
          {t('contact.form.success.again')}
        </Button>
      </div>
    );
  }

  const failed = status === 'error' || status === 'rateLimited';

  return (
    <div className={cn('rounded-modal bg-surface p-6 md:p-8 min-[1200px]:p-10', className)}>
      <h2 className="m-0 mb-6 text-h3 font-bold text-ink">{t('contact.form.title')}</h2>

      {failed ? (
        <div
          role="alert"
          className="mb-5 flex items-start gap-3 rounded-lg bg-brand-soft p-4 text-ink"
        >
          <TriangleAlert size={20} aria-hidden="true" className={cn('mt-0.5 shrink-0', brandText)} />
          <div className="flex flex-col gap-1">
            <p className="m-0 text-body-sm font-semibold">{t('contact.form.error.title')}</p>
            <p className="m-0 text-body-sm">
              {status === 'rateLimited' ? t('contact.form.error.rate') : t('contact.form.error.text')}
            </p>
          </div>
        </div>
      ) : null}

      <Form form={form} onSubmit={onSubmit} className="flex flex-col gap-5">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <FormField name="name" label={t('contact.form.name')} required>
            {({ field, state }) => (
              <Input
                {...field}
                id={field.name}
                state={state}
                autoComplete="name"
                placeholder={t('contact.form.namePlaceholder')}
              />
            )}
          </FormField>

          <FormField name="phone" label={t('contact.form.phone')} required>
            {({ field, state }) => (
              <PhoneInput
                name={field.name}
                id={field.name}
                ref={field.ref}
                onBlur={field.onBlur}
                variant="default"
                state={state}
                autoComplete="tel"
                /* RHF holds E.164; the control works in national digits. */
                value={(field.value as string).replace(/^\+994/, '')}
                onChange={(next) => field.onChange(next.e164 ?? `+994${next.digits}`)}
              />
            )}
          </FormField>
        </div>

        <fieldset className="m-0 flex flex-col gap-3 border-0 p-0">
          <legend className="mb-1 p-0 text-caption font-semibold text-ink2">
            {t('contact.form.topic')}
          </legend>
          <div className="flex flex-wrap gap-2.5">
            {contactTopics.map((option) => {
              const selected = topic === option;
              return (
                <button
                  key={option}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => form.setValue('topic', option, { shouldDirty: true })}
                  className={cn(
                    'inline-flex h-10 items-center rounded-pill px-[18px] text-label',
                    'transition-colors duration-[var(--oz-dur-fast)]',
                    selected
                      ? 'bg-cta font-semibold text-on-cta'
                      : 'border border-line bg-surface font-medium text-ink hover:border-ink',
                  )}
                >
                  {t(`contact.form.topics.${option}`)}
                </button>
              );
            })}
          </div>
        </fieldset>

        <FormField name="message" label={t('contact.form.message')} required>
          {({ field, state }) => (
            <Textarea
              {...field}
              id={field.name}
              state={state}
              rows={5}
              placeholder={t('contact.form.messagePlaceholder')}
            />
          )}
        </FormField>

        {/* Honeypot: off-screen, not hidden with `display:none` (bots skip those),
            and excluded from the tab order and the accessibility tree. */}
        <div aria-hidden className="sr-only">
          <label htmlFor={honeypotId}>{t('contact.form.name')}</label>
          <input
            id={honeypotId}
            type="text"
            tabIndex={-1}
            autoComplete="off"
            {...form.register('honeypot')}
          />
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="m-0 max-w-[340px] text-caption text-ink2">
            {t.rich('contact.form.consent', {
              link: (chunks) => (
                <Link href={paths.privacy} prefetch={false} className={cn('underline', brandText)}>
                  {chunks}
                </Link>
              ),
            })}
          </p>
          <Button type="submit" variant="brand" size="2xl" loading={status === 'sending'}>
            {status === 'sending' ? common('loading') : t('contact.form.submit')}
          </Button>
        </div>
      </Form>
    </div>
  );
}
