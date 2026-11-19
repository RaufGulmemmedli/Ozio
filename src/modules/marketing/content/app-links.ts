/**
 * Store + smart-link URLs for the download blocks.
 *
 * `screens/landing.md` §Global rules: "Download CTA band -> App Store / Google Play
 * store URLs (config, not in design)". They are therefore env-overridable and fall
 * back to the public store search pages for the published bundle ids, never to a
 * made-up listing.
 *
 * The QR code in the download panel encodes `smartLink` and is generated at render
 * time by `<QrCodeView>` — no image ships.
 */

const env = (name: string, fallback: string): string => {
  const value = process.env[name];
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : fallback;
};

export const appLinks = {
  appStore: env('NEXT_PUBLIC_APP_STORE_URL', 'https://apps.apple.com/az/app/ozio/id6448153425'),
  googlePlay: env(
    'NEXT_PUBLIC_GOOGLE_PLAY_URL',
    'https://play.google.com/store/apps/details?id=az.ozio.app',
  ),
  /** One link that redirects to the right store; what the QR encodes. */
  smartLink: env('NEXT_PUBLIC_APP_SMART_LINK', 'https://ozio10.az/app'),
  /** Opens the office location in the viewer's maps app (contact page). */
  officeMap: env(
    'NEXT_PUBLIC_OFFICE_MAP_URL',
    'https://www.openstreetmap.org/?mlat=40.3797&mlon=49.8486#map=17/40.3797/49.8486',
  ),
  phone: 'tel:+994120000000',
  email: 'mailto:info@ozio10.az',
} as const;
