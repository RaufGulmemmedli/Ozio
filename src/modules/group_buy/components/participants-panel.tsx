'use client';

/**
 * GB2's `İştirakçılar` block: `joined / target`, the progress bar, the 44px initial avatars and
 * the "N nəfər çatışmır" line (replaced by the completed copy once the group is full).
 *
 * The export tints the six avatars brand / sky / violet / success / ink2 / brand-dark. `<Avatar>`
 * ships four tones, so they cycle through those four — the tint carries no meaning.
 */
import { useTranslations } from 'next-intl';

import { Avatar, Card, Progress, type AvatarTone } from '@/shared/ui';

import type { GroupDeal } from '../data/models/group-deal';

const TONES: AvatarTone[] = ['brand', 'sky', 'violet', 'yellow'];

export function ParticipantsPanel({ deal }: { deal: GroupDeal }) {
  const t = useTranslations('group_buy');

  return (
    <Card tone="surface" radius="xl" className="flex w-full flex-col gap-4 p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="text-h4 font-extrabold text-ink">{t('participants.title')}</h2>
        <span className="text-body font-extrabold text-ink">
          {t('card.people', { joined: deal.joined, target: deal.target })}
        </span>
      </div>

      <Progress
        value={deal.joined}
        max={deal.target}
        height={12}
        label={t('progress.value', { joined: deal.joined, target: deal.target })}
      />

      <ul className="flex flex-wrap items-center gap-[10px]">
        {deal.participants.map((person, index) => (
          <li key={`${person.name}-${index}`}>
            <Avatar
              name={person.name}
              initial={person.initial}
              size={44}
              tone={TONES[index % TONES.length]}
            />
          </li>
        ))}
      </ul>

      <p className="text-label text-ink2">
        {deal.complete
          ? t('participants.complete')
          : t('participants.missing', { count: deal.missing })}
      </p>
    </Card>
  );
}
