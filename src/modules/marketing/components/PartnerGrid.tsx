/**
 * Partner cards — node `jxh78` (`screens/landing.md` §`/partnyorlar`).
 *
 * Each card: a letter logo tile (the design draws an initial, not a wordmark —
 * no partner artwork ships), a `brand-soft` "N% keşbek" tag, the name 18/700 and
 * a "Kateqoriya · N filial" meta line. Four across at 1200, two at 768, one below.
 *
 * **Static on purpose.** `GET v1/ozio-partners` (`PartnersPartners`) is
 * `auth: bearer`, so a logged-out marketing page cannot call it without firing an
 * authenticated request — which is exactly what the brief forbids. The twelve
 * examples come from the design export; the live, searchable directory lives in
 * the app at `/market/partners`, which the section's CTA links to.
 *
 * The search input and the category chips of the export are therefore rendered
 * as a link into that directory rather than as a client-side filter over twelve
 * hardcoded rows, which would have been a prop for a feature that does not work.
 */
import { cn } from '@/core/lib/cn';
import { Link } from '@/core/i18n/navigation';

import { brandText } from './type';

export interface PartnerEntry {
  id: string;
  name: string;
  initial: string;
  /** "1,5% keşbek" */
  cashback: string;
  /** "Market · 14 filial" */
  meta: string;
}

export interface PartnerGridProps {
  partners: PartnerEntry[];
  /** Destination of the whole-directory link, i.e. the in-app partner list. */
  href: string;
  linkLabel: string;
  className?: string;
}

export function PartnerGrid({ partners, href, linkLabel, className }: PartnerGridProps) {
  return (
    <div className={cn('flex flex-col gap-6', className)}>
      <ul className="m-0 grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 min-[1200px]:grid-cols-4 min-[1200px]:gap-5">
        {partners.map((partner) => (
          <li
            key={partner.id}
            className="flex flex-col items-start gap-4 rounded-xl bg-surface p-5"
          >
            <div className="flex w-full items-start justify-between gap-3">
              <span
                aria-hidden
                className="grid size-12 shrink-0 place-items-center rounded-[16px] bg-surface2 text-h4 font-extrabold text-ink"
              >
                {partner.initial}
              </span>
              <span
                className={cn(
                  'inline-flex h-7 items-center rounded-pill bg-brand-soft px-3 text-caption font-bold',
                  brandText,
                )}
              >
                {partner.cashback}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="m-0 text-[18px] font-bold text-ink">{partner.name}</h3>
              <p className="m-0 text-caption text-ink2">{partner.meta}</p>
            </div>
          </li>
        ))}
      </ul>

      <Link
        href={href}
        prefetch={false}
        className="inline-flex h-12 w-fit items-center rounded-pill border-[1.5px] border-ink px-6 text-body font-semibold text-ink transition-colors duration-[var(--oz-dur-fast)] hover:bg-ink/8"
      >
        {linkLabel}
      </Link>
    </div>
  );
}
