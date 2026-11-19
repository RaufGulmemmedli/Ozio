/**
 * `/terms` + `/privacy` body — node `BhTgY` (`screens/landing.md` §`/shertler`):
 * a sticky "MÜNDƏRİCAT" column beside the long-form article, collapsing to a
 * block above the text below 1024.
 *
 * Two sources, one layout:
 *  · `html` — the sanitized blob from `GET v1/privacy-policies`, rendered in the
 *    token-styled `proseClass` utilities from `type.ts`. It is sanitized in
 *    `lib/sanitize-html.ts` before it ever reaches here, which is the only
 *    reason `dangerouslySetInnerHTML` appears in this module.
 *  · `sections` — the static fallback from `content/legal.ts`, which also feeds
 *    the table of contents in both cases (the API blob has no section ids, so
 *    the TOC is only rendered for the static document).
 *
 * The TOC is plain anchor links: `scroll-behavior` and scroll-spy would both
 * need a client island, and `#section-n` jumps work without one.
 */
import { cn } from '@/core/lib/cn';
import { InlineNotice } from '@/shared/states/inline-notice';

import type { LegalSection } from '../content/legal';
import { brandText, proseClass, typeEyebrow } from './type';

export interface LegalSectionCopy {
  section: LegalSection;
  title: string;
  paragraphs: string[];
  note?: string;
}

export interface LegalDocProps {
  tocLabel: string;
  tocHeading: string;
  sections: LegalSectionCopy[];
  /** Sanitized HTML from the API; when present it replaces the static body. */
  html?: string | null;
  /** Shown when the API answer could not be loaded. */
  offlineNotice?: string;
  className?: string;
}

export function LegalDoc({
  tocLabel,
  tocHeading,
  sections,
  html,
  offlineNotice,
  className,
}: LegalDocProps) {
  const showToc = !html && sections.length > 0;

  return (
    <div
      className={cn(
        'flex flex-col gap-10 min-[1200px]:flex-row min-[1200px]:gap-20',
        className,
      )}
    >
      {showToc ? (
        <nav
          aria-label={tocLabel}
          className="min-[1200px]:sticky min-[1200px]:top-[104px] min-[1200px]:h-fit min-[1200px]:w-[280px] min-[1200px]:shrink-0"
        >
          <p className={cn('m-0 mb-4', brandText, typeEyebrow)}>
            {tocHeading}
          </p>
          <ol className="m-0 flex list-none flex-col gap-0.5 p-0">
            {sections.map((entry, index) => (
              <li key={entry.section.anchor}>
                <a
                  href={`#${entry.section.anchor}`}
                  className="flex gap-2.5 rounded-md px-2 py-2 text-body-sm text-ink2 transition-colors duration-[var(--oz-dur-fast)] hover:bg-surface2 hover:text-ink"
                >
                  <span className="tabular-nums text-ink3">{index + 1}.</span>
                  {entry.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>
      ) : null}

      <div className="min-w-0 flex-1">
        {offlineNotice ? (
          <InlineNotice tone="note" multiline body={offlineNotice} className="mb-8" />
        ) : null}

        {html ? (
          // Sanitized by `lib/sanitize-html.ts`: allow-listed tags only, every
          // attribute dropped except a vetted `href`. Never the raw API string.
          <div className={proseClass} dangerouslySetInnerHTML={{ __html: html }} />
        ) : (
          <div className="flex flex-col gap-12">
            {sections.map((entry, index) => (
              <section
                key={entry.section.anchor}
                id={entry.section.anchor}
                className="scroll-mt-[104px]"
              >
                <h2 className="m-0 mb-4 text-h3 font-extrabold tracking-[-0.02em] text-ink md:text-h2">
                  {index + 1}. {entry.title}
                </h2>
                <div className={proseClass}>
                  {entry.paragraphs.map((paragraph, i) => (
                    <p key={i}>{paragraph}</p>
                  ))}
                </div>
                {entry.note ? (
                  <p className="m-0 mt-5 rounded-lg bg-surface2 p-5 text-body-sm leading-6 text-ink2">
                    {entry.note}
                  </p>
                ) : null}
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
