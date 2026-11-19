'use client';

/**
 * `Qonşu anbar seçimi` (`z57Lfl`): the consumer-side picker, drawn over the landing.
 *
 * A radio list (`<RadioGroup>` → real roving-focus radios) of `CpNearbyHub` rows — r20 tile,
 * `brand-soft` when selected, `surface2` otherwise, distance chip on the right — plus the one
 * primary "Bu məntəqəni seç". It is a **state, not a route**.
 *
 * Loading is three option bones, empty is the drawn "Yaxınlıqda məntəqə yoxdur" copy.
 */
import { useState } from 'react';
import { useTranslations } from 'next-intl';

import { cn } from '@/core/lib/cn';
import { House, MapPinOff } from '@/shared/lucide';
import { Badge, Button, Modal } from '@/shared/ui';
import { Bone, Shimmer } from '@/shared/skeleton';
import { EmptyState, ErrorState } from '@/shared/states';

import { minutesToClock, type CpNearbyHub } from '../data/models/courier-plus';

export interface CpNeighborHubModalProps {
  open: boolean;
  onClose: () => void;
  hubs: readonly CpNearbyHub[];
  loading?: boolean;
  failure?: { kind?: string } | null;
  onRetry?: () => void;
  onSelect: (hub: CpNearbyHub) => void;
}

export function CpNeighborHubModal({
  open,
  onClose,
  hubs,
  loading = false,
  failure = null,
  onRetry,
  onSelect,
}: CpNeighborHubModalProps) {
  const t = useTranslations('courier_plus');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Derived, not synchronised: with nothing picked yet the nearest hub is selected, the way the
  // export draws it — so no effect has to mirror the list into state.
  const selected = hubs.find((h) => h.id === selectedId) ?? hubs[0] ?? null;

  return (
    <Modal
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      title={t('nearby.title')}
      description={t('nearby.body')}
      size="m"
      closeLabel={t('close')}
      footer={
        hubs.length > 0 ? (
          <Button
            variant="brand"
            size="xl"
            disabled={selected === null}
            onClick={() => {
              if (selected) onSelect(selected);
            }}
          >
            {t('nearby.select')}
          </Button>
        ) : null
      }
    >
      {loading ? (
        <Shimmer label={t('loading')} className="flex w-full flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <Bone key={i} w="100%" h={80} r="lg" />
          ))}
        </Shimmer>
      ) : failure ? (
        <ErrorState
          compact
          failure={failure}
          title={t('nearby.error.title')}
          message={t('matches.error.body')}
          onRetry={onRetry}
          retryLabel={t('retry')}
        />
      ) : hubs.length === 0 ? (
        <EmptyState
          compact
          icon={MapPinOff}
          title={t('nearby.empty.title')}
          body={t('nearby.empty.body')}
          titleAs="p"
        />
      ) : (
        <div
          role="radiogroup"
          aria-label={t('nearby.title')}
          className="flex w-full flex-col gap-3"
        >
          {hubs.map((hub) => {
            const active = hub.id === selected?.id;
            return (
              <button
                key={hub.id}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setSelectedId(hub.id)}
                className={cn(
                  'flex w-full flex-row items-center gap-3.5 rounded-lg p-4 text-left',
                  'transition-colors duration-[var(--oz-dur-fast)] ease-out',
                  active ? 'bg-brand-soft' : 'bg-surface2 hover:bg-line',
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    'flex size-11 shrink-0 items-center justify-center rounded-md',
                    active ? 'bg-surface text-brand' : 'bg-surface text-ink2',
                  )}
                >
                  <House size={20} />
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="truncate text-body font-extrabold text-ink">{hub.name}</span>
                  <span className="truncate text-caption font-normal text-ink2">
                    {t('nearby.hours', {
                      address: hub.address,
                      open: minutesToClock(hub.openMinutes),
                      close: minutesToClock(hub.closeMinutes),
                    })}
                  </span>
                </span>
                <Badge tone="neutral">{t('nearby.distance', { meters: hub.distanceMeters })}</Badge>
              </button>
            );
          })}
        </div>
      )}
    </Modal>
  );
}
