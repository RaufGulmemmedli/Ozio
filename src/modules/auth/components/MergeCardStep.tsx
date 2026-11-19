'use client';

/**
 * RG8 — "Köhnə kartı birləşdir" (`kohne-karti-birlesdir.html`) and its success state
 * (`kohne-kart-ugurla-birlesdi.html`). A **state of `/register`**, not a route.
 *
 * There is **no API for this**: `api/auth.md` records "Legacy-card merge — no swagger operation
 * found (`TODO backend`; mobile marks it 'later')". So nothing is called here, and pressing
 * "Kartı birləşdir" renders the documented *not available* notice rather than faking a success.
 * The success panel is real markup and is reachable for visual QA with `?preview=merged`.
 *
 * Export: segmented tabs · card-number field 56 high radius 14 with a 16-digit
 * `#### #### #### ####` mask · hint 13/400 `ink3` · primary pill 60 · skip link 15/600 `ink2` ·
 * success summary rows separated by 1px `line` hairlines.
 */
import { useState } from 'react';
import { useTranslations } from 'next-intl';

import { usePreview } from '@/core/query';
import { Camera, CircleCheck } from '@/shared/lucide';
import { InlineNotice } from '@/shared/states';
import { Button, Field, Input, SegmentedControl } from '@/shared/ui';

import { LEGACY_CARD_LENGTH } from '../auth.constants';
import { AuthHeading } from '../components/AuthHeading';
import { BackLink } from '../components/BackLink';

/** `9112408733652210` → `9112 4087 3365 2210`. Works on partial input (live mask). */
export function formatCardNumber(input: string): string {
  const digits = input.replace(/\D+/gu, '').slice(0, LEGACY_CARD_LENGTH);
  return digits.replace(/(.{4})(?=.)/gu, '$1 ');
}

export function MergeCardStep({
  onSkip,
  onDone,
  onBack,
}: {
  /** "İndi yox, sonra" — continue the flow without merging. */
  onSkip: () => void;
  /** Leaves the success panel. */
  onDone: () => void;
  onBack?: () => void;
}) {
  const t = useTranslations('auth');
  const preview = usePreview();
  const [tab, setTab] = useState<'number' | 'barcode'>('number');
  const [card, setCard] = useState('');
  const [attempted, setAttempted] = useState(false);

  const digits = card.replace(/\D+/gu, '');
  const complete = digits.length === LEGACY_CARD_LENGTH;

  /* ------------------------------------------------------------- success state */

  if (preview === 'merged') {
    return (
      <section aria-labelledby="merge-success-title" className="flex w-full flex-col gap-6">
        <span className="flex size-13 items-center justify-center rounded-pill bg-success-soft">
          <CircleCheck aria-hidden="true" className="size-6 text-success" />
        </span>
        <AuthHeading
          as="h2"
          id="merge-success-title"
          title={t('merge.success.title')}
          subtitle={t('merge.success.subtitle')}
        />
        {/*
          Every number on this panel is server data (transferred bonus, old card tail, current
          balance, active coupons) and the endpoint does not exist, so the rows render the
          "not available" notice instead of the design's sample figures.
        */}
        <InlineNotice tone="info" body={t('merge.unavailable')} multiline />
        <Button type="button" size="3xl" fullWidth onClick={onDone}>
          {t('merge.success.cta')}
        </Button>
      </section>
    );
  }

  /* ---------------------------------------------------------------- merge form */

  return (
    <section aria-labelledby="merge-title" className="flex w-full flex-col gap-6">
      {onBack ? <BackLink onClick={onBack}>{t('back')}</BackLink> : null}

      <AuthHeading
        as="h2"
        id="merge-title"
        title={t('merge.title')}
        subtitle={t('merge.subtitle')}
      />

      <SegmentedControl
        value={tab}
        label={t('merge.tab.label')}
        fullWidth
        onValueChange={(value) => setTab(value === 'barcode' ? 'barcode' : 'number')}
        options={[
          { value: 'number', label: t('merge.tab.number') },
          { value: 'barcode', label: t('merge.tab.barcode') },
        ]}
      />

      {tab === 'number' ? (
        <Field label={t('merge.card.label')} helper={t('merge.card.hint')} hideHelperIcon>
          <Input
            value={formatCardNumber(card)}
            inputMode="numeric"
            autoComplete="off"
            placeholder={t('merge.card.placeholder')}
            onChange={(event) => setCard(event.target.value)}
            className="tabular-nums"
          />
        </Field>
      ) : (
        <Button type="button" variant="soft" size="2xl" fullWidth leadingIcon={<Camera />} disabled>
          {t('merge.scan')}
        </Button>
      )}

      {attempted ? <InlineNotice tone="info" role="alert" body={t('merge.unavailable')} multiline /> : null}

      <Button
        type="button"
        size="3xl"
        fullWidth
        disabled={tab === 'number' && !complete}
        onClick={() => setAttempted(true)}
      >
        {t('merge.submit')}
      </Button>

      <button
        type="button"
        onClick={onSkip}
        className="w-full rounded-sm text-center text-body-sm font-semibold text-ink2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      >
        {t('merge.skip')}
      </button>
    </section>
  );
}
