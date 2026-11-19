'use client';

/**
 * `/senior/mode` — "Sadə rejim".
 *
 * **Not drawn on web.** `screens/mock-family-senior.md` says outright: "Sadə rejim settings screen
 * not drawn on web", so this screen is built from the `SeniorPrefs` contract
 * (`mock-contracts.ts` §13a / `api/mock-modules.md` §13a) using the design system's own settings
 * patterns — the switch rows and the section cards the other settings screens use. Nothing here is
 * invented beyond those three preferences: `enabled`, `scale` (1.0…1.6) and `highContrast`.
 *
 * It carries no `<DemoBanner>`-worthy data of its own, but it is part of a mock module and the
 * banner is required on every mock screen, so it renders one that says the preferences are real
 * while the two data screens behind them are demo content.
 *
 * The live sample reads its own `--oz-senior-sample-scale` rather than the document variable, so
 * it previews the chosen scale even while Sadə rejim is still switched **off** — you can see what
 * you would get before turning it on.
 */
import { useTranslations } from 'next-intl';
import type { CSSProperties } from 'react';

import { cn } from '@/core/lib/cn';
import { paths } from '@/core/routes';
import { PageHeader } from '@/shared/layout';
import { Calendar, HeartPulse, Sparkles } from '@/shared/lucide';
import { DemoBanner } from '@/shared/states';
import { Breadcrumbs, Slider, Switch } from '@/shared/ui';

import { LinkButton } from '../components/link-button';
import { SeniorScreen, seniorSampleClass } from '../components/senior-screen';
import { SENIOR_SCALE, useSeniorMode } from '../hooks/use-senior-mode';

/** The slider works in whole percent so its `aria-valuetext` reads "130 %". */
const toPercent = (scale: number): number => Math.round(scale * 100);
const fromPercent = (percent: number): number => Math.round(percent) / 100;

export function SeniorModeView() {
  const t = useTranslations('senior');
  const { enabled, scale, highContrast, setEnabled, setScale, setHighContrast } = useSeniorMode();

  const percent = toPercent(scale);

  return (
    <SeniorScreen>
      <PageHeader
        title={t('mode.title')}
        subtitle={t('mode.subtitle')}
        breadcrumbs={
          <Breadcrumbs
            label={t('breadcrumb.label')}
            items={[
              { label: t('breadcrumb.profile'), href: paths.profile },
              { label: t('breadcrumb.module') },
            ]}
          />
        }
      />

      <DemoBanner module={t('mode.title')} body={t('mode.demo')} />

      <div className="flex w-full flex-col items-start gap-8 lg:flex-row">
        <section
          aria-labelledby="senior-settings"
          className="flex w-full min-w-0 flex-1 flex-col items-start gap-6 rounded-xl bg-surface p-7"
        >
          <h2 id="senior-settings" className="text-h4 font-bold text-ink">
            {t('mode.settings')}
          </h2>

          <div
            data-senior-outline
            className="flex w-full flex-row items-center justify-between gap-5 rounded-lg border border-line bg-bg p-5"
          >
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="text-body font-bold text-ink">{t('mode.enabled')}</span>
              <span className="text-caption text-ink2">{t('mode.enabledHint')}</span>
            </div>
            <Switch checked={enabled} aria-label={t('mode.enabled')} onCheckedChange={setEnabled} />
          </div>

          <div
            className={cn('flex w-full flex-col gap-4', !enabled && 'pointer-events-none opacity-50')}
          >
            <div className="flex w-full flex-row items-baseline justify-between gap-4">
              <span id="senior-scale-label" className="text-body font-bold text-ink">
                {t('mode.scale')}
              </span>
              <output aria-live="polite" className="text-body font-semibold text-ink2">
                {t('mode.scaleValue', { percent })}
              </output>
            </div>

            <Slider
              value={[percent]}
              min={toPercent(SENIOR_SCALE.min)}
              max={toPercent(SENIOR_SCALE.max)}
              step={toPercent(SENIOR_SCALE.step)}
              disabled={!enabled}
              aria-labelledby="senior-scale-label"
              thumbLabels={[t('mode.scale')]}
              onValueChange={(next) => {
                const first = next[0];
                if (typeof first === 'number') setScale(fromPercent(first));
              }}
            />

            <p className="text-caption text-ink3">{t('mode.scaleHint')}</p>

            <div
              data-senior-outline
              className="flex w-full flex-row items-center justify-between gap-5 rounded-lg border border-line bg-bg p-5"
            >
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="text-body font-bold text-ink">{t('mode.contrast')}</span>
                <span className="text-caption text-ink2">{t('mode.contrastHint')}</span>
              </div>
              <Switch
                checked={highContrast}
                aria-label={t('mode.contrast')}
                disabled={!enabled}
                onCheckedChange={setHighContrast}
              />
            </div>
          </div>
        </section>

        <div className="flex w-full shrink-0 flex-col items-start gap-5 lg:w-[400px]">
          <section
            aria-labelledby="senior-sample"
            className={cn(
              'flex w-full flex-col items-start gap-3 rounded-xl bg-surface p-7',
              seniorSampleClass,
            )}
            style={{ '--oz-senior-sample-scale': scale } as CSSProperties}
          >
            <h2 id="senior-sample" className="flex flex-row items-center gap-2 text-h4 font-bold text-ink">
              <Sparkles aria-hidden="true" size={22} className="shrink-0 text-brand" />
              {t('mode.sample.title')}
            </h2>
            <p className="text-body text-ink2">{t('mode.sample.body')}</p>
            <p className="text-label text-ink3">{t('mode.sample.meta')}</p>
          </section>

          <section
            aria-labelledby="senior-links"
            className="flex w-full flex-col items-start gap-4 rounded-xl bg-surface p-7"
          >
            <h2 id="senior-links" className="text-h4 font-bold text-ink">
              {t('mode.screens')}
            </h2>

            <LinkButton
              href={paths.seniorPension}
              variant="soft"
              size="xl"
              fullWidth
              leadingIcon={<Calendar aria-hidden="true" size={20} />}
            >
              {t('pension.title')}
            </LinkButton>

            <LinkButton
              href={paths.seniorNeighbor}
              variant="soft"
              size="xl"
              fullWidth
              leadingIcon={<HeartPulse aria-hidden="true" size={20} />}
            >
              {t('help.title')}
            </LinkButton>
          </section>
        </div>
      </div>
    </SeniorScreen>
  );
}
