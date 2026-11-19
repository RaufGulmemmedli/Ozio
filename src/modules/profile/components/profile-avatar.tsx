'use client';

/**
 * `<ProfileAvatar>` — the initial-letter tile.
 *
 * `GET v1/profile/me` has **no** `image_url` / avatar field, and `POST v1/file/upload` (unverified)
 * has nothing on the profile to attach an upload to, so this package never renders or uploads a
 * photo: the avatar is always the first letter of `name` on `brand`, exactly as the export draws
 * it (88px on P1, 80px on the edit form, 48px in the top bar).
 */
import { cn } from '@/core/lib/cn';
import { Avatar } from '@/shared/ui';

import { profileInitial, type Profile } from '../data/models/profile';

/** The sizes the export actually uses. */
export type ProfileAvatarSize = 48 | 80 | 88;

const GEOMETRY: Record<ProfileAvatarSize, string> = {
  48: 'size-12 text-[18px] font-bold',
  80: 'size-20 text-[32px] font-bold',
  88: 'size-22 text-[36px] font-bold',
};

export interface ProfileAvatarProps {
  profile?: Profile | null;
  /** Overrides the initial derived from `profile.name` (e.g. a session `user.name`). */
  name?: string | null;
  size?: ProfileAvatarSize;
  /** Accessible label; pass `''` when a nearby element already names the person. */
  label?: string;
  className?: string;
}

export function ProfileAvatar({
  profile,
  name,
  size = 88,
  label = '',
  className,
}: ProfileAvatarProps) {
  const initial = name
    ? (Array.from(name.trim())[0]?.toLocaleUpperCase('az-AZ') ?? '')
    : profileInitial(profile);

  // `alt=""` keeps the bare letter out of the accessibility tree; a caller that wants the tile
  // announced passes `label` and gets a single `role="img"` node instead of a stray "N".
  const tile = (
    <Avatar
      initial={initial}
      alt=""
      size={48}
      tone="brand"
      className={cn(GEOMETRY[size], className)}
    />
  );

  if (!label) return tile;

  return (
    <span role="img" aria-label={label} className="inline-flex">
      {tile}
    </span>
  );
}
