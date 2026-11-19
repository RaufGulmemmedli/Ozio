'use client';

/**
 * One neighbour-board row, in both drawn shapes.
 *
 * `senior-neighbor-ask.html` ("Kömək istə"): a 48 `brand-soft` kind tile (radius 16) with its
 * glyph, the kind label 16/700, the note 14/400 `ink2`, and the status pill —
 * Gözləyir `yellow`, Yoldadır `sky-soft`, Tamamlandı `success-soft`.
 *
 * `senior-neighbor-help.html` ("Köməyə get"): the same row, with `requester · distance · note` as
 * the second line, a yellow "+2 ₼ bonus" tag and a 44-high brand **Köməyə get** button; once
 * accepted the button becomes "Tamamlandı", and a finished errand shows the success pill.
 *
 * The kind glyphs are the drawn ones as far as `@/shared/lucide` carries them: `shopping-basket`
 * and `trash-2` exactly, and `heart-pulse` for medicine (the export's `pill` glyph is not in the
 * project's icon set — noted rather than imported from `lucide-react` directly, which rule 9
 * forbids).
 */
import { useTranslations } from 'next-intl';

import { cn } from '@/core/lib/cn';
import { useFormat } from '@/core/i18n';
import { HeartPulse, ShoppingBasket, Trash2, type LucideIcon } from '@/shared/lucide';
import { Button } from '@/shared/ui';

import {
  canAccept,
  canComplete,
  formatDistance,
  type HelpKind,
  type HelpRequest,
  type HelpStatus,
} from '../data/models/help-request';

const KIND_ICON: Readonly<Record<HelpKind, LucideIcon>> = {
  medicine: HeartPulse,
  groceries: ShoppingBasket,
  trash: Trash2,
};

/** Status pill fills, fixed by `screens/mock-family-senior.md` ("Implementation notes"). */
const STATUS_TONE: Readonly<Record<HelpStatus, string>> = {
  open: 'bg-yellow text-on-yellow',
  accepted: 'bg-sky-soft text-ink',
  completed: 'bg-success-soft text-success',
};

export interface HelpRowProps {
  request: HelpRequest;
  /** `mine` renders the status pill, `nearby` the bonus tag plus the action button. */
  side: 'mine' | 'nearby';
  busy?: boolean;
  onAccept?: (request: HelpRequest) => void;
  onComplete?: (request: HelpRequest) => void;
}

export function HelpRow({ request, side, busy = false, onAccept, onComplete }: HelpRowProps) {
  const t = useTranslations('senior');
  const { number } = useFormat();

  const Icon = KIND_ICON[request.kind];
  const kindLabel = t(`help.kind.${request.kind}`);

  const distance = formatDistance(request.distanceKm, { number }, {
    m: t('help.unit.m'),
    km: t('help.unit.km'),
  });

  const meta =
    side === 'nearby'
      ? [request.requester, distance, request.note].filter(Boolean).join(' · ')
      : request.helper && request.status !== 'open'
        ? t('help.helperLine', { note: request.note, helper: request.helper })
        : request.note;

  return (
    <li className="flex min-h-[96px] w-full flex-row flex-wrap items-center gap-4 py-4">
      <span
        aria-hidden="true"
        className="flex size-12 shrink-0 items-center justify-center rounded-[16px] bg-brand-soft"
      >
        <Icon size={24} className="text-brand" />
      </span>

      <div className="flex min-w-[180px] flex-1 flex-col gap-[3px]">
        <span className="text-body font-bold text-ink">{kindLabel}</span>
        {meta ? <span className="text-label text-ink2">{meta}</span> : null}
      </div>

      {side === 'nearby' && request.status !== 'completed' ? (
        <span className="inline-flex h-7 shrink-0 items-center rounded-pill bg-yellow px-3 text-caption font-bold text-on-yellow">
          {/* The export's compact tag reads "+2 ₼", not "+2,00 ₼" — the amount is still fixture
              data from the API, only its presentation is the short one. */}
          {t('help.bonusTag', { amount: number(request.bonus) })}
        </span>
      ) : null}

      {side === 'nearby' && canAccept(request) ? (
        <Button
          variant="brand"
          size="md"
          loading={busy}
          onClick={() => onAccept?.(request)}
        >
          {t('help.accept')}
        </Button>
      ) : side === 'nearby' && canComplete(request) ? (
        <Button
          variant="soft"
          size="md"
          loading={busy}
          onClick={() => onComplete?.(request)}
        >
          {t('help.complete')}
        </Button>
      ) : (
        <span
          className={cn(
            'inline-flex h-7 shrink-0 items-center rounded-pill px-3 text-caption font-bold',
            STATUS_TONE[request.status],
          )}
        >
          {t(`help.status.${request.status}`)}
        </span>
      )}
    </li>
  );
}
