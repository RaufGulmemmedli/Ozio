'use client';

/**
 * `<AddressPicker>` — the delivery-address chip and its popover.
 *
 * Used by the app shell's top bar and by checkout (M5/M6 import it from `@/modules/address`).
 * The chip shows the current delivery address; the popover lists the saved rows, lets one be
 * picked, and links to "Yeni ünvan".
 *
 * Picking a row is **client state**: there is no working server route for a default address
 * (`PATCH v1/profile/address/{id}` → 404), so `useSelectAddress()` writes
 * `usePrefs().selectedAddressId` (persisted) and makes one best-effort `PUT`.
 */
import { useState } from 'react';
import { useTranslations } from 'next-intl';

import { cn } from '@/core/lib/cn';
import { Link } from '@/core/i18n/navigation';
import { paths } from '@/core/routes';
import { useSession } from '@/core/session';
import { Popover } from '@/shared/ui';
import { Bone, Shimmer } from '@/shared/skeleton';
import { Check, ChevronDown, MapPin, MapPinOff, Plus } from '@/shared/lucide';

import { useAddresses, useSelectAddress, useSelectedAddress } from '../hooks';
import type { Address } from '../data/models/address';

export interface AddressPickerProps {
  /** `chip` is the top-bar pill; `block` is the full-width row used at checkout. */
  variant?: 'chip' | 'block';
  className?: string;
}

export function AddressPicker({ variant = 'chip', className }: AddressPickerProps) {
  const t = useTranslations('address');
  const status = useSession((s) => s.status);
  const [open, setOpen] = useState(false);

  const list = useAddresses();
  const selected = useSelectedAddress();
  const select = useSelectAddress();

  // A guest has no saved addresses: the chip becomes the link to sign in and add one.
  if (status !== 'authenticated') {
    return (
      <Link
        href={paths.addresses}
        className={cn(
          'flex flex-row items-center gap-2 rounded-pill bg-surface px-4 py-2.5 text-label font-semibold text-ink',
          className,
        )}
      >
        <MapPin size={16} aria-hidden="true" className="text-brand" />
        {t('picker.chooseAddress')}
      </Link>
    );
  }

  const label = selected.address?.line || t('picker.noAddress');

  const trigger =
    variant === 'chip' ? (
      <button
        type="button"
        className={cn(
          'flex max-w-[260px] flex-row items-center gap-2 rounded-pill bg-surface px-4 py-2.5',
          'text-label font-semibold text-ink transition-colors duration-[var(--oz-dur-fast)] hover:bg-surface2',
          className,
        )}
      >
        <MapPin size={16} aria-hidden="true" className="shrink-0 text-brand" />
        <span className="min-w-0 truncate">{label}</span>
        <ChevronDown size={16} aria-hidden="true" className="shrink-0 text-ink3" />
      </button>
    ) : (
      <button
        type="button"
        className={cn(
          'flex w-full flex-row items-center gap-3 rounded-card bg-surface p-4 text-left',
          'transition-colors duration-[var(--oz-dur-fast)] hover:bg-surface2',
          className,
        )}
      >
        <span aria-hidden="true" className="grid size-11 shrink-0 place-items-center rounded-md bg-brand-soft">
          <MapPin size={20} className="text-brand" />
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="text-caption text-ink2">{t('picker.deliverTo')}</span>
          <span className="truncate text-body font-bold text-ink">{label}</span>
        </span>
        <ChevronDown size={18} aria-hidden="true" className="shrink-0 text-ink3" />
      </button>
    );

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      trigger={trigger}
      align="start"
      width={320}
      label={t('picker.popoverLabel')}
    >
      <div className="flex w-full flex-col gap-1">
        {list.isPending ? (
          <Shimmer label={t('loading')} className="flex flex-col gap-2 p-1">
            {[0, 1, 2].map((i) => (
              <Bone key={i} w="100%" h={44} r="md" />
            ))}
          </Shimmer>
        ) : list.isError ? (
          <p role="alert" className="m-0 p-2 text-label text-ink2">
            {t('picker.loadError')}
          </p>
        ) : (list.data?.length ?? 0) === 0 ? (
          <p className="m-0 p-2 text-label text-ink2">{t('picker.emptyHint')}</p>
        ) : (
          <ul className="m-0 flex list-none flex-col gap-1 p-0">
            {(list.data ?? []).map((address: Address) => {
              const isActive = selected.selectedId === address.id;
              return (
                <li key={address.id}>
                  <button
                    type="button"
                    onClick={() => {
                      select.mutate(address);
                      setOpen(false);
                    }}
                    aria-current={isActive ? 'true' : undefined}
                    className={cn(
                      'flex w-full flex-row items-start gap-3 rounded-md px-3 py-2.5 text-left',
                      'transition-colors duration-[var(--oz-dur-fast)] hover:bg-surface2',
                      isActive && 'bg-surface2',
                    )}
                  >
                    <span className="mt-0.5 shrink-0">
                      {isActive ? (
                        <Check size={18} aria-hidden="true" className="text-brand" />
                      ) : address.point === null ? (
                        <MapPinOff size={18} aria-hidden="true" className="text-ink3" />
                      ) : (
                        <MapPin size={18} aria-hidden="true" className="text-ink3" />
                      )}
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-body-sm font-semibold text-ink">
                        {address.line || t('card.noLine')}
                      </span>
                      <span className="text-caption text-ink2">{t(`kind.${address.kind}`)}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {selected.isFallback ? (
          <p className="m-0 px-3 py-1 text-caption text-ink3">{t('picker.fallbackHint')}</p>
        ) : null}

        <Link
          href={paths.addressNew}
          onClick={() => setOpen(false)}
          className="mt-1 flex flex-row items-center gap-2 rounded-md px-3 py-2.5 text-label font-bold text-brand hover:bg-surface2"
        >
          <Plus size={18} aria-hidden="true" />
          {t('picker.addNew')}
        </Link>
      </div>
    </Popover>
  );
}
