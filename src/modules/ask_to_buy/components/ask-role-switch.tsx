'use client';

/**
 * The parent / child switch.
 *
 * ask_to_buy has two sides and **no family API**: which side you are on is mock state. This
 * control is what makes both sides of every screen reachable in the demo, so it sits in the page
 * header of all three ask_to_buy screens. `?preview=parent|child` pins the role and the switch
 * then renders read-only.
 *
 * The change is announced in an `aria-live` region, because flipping it rewrites the list below.
 */
import { useTranslations } from 'next-intl';

import { cn } from '@/core/lib/cn';
import { Spinner } from '@/shared/ui';

import type { AskRole } from '../data/models/ask-request';

export interface AskRoleSwitchProps {
  role: AskRole;
  forced: boolean;
  switching: boolean;
  onChange: (role: AskRole) => void;
  className?: string;
}

const ROLES: readonly AskRole[] = ['parent', 'child'];

export function AskRoleSwitch({ role, forced, switching, onChange, className }: AskRoleSwitchProps) {
  const t = useTranslations('ask_to_buy');

  return (
    <div className={cn('flex flex-col items-start gap-2 lg:items-end', className)}>
      <div
        role="group"
        aria-label={t('role.label')}
        className="flex w-fit flex-row items-center gap-1 rounded-pill bg-surface2 p-1"
      >
        {ROLES.map((value) => {
          const active = value === role;
          return (
            <button
              key={value}
              type="button"
              aria-pressed={active}
              disabled={forced || switching}
              onClick={() => onChange(value)}
              className={cn(
                'flex h-11 min-w-[112px] flex-row items-center justify-center gap-2 rounded-pill px-[18px]',
                'text-label font-semibold text-ink2',
                'transition-[background-color,color] duration-[var(--oz-dur-fast)] ease-out',
                'disabled:cursor-not-allowed',
                active && 'bg-cta text-on-cta',
                (forced || switching) && !active && 'opacity-60',
              )}
            >
              {active && switching ? <Spinner size={16} /> : null}
              {t(`role.${value}`)}
            </button>
          );
        })}
      </div>

      <p aria-live="polite" className="text-caption text-ink3">
        {forced ? t('role.pinned') : t(`role.hint.${role}`)}
      </p>
    </div>
  );
}
