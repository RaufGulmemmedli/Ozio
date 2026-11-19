'use client';

import { useTranslations } from 'next-intl';

import { cn } from '@/core/lib/cn';
import { Briefcase, House, MapPin, MapPinOff, Pencil, Trash2 } from '@/shared/lucide';
import { IconButton } from '@/shared/ui';

import type { Address, AddressKind } from '../data/models/address';
import { AddressMapThumb } from './AddressMapThumb';

const KIND_ICON: Record<AddressKind, typeof House> = {
  home: House,
  office: Briefcase,
  other: MapPin,
};

const KIND_TINT: Record<AddressKind, string> = {
  home: 'bg-brand-soft text-brand',
  office: 'bg-sky-soft text-sky',
  other: 'bg-violet-soft text-violet',
};

export interface AddressCardProps {
  address: Address;
  /** `true` on the row the app delivers to (client state, not `is_selected`). */
  isSelected: boolean;
  onEdit?: (address: Address) => void;
  onDelete?: (address: Address) => void;
  onMakeDefault?: (address: Address) => void;
  busy?: boolean;
  className?: string;
}

/**
 * The address card (`Address Card · …`, `app-unvanlarim.html`): `surface` r28, padding 20, gap 16
 * — head row (44 tinted tile r14 + name 20/800 + the "Əsas ünvan" `cta` pill 12/700 + two 40px
 * icon buttons), the 110-high map thumb, then the address line 16/700, the parts line 14/400
 * `ink2` and the courier note 13/400; non-default cards end with the brand "Əsas et" action.
 *
 * The title is the **kind** ("Ev" / "İş" / "Digər") — the live `type` field holds the address line,
 * not a label, so there is no user-given name to show.
 */
export function AddressCard({
  address,
  isSelected,
  onEdit,
  onDelete,
  onMakeDefault,
  busy = false,
  className,
}: AddressCardProps) {
  const t = useTranslations('address');
  const Icon = KIND_ICON[address.kind];

  const parts = [
    address.buildingName ? t('parts.building', { value: address.buildingName }) : null,
    address.entranceNumber ? t('parts.entrance', { value: address.entranceNumber }) : null,
    address.floor ? t('parts.floor', { value: address.floor }) : null,
    address.apartmentRoom ? t('parts.apartment', { value: address.apartmentRoom }) : null,
  ].filter((part): part is string => part !== null);

  return (
    <article
      className={cn(
        'flex w-full flex-col gap-4 rounded-xl bg-surface p-5',
        isSelected && 'outline outline-2 outline-offset-[-2px] outline-brand',
        className,
      )}
      aria-busy={busy || undefined}
    >
      <div className="flex w-full flex-row items-center justify-between gap-3">
        <div className="flex min-w-0 flex-row items-center gap-3">
          <span aria-hidden="true" className={cn('grid size-11 shrink-0 place-items-center rounded-md', KIND_TINT[address.kind])}>
            <Icon size={20} />
          </span>
          <h3 className="m-0 truncate text-h4 font-extrabold text-ink">{t(`kind.${address.kind}`)}</h3>
          {isSelected ? (
            <span className="shrink-0 rounded-pill bg-cta px-3 py-1 text-micro font-bold text-on-cta">
              {t('card.defaultBadge')}
            </span>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-row gap-2">
          {onEdit ? (
            <IconButton
              aria-label={t('card.edit')}
              tone="surface2"
              size={44}
              onClick={() => onEdit(address)}
            >
              <Pencil size={18} />
            </IconButton>
          ) : null}
          {onDelete ? (
            <IconButton
              aria-label={t('card.delete')}
              tone="surface2"
              size={44}
              onClick={() => onDelete(address)}
            >
              <Trash2 size={18} />
            </IconButton>
          ) : null}
        </div>
      </div>

      <AddressMapThumb label={address.line} hasPoint={address.point !== null} point={address.point} />

      <div className="flex w-full flex-col gap-1">
        <p className="m-0 text-body font-bold text-ink">{address.line || t('card.noLine')}</p>
        {parts.length > 0 ? (
          <p className="m-0 text-label text-ink2">{parts.join(' · ')}</p>
        ) : null}
        {address.details ? (
          <p className="m-0 pt-1.5 text-caption text-ink2">{address.details}</p>
        ) : null}
        {address.point === null ? (
          <p className="m-0 flex flex-row items-center gap-1.5 pt-1.5 text-caption text-ink3">
            <MapPinOff size={14} aria-hidden="true" />
            {t('card.noPoint')}
          </p>
        ) : null}
      </div>

      {!isSelected && onMakeDefault ? (
        <button
          type="button"
          onClick={() => onMakeDefault(address)}
          disabled={busy}
          className="flex w-fit flex-row items-center gap-1.5 text-label font-bold text-brand disabled:opacity-50"
        >
          {t('card.makeDefault')}
        </button>
      ) : null}
    </article>
  );
}
