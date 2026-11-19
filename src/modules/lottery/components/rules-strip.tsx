/**
 * The numbered "Qaydalar" strip from `app-ozio-10-lar.html` (`Rules`).
 *
 * Measured: `surface2`, radius 36, padding 32, row gap 32; the title column 140 wide at
 * 24/700; each rule a flex-1 row at gap 14 with a 36px `yellow` disc (number 16/800
 * `on-yellow`) over a 16/700 title and a 14/400 `ink2` body. Stacks below `md`.
 *
 * Static editorial copy, so it takes already-translated strings from the calling screen.
 */
import { cn } from '@/core/lib/cn';

export interface RuleItem {
  title: string;
  body: string;
}

export interface RulesStripProps {
  heading: string;
  items: readonly RuleItem[];
  /** Heading element, so the page's heading order stays valid. */
  headingAs?: 'h2' | 'h3';
  className?: string;
}

export function RulesStrip({ heading, items, headingAs: Heading = 'h2', className }: RulesStripProps) {
  return (
    <section
      className={cn(
        'flex w-full flex-col items-start gap-8 rounded-bento bg-surface2 p-8 md:flex-row md:items-center',
        className,
      )}
    >
      <Heading className="text-h3 font-bold text-ink md:w-[140px] md:shrink-0">{heading}</Heading>

      <ol className="flex w-full list-none flex-col gap-8 p-0 md:flex-row">
        {items.map((item, index) => (
          <li key={item.title} className="flex min-w-0 flex-1 flex-row items-start gap-[14px]">
            <span
              aria-hidden="true"
              className="grid size-9 shrink-0 place-items-center rounded-pill bg-yellow text-body font-extrabold text-on-yellow"
            >
              {index + 1}
            </span>
            <span className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="text-body font-bold text-ink">{item.title}</span>
              <span className="text-label text-ink2">{item.body}</span>
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
