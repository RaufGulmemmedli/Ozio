/**
 * The analytics event catalogue (10-env-and-tooling.md).
 *
 * Provider-agnostic on purpose: the provider (Amplitude / GA4 / Plausible / first-party) is still
 * TBD, so screens only ever speak this vocabulary.
 *
 * **No PII.** No phone number, name, email or address ever goes into a payload; a user id is hashed
 * (`hashUserId` in ./track). `track()` strips PII-looking keys at runtime as a second line of
 * defence, but the payload type is the real contract.
 *
 * `EventMap` is an interface so a module that needs an event of its own can add it without editing
 * this file:
 *
 * ```ts
 * declare module '@/core/analytics/events' {
 *   interface EventMap { parcel_quoted: { price: number; distance_km: number } }
 * }
 * ```
 */
export interface EventMap {
  screen_view: { path: string; screen: string; locale: string };

  // auth
  login_started: Record<string, never>;
  otp_verified: { is_new: boolean };
  guest_continue: Record<string, never>;

  // catalog / cart
  product_view: { id: number; store_id: number };
  add_to_cart: { id: number; qty: number; source: string };
  search_performed: { query_length: number; results: number; source: string };

  // checkout
  checkout_started: { items: number };
  order_placed: { order_id: number; total: number };
  coupon_applied: { id: string };

  // preferences
  language_changed: { from: string; to: string };
  theme_changed: { to: string };

  // mock modules
  demo_feature_opened: { module: string };

  // health
  error_shown: { kind: string; screen: string; status?: number };
  web_vital: { name: string; value: number; rating: string };
}

export type EventName = keyof EventMap;

/** Payload keys that must never be sent, whatever a caller passes. */
export const PII_KEYS: readonly string[] = [
  'phone',
  'phone_number',
  'phoneNumber',
  'msisdn',
  'name',
  'full_name',
  'fullName',
  'first_name',
  'last_name',
  'person_name',
  'email',
  'e_mail',
  'address',
  'address_line',
  'lat',
  'lng',
  'latitude',
  'longitude',
  'card_number',
  'cardNumber',
  'pan',
  'otp',
  'code',
  'token',
  'password',
];
