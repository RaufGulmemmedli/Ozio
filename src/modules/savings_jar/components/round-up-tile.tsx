'use client';

/**
 * `<RoundUpTile>` — the cart-summary row from `cart-round-up-tile.html`, exported for
 * `@/modules/cart` to drop into its summary card. **The cart module is not edited by this module.**
 *
 * ```tsx
 * import { RoundUpTile } from '@/modules/savings_jar';
 * // inside the cart summary card, under the payable row:
 * <RoundUpTile total={summary.payable} />
 * ```
 *
 * Two states, both from the export:
 *  - **on**: yellow r20 tile, dark 48px disc, "Qənaət sandığına yuvarlaqlaşdır" +
 *    "18,40 ₼ → 19,00 ₼ · +0,60 ₼ sandığa", dark track with a yellow knob;
 *  - **off**: surface tile, `surface2` disc, the value proposition instead of the amounts.
 *
 * `total` is the payable the cart already has from the API; the tile only runs the documented
 * integer-qəpik round-up on it with the step the jar settings specify. It renders nothing when the
 * jar is unavailable (flag off, mocks off), so the cart never shows a broken row.
 */
import { useTranslations } from 'next-intl';

import { cn } from '@/core/lib/cn';
import { useFormat } from '@/core/i18n';
import { Wallet } from '@/shared/lucide';

import { roundUp, type RoundStepCents } from '../data/models/savings-jar';
import { useSaveJarSettings, useSavingsJar } from '../hooks/use-savings-jar';
import { JarToggle } from './jar-toggle';

export interface RoundUpTileProps {
  /** The payable the cart got from the API. */
  total: number;
  /** Controlled mode: pass both to own the state (otherwise the jar settings drive it). */
  enabled?: boolean;
  onEnabledChange?: (next: boolean) => void;
  /** Overrides the step from the jar settings. */
  stepCents?: RoundStepCents;
  className?: string;
}

export function RoundUpTile({
  total,
  enabled,
  onEnabledChange,
  stepCents,
  className,
}: RoundUpTileProps) {
  const t = useTranslations('savings_jar');
  const format = useFormat();

  const jar = useSavingsJar();
  const save = useSaveJarSettings();

  const settings = jar.data?.settings;
  const controlled = enabled !== undefined && onEnabledChange !== undefined;

  // Nothing to show until we know the step — and nothing at all if the jar cannot be read.
  if (!controlled && (jar.isPending || jar.isError || !settings)) return null;

  const step = stepCents ?? settings?.stepCents ?? 100;
  const isOn = controlled ? enabled : (settings?.enabled ?? false);
  const { total: shown, rounded, extra } = roundUp(total, step);

  const toggle = (next: boolean) => {
    if (controlled) {
      onEnabledChange(next);
      return;
    }
    if (!settings) return;
    save.mutate({ ...settings, enabled: next });
  };

  return (
    <div
      className={cn(
        'flex w-full flex-row items-center gap-[14px] rounded-lg p-5',
        isOn ? 'bg-yellow' : 'bg-surface',
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'flex size-12 shrink-0 items-center justify-center rounded-pill',
          isOn ? 'bg-block text-on-block' : 'bg-surface2 text-ink2',
        )}
      >
        <Wallet size={24} />
      </span>

      <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
        <p className={cn('text-body-sm font-bold', isOn ? 'text-on-yellow' : 'text-ink')}>
          {t('tile.title')}
        </p>
        <p className={cn('text-caption', isOn ? 'text-on-yellow' : 'text-ink2')}>
          {isOn
            ? t('tile.on', {
                total: format.money(shown),
                rounded: format.money(rounded),
                extra: format.money(extra),
              })
            : t('tile.off')}
        </p>
      </div>

      <JarToggle
        checked={isOn}
        onChange={toggle}
        disabled={save.isPending}
        label={t('tile.toggle')}
        tone={isOn ? 'yellow' : 'plain'}
      />
    </div>
  );
}
