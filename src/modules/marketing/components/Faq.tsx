/**
 * FAQ — node `e52M7m` (layout.md §3: two columns at gap 80, a 380-wide title
 * beside a 740-wide accordion; item padding 24/0 with a 1 px `line` bottom rule).
 *
 * The accordion itself is `<Accordion>` from `@/shared/ui` (Radix), which gives
 * the `button[aria-expanded]` + `aria-controls` pairing, one-open-at-a-time and
 * the animated height the screen spec asks for. `defaultValue` opens the first
 * item, as the canvas draws it.
 *
 * This is the only client island on the landing page besides the header, and it
 * is also the section the `FAQPage` JSON-LD is built from (`/`, `/cashback`,
 * `/ten`), so the questions and answers are passed in as plain strings.
 */
import { cn } from '@/core/lib/cn';
import { Container } from '@/shared/layout/container';
import { Section } from '@/shared/layout/section';
import { Accordion } from '@/shared/ui/accordion';

import { brandText, typeEyebrow, typeFaqTitle } from './type';

export interface FaqEntry {
  id: string;
  question: string;
  answer: string;
}

export interface FaqProps {
  eyebrow: string;
  title: string;
  items: FaqEntry[];
  /** `#faq` — the footer and nav both link to it. */
  anchor?: string;
  className?: string;
}

export function Faq({ eyebrow, title, items, anchor = 'faq', className }: FaqProps) {
  const headingId = `${anchor}-title`;

  return (
    <Section id={anchor} contained={false} aria-labelledby={headingId} className={className}>
      <Container>
        <div className="flex flex-col gap-8 min-[1200px]:flex-row min-[1200px]:gap-20">
          <div className="flex flex-col gap-3 md:gap-4 min-[1200px]:w-[380px] min-[1200px]:shrink-0">
            <p className={cn('m-0', brandText, typeEyebrow)}>{eyebrow}</p>
            <h2 id={headingId} className={cn('m-0 text-ink', typeFaqTitle)}>
              {title}
            </h2>
          </div>

          <Accordion
            className="min-w-0 flex-1 border-t border-line"
            type="single"
            defaultValue={items[0]?.id}
            items={items.map((item) => ({
              value: item.id,
              question: item.question,
              answer: item.answer,
            }))}
          />
        </div>
      </Container>
    </Section>
  );
}
