'use client';

/**
 * "Səviyyə yüksəldi" (KT6) — node `Level Up Modal` in
 * `app-seviyye-yukseldi.html`: a 520-wide white panel, `rounded-2xl` (48),
 * padding 48/40/40, gap 18, centred; a 128 `violet-soft` trophy disc, a
 * `yellow` eyebrow pill (30 high, 12/700 +1px), the title 32/800 centred, the
 * body 16/400 `ink2`, a row of `success-soft` perk pills (36 high, 13/700) and
 * a full-width `brand` CTA (56) over the "Bütün səviyyələrə bax" link.
 *
 * Focus trap, Esc and focus restore come from `<Modal>` (Radix Dialog).
 *
 * **MSW-backed and local-only**: there is no server tier and no level-up event
 * (app-loyalty.md §8 records that as a GAP), so the trigger compares the
 * fixture ladder with `localStorage['ozio.lastTier']`.
 */
import { useTranslations } from 'next-intl';

import { Link, useFormat } from '@/core/i18n';
import { paths } from '@/core/routes';
import { Gift, Percent, Ticket, Trophy } from '@/shared/lucide';
import { DemoBanner } from '@/shared/states';
import { Button, Modal } from '@/shared/ui';

import type { LoyaltyTier } from '../data/models/tier';
import { LOYALTY_DEMO_MODULE } from '../loyalty_card.flags';

const PERK_ICONS = [Percent, Gift, Ticket] as const;

export interface LevelUpDialogProps {
  open: boolean;
  tier: LoyaltyTier | null;
  onAcknowledge: () => void;
}

export function LevelUpDialog({ open, tier, onAcknowledge }: LevelUpDialogProps) {
  const t = useTranslations('loyalty_card');
  const { percentPoints } = useFormat();

  if (!tier) return null;

  const percent = percentPoints(tier.cashbackPercent);
  const perks = [t('levelUp.perkBonus', { percent }), ...tier.perks].slice(0, 3);

  return (
    <Modal
      open={open}
      onOpenChange={(next) => {
        if (!next) onAcknowledge();
      }}
      title={t('levelUp.title', { tier: tier.name })}
      titleHidden
      size="m"
      closeLabel={t('cashier.close')}
    >
      <div className="flex w-full flex-col items-center gap-[18px] text-center">
        <DemoBanner module={LOYALTY_DEMO_MODULE} compact />

        <span
          aria-hidden="true"
          className="flex size-32 items-center justify-center rounded-pill bg-violet-soft text-violet"
        >
          <Trophy size={64} />
        </span>

        <span className="flex h-[30px] items-center rounded-pill bg-yellow px-4 text-micro font-bold tracking-[1px] text-on-yellow">
          {t('levelUp.eyebrow')}
        </span>

        <p className="m-0 text-h2 font-extrabold leading-[1.2] text-ink">
          {t('levelUp.title', { tier: tier.name })}
        </p>
        <p className="m-0 max-w-[380px] text-body text-ink2">
          {t('levelUp.body', { percent })}
        </p>

        <ul className="m-0 flex list-none flex-row flex-wrap justify-center gap-2 ps-0 pb-2 pt-1">
          {perks.map((perk, index) => {
            const Icon = PERK_ICONS[index % PERK_ICONS.length];
            return (
              <li
                key={perk}
                className="flex h-9 items-center gap-1.5 rounded-pill bg-success-soft px-[14px] text-caption font-bold text-success"
              >
                <Icon size={16} aria-hidden="true" />
                {perk}
              </li>
            );
          })}
        </ul>

        <Button variant="brand" size="2xl" fullWidth onClick={onAcknowledge}>
          {t('levelUp.cta')}
        </Button>

        <Link
          href={paths.cardLevels}
          onClick={onAcknowledge}
          className="rounded-sm text-body-sm font-semibold text-ink2 underline-offset-4 hover:underline"
        >
          {t('levelUp.seeLevels')}
        </Link>
      </div>
    </Modal>
  );
}
