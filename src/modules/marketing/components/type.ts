/**
 * The responsive type ladder from `design-system/typography.md` §1 "Responsive
 * type", expressed once so every section reads the same.
 *
 * Tiers match the layout-token breakpoints in `globals.css`:
 *   base  < 768   (mobile frame `cZWDS`, `--oz-page-x: 20px`)
 *   md   ≥ 768    (tablet frame `RfOSA`, `--oz-page-x: 32px`)
 *   1200 ≥ 1200   (desktop frame `M0HxE`, `--oz-page-x: 120px`, container 1200)
 *
 * Letter-spacing is converted from the canvas's px to em (`px / size`), per the
 * typography doc's instruction.
 *
 * NOTE — no CSS module here, on purpose. `next.config.ts` routes **every** `.css`
 * file through `@tailwindcss/turbopack` (`turbopack.rules["*.css"]`), which also
 * swallows `*.module.css`: the scoped-class mapping is lost and the default
 * export comes back empty, so `styles.x` silently renders as no class at all.
 * (The same config is why `src/modules/senior/senior.module.css` logs
 * "':global' is not recognized" during the build.) Everything below is therefore
 * plain utilities.
 * TODO(core): fix the turbopack rule to exclude `*.module.css`, then the shared
 * `ui.module.css` and per-module CSS files start working again.
 */

/** Landing hero H1 — 68/1.05/-2 → 56/1.05/-1.5 → 42/1.08/-1.5. */
export const typeHero =
  'text-[42px] font-extrabold leading-[1.08] tracking-[-0.036em] ' +
  'md:text-[56px] md:leading-[1.05] md:tracking-[-0.027em] ' +
  'min-[1200px]:text-hero';

/** Landing section title — 48/1.1/-1.5 → 40/1.1/-1 → 30/1.15/-1. */
export const typeSectionTitle =
  'text-[30px] font-extrabold leading-[1.15] tracking-[-0.033em] ' +
  'md:text-[40px] md:leading-[1.1] md:tracking-[-0.025em] ' +
  'min-[1200px]:text-h1';

/** FAQ title — the one 44/800/-1.5 heading on the canvas (`e52M7m`). */
export const typeFaqTitle =
  'text-[30px] font-extrabold leading-[1.15] tracking-[-0.033em] ' +
  'md:text-[40px] md:leading-[1.1] md:tracking-[-0.025em] ' +
  'min-[1200px]:text-[44px] min-[1200px]:leading-[48px] min-[1200px]:tracking-[-0.034em]';

/** Ten + Download panel headline — 52/1.08/-1.5 → 40/1.1/-1 → 30/1.1. */
export const typePanelTitle =
  'text-[30px] font-extrabold leading-[1.1] tracking-[-0.033em] ' +
  'md:text-[40px] md:leading-[1.1] md:tracking-[-0.025em] ' +
  'min-[1200px]:text-hero-lg';

/** Bento card title — 32/800/1.15/-0.5, ~20–22/800 on mobile. */
export const typeBentoTitle =
  'text-[22px] font-extrabold leading-[1.15] tracking-[-0.023em] ' +
  'md:text-h2 md:leading-[1.15] md:tracking-[-0.015em]';

/** Step number — 56/800/-2 → 48/800/-1. */
export const typeStepNumber =
  'text-[40px] font-extrabold leading-none tracking-[-0.03em] ' +
  'md:text-[48px] md:tracking-[-0.021em] ' +
  'min-[1200px]:text-[56px] min-[1200px]:tracking-[-0.036em]';

/** Landing stat number — 48/800/-1 at 768 and up; the mobile tiles are smaller. */
export const typeStatValue =
  'text-[26px] font-extrabold leading-none tracking-[-0.027em] ' +
  'md:text-h1 md:leading-none md:tracking-[-0.021em]';

/** Hero lead paragraph — 19/1.5 → 17/26 → 16/1.5. */
export const typeLead =
  'text-body leading-[1.5] md:text-[17px] md:leading-[26px] min-[1200px]:text-body-l min-[1200px]:leading-[29px]';

