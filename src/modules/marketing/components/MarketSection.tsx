/**
 * Market teaser — node `YEPSp` (layout.md §3: padding 120/120/0/120, gap 40,
 * header + chips + four product cards at gap 20).
 *
 * The chips are links into the app catalogue, not client-side filters: this page
 * is static and the catalogue lives behind `/market`. The export draws their
 * labels as the placeholder "Kateqoriya"; the node names carry the real ones
 * (Meyvə-tərəvəz, Süd məhsulları, Çörək, İçkilər), which is what ships.
 *
 * Mobile (`xMgTJ`): the row becomes a horizontal, full-bleed rail of 240-wide
 * cards (layout.md §3 "product rail horizontal scroll (cards 240 wide)").
 */
import type { ReactNode } from 'react';

import { cn } from '@/core/lib/cn';
import { Link } from '@/core/i18n/navigation';
import { Container } from '@/shared/layout/container';
import { Section } from '@/shared/layout/section';

import { SectionHeader } from './SectionHeader';
import { railClass } from './type';

export interface MarketChip {
  id: string;
  label: string;
  href: string;
  active?: boolean;
}

export interface MarketSectionProps {
  eyebrow: string;
  title: string;
  chips: MarketChip[];
  /** `<ProductCard>` list. */
  children: ReactNode;
  /** `aria-labelledby` target. */
  id: string;
  className?: string;
}

export function MarketSection({
  eyebrow,
  title,
  chips,
  children,
  id,
  className,
}: MarketSectionProps) {
  return (
    <Section gap={40} contained={false} aria-labelledby={id} className={className}>
      <Container>
        <SectionHeader
          id={id}
          eyebrow={eyebrow}
          title={title}
          aside={
            <ul className="m-0 flex list-none flex-wrap items-center gap-2.5 p-0">
              {chips.map((chip) => (
                <li key={chip.id}>
                  <Link
                    href={chip.href}
                    prefetch={false}
                    className={cn(
                      'inline-flex h-10 items-center rounded-pill px-[18px] text-label',
                      'transition-colors duration-[var(--oz-dur-fast)]',
                      chip.active
                        ? 'bg-cta font-semibold text-on-cta'
                        : 'border border-line bg-surface font-medium text-ink hover:border-ink',
                    )}
                  >
                    {chip.label}
                  </Link>
                </li>
              ))}
            </ul>
          }
        />
      </Container>

      {/* full-bleed rail below 768, grid from 768 up */}
      <Container>
        <div
          className={cn(
            '-mx-[var(--oz-page-x)] flex snap-x snap-mandatory gap-3 overflow-x-auto px-[var(--oz-page-x)] pb-1',
            railClass,
            'md:mx-0 md:grid md:grid-cols-2 md:gap-4 md:overflow-visible md:px-0 md:pb-0',
            'min-[1200px]:grid-cols-4 min-[1200px]:gap-5',
            '[&>*]:w-60 [&>*]:shrink-0 [&>*]:snap-start md:[&>*]:w-auto md:[&>*]:shrink',
          )}
        >
          {children}
        </div>
      </Container>
    </Section>
  );
}
