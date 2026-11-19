/**
 * The copy-only page header used by `/contact` (`wI9NJ`) and `/terms` /
 * `/privacy` (`e1OBEw`): a `surface2` tag pill, the page `h1` and one lead line.
 *
 * Padding follows the hero's (40 top on desktop, 16 on mobile) and the section
 * rhythm takes over below it.
 */
import { cn } from '@/core/lib/cn';
import { Container } from '@/shared/layout/container';

import { typeSectionTitle } from './type';

export interface PageIntroProps {
  /** `surface2` pill above the title — "Dəstək", "Son yenilənmə: …". */
  tag?: string;
  title: string;
  lead?: string;
  className?: string;
}

export function PageIntro({ tag, title, lead, className }: PageIntroProps) {
  return (
    <section className={cn('w-full pt-6 md:pt-12', className)}>
      <Container>
        <div className="flex max-w-[720px] flex-col items-start gap-4 md:gap-5">
          {tag ? (
            <span className="inline-flex h-9 items-center rounded-pill bg-surface2 px-4 text-label font-semibold text-ink2">
              {tag}
            </span>
          ) : null}
          <h1 className={cn('m-0 text-ink', typeSectionTitle)}>{title}</h1>
          {lead ? (
            <p className="m-0 text-body leading-[26px] text-ink2 md:text-[17px]">{lead}</p>
          ) : null}
        </div>
      </Container>
    </section>
  );
}
