'use client';

/**
 * `/market/tens` — "Ozio 10-lar" (`app-ozio-10-lar.html`, frame `mW6JS`).
 * **Guest-visible route**; the card itself is account data, so it sits behind `<GuestGate>`
 * while the header and the rules strip stay readable for everyone.
 *
 * Layout from the export: Page Header → Main Row (gap 24) with the `block` Stamp Hero
 * (radius 48, padding 40, gap 24: a `yellow` eyebrow pill, a 40/800 hero line and the
 * white `<StampCard>`) beside the 400-wide gifts panel → Stores Header → Stores Row of
 * per-card progress tiles (radius 28, padding 24, gap 16, 24px mini stamps) → Rules.
 *
 * NOT rendered, because `GET v1/ten-carts` has no field for it:
 *   · the "OZIO MARKET · NƏRİMANOV" store eyebrow — a row carries **no store**; the eyebrow
 *     shows the card's own name from `ten_cart_translations` instead
 *   · the whole "Aylıq hədiyyələr" panel (Noyabr / Oktyabr / Sentyabr / Dekabr with
 *     Davam edir · Qazanılıb · Bağlı) — there is no monthly-gift endpoint and no prize
 *     field on a ten-cart, so the block is hidden rather than invented (the screen spec
 *     says exactly this)
 *   · "10-cu möhürdə: pulsuz 1 L süd və ya 3 ₼ endirim kuponu" — no prize text exists
 *   · per-store progress: the tiles are the **cards** the endpoint returns (5 on live),
 *     not stores, because a card is not tied to a store in the data
 *
 * "Kartı seç" posts to `POST v1/ten-carts/add`, which is `live: 'unverified'` — the body
 * key is a guess and nothing is known about whether it selects or toggles — so the button
 * reports "sent" and refetches instead of flipping `is_selected` optimistically.
 */
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';

import { useFailureMessage, useFormat } from '@/core/i18n';
import { paths } from '@/core/routes';
import { usePreview } from '@/core/query';
import { useIsAuthenticated } from '@/core/session';
import { Gift, Store } from '@/shared/lucide';
import { PageHeader } from '@/shared/layout';
import { EmptyState, ErrorState, GuestGate } from '@/shared/states';
import { Button, toast } from '@/shared/ui';

import { LinkButton } from '../components/link-button';
import { RulesStrip } from '../components/rules-strip';
import { MiniStamps, StampCard } from '../components/stamp-card';
import { pickActiveCard, stampsLeft, type TenCart } from '../data/models/ten-cart';
import { useSelectTenCart, useTenCarts } from '../hooks/use-ten-carts';
import { TensSkeleton } from './TensSkeleton';

const RULE_KEYS = ['earn', 'collect', 'claim'] as const;

