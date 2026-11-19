/**
 * Blocking theme script (architecture/06-i18n-theming.md).
 *
 * Puts the resolved theme on <html> BEFORE first paint, so there is no
 * light-then-dark flash on a cold load.
 *
 * The script body lives in `public/theme.js` and is pulled in here by `src`,
 * rather than inlined with `dangerouslySetInnerHTML`. React 19 never executes an
 * inline script during a client render and says so on every client navigation:
 *
 *   "Encountered a script tag while rendering React component. Scripts inside
 *    React components are never executed when rendering on the client."
 *
 * `next/script` with `strategy="beforeInteractive"` does put the script in the
 * initial <head>, but it does not stop that warning and trips
 * `@next/next/no-before-interactive-script-outside-document` as well — so a
 * plain `src` is the quieter answer. No `async`/`defer`: the point is that it
 * blocks, which is what keeps the first paint flash-free.
 *
 * Reading the cookie on the server instead would be simpler still, but
 * `cookies()` in the root layout would de-opt every statically generated
 * marketing page, which is a far worse trade than one tiny cached request.
 */

/** Cookie that carries the preference across requests (mirrored by ThemeProvider). */
export const THEME_COOKIE = "ozio_theme";

export function ThemeScript() {
  /*
   * Blocking is the point. `@next/next/no-sync-scripts` guards against third-party scripts
   * delaying paint; this one is a few hundred bytes, same-origin and cached, and it has to run
   * BEFORE the first paint or the theme flash it exists to prevent comes straight back.
   * `async`/`defer` would break it.
   */
  // eslint-disable-next-line @next/next/no-sync-scripts
  return <script src="/theme.js" />;
}
