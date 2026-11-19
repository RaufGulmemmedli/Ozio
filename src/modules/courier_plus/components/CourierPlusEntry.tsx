'use client';

/**
 * `<CourierPlusEntry>` — the only way another module links into Yolüstü kuryer.
 *
 * W7 owns `/courier-services` and places this tile there; the profile menu uses the same
 * component. It renders **nothing** when the `courierPlus` flag is off, so no caller has to know
 * about the flag (08-feature-flags-mocks.md "Entry level").
 *
 * The tile shape follows the service tiles of `kuryer-xidmetleri-hub.html`: icon tile, 22/800
 * title, one line of body, one pill CTA.
 */
import { useTranslations } from 'next-intl';

import { cn } from '@/core/lib/cn';
import { paths } from '@/core/routes';
import { Bike } from '@/shared/lucide';
import { DemoBanner } from '@/shared/states';

import { courierPlusEnabled } from '../courier_plus.flags';

import { CpLinkButton } from './CpLinkButton';

export interface CourierPlusEntryProps {
  /** `dark` is the `block` tile, `surface` the white one, `brand` the pink one. */
  tone?: 'dark' | 'surface' | 'brand';
  /** Adds the compact "Demo rejim" chip inside the tile. */
  showDemoChip?: boolean;
  className?: string;
}

export function CourierPlusEntry({
  tone = 'dark',
  showDemoChip = true,
  className,
}: CourierPlusEntryProps) {
  const t = useTranslations('courier_plus');
  if (!courierPlusEnabled()) return null;

  const dark = tone === 'dark';
  const brand = tone === 'brand';

  return (
    <article
      className={cn(
        'flex w-full flex-col items-start gap-4 rounded-bento p-7 md:p-8',
        dark && 'bg-block',
        brand && 'bg-brand-soft',
        tone === 'surface' && 'bg-surface',
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'flex size-14 shrink-0 items-center justify-center rounded-lg',
          dark ? 'bg-on-block/12 text-on-block' : 'bg-surface text-brand',
        )}
      >
        <Bike size={26} />
      </span>

      <h3
        className={cn(
          'm-0 text-[22px] font-extrabold leading-tight',
          dark ? 'text-on-block' : 'text-ink',
        )}
      >
        {t('entry.title')}
      </h3>
      <p
        className={cn(
          'm-0 text-body-sm font-medium',
          dark ? 'text-on-block/80' : 'text-ink2',
        )}
      >
        {t('entry.body')}
      </p>

      {showDemoChip ? <DemoBanner compact module="courier_plus" title={t('demo.title')} /> : null}

      <CpLinkButton
        href={paths.courierPlus}
        variant={dark ? 'white' : 'brand'}
        size="lg"
        className="mt-auto"
      >
        {t('entry.action')}
      </CpLinkButton>
    </article>
  );
}
