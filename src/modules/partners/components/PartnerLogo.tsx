'use client';

import Image from 'next/image';
import { useState } from 'react';

import { cn } from '@/core/lib/cn';

import { initialsOf } from '../data/models/partner';

/**
 * The partner logo tile (`Logo` in `app-partnyorlar.html`): a tinted square with the brand
 * initials, or the CDN image when the row carries one.
 *
 * The canvas rotates five soft tints across the grid (`#FFD6E1` `#E4F0FE` `#E3F6EC` `#EEEAFE`
 * `#FFD43B`), which are exactly the `*-soft` tokens + `yellow`; the tint is picked from the name
 * so a brand keeps the same colour between renders and between screens.
 */
const TINTS = [
  'bg-brand-soft',
  'bg-sky-soft',
  'bg-success-soft',
  'bg-violet-soft',
  'bg-yellow',
] as const;

export function logoTint(name: string): string {
  let hash = 0;
  for (const char of name) hash = (hash * 31 + char.codePointAt(0)!) % 9973;
  return TINTS[hash % TINTS.length];
}

export interface PartnerLogoProps {
  name: string;
  src?: string | null;
  /** Square side in px, or `'fill'` for the grid card's full-width 116-high tile. */
  size?: number | 'fill';
  /** Radius in px — 16 on the grid card, 18 on the map card, 24 on the detail cover. */
  radius?: number;
  /** Initials font size; defaults to a proportion of `size`. */
  fontSize?: number;
  /** `true` when a sibling already names the brand (list rows, cards with a title). */
  decorative?: boolean;
  className?: string;
}

export function PartnerLogo({
  name,
  src,
  size = 56,
  radius = 16,
  fontSize,
  decorative = true,
  className,
}: PartnerLogoProps) {
  const [failed, setFailed] = useState(false);
  const showInitials = !src || failed;
  const fill = size === 'fill';
  const side = fill ? 116 : size;

  return (
    <div
      className={cn(
        'relative grid shrink-0 place-items-center overflow-hidden',
        showInitials ? logoTint(name) : 'bg-surface2',
        fill && 'h-[116px] w-full',
        className,
      )}
      style={{
        borderRadius: radius,
        ...(fill ? {} : { width: side, height: side }),
      }}
    >
      {showInitials ? (
        <span
          aria-hidden={decorative ? 'true' : undefined}
          className="font-extrabold leading-none tracking-[-0.025em] text-ink"
          style={{ fontSize: fontSize ?? Math.round(side * (40 / 116)) }}
        >
          {initialsOf(name)}
        </span>
      ) : (
        // TODO(core): the API image CDN host must be allow-listed in next.config `images.remotePatterns`.
        <Image
          src={src}
          alt={decorative ? '' : name}
          fill={fill}
          width={fill ? undefined : side}
          height={fill ? undefined : side}
          sizes={fill ? '(max-width: 767px) 50vw, 263px' : `${side}px`}
          className="size-full object-cover"
          onError={() => setFailed(true)}
        />
      )}
      {decorative ? null : <span className="sr-only">{name}</span>}
    </div>
  );
}
