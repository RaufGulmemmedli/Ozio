/**
 * Hero visual — node `miu5i` (components.md §11, layout.md §3).
 *
 * Desktop 560×620 `rounded-2xl` `brand`; tablet 704×420 `rounded-2xl`;
 * mobile full-bleed 300 high `rounded-modal`. It holds, all in CSS — no image
 * ships:
 *   · yellow blob 360 circle at 300/-120            (`O5JZAc`)
 *   · ink blob 300 circle at -100/440               (`J0HPk`)
 *   · the Ozio card 420×260 r28 at 70/150, rot -6°  (`YXnK7`)
 *   · order chip 209×76 `surface` r24, 48 `success-soft` icon (`svmfL`)
 *   · cashback chip, `ink` pill, "+1,5%" 22/800 `yellow`  (`Lks0y`)
 *   · ten chip "9 + 1" 28/800 `brand`               (`fgSuL`)
 *
 * Offsets are percentages of the 560×620 frame, so the same markup reflows to
 * the tablet and mobile frames instead of needing three sets of coordinates.
 * The three chips float ±6 px over 6 s and stop under `prefers-reduced-motion`
 * (see `floatClass` in `type.ts`). The responsive table in `screens/landing.md` drops
 * the order chip at 768 and all chips at 390, which is what the `hidden`
 * variants below do.
 *
 * The card is a local static stand-in: `@/modules/loyalty_card` does not exist
 * yet, so there is no `<OzioCard>` to import.
 * TODO(loyalty): swap this card for `<OzioCard variant="static">` once the
 * loyalty_card module exports one.
 */
import { cn } from '@/core/lib/cn';
import { OzioLogo } from '@/shared/brand/ozio-logo';
import { Bike } from '@/shared/lucide';

import { floatClass } from './type';

/**
 * The one keyframe the marketing pages need, emitted as a hoisted `<style>`.
 *
 * React 19 lifts a `<style href precedence>` element into `<head>` and de-dupes
 * it by `href`, so rendering several heroes in one tree still yields one rule.
 * It is not in a CSS module because this project's turbopack rule breaks those
 * (see `type.ts`), and `@theme` lives in the frozen `globals.css`.
 */
function FloatKeyframes() {
  return (
    <style href="oz-mk-float" precedence="default">
      {'@keyframes oz-mk-float{0%,100%{transform:translateY(-6px)}50%{transform:translateY(6px)}}'}
    </style>
  );
}

export interface HeroVisualCopy {
  /** Accessible summary; the whole block is decorative otherwise. */
  label: string;
  tier: string;
  balanceLabel: string;
  balance: string;
  cardNumber: string;
  orderTitle: string;
  orderMeta: string;
  cashbackValue: string;
  cashbackLabel: string;
  tenValue: string;
  tenTitle: string;
  tenMeta: string;
}

export interface HeroVisualProps {
  copy: HeroVisualCopy;
  className?: string;
}

export function HeroVisual({ copy, className }: HeroVisualProps) {
  return (
    <div
      role="img"
      aria-label={copy.label}
      className={cn(
        'relative -mx-[var(--oz-page-x)] h-[300px] shrink-0 overflow-hidden rounded-modal bg-brand',
        'md:mx-0 md:h-[420px] md:w-full md:rounded-2xl',
        'min-[1200px]:h-[620px] min-[1200px]:w-[560px]',
        className,
      )}
    >
      <FloatKeyframes />

      {/* yellow blob — 360 circle, left 300, top -120 of a 560×620 frame */}
      <span
        aria-hidden
        className="absolute left-[54%] top-[-19%] aspect-square w-[64%] rounded-pill bg-yellow"
      />
      {/* ink blob — 300 circle, left -100, top 440 */}
      <span
        aria-hidden
        className="absolute left-[-18%] top-[71%] aspect-square w-[54%] rounded-pill bg-block"
      />

      {/* Ozio card — 420×260, r28, shadow float, -6° */}
      <div
        aria-hidden
        className={cn(
          'absolute left-[12.5%] top-[24%] flex w-[75%] flex-col justify-between',
          'aspect-[420/260] rotate-[-6deg] rounded-xl bg-brand p-4 shadow-float',
          'md:p-6 min-[1200px]:p-7',
        )}
      >
        <div className="flex items-center justify-between">
          <OzioLogo
            size="m"
            tone="white"
            decorative
            className="h-auto w-[72px] md:w-[96px] min-[1200px]:w-[121px]"
          />
          <span className="text-label font-bold tracking-[0.143em] text-white">{copy.tier}</span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-label text-white/80">{copy.balanceLabel}</span>
          <span className="text-[28px] font-extrabold leading-none text-white tabular-nums md:text-[38px] min-[1200px]:text-[44px]">
            {copy.balance}
          </span>
          <span className="text-label font-medium tracking-[0.07em] text-white/80">
            {copy.cardNumber}
          </span>
        </div>
      </div>

      {/* order chip — hidden below 1200 (screens/landing.md responsive table) */}
      <div
        aria-hidden
        className={cn(
          'absolute left-[6.4%] top-[61%] hidden items-center gap-[14px] rounded-card bg-surface',
          'px-5 py-[14px] shadow-float min-[1200px]:flex',
          floatClass,
        )}
      >
        <span className="grid size-12 shrink-0 place-items-center rounded-[16px] bg-success-soft text-success">
          <Bike size={24} aria-hidden="true" />
        </span>
        <span className="flex flex-col gap-0.5">
          <span className="text-body-sm font-bold text-ink">{copy.orderTitle}</span>
          <span className="text-caption text-ink2">{copy.orderMeta}</span>
        </span>
      </div>

      {/* cashback chip */}
      <div
        aria-hidden
        className={cn(
          'absolute left-[59%] top-[14.5%] hidden items-center gap-2.5 rounded-pill bg-block',
          'px-5 py-3 shadow-float md:flex',
          floatClass,
          '[animation-delay:-2s]',
        )}
      >
        <span className="text-[22px] font-extrabold leading-none text-yellow">
          {copy.cashbackValue}
        </span>
        <span className="text-body-sm font-semibold text-white">{copy.cashbackLabel}</span>
      </div>

      {/* ten chip */}
      <div
        aria-hidden
        className={cn(
          'absolute left-[53.5%] top-[76%] hidden items-center gap-3 rounded-card bg-surface',
          'px-5 py-[14px] shadow-float md:flex',
          floatClass,
          '[animation-delay:-4s]',
        )}
      >
        <span className="text-[28px] font-extrabold leading-none text-brand">{copy.tenValue}</span>
        <span className="flex flex-col gap-0.5">
          <span className="text-body-sm font-bold text-ink">{copy.tenTitle}</span>
          <span className="text-caption text-ink2">{copy.tenMeta}</span>
        </span>
      </div>
    </div>
  );
}
