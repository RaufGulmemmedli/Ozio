'use client';

/**
 * The `/parcel/new` form state.
 *
 * Holds one `ParcelDraft`, validates it against the server's `ParcelRules` and reports per-field
 * errors as *message keys + params*, so the view resolves them through next-intl and nothing here
 * contains user-facing text.
 *
 * Nothing here prices anything: the quote comes from `useParcelQuote` → the mock.
 */
import { useCallback, useMemo, useState } from 'react';

import {
  emptyParcelDraft,
  parcelLongestSide,
  type ParcelDraft,
  type ParcelPaymentMethod,
  type ParcelPoint,
  type ParcelRules,
  type ParcelSizePreset,
  type ParcelSpec,
} from '../data/models/parcel';

export type ParcelPointKey = 'pickup' | 'dropoff';

export type ParcelField =
  | `${ParcelPointKey}.address`
  | `${ParcelPointKey}.contactName`
  | `${ParcelPointKey}.contactPhone`
  | 'spec.lengthCm'
  | 'spec.widthCm'
  | 'spec.heightCm'
  | 'spec.weightKg'
  | 'spec.contents'
  | 'payment';

export interface ParcelFieldIssue {
  /** Key inside the `parcel` namespace, e.g. `field.required`. */
  key: string;
  values?: Record<string, string | number>;
}

export type ParcelIssues = Partial<Record<ParcelField, ParcelFieldIssue>>;

/** Loose enough for `+994 50 123 45 67`, strict enough to catch a half-typed number. */
const PHONE_RE = /^\+?[\d\s()-]{9,20}$/;

export function validateParcelDraft(draft: ParcelDraft, rules?: ParcelRules): ParcelIssues {
  const issues: ParcelIssues = {};
  const required = (field: ParcelField, value: string) => {
    if (value.trim() === '') issues[field] = { key: 'field.required' };
  };

  for (const side of ['pickup', 'dropoff'] as const) {
    const point = draft[side];
    required(`${side}.address`, point.address);
    required(`${side}.contactName`, point.contactName);
    if (point.contactPhone.trim() === '') {
      issues[`${side}.contactPhone`] = { key: 'field.required' };
    } else if (!PHONE_RE.test(point.contactPhone.trim())) {
      issues[`${side}.contactPhone`] = { key: 'field.phone' };
    }
  }

  if (
    draft.pickup.address.trim() !== '' &&
    draft.pickup.address.trim() === draft.dropoff.address.trim()
  ) {
    issues['dropoff.address'] = { key: 'field.sameAddress' };
  }

  const dims: Array<[ParcelField, number]> = [
    ['spec.lengthCm', draft.spec.lengthCm],
    ['spec.widthCm', draft.spec.widthCm],
    ['spec.heightCm', draft.spec.heightCm],
    ['spec.weightKg', draft.spec.weightKg],
  ];
  for (const [field, value] of dims) {
    if (!(value > 0)) issues[field] = { key: 'field.notPositive' };
  }

  if (rules) {
    const side = parcelLongestSide(draft.spec);
    if (side > rules.maxSideCm) {
      const longest: ParcelField =
        draft.spec.lengthCm === side
          ? 'spec.lengthCm'
          : draft.spec.widthCm === side
            ? 'spec.widthCm'
            : 'spec.heightCm';
      issues[longest] = { key: 'field.sideTooLong', values: { max: rules.maxSideCm } };
    }
    if (draft.spec.weightKg > rules.maxWeightKg) {
      issues['spec.weightKg'] = { key: 'field.tooHeavy', values: { max: rules.maxWeightKg } };
    }
    if (draft.payer === 'recipient' && draft.paymentMethod !== 'cash') {
      issues.payment = { key: 'field.recipientCashOnly' };
    }
  }

  required('spec.contents', draft.spec.contents);
  return issues;
}

export function useParcelDraft(rules?: ParcelRules) {
  const [draft, setDraft] = useState<ParcelDraft>(emptyParcelDraft);
  const [touched, setTouched] = useState(false);

  const setPoint = useCallback(
    (side: ParcelPointKey, part: Partial<ParcelPoint>) =>
      setDraft((prev) => ({ ...prev, [side]: { ...prev[side], ...part } })),
    [],
  );

  const setSpec = useCallback(
    (part: Partial<ParcelSpec>) =>
      setDraft((prev) => ({ ...prev, spec: { ...prev.spec, ...part } })),
    [],
  );

  /** Picking a preset fills the three dimensions; the weight stays the user's. */
  const applyPreset = useCallback(
    (preset: ParcelSizePreset) =>
      setDraft((prev) => ({
        ...prev,
        spec: {
          ...prev.spec,
          lengthCm: preset.lengthCm,
          widthCm: preset.widthCm,
          heightCm: preset.heightCm,
        },
      })),
    [],
  );

  const setPayer = useCallback(
    (payer: ParcelDraft['payer']) =>
      setDraft((prev) => ({
        ...prev,
        payer,
        // The server refuses a non-cash method when the recipient pays, so follow it here too.
        paymentMethod: payer === 'recipient' ? 'cash' : prev.paymentMethod,
        ...(payer === 'recipient' ? { cardId: undefined } : {}),
      })),
    [],
  );

  const setPaymentMethod = useCallback(
    (method: ParcelPaymentMethod, cardId?: string) =>
      setDraft((prev) => ({
        ...prev,
        paymentMethod: method,
        ...(method === 'card' ? { cardId: cardId ?? prev.cardId } : { cardId: undefined }),
      })),
    [],
  );

  const setNote = useCallback(
    (courierNote: string) => setDraft((prev) => ({ ...prev, courierNote })),
    [],
  );

  /** Fills a whole point from a saved address (the chips above each address card). */
  const useSavedAddress = useCallback(
    (side: ParcelPointKey, saved: ParcelRules['savedAddresses'][number]) =>
      setPoint(side, {
        address: saved.address,
        details: saved.details,
        contactName: saved.contactName,
        contactPhone: saved.contactPhone,
      }),
    [setPoint],
  );

  const issues = useMemo(() => validateParcelDraft(draft, rules), [draft, rules]);
  const valid = Object.keys(issues).length === 0;

  /** Only show an error once the user has tried to submit (no red form on first paint). */
  const visibleIssues = touched ? issues : {};

  const selectedPresetId = useMemo(() => {
    const match = rules?.presets.find(
      (p) =>
        p.lengthCm === draft.spec.lengthCm &&
        p.widthCm === draft.spec.widthCm &&
        p.heightCm === draft.spec.heightCm,
    );
    return match?.id;
  }, [rules, draft.spec.lengthCm, draft.spec.widthCm, draft.spec.heightCm]);

  return {
    draft,
    issues: visibleIssues,
    valid,
    touched,
    markTouched: () => setTouched(true),
    selectedPresetId,
    setPoint,
    setSpec,
    applyPreset,
    setPayer,
    setPaymentMethod,
    setNote,
    useSavedAddress,
  };
}
