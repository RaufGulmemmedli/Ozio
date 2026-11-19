'use client';

/**
 * `Web · Qənaət sandığı · Parametrlər` (`savings-jar-settings.html`) + its skeleton
 * (`savings-jar-settings-loading.html`).
 *
 * Enable switch, the three step chips (0,50 / 1 / 5 ₼), the four cap chips (20 / 50 / 100 /
 * Limitsiz), the save button and the dark preview card that runs the documented round-up on the
 * example total (18,40 ₼ → 19,00 ₼, +0,60 ₼ to the jar).
 *
 * `?preview=save-error` makes the save post the magic cap the handler answers 500 to, so the
 * save-failure state is reachable from the URL.
 */
import { useState } from 'react';
import { useTranslations } from 'next-intl';

import { cn } from '@/core/lib/cn';
import { useFormat } from '@/core/i18n';
import { useFailureMessage } from '@/core/i18n/failure-message';
import { paths } from '@/core/routes';
import { Wallet } from '@/shared/lucide';
import { ErrorState, InlineNotice } from '@/shared/states';
import { Button, Switch, toast } from '@/shared/ui';

import { JarPage } from '../components/jar-page';
import { JarStateCard } from '../components/jar-state-card';
import {
  CAP_CHOICES,
  ROUND_STEPS,
  roundUp,
  stepAmount,
  type JarSettings,
  type RoundStepCents,
} from '../data/models/savings-jar';
import {
  useForceSaveError,
  useSaveJarSettings,
  useSavingsJar,
} from '../hooks/use-savings-jar';
import { SavingsJarSettingsSkeleton } from './SavingsJarSettingsSkeleton';

/** The example total from the export's preview card. */
const PREVIEW_TOTAL = 18.4;

/** The cap the handler refuses, used only by `?preview=save-error`. */
const FORCE_SAVE_FAILURE_CAP = 13;

function Chip({
  selected,
  disabled,
  onClick,
  children,
}: {
  selected: boolean;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'flex h-11 items-center rounded-pill px-[22px] text-body-sm font-bold transition-colors',
        selected ? 'bg-cta text-on-cta' : 'bg-surface2 text-ink hover:bg-line',
        'disabled:cursor-not-allowed disabled:opacity-60',
      )}
    >
      {children}
    </button>
  );
}

export function SavingsJarSettingsView() {
  const t = useTranslations('savings_jar');
  const format = useFormat();
  const failureMessage = useFailureMessage();

  const query = useSavingsJar();
  const save = useSaveJarSettings();
  const forceError = useForceSaveError();

  /**
   * The form is the server's settings with the user's edits laid over them — derived, not copied,
   * so there is no effect that mirrors the query into state (and nothing to go stale when the jar
   * refetches).
   */
  const [edits, setEdits] = useState<JarSettings | null>(null);
  const draft: JarSettings | null = edits ?? query.data?.settings ?? null;
  const setDraft = setEdits;

  const page = (children: React.ReactNode) => (
    <JarPage
      crumbs={[
        { label: t('crumb.root'), href: paths.card },
        { label: t('crumb.jar'), href: paths.savingsJar },
        { label: t('crumb.settings') },
      ]}
      crumbsLabel={t('crumb.root')}
      title={t('settings.title')}
      subtitle={t('settings.subtitle')}
    >
      {children}
    </JarPage>
  );

  if (query.isPending || (draft === null && !query.isError)) {
    return page(<SavingsJarSettingsSkeleton label={t('loading')} />);
  }

  if (query.isError || draft === null) {
    return page(
      <JarStateCard>
        <ErrorState
          failure={query.error}
          title={t('error.title')}
          message={query.error ? failureMessage(query.error) : t('error.body')}
          retryLabel={t('retry')}
          onRetry={() => query.refetch()}
        />
      </JarStateCard>,
    );
  }

  const preview = roundUp(PREVIEW_TOTAL, draft.stepCents);

  const submit = () => {
    const payload: JarSettings = forceError
      ? { ...draft, monthlyCap: FORCE_SAVE_FAILURE_CAP }
      : draft;
    save.mutate(payload, {
      onSuccess: () => {
        // Drop the overlay so the form follows the server's answer again.
        setDraft(null);
        toast.success({ title: t('settings.saved') });
      },
    });
  };

  return page(
    <div className="flex w-full flex-col gap-6 lg:flex-row">
      {/* Settings Card */}
      <section className="flex min-w-0 flex-1 flex-col gap-5 rounded-xl bg-surface p-6 md:p-7">
        <div className="flex flex-row items-center justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-1">
            <h2 className="text-body-l font-extrabold text-ink">{t('settings.enable.title')}</h2>
            <p className="text-label text-ink2">{t('settings.enable.body')}</p>
          </div>
          <Switch
            checked={draft.enabled}
            disabled={save.isPending}
            aria-label={t('settings.enable.title')}
            onCheckedChange={(enabled) => setDraft({ ...draft, enabled })}
          />
        </div>

        <div aria-hidden="true" className="h-px w-full bg-line" />

        <fieldset className="flex flex-col gap-3 border-0 p-0">
          <legend className="text-body-sm font-extrabold text-ink3">
            {t('settings.step.title')}
          </legend>
          <div className="flex flex-row flex-wrap gap-2.5">
            {ROUND_STEPS.map((step: RoundStepCents) => (
              <Chip
                key={step}
                selected={draft.stepCents === step}
                disabled={save.isPending}
                onClick={() => setDraft({ ...draft, stepCents: step })}
              >
                {format.money(stepAmount(step))}
              </Chip>
            ))}
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-3 border-0 p-0">
          <legend className="text-body-sm font-extrabold text-ink3">
            {t('settings.cap.title')}
          </legend>
          <div className="flex flex-row flex-wrap gap-2.5">
            {CAP_CHOICES.map((cap) => (
              <Chip
                key={cap}
                selected={draft.monthlyCap === cap}
                disabled={save.isPending}
                onClick={() => setDraft({ ...draft, monthlyCap: cap })}
              >
                {cap === 0 ? t('settings.cap.unlimited') : format.money(cap)}
              </Chip>
            ))}
          </div>
          <p className="text-caption text-ink3">{t('settings.cap.hint')}</p>
        </fieldset>

        {save.isError && save.error ? (
          <InlineNotice
            tone="error"
            multiline
            title={t('settings.saveFailed')}
            body={failureMessage(save.error)}
          />
        ) : null}

        <Button variant="primary" size="2xl" fullWidth loading={save.isPending} onClick={submit}>
          {t('settings.save')}
        </Button>
      </section>

      {/* Preview Card */}
      <section className="flex min-h-[260px] w-full flex-col justify-center gap-3.5 rounded-bento bg-block p-8 lg:min-h-[300px] lg:w-[400px] lg:shrink-0">
        <p className="flex flex-row items-center gap-2 text-label font-bold text-on-block2">
          <Wallet size={16} aria-hidden="true" className="shrink-0" />
          {t('settings.preview.label')}
        </p>
        <p className="text-h2 font-extrabold tracking-[-0.03em] text-on-block">
          {t('settings.preview.amount', {
            total: format.money(preview.total),
            rounded: format.money(preview.rounded),
          })}
        </p>
        <span className="w-fit rounded-pill bg-yellow px-4 py-2 text-body-sm font-extrabold text-on-yellow">
          {t('settings.preview.extra', { extra: `+${format.money(preview.extra)}` })}
        </span>
        <p className="text-label text-on-block2">{t('settings.preview.hint')}</p>
      </section>
    </div>,
  );
}
