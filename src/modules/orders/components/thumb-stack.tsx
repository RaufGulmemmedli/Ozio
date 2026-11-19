'use client';

/**
 * The item-thumbnail strip used on the orders list, the success page, the failed page, tracking and
 * the rating recap: n square thumbs + a "+k" tile for the rest.
 *
 * Sizes from the exports: 56 (tracking / rating / failed), 48 (success "Details" card), 56 with a
 * −14 overlap on the past-orders row.
 */
import { cn } from '@/core/lib/cn';
import { ProductImage } from '@/shared/media';

export interface ThumbStackProps {
  urls: readonly string[];
  /** Thumb edge in px. */
  size?: number;
  /** How many to show before the "+k" tile. */
  max?: number;
  /** Negative gap in px for the overlapping variant (past-orders row). */
  overlap?: number;
  /** Rendered on a dark card: the overflow tile uses the translucent white fill. */
  onBlock?: boolean;
  /** Already-localized alt text for the whole strip (the images are decorative). */
  label: string;
  className?: string;
}

// `inner` is the 16px radius the exports draw on 48–60px thumbs.
const RADIUS_FOR = (size: number): 'inner' | 'lg' => (size <= 56 ? 'inner' : 'lg');

export function ThumbStack({
  urls,
  size = 56,
  max = 4,
  overlap = 0,
  onBlock = false,
  label,
  className,
}: ThumbStackProps) {
  if (urls.length === 0) return null;
  const shown = urls.slice(0, max);
  const rest = urls.length - shown.length;

  return (
    <ul
      className={cn('flex items-center', className)}
      // Negative gap does not exist in CSS; the overlapping variant uses negative margins below.
      style={overlap > 0 ? undefined : { gap: 8 }}
      aria-label={label}
    >
      {shown.map((url, index) => (
        <li
          key={`${url}-${index}`}
          className="shrink-0 overflow-hidden"
          style={{
            width: size,
            height: size,
            marginInlineStart: overlap > 0 && index > 0 ? -overlap : undefined,
          }}
        >
          <ProductImage
            src={url}
            alt=""
            ratio="1/1"
            radius={RADIUS_FOR(size)}
            sizes={`${size}px`}
            fallbackIconSize={Math.round(size * 0.45)}
          />
        </li>
      ))}
      {rest > 0 ? (
        <li
          className={cn(
            'flex shrink-0 items-center justify-center text-label font-bold',
            size <= 48 ? 'rounded-md' : 'rounded-lg',
            onBlock ? 'bg-white/12 text-white' : 'bg-surface2 text-ink2',
          )}
          style={{
            width: size,
            height: size,
            marginInlineStart: overlap > 0 ? -overlap : undefined,
          }}
        >
          +{rest}
        </li>
      ) : null}
    </ul>
  );
}
