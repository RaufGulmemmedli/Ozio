/**
 * The seven glyphs the school export uses that `@/shared/lucide` does not re-export yet.
 *
 * TODO(core): add `GraduationCap`, `NotebookPen`, `IdCard`, `ImageUp`, `BookOpen`, `Cookie` and
 * `Unlink` to `src/shared/lucide.ts` and delete this file. Hard rule 9 says `lucide-react` may be
 * imported in exactly one place, so these are hand-drawn in the same 24×24 / stroke-2 / round-cap
 * geometry rather than imported here. Every other icon on these screens comes from
 * `@/shared/lucide`.
 *
 * They are `forwardRef` components typed with `LucideProps`, which makes each one structurally a
 * `LucideIcon` — so `<EmptyState icon={GraduationCap}>` and `<InlineNotice icon={…}>` type-check
 * exactly as they do with a real lucide glyph, and the swap above is a pure deletion.
 */
import { forwardRef, type ReactNode } from 'react';

import type { LucideIcon, LucideProps } from '@/shared/lucide';

/** Shared chrome: the attributes every lucide glyph carries. */
function glyph(name: string, paths: ReactNode): LucideIcon {
  const Icon = forwardRef<SVGSVGElement, LucideProps>(function Icon(
    { size = 24, strokeWidth = 2, absoluteStrokeWidth, ...rest },
    ref,
  ) {
    return (
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        // lucide's own rule: `absoluteStrokeWidth` keeps the stroke constant as the glyph scales.
        strokeWidth={
          absoluteStrokeWidth ? (Number(strokeWidth) * 24) / Number(size) : strokeWidth
        }
        strokeLinecap="round"
        strokeLinejoin="round"
        {...rest}
      >
        {paths}
      </svg>
    );
  });
  Icon.displayName = name;
  return Icon;
}

/** `graduation-cap` — the module's own mark (hub tile, grades empty state). */
export const GraduationCap = glyph(
  'GraduationCap',
  <>
    <path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z" />
    <path d="M22 10v6" />
    <path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5" />
  </>,
);

/** `notebook-pen` — the class-list tile and its empty state. */
export const NotebookPen = glyph(
  'NotebookPen',
  <>
    <path d="M13.4 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7.4" />
    <path d="M2 6h4" />
    <path d="M2 10h4" />
    <path d="M2 14h4" />
    <path d="M2 18h4" />
    <path d="M21.378 5.626a1 1 0 1 0-3.004-3.004l-5.01 5.012a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506z" />
  </>,
);

/** `id-card` — the student-card tile and the card status row. */
export const IdCard = glyph(
  'IdCard',
  <>
    <path d="M16 10h2" />
    <path d="M16 14h2" />
    <path d="M6.17 15a3 3 0 0 1 5.66 0" />
    <circle cx="9" cy="11" r="2" />
    <rect x="2" y="5" width="20" height="14" rx="2" />
  </>,
);

/** `image-up` — the "Qiymət cədvəlini yüklə" dropzone. */
export const ImageUp = glyph(
  'ImageUp',
  <>
    <path d="M10.3 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v9" />
    <path d="m21 15-3.1-3.1a2 2 0 0 0-2.814.014L6 21" />
    <path d="m14 19 3-3 3 3" />
    <path d="M17 22v-5.5" />
    <circle cx="9" cy="9" r="2" />
  </>,
);

/** `book-open` — the class-list item thumbnails. */
export const BookOpen = glyph(
  'BookOpen',
  <>
    <path d="M12 7v14" />
    <path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z" />
  </>,
);

/** `cookie` — the "Qəlyanaltılar" night-discount category. */
export const Cookie = glyph(
  'Cookie',
  <>
    <path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5" />
    <path d="M8.5 8.5v.01" />
    <path d="M16 15.5v.01" />
    <path d="M12 12v.01" />
    <path d="M11 17v.01" />
    <path d="M7 14v.01" />
  </>,
);

/** `unlink` — "Kartı ayır". */
export const Unlink = glyph(
  'Unlink',
  <>
    <path d="m18.84 12.25 1.72-1.71h-.02a5.004 5.004 0 0 0-.12-7.07 5.006 5.006 0 0 0-6.95 0l-1.72 1.71" />
    <path d="m5.17 11.75-1.71 1.71a5.004 5.004 0 0 0 .12 7.07 5.006 5.006 0 0 0 6.95 0l1.71-1.71" />
    <path d="m2 2 20 20" />
  </>,
);