export function TensView() {
  const t = useTranslations('lottery');
  const tc = useTranslations('common');
  const { date } = useFormat();
  const authenticated = useIsAuthenticated();
  const previewing = usePreview() !== null;
  const failureMessage = useFailureMessage();

  const cards = useTenCarts();
  const select = useSelectTenCart();
  const [focusId, setFocusId] = useState<number | null>(null);

  const rows = useMemo(() => cards.data ?? [], [cards.data]);
  const auto = useMemo(() => pickActiveCard(rows), [rows]);
  const active: TenCart | null = useMemo(
    () => rows.find((card) => card.id === focusId) ?? auto,
    [rows, focusId, auto],
  );

  const ruleItems = useMemo(
    () =>
      RULE_KEYS.map((key) => ({
        title: t(`tens.rules.${key}.title`),
        body: t(`tens.rules.${key}.body`),
      })),
    [t],
  );

  const header = (
    <PageHeader title={t('tens.title')} subtitle={t('tens.subtitle')} />
  );

  function handleSelect(card: TenCart) {
    select.mutate(card.id, {
      onSuccess: () => {
        // `verified: false` — the POST has never been observed, so this is "sent", not "done".
        toast.info({ title: t('tens.select.sent.title'), body: t('tens.select.sent.body') });
        setFocusId(card.id);
      },
      onError: (failure) => toast.error(failureMessage(failure)),
    });
  }

  // `?preview=` must reach the data states even without a session (BUILD-CONTRACT rule 4).
  if (!authenticated && !previewing) {
    return (
      <>
        {header}
        <GuestGate
          icon={Gift}
          title={t('tens.guest.title')}
          body={t('tens.guest.body')}
          actionLabel={tc('signIn')}
          next={paths.tens}
        />
        <RulesStrip heading={t('tens.rulesTitle')} items={ruleItems} />
      </>
    );
  }

  if (cards.isPending) {
    return (
      <>
        {header}
        <TensSkeleton label={tc('loading')} />
        <RulesStrip heading={t('tens.rulesTitle')} items={ruleItems} />
      </>
    );
  }

  if (cards.isError) {
    return (
      <>
        {header}
        <ErrorState
          failure={cards.error}
          title={tc('error.generic.title')}
          message={failureMessage(cards.error)}
          retryLabel={tc('retry')}
          onRetry={() => cards.refetch()}
        />
        <RulesStrip heading={t('tens.rulesTitle')} items={ruleItems} />
      </>
    );
  }

  if (!active) {
    return (
      <>
        {header}
        <EmptyState
          icon={Gift}
          tone="brand"
          title={t('tens.empty.title')}
          body={t('tens.empty.body')}
          panel
          action={
            <LinkButton href={paths.market} variant="primary" size="lg">
              {t('tens.empty.action')}
            </LinkButton>
          }
        />
        <RulesStrip heading={t('tens.rulesTitle')} items={ruleItems} />
      </>
    );
  }

  const left = stampsLeft(active);

  return (
    <>
      {header}

      <div className="flex w-full flex-col gap-6">
        <section className="flex w-full flex-col gap-6 rounded-2xl bg-block p-6 md:p-10">
          {/* The export's store eyebrow; the API has no store, so this is the card's name. */}
          <span className="inline-flex h-8 w-fit items-center rounded-pill bg-yellow px-4 text-caption font-bold tracking-wide text-on-yellow uppercase">
            {active.name || t('tens.cardFallback')}
          </span>

          <h2 className="max-w-[560px] text-h2 leading-tight font-extrabold text-on-block md:text-[40px]">
            {active.completed
              ? t('tens.heroComplete')
              : left === 0
                ? t('tens.heroGiftReady')
                : t('tens.hero', { current: active.currentStep, left })}
          </h2>

          <StampCard card={active} titleAs="h3" />

          {active.endsAt ? (
            <p className="text-body-sm text-on-block2">
              {t('tens.validUntil', { date: date(active.endsAt.at, 'long') })}
            </p>
          ) : null}

          {!active.isSelected ? (
            <Button
              variant="white"
              size="xl"
              loading={select.isPending}
              onClick={() => handleSelect(active)}
              className="w-full md:w-fit"
            >
              {t('tens.select.action')}
            </Button>
          ) : null}
        </section>

        {rows.length > 1 ? (
          <>
            <div className="flex w-full flex-row items-center justify-between gap-3 pt-2">
              <h2 className="text-h3 font-bold text-ink">{t('tens.allCards')}</h2>
              <LinkButton href={paths.discounts} variant="ghost" size="md">
                {t('tens.toDiscounts')}
              </LinkButton>
            </div>

            <ul className="grid w-full list-none grid-cols-1 gap-5 p-0 md:grid-cols-2 lg:grid-cols-3">
              {rows.map((card) => (
                <li key={card.id} className="min-w-0">
                  <article className="flex w-full flex-col gap-4 rounded-xl border border-line bg-surface p-6">
                    <div className="flex w-full flex-row items-center justify-between gap-3">
                      <span className="flex min-w-0 flex-row items-center gap-[10px]">
                        <span
                          aria-hidden="true"
                          className="grid size-9 shrink-0 place-items-center rounded-pill bg-brand-soft text-brand"
                        >
                          <Store size={18} />
                        </span>
                        <span className="truncate text-body-sm font-bold text-ink">
                          {card.name || t('tens.cardFallback')}
                        </span>
                      </span>
                      <span className="shrink-0 text-body-sm font-extrabold text-brand">
                        {card.currentStep} / {card.slots}
                      </span>
                    </div>

                    <MiniStamps card={card} />

                    <Button
                      variant={card.id === active.id ? 'soft' : 'ghost'}
                      size="md"
                      fullWidth
                      onClick={() => setFocusId(card.id)}
                      aria-pressed={card.id === active.id}
                    >
                      {card.id === active.id ? t('tens.shown') : t('tens.show')}
                    </Button>
                  </article>
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </div>

      <RulesStrip heading={t('tens.rulesTitle')} items={ruleItems} />
    </>
  );
}
