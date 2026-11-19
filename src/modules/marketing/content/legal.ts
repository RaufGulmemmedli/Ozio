/**
 * `/terms` + `/privacy` — the static fallback document.
 *
 * `GET v1/privacy-policies` (`ProfilePrivacyPolicies`, `auth: none`, `live: verified`)
 * is the real source and is fetched server-side with ISR 86400. It returns ONE
 * HTML blob per locale, not a split terms/privacy pair, so when it answers the
 * page renders that blob as sanitized prose; when it fails (or returns nothing for
 * the active locale) these section lists are rendered instead, which is also what
 * the design export `ogihP` draws.
 *
 * The export is a single "Şərtlər və Məxfilik" page with 8 numbered sections;
 * 02-routing.md splits it into two indexable routes, so the sections are split
 * along their own subject matter.
 */

export interface LegalSection {
  /** `legal.sections.<id>.title` / `.p1` / `.p2` / `.note` */
  id: string;
  /** `#section-<n>` anchor target. */
  anchor: string;
  paragraphs: readonly ('p1' | 'p2')[];
  note?: boolean;
}

const section = (id: string, index: number, note = false): LegalSection => ({
  id,
  anchor: `section-${index + 1}`,
  paragraphs: ['p1', 'p2'],
  note,
});

/** `/terms`: 1 Ümumi müddəalar · 2 Hesab · 3 Sifariş · 4 Keşbek · 5 Əlaqə. */
export const termsSections: LegalSection[] = [
  section('general', 0),
  section('account', 1),
  section('orders', 2),
  section('bonus', 3, true),
  section('contact', 4),
];

/** `/privacy`: 1 Toplanma · 2 Qorunma · 3 Kukilər · 4 Əlaqə. */
export const privacySections: LegalSection[] = [
  section('collect', 0),
  section('protect', 1),
  section('cookies', 2),
  section('contact', 3),
];
