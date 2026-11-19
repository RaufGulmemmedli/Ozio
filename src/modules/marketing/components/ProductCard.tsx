/**
 * Product card — node `q9FFnz` (components.md §5 "Product Card"), as it appears
 * in the landing Market row `YEPSp` and the `/delivery` featured grid `Zapng`.
 *
 * `surface`, radius 24, padding 12, gap 12; image 200 high at radius 16; a
 * `yellow` 28-high discount pill 13/700; name 16/600; meta 13/400 `ink2`;
 * price 20/700; a 40 px `brand` circle action.
 *
 * The export's images are Unsplash URLs, which do not ship — `<ProductImage>`
 * with `src={null}` renders its `surface2` + category-glyph tile at a fixed
 * aspect ratio, so there is no remote request and no CLS.
 *
 * The action is a link into the app, not an add-to-cart button: adding to a cart
 * needs a session, and this page is static and logged-out.
 */
import { cn } from '@/core/lib/cn';
import { Link } from '@/core/i18n/navigation';
import { Plus } from '@/shared/lucide';
import { ProductImage } from '@/shared/media/product-image';

export interface ProductCardProps {
  name: string;
  meta: string;
  price: string;
  /** `categoryIcon()` slug for the fallback tile. */
  category?: string;
  /** Text of the `yellow` corner pill ("-20%", "Yeni"). */
  tag?: string;
  /** Where the circular action goes — the app market. */
  href: string;
  /** Accessible name for that action. */
  actionLabel: string;
  className?: string;
}

export function ProductCard({
  name,
  meta,
  price,
  category,
  tag,
  href,
  actionLabel,
  className,
}: ProductCardProps) {
  return (
    <article className={cn('flex flex-col gap-3 rounded-card bg-surface p-3', className)}>
      <div className="relative">
        <ProductImage src={null} alt="" category={category} ratio="236/200" radius="inner" />
        {tag ? (
          <span className="absolute left-2.5 top-2.5 inline-flex h-7 items-center rounded-pill bg-yellow px-3 text-caption font-bold text-on-yellow">
            {tag}
          </span>
        ) : null}
      </div>

      <div className="flex flex-col gap-1 px-1">
        <h3 className="m-0 truncate text-body font-semibold text-ink">{name}</h3>
        <p className="m-0 truncate text-caption text-ink2">{meta}</p>
      </div>

      <div className="flex items-center justify-between gap-2 px-1 pb-1">
        <span className="text-h4 font-bold text-ink tabular-nums">{price}</span>
        <Link
          href={href}
          prefetch={false}
          aria-label={`${actionLabel}: ${name}`}
          className="grid size-10 shrink-0 place-items-center rounded-pill bg-brand text-white transition-colors duration-[var(--oz-dur-fast)] hover:bg-brand-dark"
        >
          <Plus size={20} aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}
