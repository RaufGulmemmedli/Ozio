'use client';

import { useTranslations } from 'next-intl';

import { Badge, type BadgeTone } from '@/shared/ui';

import type { ParcelStatus } from '../data/models/parcel';

/**
 * Status mapping measured in `baglama-esas.html`: searching = `yellow` (#FFD43B),
 * assigned/pickedUp = `sky` (#E4F0FE), delivered = `success` (#E3F6EC),
 * cancelled = `neutral` (#EAE5DE).
 */
const TONE: Record<ParcelStatus, BadgeTone> = {
  searching: 'yellow',
  assigned: 'sky',
  pickedUp: 'sky',
  delivered: 'success',
  cancelled: 'neutral',
};

export function ParcelStatusTag({ status }: { status: ParcelStatus }) {
  const t = useTranslations('parcel');
  return <Badge tone={TONE[status]}>{t(`status.${status}`)}</Badge>;
}