/** Section kicker — the `.eyebrow` utility is brand-coloured; these recolour it. */
export const typeEyebrow = 'text-label font-bold uppercase tracking-[0.143em]';

/** Card kicker inside a bento tile — 13/700/+1.5. */
export const typeCardKicker = 'text-caption font-bold uppercase tracking-[0.115em]';

/**
 * Brand pink for SMALL text — kickers, tags, inline links.
 *
 * `--oz-brand` (#EE3768) on `bg` is ~3.45:1: fine for fills, icons and large
 * display type, below the 4.5:1 AA floor for the 13–16 px text the design paints
 * brand pink. `--oz-brand-dark` (#C81F4F) clears it at 5.6:1 in light; in dark
 * the lighter `--oz-brand` (#FF4D7D) clears it at 6.1:1 while brand-dark would
 * not — hence the pair. `dark:` is the `[data-theme="dark"]` variant declared in
 * globals.css, and `ThemeScript` writes that attribute before first paint.
 *
 * Large brand type (step numbers, campaign figures, rate cells) keeps `text-brand`.
 */
export const brandText = 'text-brand-dark dark:text-brand';

/**
 * Prose block for the ONE HTML string this site renders from the API
 * (`GET v1/privacy-policies`, sanitized in `lib/sanitize-html.ts`).
 *
 * Child selectors as arbitrary variants rather than a stylesheet, for the CSS
 * module reason in this file's header. Tokens only, so it follows the theme.
 */
export const proseClass = [
  'text-body leading-[26px] text-ink2',
  '[&>*:first-child]:mt-0',
  '[&_p]:m-0 [&_p]:mb-4',
  '[&_h2]:mb-4 [&_h2]:mt-10 [&_h2]:text-h3 [&_h2]:font-extrabold [&_h2]:tracking-[-0.01em] [&_h2]:text-ink',
  '[&_h3]:mb-4 [&_h3]:mt-10 [&_h3]:text-h4 [&_h3]:font-extrabold [&_h3]:text-ink',
  '[&_h4]:mb-3 [&_h4]:mt-8 [&_h4]:text-[18px] [&_h4]:font-bold [&_h4]:text-ink',
  '[&_ul]:m-0 [&_ul]:mb-4 [&_ul]:list-disc [&_ul]:ps-6',
  '[&_ol]:m-0 [&_ol]:mb-4 [&_ol]:list-decimal [&_ol]:ps-6',
  '[&_li]:mb-2',
  '[&_strong]:font-semibold [&_strong]:text-ink [&_b]:font-semibold [&_b]:text-ink',
  '[&_a]:text-brand-dark [&_a]:underline [&_a]:underline-offset-2 dark:[&_a]:text-brand',
  '[&_blockquote]:m-0 [&_blockquote]:mb-4 [&_blockquote]:border-s-2 [&_blockquote]:border-line [&_blockquote]:ps-5',
  '[&_hr]:my-8 [&_hr]:border-0 [&_hr]:border-t [&_hr]:border-line',
  '[&_table]:mb-4 [&_table]:w-full [&_table]:border-collapse',
  '[&_th]:border-b [&_th]:border-line [&_th]:px-2 [&_th]:py-3 [&_th]:text-start [&_th]:text-caption [&_th]:font-bold [&_th]:uppercase [&_th]:tracking-[0.08em] [&_th]:text-ink',
  '[&_td]:border-b [&_td]:border-line [&_td]:px-2 [&_td]:py-3 [&_td]:text-start',
].join(' ');

/**
 * The hero's floating chips (components.md §11: "gentle float animation 6 s
 * ease-in-out ±6 px, disabled for reduced motion"). The keyframe itself is
 * emitted once by `<FloatKeyframes>` in `HeroVisual.tsx`; `motion-reduce` turns
 * it off, and globals.css neutralises it a second time.
 */
export const floatClass =
  'animate-[oz-mk-float_6s_ease-in-out_infinite] motion-reduce:animate-none will-change-transform';

/** Horizontal rail with no visible scrollbar (mobile product row). */
export const railClass = '[scrollbar-width:none] [&::-webkit-scrollbar]:hidden';
