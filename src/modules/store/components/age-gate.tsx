'use client';

/**
 * Confirm step for an age-restricted category.
 *
 * `GET v1/categories/products` marks the alcohol and tobacco categories with
 * `is_age_restricted: true`, and **the API does not gate their products** — asking here is the
 * only gate that exists. The answer is kept per category for this tab only (`sessionStorage`), so
 * it is never a claim about a verified age.
 */
import { useCallback, useSyncExternalStore } from 'react';
import { useTranslations } from 'next-intl';

import { TriangleAlert } from '@/shared/lucide';
import { EmptyState, StateButton } from '@/shared/states';

const STORAGE_KEY = 'ozio.store.ageConfirmed';

function readConfirmed(): number[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((v): v is number => typeof v === 'number') : [];
  } catch {
    return [];
  }
}

function writeConfirmed(ids: readonly number[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // Private mode / blocked storage: the gate simply asks again.
  }
}

/*
 * One tiny external store instead of state-in-an-effect: `getSnapshot` is cached so its reference
 * stays stable, and the server snapshot is always empty, which is what keeps hydration identical.
 */
const listeners = new Set<() => void>();
const SERVER_SNAPSHOT: number[] = [];
let cache: number[] | null = null;

function snapshot(): number[] {
  if (cache === null) cache = readConfirmed();
  return cache;
}

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  return () => listeners.delete(onChange);
}

function markConfirmed(categoryId: number): void {
  const current = snapshot();
  if (current.includes(categoryId)) return;
  cache = [...current, categoryId];
  writeConfirmed(cache);
  for (const listener of listeners) listener();
}

export interface UseAgeGateResult {
  /** True while the products of `categoryId` must stay hidden. */
  blocked: boolean;
  confirm: () => void;
}

export function useAgeGate(categoryId: number | null, restricted: boolean): UseAgeGateResult {
  const confirmed = useSyncExternalStore(subscribe, snapshot, () => SERVER_SNAPSHOT);

  const confirm = useCallback(() => {
    if (categoryId !== null) markConfirmed(categoryId);
  }, [categoryId]);

  return {
    blocked: restricted && categoryId !== null && !confirmed.includes(categoryId),
    confirm,
  };
}

export interface AgeGateProps {
  categoryName: string;
  onConfirm: () => void;
  onCancel?: () => void;
}

export function AgeGate({ categoryName, onConfirm, onCancel }: AgeGateProps) {
  const t = useTranslations('store');

  return (
    <EmptyState
      icon={TriangleAlert}
      tone="brand"
      panel
      title={t('age.title')}
      body={t('age.body', { category: categoryName })}
      action={
        <StateButton variant="primary" onClick={onConfirm}>
          {t('age.confirm')}
        </StateButton>
      }
      secondaryAction={
        onCancel ? (
          <StateButton variant="soft" onClick={onCancel}>
            {t('age.cancel')}
          </StateButton>
        ) : undefined
      }
    />
  );
}
