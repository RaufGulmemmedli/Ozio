/*
 * Blocking theme resolver (architecture/06-i18n-theming.md).
 *
 * Loaded from <head> WITHOUT async/defer, so it runs before first paint and
 * there is no light-then-dark flash.
 *
 * It lives in /public rather than inline in the layout because React 19 refuses
 * to execute an inline <script> during a client render and warns about it on
 * every client navigation ("Encountered a script tag while rendering React
 * component"). A script with a `src` has no such problem.
 *
 * It reads only its own cookie and matches it against a hard-coded
 * light|dark|system alternation, so nothing from the cookie can reach the DOM
 * other than one of those three literals.
 */
(function () {
  try {
    var m = document.cookie.match(/ozio_theme=(light|dark|system)/);
    var pref = m ? m[1] : 'system';
    var dark = pref === 'dark' || (pref === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
    var r = document.documentElement;
    r.dataset.theme = dark ? 'dark' : 'light';
    r.dataset.themePref = pref;
    r.style.colorScheme = dark ? 'dark' : 'light';
  } catch (e) {
    /* A missing cookie or a blocked matchMedia must never break the page: the
       CSS in globals.css already resolves prefers-color-scheme on its own. */
  }
})();
