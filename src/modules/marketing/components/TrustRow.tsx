/**
 * Trust row — node `BLAz5` (components.md §11): four overlapping 36 px avatars
 * (gap -10, 3 px `bg` stroke) + 15/500 `ink2`.
 *
 * `<AvatarStack>` from `@/shared/ui` already draws exactly that ring and overlap;
 * the circles are decorative (no photo ships), so they carry no names and the
 * sentence next to them is the accessible text.
 */
import { cn } from '@/core/lib/cn';
import { AvatarStack } from '@/shared/ui/avatar';

import { trustAvatarTones } from '../content/landing';

export interface TrustRowProps {
  /** "600 000+ istifadəçi artıq Ozio ilə qazanır" */
  children: string;
  className?: string;
}

export function TrustRow({ children, className }: TrustRowProps) {
  return (
    <div className={cn('flex items-center gap-[14px] pt-3', className)}>
      <AvatarStack items={trustAvatarTones.map((tone) => ({ tone }))} size={36} max={4} />
      <p className="m-0 text-body-sm font-medium text-ink2">{children}</p>
    </div>
  );
}
