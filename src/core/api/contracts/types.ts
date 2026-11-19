/* Ozio customer API types - GENERATED from ozio-api.swagger.yaml (live-verified 2026-11-11/12), then hand-augmented.
 *
 * Rules the web client must follow (taken from the Flutter hand-written `fromJson` parsers in lib/modules/<module>/data):
 *  - Every response field is optional: the API is reverse-engineered and loosely typed. Never assume presence.
 *  - Decimals (price, mrp, stock, percentage, lat, lng, quantity) arrive as STRINGS ("2.59"); some endpoints send
 *    numbers. Type: `Decimal`. Parse with `toNumber()` (comma-tolerant) from api-client.ts.
 *  - Lists may arrive as null/undefined: use `asArray()`.
 *  - Envelope: success => {success:true,message,data,statusCode,is_cache,cache_ttl}; error => {success:false,message,statusCode} (NO data, except 422).
 *  - `x-live` status of each operation is in endpoints.ts (`live`) and in the module docs.
 */

export type Decimal = string | number;
export type ISODateTime = string;

export interface Envelope<T> {
  success: boolean;
  message?: string;
  data: T;
  statusCode?: number;
  is_cache?: boolean;
  cache_ttl?: number;
}
export interface ValidationIssue { path: string | (string | number)[]; message: string }
export interface ErrorEnvelope {
  success: false;
  message: string;           // English text: "Bad request", "Unauthorized access", "Validation failed", "Order not found"...
  statusCode: number;
  is_cache?: boolean;
  cache_ttl?: number;
  data?: ValidationIssue[];  // ONLY on 422
}

// ---------------------------------------------------------------------------
// Component schemas (swagger components.schemas). Names ending Live* were written from live JSON; others are APK-recovered guesses.
// ---------------------------------------------------------------------------

/** Response to POST /auth/login. Triggers OTP send; data carries registration state. */
export interface LoginResponse {
  success?: boolean;
  message?: string;
  data?: LoginData;
}

/** Response to POST /auth/otp_verify. */
export interface VerifyOtpResponse {
  success?: boolean;
  message?: string;
  data?: LoginData;
}

/** Response to POST /auth/complete_registration. */
export interface RegisterResponse {
  success?: boolean;
  message?: string;
  data?: LoginData;
}

/** Auth/session bundle returned after OTP verification or registration. Field list recovered from the APK, not captured from a live response. Note there is NO `refresh_token` here: where a refresh token would come from (and whether /auth/refresh works) is unknown. */
export interface LoginData {
  access_token?: string;
  token_type?: string;
  expires_at?: string;
  is_registered?: boolean; // Whether the phone number already has a completed account (false => client must complete_registration).
  is_logged_in?: boolean;
  device_token?: string; // Device push/registration token sent on auth.
}

/** Response of GET /profile/me (verified). Replaces the old APK guess (user_id, person_name, display_name, phone_number, email, image_url, total_bonus …), none of which exist on live. */
export type ProfileResponse = Envelope<unknown> & {
  data?: LiveProfile;
};

/** UNVERIFIED guess for the PUT /profile/me body (APK key names; never sent to the live API). It uses names the live GET does not return (`person_name`, `display_name`, `phone_number`, `email`, `image_url`); the GET has `name` and `phone`. Which keys the server accepts is unknown. */
export interface ProfileUpdate {
  person_name?: string;
  display_name?: string;
  email?: string;
  gender?: string;
  birth_date?: string;
  phone_number?: string;
  image_url?: string;
}

/** UNVERIFIED guess for the POST / PUT /profile/address request body (APK key names; never sent to the live API). This is NOT the shape the API returns — read rows are `LiveAddress` (`type`, `phone`, `lat`, `lng`, …). Whether writes take these keys (`address_line`, `phone_number`, `latitude`, `longitud */
export interface Address {
  address_id?: number;
  address_line?: string;
  address_type?: string; // Home type — e.g. hotel_apartment / office / other.
  person_name?: string;
  phone_number?: string;
  building_name?: string;
  apartment_room?: string;
  entrance_number?: string;
  floor?: string;
  block_type?: string;
  hotel_apartment?: string; // Hotel/apartment designation (home_type variant).
  actual_address?: string; // Physical/actual address text.
  legal_address?: string;
  address_details?: string;
  delivery_address?: string;
  city_id?: number;
  city_translations?: (Record<string, unknown>)[];
  zone_id?: number;
  latitude?: number;
  longitude?: number;
  in_zone?: boolean;
  out_of_zone?: boolean;
  is_selected?: boolean;
  is_added_address?: boolean;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string;
}

export interface ActiveCampaign {
  title?: string;
  description?: string;
  image?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
  start_at?: string;
  end_at?: string;
  store_bonus_percentages?: (Record<string, unknown>)[];
  bonus_percentage?: number;
}

/** STALE APK guess — contradicts live. GET /lotteries/active returns `{ticketsCount, activeLottery: {id, name, uploads, lotteries_uploads}}` with no title, dates, status or prizes; see that operation. @deprecated */
export interface ActiveLottery {
  title?: string;
  subtitle?: string;
  description?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
  lotteries_uploads?: (Record<string, unknown>)[];
  lottery_prizes?: LotteryPrize[];
}

/** STALE APK guess — contradicts live. GET /lotteries/active returns `{ticketsCount, activeLottery: {id, name, uploads, lotteries_uploads}}` with no title, dates, status or prizes; see that operation. @deprecated */
export interface ActiveLotteryData {
  data?: ActiveLottery;
}

/** UNVERIFIED APK guess. The endpoint that would return it answers 500 on live, so no field here has ever been observed. */
export interface ActiveLotteryDetailsData {
  data?: LotteryDetails;
}

/** UNVERIFIED APK guess. The endpoint that would return it answers 500 on live, so no field here has ever been observed. */
export interface ActiveLotteryDetailsResponse {
  data?: ActiveLotteryDetailsData;
  message?: string;
  status_code?: number;
}

/** STALE APK guess — contradicts live. GET /lotteries/active returns `{ticketsCount, activeLottery: {id, name, uploads, lotteries_uploads}}` with no title, dates, status or prizes; see that operation. @deprecated */
export interface ActiveLotteryResponse {
  data?: ActiveLotteryData;
  message?: string;
  status_code?: number;
}

/** UNVERIFIED APK guess. The endpoint that would return it answers 500 on live, so no field here has ever been observed. */
export interface ApiLotteryTicket {
  code?: string;
  number?: string;
  status?: string;
  date?: string;
  created_at?: string;
}

export interface AppliedOffer {
  offer_id?: number;
  discount_type?: string;
  discount_value?: number;
  discount_percentage?: number;
  total_discount?: number;
}

export interface AppliedPromoCode {
  promo_id?: number;
  code?: string;
  discount_type?: string;
  discount_value?: number;
  discount_percentage?: number;
  total_discount?: number;
}

export interface ApplyPromoCodeResponse {
  applied_promo?: AppliedPromoCode;
  applied_offer?: AppliedOffer;
  total_discount?: number;
  total_amount?: number;
  payable_amount?: number;
  message?: string;
  status_code?: number;
}

export interface BannersOfStore {
  store_id?: number;
  image_url?: string;
  redirect_url?: string;
  custom_url?: string;
  show_on_main?: boolean;
  source_id?: number;
  source_type?: string;
  slider_image_translations?: StoreTranslationElement[];
}

export interface BannersOfStoreResponse {
  store_id?: number;
  banners_of_store?: BannersOfStore[];
}

/** Loyalty/bonus card attached to the customer (loginBonusCard / bonus_cards). */
export interface BonusCard {
  card_number?: string;
  barcode_image?: string;
  total_bonus?: number;
  bonus_percentage?: number;
  earned_bonus?: number;
  spent_bonus?: number;
  total_bonus_earned?: number;
  is_expired?: boolean;
  expires_at?: string;
}

export interface BonusTransactionList {
  amount?: number;
  type?: string;
  status?: string;
  source_type?: string;
  bonus_percentage?: number;
  bonus_spent?: number;
  spent_bonus?: number;
  earned_bonus?: number;
  total_bonus?: number;
  total_bonus_earned?: number;
  bonus_payment?: number;
  created_at?: string;
}

export interface BonusTransactionResponse {
  data?: BonusTransactionList[];
  message?: string;
  status_code?: number;
}

export interface Brand {
  name?: string;
  logo?: string;
  image?: string;
  status?: string;
  branch_count?: number;
  android_store_url?: string;
  ios_store_url?: string;
  brand_translations?: (Record<string, unknown>)[];
  brands_uploads?: (Record<string, unknown>)[];
}

export interface Brands {
  brands?: Brand[];
}

/** One line in the payment/price breakdown. */
export interface Breakdown {
  old_price?: number;
  new_price?: number;
  total_price?: number;
  discount_value?: number;
  tax_value?: number;
  tax_type?: string;
  service_fee?: number;
  packet_fee?: number;
  delivery_fee?: number;
}

export interface CartActionResponse {
  cart_id?: number;
  action_status?: string;
  cart_updated?: boolean;
  updated_items?: CartItem[];
  accept_pending_item?: boolean;
  remove_pending_item?: boolean;
  remove_all?: boolean;
}

export interface CartItem {
  item_id?: number;
  product_id?: number;
  store_product_variant_id?: number;
  store_id?: number;
  image_url?: string;
  unit_name?: string;
  unit_symbol?: string;
  unit_price?: number;
  unit_mrp?: number;
  item_total_price?: number;
  item_total_mrp?: number;
  real_quantity?: number;
  original_quantity?: number;
  max_order_quantity?: number;
  min_order_quantity?: number;
  sold_by_gram?: boolean;
  has_weight?: boolean;
  has_packet?: boolean;
  is_popular_item?: boolean;
  barcode_image?: string;
  added_later?: boolean;
  added_later_date?: string;
  added_later_for?: string;
  added_at?: string;
  save_for_later?: boolean;
}

/** STALE APK guess — contradicts live. GET /v2/carts returns a list of `LiveCart`; `totals` is only `{price, mrp}` (no fees, payable, bonus or discount fields). @deprecated */
export interface CartModel {
  cart_id?: number;
  store_id?: number;
  store_name?: string;
  image_url?: string;
  items_total_price?: number;
  total_price?: number;
  total_mrp?: number;
  total_discount?: number;
  items_map?: Record<string, unknown>;
  minimum_order_fee?: number;
  is_delivery_free?: boolean;
  created_at?: string;
  updated_at?: string;
}

/** STALE APK guess — contradicts live. GET /v2/carts returns a list of `LiveCart`; `totals` is only `{price, mrp}` (no fees, payable, bonus or discount fields). @deprecated */
export interface CartResponse {
  cart_id?: number;
  store_id?: number;
  store_name?: string;
  items?: CartItem[];
  totals?: CartTotals;
  cart_updated?: boolean;
  action_status?: string;
}

/** STALE APK guess — contradicts live. GET /v2/carts returns a list of `LiveCart`; `totals` is only `{price, mrp}` (no fees, payable, bonus or discount fields). @deprecated */
export interface CartTotals {
  items_total_price?: number;
  total_price?: number;
  total_mrp?: number;
  total_discount?: number;
  delivery_fee?: number;
  delivery_charge?: number;
  service_fee?: number;
  packet_fee?: number;
  minimum_order_fee?: number;
  is_delivery_free?: boolean;
  payable_amount?: number;
  total_amount?: number;
  total_bonus?: number;
  bonus_payment?: number;
}

export interface Categories {
  categories?: Category[];
}

export interface Category {
  category_id?: number;
  name?: string;
  icon?: string;
  image_url?: string;
  color?: string;
  is_parent?: boolean;
  is_popular?: boolean;
  category_translations?: StoreCategoryTranslation[];
  categories_uploads?: (Record<string, unknown>)[];
}

/** STALE APK guess — contradicts live. City rows are `LiveCity` (`id`, `city_translations[]`, `countries`); no `city_id`, `name`, coordinates or `status` wrapper. @deprecated */
export interface Cities {
  city_id?: number;
  name?: string;
  display_name?: string;
  latitude?: number;
  longitude?: number;
  city_translations?: Translation[];
}

/** STALE APK guess — contradicts live. City rows are `LiveCity` (`id`, `city_translations[]`, `countries`); no `city_id`, `name`, coordinates or `status` wrapper. @deprecated */
export interface CitiesList {
  status?: boolean;
  message?: string;
  data?: Cities[];
}

export interface Countries {
  name?: string;
  code?: string;
  country_translations?: Translation[];
  data?: Cities[];
}

export interface CouponItem {
  code?: string;
  title?: string;
  description?: string;
  status?: string;
  discount_value?: number;
  discount_percentage?: number;
  image?: CouponImage;
  barcode_image?: string;
  is_expired?: boolean;
  start_date?: string;
  end_date?: string;
  expires_at?: string;
  used_at?: string;
}

export interface CouponsData {
  data?: CouponItem[];
}

export interface CouponsResponse {
  data?: CouponsData;
  message?: string;
  status_code?: number;
}

/** UNVERIFIED APK guess: courier info embedded in a customer order (no order has been observed live). It has no coordinate fields. This is customer-side data only — there is no courier-side API. */
export interface CourierTracking {
  person_name?: string;
  phone_number?: string;
  courier_rating?: number;
  courier_rating_message?: string;
  eta_minutes?: number;
  distance_meters?: number;
  is_courier_accepted?: boolean;
  is_delivering_other_order?: boolean;
  courier_location_updated?: boolean;
  picked_up?: boolean;
  picked_up_at?: string;
  heading_accuracy?: number;
  altitude_accuracy?: number;
  speed_accuracy?: number;
  is_mocked?: boolean;
}

export interface CreateOrderResponse {
  order_id?: number;
  checkout_id?: number;
  order_status?: OrderStatus;
  payment_status?: string;
  redirect_url?: string;
  status_code?: number;
}

/** Address attached to an order/checkout (UpdateDeliveryAddressService). */
export interface DeliveryAddress {
  address_id?: number;
  delivery_address?: string;
  actual_address?: string;
  address_details?: string;
  person_name?: string;
  phone_number?: string;
  entrance_number?: string;
  floor?: string;
  apartment_room?: string;
  building_name?: string;
  latitude?: number;
  longitude?: number;
  zone_id?: number;
}

export interface DeliveryDetails {
  delivery_address?: string;
  actual_address?: string;
  legal_address?: string;
  address_type?: string;
  person_name?: string;
  phone_number?: string;
  delivery_fee?: number;
  delivery_charge?: number;
  delivery_time?: string;
  delivery_time_min?: number;
  delivery_time_max?: number;
  time_slot?: string;
  is_delivery_free?: boolean;
  zone_id?: number;
  in_zone?: boolean;
  out_of_zone?: boolean;
}

export interface DeliveryFee {
  delivery_fee?: number;
  delivery_charge?: number;
  minimum_order_fee?: number;
  is_delivery_free?: boolean;
  is_free?: boolean;
  price_per_km?: number;
  price_for_100m?: number;
  distance_meters?: number;
}

/** STALE APK guess — contradicts live. Real errors are `ErrorEnvelope` (`success`, `message`, `statusCode`; no `status`, `status_code`, `error_code` or `errors`). @deprecated */
export interface ErrorResponse {
  status?: boolean;
  message?: string;
  status_code?: number;
  error_code?: string;
  error_type?: string;
  errors?: Record<string, unknown>;
}

export interface FileUploadResponse {
  status?: boolean;
  message?: string;
  file_id?: number;
  file_name?: string;
  file_type?: string;
  original_name?: string;
  mime_type?: string;
  content_type?: string;
  image_url?: string;
  path?: string;
  size?: number;
  data?: UploadsModel;
}

/** GET /highlights?store_id= */
export interface HighlightResponse {
  data?: HighlightResponseData;
  status_code?: number;
}

export interface HighlightResponseData {
  highlights?: Hightlight[];
  data?: Hightlight[];
}

/** GET /highlights/products/{id} */
export interface HighlightsProductsResponse {
  data?: Product[];
  store_id?: number;
  show_on_main?: boolean;
}

/** Stock / quantity availability for a variant. */
export interface Inventory {
  store_product_variant_id?: number;
  zone_id?: number;
  quantity?: number;
  stock?: number;
  real_quantity?: number;
  original_quantity?: number;
  max_order_quantity?: number;
  min_order_quantity?: number;
  has_packet?: boolean;
  purchasing_disabled?: boolean;
  purchasing_disabled_reasons?: string[];
  in_zone?: boolean;
  out_of_zone?: boolean;
}

/** UNVERIFIED APK guess. The endpoint that would return it answers 500 on live, so no field here has ever been observed. */
export interface LotteryDetails {
  title?: string;
  subtitle?: string;
  description?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
  lotteries_uploads?: (Record<string, unknown>)[];
  lottery_prizes?: LotteryPrize[];
}

export interface LotteryPolicyResponse {
  data?: {
    description?: string;
  };
  message?: string;
  status_code?: number;
}

/** UNVERIFIED APK guess. The endpoint that would return it answers 500 on live, so no field here has ever been observed. */
export interface LotteryPrize {
  name?: string;
  title?: string;
  description?: string;
  image?: string;
  lottery_prizes_uploads?: (Record<string, unknown>)[];
}

/** UNVERIFIED APK guess. The endpoint that would return it answers 500 on live, so no field here has ever been observed. */
export interface LotteryTicketsResponse {
  data?: ApiLotteryTicket[];
  message?: string;
  status_code?: number;
}

/** Payload carried inside a notification (deep-link target). */
export interface NotificationData {
  type?: string;
  link?: string;
  image_url?: string;
  data?: Record<string, unknown>;
}

export interface NotificationItem {
  title?: string;
  body?: string;
  notification_message?: string;
  type?: string;
  image_url?: string;
  is_read?: boolean;
  data?: NotificationData;
  created_at?: string;
  updated_at?: string;
}

export interface NotificationResponse {
  status?: boolean;
  message?: string;
  count?: number;
  data?: NotificationItem[];
}

export interface Order {
  order_id?: number;
  order_status?: OrderStatus;
  store_id?: number;
  store_name?: string;
  image_url?: string;
  total_amount?: number;
  total_price?: number;
  payable_amount?: number;
  delivery_address?: string;
  delivery_fee?: number;
  payment_method?: string;
  payment_status?: string;
  eta_minutes?: number;
  total_eta?: number;
  canceling_reason?: string;
  created_at?: string;
  accepted_at?: string;
  picked_up_at?: string;
  delivered_at?: string;
  cancelled_at?: string;
  status_history?: StatusHistory[];
  delivery_details?: DeliveryDetails;
  price_details?: PriceDetails;
  payment_details?: PaymentDetails;
  courier_tracking?: CourierTracking;
}

/** Returned by /orders/checkout; recalculates the full price breakdown. */
export interface OrderCheckoutForCalculatingResponse {
  checkout_id?: number;
  items_total_price?: number;
  delivery_fee?: number;
  delivery_charge?: number;
  service_fee?: number;
  packet_fee?: number;
  minimum_order_fee?: number;
  is_delivery_free?: boolean;
  total_amount?: number;
  total_discount?: number;
  payable_amount?: number;
  bonus_payment?: number;
  bonus_spent?: number;
  total_bonus?: number;
  total_bonus_earned?: number;
  applied_offer?: Record<string, unknown>;
  applied_promo?: Record<string, unknown>;
  delivery_time?: string;
  delivery_time_min?: number;
  delivery_time_max?: number;
  tip_config?: TipConfig;
  price_details?: PriceDetails;
}

export interface OrderDetailsResponse {
  order?: Order;
  status_history?: StatusHistory[];
  price_details?: PriceDetails;
  payment_details?: PaymentDetails;
  delivery_details?: DeliveryDetails;
  courier_tracking?: CourierTracking;
}

export interface OrderPayErrorResponse {
  error_code?: string;
  error_type?: string;
  status_code?: number;
  payment_status?: string;
  invalid_payment_data?: Record<string, unknown>;
}

export interface OrderPayResponse {
  order_id?: number;
  payment_status?: string;
  redirect_url?: string;
  status_code?: number;
}

/** STALE APK guess. The live list envelope is `{total, limit, offset, orders[]}`; no `past_delivered` key was seen (order rows themselves are unobserved). @deprecated */
export interface OrdersResponse {
  orders?: Order[];
  past_delivered?: Order[];
}

/** Server-sent event payload for live order/courier tracking. */
export interface OrderTrackingSseModel {
  order_id?: number;
  order_status?: OrderStatus;
  current_step?: number;
  eta_minutes?: number;
  total_eta?: number;
  is_courier_accepted?: boolean;
  on_the_way?: boolean;
  picked_up?: boolean;
  distance_meters?: number;
  courier_tracking?: CourierTracking;
}

export interface OzioPlusCampaignCategoriesResponse {
  categories?: {
    category_id?: number;
    category_translations?: (Record<string, unknown>)[];
    categories_uploads?: (Record<string, unknown>)[];
    active_campaigns?: ActiveCampaign[];
  }[];
  message?: string;
  status_code?: number;
}

export interface OzioPlusCampaignProductsResponse {
  products?: {
    product_id?: number;
    category_id?: number;
    store_products?: (Record<string, unknown>)[];
    discount_percentage?: number;
  }[];
  message?: string;
  status_code?: number;
}

export interface PartnersModulesBrandsResponse {
  brands?: Brand[];
  message?: string;
  status_code?: number;
}

export interface PartnersModulesResponse {
  modules?: Modules[];
  message?: string;
  status_code?: number;
}

export interface PartnersResponse {
  partners?: Modules[];
  message?: string;
  status_code?: number;
}

export interface PaymentDetails {
  payment_method?: string;
  payment_status?: string;
  last_payment_method?: string;
  payment_card_id?: number;
  masked_card_number?: string;
  card_brand?: string;
  cash_amount_provided?: number;
  apple_pay?: boolean;
  google_pay?: boolean;
  bonus_payment?: number;
  bonus_spent?: number;
  payable_amount?: number;
  total_amount?: number;
  breakdown?: Breakdown[];
}

export interface PopupData {
  popup_id?: number;
  image_url?: string;
  link?: string;
  type?: string;
  popup_translations?: PopupTranslation[];
}

export interface PopupResponse {
  status?: boolean;
  message?: string;
  data?: PopupData;
}

export interface PriceDetails {
  items_total_price?: number;
  total_price?: number;
  total_mrp?: number;
  total_discount?: number;
  delivery_fee?: number;
  service_fee?: number;
  packet_fee?: number;
  total_amount?: number;
  payable_amount?: number;
  old_price?: number;
  new_price?: number;
  tax_value?: number;
  tax_type?: string;
}

export interface PriceInfo {
  old_price?: number;
  new_price?: number;
  unit_price?: number;
  unit_mrp?: number;
  total_price?: number;
  discount_value?: number;
  discount_type?: string;
  discount_percentage?: number;
}

export interface PrivacyPolicyResponse {
  status?: boolean;
  message?: string;
  content?: string;
  data?: PrivacyPolicyTranslation[];
}

/** Catalog / list product (store product variant surfaced to customer). */
export interface Product {
  product_id?: number;
  store_product_variant_id?: number;
  store_id?: number;
  category_id?: number;
  name?: string;
  display_name?: string;
  short_text?: string;
  description?: string;
  barcode?: string;
  generated_code?: string;
  material_code?: string;
  content_hash?: string;
  image_url?: string;
  old_price?: number;
  new_price?: number;
  unit_price?: number;
  unit_mrp?: number;
  total_mrp?: number;
  price?: number;
  discount_percentage?: number;
  discount_type?: string;
  discount_value?: number;
  bonus_percentage?: number;
  rating_value?: number;
  rating_count?: number;
  rating_message?: string;
  search_count?: number;
  max_order_quantity?: number;
  min_order_quantity?: number;
  has_weight?: boolean;
  sold_by_gram?: boolean;
  is_favorite?: boolean;
  is_age_restricted?: boolean;
  is_organic?: boolean;
  is_halal?: boolean;
  is_vegan?: boolean;
  is_wholesale?: boolean;
  is_popular?: boolean;
  is_popular_item?: boolean;
  is_recommended?: boolean;
  show_on_main?: boolean;
  purchasing_disabled?: boolean;
  purchasing_disabled_reasons?: string[];
  barcode_image?: string;
  attributes?: ProductAttributes;
  unit?: Unit;
  tax?: Tax;
  measurements?: Measurements[];
  images?: ProductImage[];
  variants?: StoreProductVariants;
  store_product_variants?: StoreProductVariants[];
}

/** Boolean / descriptive product attribute flags. */
export interface ProductAttributes {
  name?: string;
  value?: string;
  has_weight?: boolean;
  sold_by_gram?: boolean;
  is_organic?: boolean;
  is_halal?: boolean;
  is_vegan?: boolean;
  is_age_restricted?: boolean;
  is_wholesale?: boolean;
  is_recommended?: boolean;
  is_popular?: boolean;
}

/** Categories grouping products (GET /categories/products). */
export interface ProductCategoriesResponse {
  data?: StoreProductsCategory[];
  store_products_categories?: StoreProductsCategory[];
  categories?: StoreProductsCategory[];
}

export interface ProductColor {
  name?: string;
  value?: string;
  color?: string;
}

/** Single product detail (GET /products/{id}). */
export interface ProductDetailResponse {
  data?: Product;
  status_code?: number;
}

export interface ProductImage {
  file_id?: number;
  file_name?: string;
  file_type?: string;
  mime_type?: string;
  content_type?: string;
  object_key?: string;
  original_name?: string;
  image_url?: string;
  custom_url?: string;
  position?: number;
  source_id?: number;
  source_type?: string;
  use_type?: string;
  content_hash?: string;
}

/** List response for products / latest / similar / category endpoints. */
export interface ProductResponse {
  data?: Product[];
  meta?: Record<string, unknown>;
  status_code?: number;
}

export interface PromoCode {
  promo_id?: number;
  code?: string;
  title?: string;
  description?: string;
  discount_type?: string;
  discount_value?: number;
  discount_percentage?: number;
  status?: string;
  start_date?: string;
  end_date?: string;
  expires_at?: string;
  is_expired?: boolean;
  used_count?: number;
  used_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PromoCodesData {
  data?: PromoCode[];
}

export interface PromoCodesResponse {
  data?: PromoCodesData;
  message?: string;
  status_code?: number;
}

/** Response to POST /payment/save-card. Returns a webview redirect to complete card binding. */
export interface SaveCardResponse {
  success?: boolean;
  message?: string;
  payment_card_id?: number;
  redirect_url?: string; // Bank 3-D Secure / card-binding webview URL.
  custom_url?: string;
}

/** UNVERIFIED APK guess. GET /profile/me/cards returned [] on live, so the card row shape has never been observed. */
export interface SavedCardsResponse {
  success?: boolean;
  message?: string;
  data?: {
    payment_card_id?: number;
    card_number?: string;
    masked_card_number?: string;
    card_brand?: string;
    brand_translations?: (Record<string, unknown>)[];
    is_expired?: boolean;
    is_selected?: boolean;
    expires_at?: string;
    created_at?: string;
  }[];
}

/** GET /products?keyword= and /search / /stores/search. */
export interface SearchResponse {
  data?: Product[];
  products?: Product[];
  search_count?: number;
  meta?: Record<string, unknown>;
}

export interface SliderImagesStore {
  store_id?: number;
  image_url?: string;
  redirect_url?: string;
  custom_url?: string;
  show_on_main?: boolean;
  source_id?: number;
  source_type?: string;
  slider_image_translations?: StoreTranslationElement[];
}

export interface Store {
  store_id?: number;
  store_name?: string;
  store_code?: string;
  name?: string;
  logo?: string;
  image_url?: string;
  is_store_closed?: boolean;
  is_delivery_free?: boolean;
  is_favorite?: boolean;
  is_user_favorite_store?: boolean;
  is_age_restricted?: boolean;
  delivery_fee?: number;
  delivery_charge?: number;
  delivery_time?: string;
  delivery_time_min?: number;
  delivery_time_max?: number;
  minimum_order_fee?: number;
  packet_fee?: number;
  service_fee?: number;
  bonus_percentage?: number;
  branch_count?: number;
  rating_value?: number;
  rating_count?: number;
  rating_message?: string;
  latitude?: number;
  longitude?: number;
  distance_meters?: number;
  open_time?: string;
  close_time?: string;
  in_zone?: boolean;
  out_of_zone?: boolean;
  store_category_id?: number;
  category_id?: number;
  status?: string;
  type?: string;
  store_translations?: StoreTranslationElement[];
  store_branches?: StoreBranches[];
  store_bonus_percentages?: StoreBonusPercentage[];
  stores_store_holidays?: (Record<string, unknown>)[];
  zone_pricings?: ZonePricing[];
}

export interface StoreBranches {
  store_id?: number;
  store_category_id?: number;
  zone_id?: number;
  name?: string;
  address?: string;
  phone?: string;
  latitude?: number;
  longitude?: number;
  open_time?: string;
  close_time?: string;
  is_store_closed?: boolean;
  store_branch_translations?: StoreTranslationElement[];
  store_branches_uploads?: (Record<string, unknown>)[];
}

export interface StoreCategories {
  store_category_id?: number;
  category_id?: number;
  store_id?: number;
  name?: string;
  icon?: string;
  image_url?: string;
  color?: string;
  is_parent?: boolean;
  store_category_translations?: StoreCategoryTranslation[];
  store_categories_uploads?: (Record<string, unknown>)[];
}

export interface StoreDetailResponse {
  store_id?: number;
  store_detail_divisions_and_contents?: StoreDetailDivisionsAndContent[];
  store_bonus_percentages?: StoreBonusPercentage[];
  slider_images_stores?: SliderImagesStore[];
}

export interface StoreProducts {
  store_id?: number;
  store_products_categories?: StoreProductsCategory[];
  store_product_variants?: StoreProductVariants[];
  products?: Product[];
}

/** Store product variant - the purchasable unit. */
export interface StoreProductVariants {
  store_product_variant_id?: number;
  store_id?: number;
  display_name?: string;
  short_text?: string;
  barcode_image?: string;
  generated_code?: string;
  material_code?: string;
  content_hash?: string;
  old_price?: number;
  new_price?: number;
  unit_price?: number;
  unit_mrp?: number;
  total_mrp?: number;
  discount_percentage?: number;
  discount_type?: string;
  discount_value?: number;
  bonus_percentage?: number;
  max_order_quantity?: number;
  min_order_quantity?: number;
  real_quantity?: number;
  original_quantity?: number;
  has_weight?: boolean;
  sold_by_gram?: boolean;
  is_wholesale?: boolean;
  purchasing_disabled?: boolean;
  purchasing_disabled_reasons?: string[];
  unit?: Unit;
  tax?: Tax;
  measurements?: Measurements[];
  store_product_variant_translations?: (Record<string, unknown>)[];
  store_product_variant_uploads?: Image[];
  store_product_variant_barcodes?: StoreProductVariantBarcode[];
  store_product_variant_assignments?: StoreProductVariantAssignment[];
}

export interface Stores {
  stores?: Store[];
  search_count?: number;
}

export interface StoresByCategoryResponse {
  category_id?: number;
  stores?: Store[];
  search_count?: number;
}

/** STALE APK guess — contradicts live. Ten-carts are stamp cards, not priced bundles: see `LiveTenCart`. @deprecated */
export interface TenCartsModel {
  ten_cart_ids?: number[];
  store_id?: number;
  store_name?: string;
  image_url?: string;
  total_price?: number;
  is_free?: boolean;
}

/** STALE APK guess — contradicts live. Ten-carts are stamp cards, not priced bundles: see `LiveTenCart`. @deprecated */
export interface TenCartsResponse {
  ten_cart_ids?: number[];
  items?: TenCartsModel[];
}

export interface Tip {
  tip_type?: string;
  tip_value?: number;
  courier_tip?: number;
  max_allowed_tip?: number;
}

export interface TipConfig {
  tip_type?: string;
  tip_value?: number;
  max_allowed_tip?: number;
}

export interface Zone {
  zone_id?: number;
  name?: string;
  in_zone?: boolean;
  out_of_zone?: boolean;
  zone_pricing?: ZonePricing;
  zone_pricings?: ZonePricing[];
  zone_translations?: StoreTranslationElement[];
}

export interface ZonePricing {
  zone_id?: number;
  price_for_100m?: number;
  price_per_km?: number;
  delivery_fee?: number;
  minimum_order_fee?: number;
  distance_meters?: number;
}

/** Entry within social_media_data. */
export interface SocialMediaData {
  name?: string;
  type?: string;
  link?: string;
  icon?: string;
}

export interface StoreCategoriesList {
  store_categories?: StoreCategories[];
}

export interface StoreDetailContents {
  store_id?: number;
  store_product_variant_id?: number;
  store_product_variant_assignment_id?: number;
  store_product_variant_assignments?: (Record<string, unknown>)[];
  store_detail_contents_uploads?: (Record<string, unknown>)[];
}

export interface StoreDetailDivisionsAndContent {
  store_id?: number;
  name?: string;
  title?: string;
  store_detail_contents?: StoreDetailContents[];
  store_detail_division_translations?: StoreTranslationElement[];
}

export interface StoreBonusPercentage {
  store_id?: number;
  store_category_id?: number;
  bonus_percentage?: number;
  start_date?: string;
  end_date?: string;
}

export interface Zones {
  zones?: Zone[];
}

export interface StoreCategoryTranslation {
  store_category_id?: number;
  category_id?: number;
  locale?: string;
  name?: string;
  description?: string;
}

export interface StoreTranslationElement {
  store_id?: number;
  locale?: string;
  name?: string;
  title?: string;
  description?: string;
}

export interface StoreProductsCategory {
  store_category_id?: number;
  category_id?: number;
  display_name?: string;
  show_on_main?: boolean;
  store_category_translations?: (Record<string, unknown>)[];
  store_categories_uploads?: Image[];
  store_product_variants?: StoreProductVariants[];
}

export interface StoreProductVariantAssignment {
  store_product_variant_assignment_id?: number;
  store_product_variant_id?: number;
  store_id?: number;
  real_quantity?: number;
  original_quantity?: number;
}

export interface StoreProductVariantAssignments {
  store_product_variant_assignments?: StoreProductVariantAssignment[];
}

export interface StoreProductVariantBarcode {
  store_product_variant_id?: number;
  barcode?: string;
  barcode_image?: string;
  generated_code?: string;
  material_code?: string;
  content_hash?: string;
}

/** A highlight banner/collection (class spelled 'Hightlight' in source). */
export interface Hightlight {
  store_id?: number;
  title?: string;
  display_name?: string;
  short_text?: string;
  image_url?: string;
  show_on_main?: boolean;
  start_at?: string;
  end_at?: string;
  products?: Product[];
}

export interface Unit {
  unit_name?: string;
  unit_symbol?: string;
  unit_price?: number;
  unit_mrp?: number;
  name?: string;
  symbol?: string;
  value?: string;
  unit_types?: UnitTypes[];
  unit_translations?: (Record<string, unknown>)[];
}

export interface Units {
  units?: Unit[];
}

export interface UnitTypes {
  unit_name?: string;
  unit_symbol?: string;
  unit_type_translations?: (Record<string, unknown>)[];
}

export interface Measurements {
  unit_name?: string;
  unit_symbol?: string;
  value?: number;
  weight?: number;
  price_for_100m?: number;
  has_weight?: boolean;
  sold_by_gram?: boolean;
}

export interface Tax {
  tax_type?: string;
  tax_value?: number;
}

export interface Image {
  image_url?: string;
  path?: string;
  name?: string;
  type?: string;
  size?: number;
}

export interface Option {
  name?: string;
  value?: string;
  options?: string[];
}

/** Cart/order line item referencing a product variant. */
export interface Item {
  item_id?: number;
  product_id?: number;
  store_product_variant_id?: number;
  quantity?: number;
  real_quantity?: number;
  original_quantity?: number;
  item_total_mrp?: number;
  item_total_price?: number;
  items_total_price?: number;
}

/** Order lifecycle status. Enum values verified present in STRINGS/FIELDS. */
export type OrderStatus = "order_waiting" | "order_accepted" | "order_preparing" | "order_ready" | "order_picked_up" | "order_delivered" | "order_cancelled" | "order_not_found";

export interface StatusHistory {
  order_status?: OrderStatus;
  current_step?: number;
  canceling_reason?: string;
  created_at?: string;
  accepted_at?: string;
  picked_up_at?: string;
  delivered_at?: string;
  cancelled_at?: string;
}

export interface SaveForLater {
  item_id?: number;
  product_id?: number;
  store_product_variant_id?: number;
  store_id?: number;
  image_url?: string;
  unit_price?: number;
  save_for_later?: boolean;
  added_at?: string;
}

export interface Count {
  count?: number;
}

export interface CouponImage {
  image_url?: string;
}

export interface Modules {
  name?: string;
  image?: string;
  logo?: string;
  status?: string;
  branch_count?: number;
  android_store_url?: string;
  ios_store_url?: string;
  module_translations?: (Record<string, unknown>)[];
}

export interface Translation {
  name?: string;
  locale?: string;
}

/** Device-side local/push notification (createNotificationChannel). */
export interface LocalNotification {
  title?: string;
  body?: string;
  type?: string;
  image_url?: string;
  firebase_device_id?: string;
  device_token?: string;
  data?: NotificationData;
}

/** Response of deleteNotifications (clear all). */
export interface RemoveAllResponse {
  status?: boolean;
  message?: string;
  remove_all?: boolean;
}

export type PopupTranslation = Translation & {
  popup_id?: number;
};

export type PrivacyPolicyTranslation = Translation & {
  content?: string;
};

export interface Currencies {
  code?: string;
  symbol?: string;
  name?: string;
  currency_translations?: CurrencyTranslations[];
}

export type CurrencyTranslations = Translation & {
  symbol?: string;
};

export interface UploadsModel {
  upload_id?: number;
  file_id?: number;
  file_name?: string;
  file_type?: string;
  original_name?: string;
  mime_type?: string;
  content_type?: string;
  image_url?: string;
  path?: string;
  size?: number;
  used_count?: number;
}

/** File reference. `object_key` is the storage key the client turns into an image URL. */
export interface Upload {
  id?: number;
  object_key?: string;
  size?: number;
  mime_type?: string;
  extension?: string;
  type?: string;
}

export interface Module {
  id?: number;
  type?: string;
  module_translations?: Translation[];
}

/** One entry of a store's bonus-rate history (`store_bonus_percentages`, newest first). Current rate = newest entry whose start_date has passed. */
export interface BonusPercentage {
  id?: number;
  percentage?: Decimal; // decimal as string, e.g. "2.59"
  start_date?: string;
}

/** Store as returned by stores/search and stores/{id} (delivery_time_* only in stores/search). */
export interface LiveStore {
  id?: number;
  address?: string;
  lat?: Decimal; // decimal as string, e.g. "2.59"
  lng?: Decimal; // decimal as string, e.g. "2.59"
  store_translations?: Translation[];
  store_code?: string;
  phone?: string;
  email?: string;
  rating?: Decimal; // decimal as string, e.g. "2.59"
  have_not_vegan?: boolean;
  have_vegan?: boolean;
  has_packet?: boolean;
  open_time?: string; // Time of day with a 1970-01-01 date part. Baku wall-clock with a trailing Z on /stores/search, product and cart rows; true UTC on GET /stores
  close_time?: string; // Time of day with a 1970-01-01 date part. Baku wall-clock with a trailing Z on /stores/search, product and cart rows; true UTC on GET /stores
  preparation_time?: number;
  is_wholesale?: boolean;
  free_delivery_stores?: unknown[];
  store_categories?: {
    id?: number;
    status?: string;
    deleted_at?: string | null;
    priority?: number;
    store_category_translations?: Translation[];
  };
  currencies?: {
    id?: number;
    code?: string;
  };
  modules?: Module;
  zone_id?: number;
  zones?: {
    id?: number;
    zone_coefficients?: unknown[];
    zones?: {
      id?: number;
      zone_translations?: Translation[];
      cities?: Record<string, unknown>;
      zone_pricings?: {
        id?: number;
        price_per_km?: Decimal; // decimal as string, e.g. "2.59"
      }[];
    };
  };
  store_bonus_percentages?: BonusPercentage[]; // History of bonus rates, newest first. Current rate = the newest entry whose start_date has passed (do not take [0] blindly).
  store_branches?: {
    id?: number;
    store_branch_translations?: Translation[];
    store_branches_uploads?: {
      uploads?: Upload;
    }[];
  };
  is_delivery_free?: boolean;
  delivery_fee?: unknown;
  delivery_time_min?: number;
  delivery_time_max?: number;
}

export interface LiveProductVariant {
  id?: number; // Variant id = the id for GET /stores/{storeId}/products/{id} and similar-products. NOT the cart key.
  material_code?: string;
  is_recommended?: boolean;
  is_organic?: boolean;
  is_halal?: boolean;
  is_vegan?: boolean;
  is_popular_item?: boolean;
  width?: Decimal; // decimal as string, e.g. "2.59"
  height?: Decimal; // decimal as string, e.g. "2.59"
  length?: Decimal; // decimal as string, e.g. "2.59"
  quantity?: Decimal; // decimal as string, e.g. "2.59"
  volume?: Decimal; // decimal as string, e.g. "2.59"
  has_weight?: boolean;
  sold_by_gram?: boolean;
  store_product_variant_barcodes?: {
    barcode?: string;
  }[];
  store_product_variant_uploads?: Upload[];
  units?: {
    id?: number;
    symbol?: string;
    conversion?: Decimal; // decimal as string, e.g. "2.59"
    unit_translations?: Translation[];
    unit_types?: {
      id?: number;
      unit_type_translations?: {
        name?: string;
      }[];
    };
  };
  colors?: unknown;
  store_products?: {
    id?: number;
    tax_value?: Decimal; // decimal as string, e.g. "2.59"
    tax_type?: string;
    brands?: {
      id?: number;
      brand_translations?: Translation[];
      brands_uploads?: {
        uploads?: Upload;
      }[];
    };
    store_products_categories?: {
      categories?: {
        id?: number;
        categories_uploads?: {
          uploads?: Upload;
        }[];
        category_translations?: {
          name?: string;
        }[];
      };
    }[];
  };
  store_product_variant_translations?: {
    name?: string;
    description?: string | null;
  }[];
  is_favorite?: boolean;
}

/** Store product (price/stock are per store). `mrp` is the list price; price < mrp means discounted. */
export interface LiveProduct {
  id?: number; // Store-product ROW id (store-specific). This is the cart key (`product_id` of carts/action).
  price?: Decimal; // Sale price, decimal as string, e.g. "2.59".
  stock?: Decimal; // Decimal as string. Pieces for count products, GRAMS for weight products (while carts/action quantities are in the product unit, 1 = 1 kg).
  mrp?: Decimal; // List price, decimal as string. price < mrp means discounted.
  min_order_quantity?: string | null; // null on every sampled live row. Unit for weight products unknown.
  max_order_quantity?: Decimal | null; // null on almost every live row; a decimal string when set ("3" seen on a count product). Unit for weight products unknown.
  stores?: Record<string, unknown>; // Embedded store (id, address, store_translations, store_bonus_percentages, open_time, close_time, modules, currencies{tips[]}, zones{zone_pri
  _count?: {
    user_favorite_store_product_variants?: number;
  };
  store_product_variants?: LiveProductVariant; // The variant; its `id` is the product-DETAIL id (shared across stores).
}

export interface LiveProductCategory {
  id?: number;
  search_count?: number;
  is_parent?: boolean;
  is_age_restricted?: boolean;
  modules?: Module;
  category_translations?: Translation[];
  categories_uploads?: {
    uploads?: Upload;
  }[];
}

export interface LiveStoreCategory {
  id?: number;
  search_count?: number;
  modules?: Module;
  store_category_translations?: Translation[];
  store_categories_uploads?: {
    uploads?: Upload;
  }[];
}

/** One cart of one store. GET /v2/carts returns a LIST of these. */
export interface LiveCart {
  id?: number;
  status?: string;
  totals?: {
    price?: number;
    mrp?: number;
  }; // Only `price` and `mrp` (items total at sale price / at list price). Nothing else is sent.
  store?: {
    id?: number;
    name?: string;
    open_time?: string; // Baku wall-clock time written with a trailing Z (date part is 1970-01-01): read HH:mm literally, do NOT convert from UTC. GET /stores/{id} se
    close_time?: string; // Baku wall-clock time written with a trailing Z (date part is 1970-01-01): read HH:mm literally, do NOT convert from UTC. GET /stores/{id} se
  };
  created_at?: string;
  updated_at?: string;
  items_map?: Record<string, number>; // cart item id → quantity
  items?: {
    id?: number;
    quantity?: number;
    price_details?: {
      total_price?: number;
      total_mrp?: number;
      unit_price?: number;
      unit_mrp?: number;
    };
    inventory?: {
      stock?: number;
      min_order_quantity?: number | null;
      max_order_quantity?: number | null;
    };
    tax?: {
      type?: string;
      value?: number;
    };
    notes?: string | null;
    save_for_later?: {
      is_saved?: boolean;
      date?: string | null;
    };
    product?: {
      id?: number;
      name?: string;
      image?: {
        url?: string;
      };
      color?: {
        hex?: string | null;
      };
      attributes?: {
        is_halal?: boolean;
        is_organic?: boolean;
        is_vegan?: boolean;
      };
      measurements?: {
        has_weight?: boolean;
        sold_by_gram?: boolean;
        unit?: {
          symbol?: string;
          name?: string;
          type?: string;
          conversion?: number;
        };
      };
    };
    added_at?: string;
  }[];
}

/** A "10-lar" stamp card (NOT a preset basket). `steps` was 9 for a 10-stamp card on live. */
export interface LiveTenCart {
  id?: number;
  start_date?: string;
  end_date?: string;
  ten_carts_uploads?: {
    uploads?: Upload;
  }[];
  ten_cart_translations?: Translation[];
  steps?: number;
  is_selected?: boolean;
  current_step?: number; // Absent when is_selected is false.
  completed?: boolean;
}

/** GET /profile/me `data` (verified 2026-11-12). No name parts, email, image, tier, cashback or role fields. */
export interface LiveProfile {
  id?: number;
  name?: string; // Full name as one string.
  bonus_cards?: {
    card_number?: string;
    total?: Decimal; // Lifetime bonus earned (AZN, decimal string).
    bonus?: Decimal; // Spendable bonus balance (AZN, decimal string).
    block_type?: string;
    status?: string;
    type?: string;
  }[];
  birth_date?: string; // ISO datetime at 00:00:00.000Z — use the date part only.
  ref_code?: string | null;
  gender?: string;
  phone?: string; // E.164, +994XXXXXXXXX.
  is_registered?: boolean;
  cities?: unknown;
  active_orders?: unknown[];
}

/** A saved address as the API RETURNS it (list and by-id; verified 2026-11-12). The request body for POST / PUT is unverified — see `Address`. */
export interface LiveAddress {
  id?: number;
  type?: string; // The free-text address line the user typed (NOT the kind of address).
  phone?: string;
  lng?: Decimal; // Longitude, decimal as string.
  lat?: Decimal; // Latitude, decimal as string.
  person_name?: string;
  floor?: string | null; // String (numeric string on the live row).
  road?: string | null;
  address_type?: string; // Kind of address. Seen: "office".
  address_details?: string | null;
  apartment_room?: string | null;
  building_name?: string | null;
  entrance_number?: string | null;
  is_selected?: boolean;
  zones?: unknown; // null on the live row.
  isCurrentLocation?: boolean; // List only; absent on GET /profile/address/{id}.
  distanceMeters?: unknown; // List only.
}

export interface LiveCoupon {
  id?: string;
  code?: string;
  status?: string;
  name?: string;
  description?: string;
  price?: Decimal; // decimal as string, e.g. "2.59"
  type?: string;
  is_popular?: boolean;
  discount_type?: string;
  discount_value?: Decimal; // Decimal string; a percentage for percent / cashback, an amount for fixed.
  is_qr?: boolean;
  start_date?: string; // Baku wall-clock written with a trailing Z — do NOT convert from UTC.
  end_date?: string; // Baku wall-clock written with a trailing Z — do NOT convert from UTC.
  is_expired?: boolean;
  used_at?: string | null;
  image?: Upload;
}

export interface LiveCity {
  id?: number;
  city_translations?: Translation[];
  countries?: {
    id?: number;
    country_translations?: Translation[];
  };
}

export interface LivePartnerImage {
  id?: number;
  object_key?: string;
  size?: number;
  mime_type?: string;
  extension?: string;
}

export interface LiveNotification {
  id?: number;
  title?: string;
  content?: string;
  type?: string;
  isRead?: boolean;
  image?: Upload;
  createdAt?: string; // No time-zone suffix (`YYYY-MM-DDTHH:mm:ss`). Appears to be UTC (a row's createdAt is minutes after its own image.created_at, which is UTC) —
}


// ---------------------------------------------------------------------------
// Per-operation request / response types (data = the `data` field of the envelope)
// ---------------------------------------------------------------------------

export type AuthLoginBody = {
  phone: string; // E.164, +994XXXXXXXXX
  device_token: string; // Stable per-install token; request fails without it
};

export type AuthOtpVerifyBody = {
  phone: string;
  otp: string; // 6-digit SMS code. The field is `otp` (NOT `code`).
  device_token?: string;
};

export type AuthOtpVerifyData = LoginData;

export type AuthCompleteRegistrationBody = {
  first_name?: string;
  last_name?: string;
  email?: string;
  birth_date?: string;
  gender?: string;
};

export type AuthCompleteRegistrationData = LoginData;

export type AuthRefreshBody = {
  refresh_token?: string;
};

export type AuthRefreshData = LoginData;

export type ProfileMeData = {
  id?: number;
  name?: string; // Full name as one string (there is no first/last, display_name or person_name).
  bonus_cards?: {
    card_number?: string; // Digits only (11 on the test account).
    total?: Decimal; // Lifetime bonus earned (AZN, decimal string) — equals the sum of earned_bonus over all bonus transactions.
    bonus?: Decimal; // Spendable bonus balance (AZN, decimal string). THIS is the Ozio balance shown in the app.
    block_type?: string; // Seen: "not_blocked".
    status?: string; // Seen: "active".
    type?: string; // Seen: "digital".
  }[];
  birth_date?: string; // ISO datetime at 00:00:00.000Z — use the date part only.
  ref_code?: unknown; // null on the test account. No referral endpoint exists.
  gender?: string; // Seen: "male".
  phone?: string; // E.164, +994XXXXXXXXX.
  is_registered?: boolean;
  cities?: unknown; // null on the test account (shape unobserved).
  active_orders?: unknown[]; // Empty on the test account (row shape unobserved).
};

export type ProfileUpdateMeBody = ProfileUpdate;

export type PaymentCardsData = (Record<string, unknown>)[];

export type AddressListData = {
  id?: number;
  type?: string; // The free-text address line the user typed (NOT the kind of address).
  phone?: string;
  lng?: Decimal; // Longitude, decimal as string.
  lat?: Decimal; // Latitude, decimal as string.
  person_name?: string;
  floor?: string;
  road?: unknown;
  address_type?: string; // Kind of address. Seen: "office".
  address_details?: unknown;
  apartment_room?: unknown;
  building_name?: string;
  entrance_number?: unknown;
  is_selected?: boolean;
  zones?: unknown;
  isCurrentLocation?: boolean; // List only; absent on GET /profile/address/{id}.
  distanceMeters?: unknown; // List only; null when no point was supplied.
}[];

export type AddressCreateBody = Address;

export type AddressGetData = LiveAddress;

export type AddressUpdateBody = Address;

export interface StoreSearchQuery {
  search?: string; // IGNORED by the server (verified 2026-11-12): empty, omitted and nonsense values all return the same stores. Filter by name on the client.
  lat: number; // Latitude of the delivery point. REQUIRED — 400 "Bad request" without lat/lng.
  lng: number; // Longitude of the delivery point. REQUIRED — 400 "Bad request" without lat/lng.
}

export type StoreSearchData = {
  total?: number;
  stores?: {
    delivery_time_min?: number;
    id?: number;
    store_translations?: {
      locale?: string;
      name?: string;
    }[];
    lng?: Decimal; // decimal as string
    free_delivery_stores?: unknown[];
    store_branches?: {
      store_branch_translations?: {
        locale?: string;
        name?: string;
      }[];
      store_branches_uploads?: {
        uploads?: {
          size?: number;
          mime_type?: string;
          id?: number;
          extension?: string;
          object_key?: string;
        };
      }[];
      id?: number;
    };
    delivery_fee?: {
      distance?: number;
      currency?: {
        code?: string;
        id?: number;
        currency_translations?: {
          locale?: string;
          name?: string;
        }[];
        tips?: {
          value?: number;
          id?: number;
        }[];
      };
      price?: number;
    } | null;
    lat?: Decimal; // decimal as string
    zone_id?: number;
    has_packet?: boolean;
    email?: string;
    close_time?: string; // Baku wall-clock time written with a trailing Z (date part is 1970-01-01): read HH:mm literally, do NOT convert from UTC. GET /stores/{id} se
    address?: string;
    store_bonus_percentages?: {
      percentage?: Decimal; // decimal as string
      start_date?: string;
      id?: number;
    }[]; // History of bonus rates, newest first. Current rate = the newest entry whose start_date has passed (do not take [0] blindly).
    store_code?: string;
    have_not_vegan?: boolean;
    modules?: {
      type?: string;
      module_translations?: {
        locale?: string;
        name?: string;
      }[];
      id?: number;
    };
    phone?: string;
    is_delivery_free?: boolean;
    is_wholesale?: boolean;
    rating?: string;
    currencies?: {
      code?: string;
      id?: number;
    };
    open_time?: string; // Baku wall-clock time written with a trailing Z (date part is 1970-01-01): read HH:mm literally, do NOT convert from UTC. GET /stores/{id} se
    have_vegan?: boolean;
    delivery_time_max?: number;
    preparation_time?: number;
    store_categories?: {
      priority?: number;
      id?: number;
      status?: string;
      store_category_translations?: {
        locale?: string;
        name?: string;
      }[];
      deleted_at?: unknown;
    };
    zones?: {
      zones?: {
        cities?: {
          countries?: {
            country_translations?: {
              locale?: string;
              name?: string;
            }[];
            id?: number;
          };
          city_translations?: {
            locale?: string;
            name?: string;
          }[];
          id?: number;
        };
        id?: number;
        zone_pricings?: {
          currencies?: {
            code?: string;
            id?: number;
            currency_translations?: {
              locale?: string;
              name?: string;
            }[];
            tips?: {
              value?: number;
              id?: number;
            }[];
          };
          price_per_km?: string;
          base_fee?: string;
        }[];
        zone_translations?: {
          locale?: string;
          name?: string;
        }[];
      };
      id?: number;
      zone_coefficients?: unknown[];
    };
  }[];
};

export type StoreDetailData = {
  store?: {
    id?: number;
    address?: string;
    lat?: Decimal; // decimal as string
    lng?: Decimal; // decimal as string
    store_translations?: {
      name?: string;
      locale?: string;
    }[];
    store_code?: string;
    phone?: string;
    email?: string;
    rating?: string;
    have_not_vegan?: boolean;
    have_vegan?: boolean;
    has_packet?: boolean;
    open_time?: string; // TRUE UTC here (e.g. 1969-12-31T20:00:00.000Z = 00:00 Baku; 04:00Z = 08:00 Baku), unlike /stores/search, product and cart rows, which send Ba
    close_time?: string; // TRUE UTC here (e.g. 1969-12-31T20:00:00.000Z = 00:00 Baku; 04:00Z = 08:00 Baku), unlike /stores/search, product and cart rows, which send Ba
    preparation_time?: number;
    is_wholesale?: boolean;
    free_delivery_stores?: unknown[];
    store_categories?: {
      id?: number;
      status?: string;
      deleted_at?: unknown;
      priority?: number;
      store_category_translations?: {
        name?: string;
        locale?: string;
      }[];
    };
    currencies?: {
      id?: number;
      code?: string;
    };
    modules?: {
      id?: number;
      type?: string;
      module_translations?: {
        name?: string;
        locale?: string;
      }[];
    };
    zone_id?: number;
    zones?: {
      id?: number;
      zone_coefficients?: unknown[];
      zones?: {
        id?: number;
        zone_translations?: {
          name?: string;
          locale?: string;
        }[];
        cities?: {
          id?: number;
          city_translations?: {
            name?: string;
            locale?: string;
          }[];
          countries?: {
            id?: number;
            country_translations?: {
              name?: string;
              locale?: string;
            }[];
          };
        };
        zone_pricings?: {
          currencies?: {
            id?: number;
            code?: string;
            currency_translations?: {
              name?: string;
              locale?: string;
            }[];
            tips?: {
              value?: number;
              id?: number;
            }[];
          };
          price_per_km?: Decimal; // decimal as string
          base_fee?: string;
        }[];
      };
    };
    store_bonus_percentages?: {
      percentage?: Decimal; // decimal as string
      start_date?: string;
      id?: number;
    }[]; // History of bonus rates, newest first. Current rate = the newest entry whose start_date has passed (do not take [0] blindly).
    store_branches?: {
      id?: number;
      store_branch_translations?: {
        name?: string;
        locale?: string;
      }[];
      store_branches_uploads?: {
        uploads?: {
          id?: number;
          object_key?: string;
          size?: number;
          mime_type?: string;
          extension?: string;
        };
      }[];
    };
    store_category_id?: number;
    is_delivery_free?: boolean;
    delivery_fee?: unknown;
  };
  category?: {
    name?: string;
    locale?: string;
  };
  storeBonusPercentage?: {
    id?: number;
    percentage?: Decimal; // decimal as string
    start_date?: string;
  }[];
  storeDetailDivisionsAndContent?: unknown[];
  storeHolidays?: unknown[];
  brands?: {
    brands?: {
      brand_translations?: {
        locale?: string;
        name?: string;
      }[];
      id?: number;
      brands_uploads?: {
        uploads?: {
          size?: number;
          object_key?: string;
          extension?: string;
        };
      }[];
    };
  }[];
  is_user_favorite_store?: boolean;
};

export type StoreFavoritesListData = Record<string, unknown>;

export type StoreFavoriteAddBody = {
  store_id?: number;
};

export interface StoreFavoriteRemoveQuery {
  store_id?: number;
}

export interface StoreStoreCategoriesQuery {
  category_id?: number; // Appears to be ignored (same rows with and without it, 2026-11-12).
}

export type StoreStoreCategoriesData = {
  store_categories_uploads?: {
    uploads?: {
      size?: number;
      mime_type?: string;
      id?: number;
      extension?: string;
      object_key?: string;
      type?: string;
    };
  }[];
  modules?: {
    type?: string;
    module_translations?: {
      locale?: string;
      name?: string;
    }[];
    id?: number;
  };
  search_count?: number;
  id?: number;
  store_category_translations?: {
    locale?: string;
    name?: string;
  }[];
}[];

export interface StoreProductCategoriesQuery {
  store_id: number;
  parent_id?: number; // Return the sub-categories of this category
}

export type StoreProductCategoriesData = {
  categories?: {
    _count?: {
      store_products_categories?: number;
    };
    is_parent?: boolean;
    modules?: {
      type?: string;
      module_translations?: {
        locale?: string;
        name?: string;
      }[];
      id?: number;
    };
    is_age_restricted?: boolean;
    category_translations?: {
      locale?: string;
      name?: string;
    }[];
    search_count?: number;
    id?: number;
    categories_uploads?: {
      uploads?: {
        size?: number;
        mime_type?: string;
        id?: number;
        extension?: string;
        object_key?: string;
        type?: string;
      };
    }[];
  }[];
  total?: number;
};

export type HomeHighlightsData = {
  total?: number;
  hightlights?: unknown[];
};

export type HomeHighlightProductsData = {
  products?: LiveProduct[];
  total?: number;
};

export type CartListData = {
  id?: number;
  status?: string;
  totals?: {
    price?: number;
    mrp?: number;
  }; // Only `price` and `mrp` (items total at sale price / at list price). Nothing else is sent.
  store?: {
    id?: number;
    name?: string;
    open_time?: string; // Baku wall-clock time written with a trailing Z (date part is 1970-01-01): read HH:mm literally, do NOT convert from UTC. GET /stores/{id} se
    close_time?: string; // Baku wall-clock time written with a trailing Z (date part is 1970-01-01): read HH:mm literally, do NOT convert from UTC. GET /stores/{id} se
  };
  created_at?: string;
  updated_at?: string;
  items_map?: {
    "119088"?: number;
  };
  items?: {
    id?: number;
    quantity?: number;
    price_details?: {
      total_price?: number;
      total_mrp?: number;
      unit_price?: number;
      unit_mrp?: number;
    };
    inventory?: {
      stock?: number;
      min_order_quantity?: unknown;
      max_order_quantity?: unknown;
    };
    tax?: {
      type?: string;
      value?: number;
    };
    notes?: unknown;
    save_for_later?: {
      is_saved?: boolean;
      date?: unknown;
    };
    product?: {
      id?: number;
      name?: string;
      image?: {
        url?: string;
      };
      color?: {
        hex?: unknown;
      };
      attributes?: {
        is_halal?: boolean;
        is_organic?: boolean;
        is_vegan?: boolean;
      };
      measurements?: {
        has_weight?: boolean;
        sold_by_gram?: boolean;
        unit?: {
          symbol?: string;
          name?: string;
          type?: string;
          conversion?: number;
        };
      };
    };
    added_at?: string;
  }[];
}[];

export type CartActionBody = {
  store_id: number;
  product_id: number; // Store-product ROW id (top-level `id` of a stores/{sid}/products row = cart item id = items_map key).
  quantity: number; // In the product unit (kg for weight products: 1 = 1 kg), NOT grams. A DELTA for add.
  action: "add" | "remove"; // add increments by quantity; remove with the full line quantity deletes the line. increase/decrease are rejected (422).
};

export type CartActionData = {
  id?: number; // cart id
  action_status?: string;
  notification_message?: string | null;
};

export type PartnersTenCartsData = {
  steps?: number;
  ten_carts_uploads?: {
    uploads?: {
      object_key?: string;
      id?: number;
    };
  }[];
  current_step?: number; // Absent when is_selected is false.
  is_selected?: boolean;
  id?: number;
  completed?: boolean;
  ten_cart_translations?: {
    locale?: string;
    name?: string;
  }[];
  start_date?: string;
  end_date?: string;
}[];

export type PartnersTenCartsAddBody = {
  ten_cart_id?: number;
};

export interface OrdersListQuery {
  offset?: number; // Rows to skip. Honoured (offset=5 is echoed back as data.offset=5).
  limit?: number; // Page size; default 20. Echoed back as data.limit.
}

export type OrdersListData = {
  total?: number;
  limit?: number;
  offset?: number;
  orders?: unknown[];
};

export type OrdersCreateBody = Record<string, unknown>;

export type OrdersCreateData = {
  order_id?: number;
  checkout_id?: number;
  order_status?: OrderStatus;
  payment_status?: string;
  redirect_url?: string;
  status_code?: number;
};

export type OrdersDetailData = {
  order?: Order;
  status_history?: StatusHistory[];
  price_details?: PriceDetails;
  payment_details?: PaymentDetails;
  delivery_details?: DeliveryDetails;
  courier_tracking?: CourierTracking;
};

export type OrdersCheckoutBody = Record<string, unknown>;

export type OrdersCheckoutData = {
  checkout_id?: number;
  items_total_price?: number;
  delivery_fee?: number;
  delivery_charge?: number;
  service_fee?: number;
  packet_fee?: number;
  minimum_order_fee?: number;
  is_delivery_free?: boolean;
  total_amount?: number;
  total_discount?: number;
  payable_amount?: number;
  bonus_payment?: number;
  bonus_spent?: number;
  total_bonus?: number;
  total_bonus_earned?: number;
  applied_offer?: Record<string, unknown>;
  applied_promo?: Record<string, unknown>;
  delivery_time?: string;
  delivery_time_min?: number;
  delivery_time_max?: number;
  tip_config?: TipConfig;
  price_details?: PriceDetails;
};

export type OrdersRateBody = {
  order_rating?: number;
  courier_rating?: number;
  comment?: string;
};

export type PaymentSaveCardBody = Record<string, unknown>;

export type PaymentSaveCardData = {
  success?: boolean;
  message?: string;
  payment_card_id?: number;
  redirect_url?: string; // Bank 3-D Secure / card-binding webview URL.
  custom_url?: string;
};

export type PaymentWalletGoogleGetData = {
  url?: string;
};

export type CouponsPromoCodesData = {
  promoCodes?: unknown[];
  count?: number;
};

export type CouponsPromoApplyBody = {
  code?: string;
};

export type CouponsPromoApplyData = {
  applied_promo?: AppliedPromoCode;
  applied_offer?: AppliedOffer;
  total_discount?: number;
  total_amount?: number;
  payable_amount?: number;
  message?: string;
  status_code?: number;
};

export type CouponsGlobalData = {
  data?: {
    is_qr?: boolean;
    image?: {
      size?: number;
      mime_type?: string;
      id?: number;
      extension?: string;
      object_key?: string;
    };
    name?: string;
    id?: string;
    discount_value?: Decimal; // Decimal string; a percentage for percent / cashback, an amount for fixed.
    start_date?: string; // Baku wall-clock written with a trailing Z — do NOT convert from UTC.
    end_date?: string; // Baku wall-clock written with a trailing Z — do NOT convert from UTC.
    used_at?: unknown;
    description?: string;
    code?: string;
    discount_type?: string;
    status?: string;
    type?: string;
    is_expired?: boolean;
    is_popular?: boolean;
    price?: string;
  }[];
  total?: number;
};

export type LotteryActiveData = {
  ticketsCount?: number;
  activeLottery?: {
    id?: number;
    name?: string;
    uploads?: {
      id?: number;
      object_key?: string;
      size?: number;
      mime_type?: string;
      extension?: string;
      type?: string;
      deleted_at?: unknown;
      created_at?: string;
      updated_at?: string;
    };
    lotteries_uploads?: {
      uploads?: {
        id?: number;
        object_key?: string;
        size?: number;
        mime_type?: string;
        extension?: string;
        type?: string;
        deleted_at?: unknown;
        created_at?: string;
        updated_at?: string;
      };
    }[];
  };
};

export interface LotteryActiveDetailsQuery {
  lottery_id: number; // Id of the active lottery (`lotteries/active` → `data.activeLottery.id`).
}

export type LotteryActiveDetailsData = ActiveLotteryDetailsData;

export type LotteryPolicyData = {
  content?: string; // HTML.
};

export interface LotteryTicketsQuery {
  lottery_id: number; // Id of the active lottery (`lotteries/active` → `data.activeLottery.id`).
  limit?: number; // Page size (default 10).
  offset?: number; // Rows to skip.
}

export type LotteryTicketsData = ApiLotteryTicket[];

export interface LoyaltyBonusTransactionsQuery {
  source_type: "online" | "offline";
  limit?: number; // Default 50; above 50 → 422.
  offset?: number;
}

export type LoyaltyBonusTransactionsData = {
  data?: {
    source_id?: string;
    source_type?: string;
    id?: string;
    store_name?: string;
    created_at?: string;
    earned_bonus?: number;
    total_amount?: number;
    spent_bonus?: number;
    cardno?: string;
  }[];
  total?: number;
};

export interface NotificationsListQuery {
  limit?: number; // Default 10.
  offset?: number;
}

export type NotificationsListData = {
  data?: {
    image?: {
      size?: number;
      mime_type?: string;
      id?: number;
      extension?: string;
      created_at?: string;
      object_key?: string;
      type?: string;
      updated_at?: string;
      deleted_at?: unknown;
    } | null;
    createdAt?: string; // No time-zone suffix (`YYYY-MM-DDTHH:mm:ss`). Appears to be UTC (a row's createdAt is minutes after its own image.created_at, which is UTC) —
    id?: number;
    title?: string;
    type?: string;
    content?: string;
    isRead?: boolean;
  }[];
  total?: number;
};

export type NotificationsMarkReadBody = {
  ids?: number[];
};

export type NotificationsUnreadCountData = number;

export type HomeSlidersData = (Record<string, unknown>)[];

export type ProfilePrivacyPoliciesData = {
  content?: string;
  locale?: string;
}[];

export interface AuthCitiesQuery {
  country_id: number; // REQUIRED — 400 "Bad request" without it. Azerbaijan = 1
}

export type AuthCitiesData = {
  countries?: {
    country_translations?: {
      locale?: string;
      name?: string;
    }[];
    id?: number;
  };
  city_translations?: {
    locale?: string;
    name?: string;
  }[];
  id?: number;
}[];

export type PartnersPartnersData = {
  image?: {
    size?: number;
    mime_type?: string;
    id?: number;
    extension?: string;
    object_key?: string;
  };
  name?: string;
  id?: string;
}[];

export type PartnersModuleData = {
  image?: {
    size?: number;
    mime_type?: string;
    id?: number;
    extension?: string;
    object_key?: string;
  };
  name?: string;
  id?: string;
  branch_count?: number;
  social_media_data?: {
    icon?: {
      id?: number;
      object_key?: string;
      size?: number;
      mime_type?: string;
      extension?: string;
      type?: string;
      deleted_at?: unknown;
      created_at?: string;
      updated_at?: string;
    };
    link?: string;
  }[];
}[];

export type PartnersBranchesData = {
  bonus_percentage?: number;
  image?: {
    size?: number;
    mime_type?: string;
    id?: number;
    extension?: string;
    object_key?: string;
  };
  phone?: unknown;
  name?: string;
  id?: string;
  lng?: unknown; // Numeric string or null. null on 191 of 197 live branches; "1" is junk.
  open_time?: unknown; // Mostly null (non-null on 7 of 197 live branches).
  lat?: unknown; // Numeric string or null. null on 191 of 197 live branches; "1" is junk.
  close_time?: unknown; // Mostly null (non-null on 7 of 197 live branches).
  address?: unknown;
  social_media_data?: {
    link?: string;
    icon?: {
      size?: number;
      mime_type?: string;
      id?: number;
      extension?: string;
      created_at?: string;
      object_key?: string;
      type?: string;
      updated_at?: string;
      deleted_at?: unknown;
    };
  }[];
}[];

export type PartnersPlusCategoriesData = {
  total?: number;
  categories?: {
    image?: {
      size?: number;
      mime_type?: string;
      id?: number;
      extension?: string;
      object_key?: string;
    };
    name?: string;
    id?: number;
    active_campaigns?: {
      name?: string;
      id?: number;
    }[];
  }[];
};

export interface PartnersPlusProductsQuery {
  category_id?: number; // Store chain from /ozio-plus/categories (2 Bolmart, 3 Megastore, 4 Grandmart). Needed for price_info to be filled.
  limit?: number;
  offset?: number; // Pagination offset (verified: limit=5&offset=5 returns the next page).
}

export type PartnersPlusProductsData = {
  total?: number;
  products?: {
    id?: number;
    price_info?: {
      old_price?: Decimal; // decimal as string
      discount_percentage?: number;
      new_price?: Decimal; // decimal as string
    };
    name?: string;
    material_code?: string;
    image?: {
      id?: number;
      mime_type?: string;
      extension?: string;
      object_key?: string;
    };
  }[];
};

export type ProfileFileUploadBody = {
  file?: string;
};

export type ProfileFileUploadData = UploadsModel;

export interface StoreProductsQuery {
  category_id?: number;
  keyword?: string; // In-store product search
  limit?: number;
  offset?: number;
}

export type StoreProductsData = {
  products?: {
    id?: number;
    price?: Decimal; // decimal as string
    stock?: string;
    mrp?: Decimal; // decimal as string
    min_order_quantity?: unknown;
    max_order_quantity?: unknown;
    stores?: {
      id?: number;
      address?: string;
      store_bonus_percentages?: {
        percentage?: string;
        updated_at?: string;
        id?: number;
        created_at?: string;
        store_id?: number;
        start_date?: string;
        deleted_at?: string | null;
      }[]; // History of bonus rates, newest first. Current rate = the newest entry whose start_date has passed (do not take [0] blindly).
      has_packet?: boolean;
      have_not_vegan?: boolean;
      have_vegan?: boolean;
      stores_store_holidays?: unknown[];
      is_popular?: boolean;
      rating?: string;
      rating_count?: number;
      status?: string;
      store_code?: string;
      open_time?: string; // Baku wall-clock time written with a trailing Z (date part is 1970-01-01): read HH:mm literally, do NOT convert from UTC. GET /stores/{id} se
      close_time?: string; // Baku wall-clock time written with a trailing Z (date part is 1970-01-01): read HH:mm literally, do NOT convert from UTC. GET /stores/{id} se
      preparation_time?: number;
      store_translations?: {
        name?: string;
        locale?: string;
      }[];
      modules?: {
        id?: number;
        type?: string;
        module_translations?: {
          name?: string;
          locale?: string;
        }[];
      };
      currencies?: {
        id?: number;
        code?: string;
        currency_translations?: {
          name?: string;
          locale?: string;
        }[];
        tips?: {
          value?: number;
          id?: number;
        }[];
      };
      zones?: {
        id?: number;
        zone_translations?: {
          name?: string;
          locale?: string;
        }[];
        type?: string;
        cities?: {
          id?: number;
          city_translations?: {
            name?: string;
            locale?: string;
          }[];
          countries?: {
            id?: number;
            country_translations?: {
              name?: string;
              locale?: string;
            }[];
          };
        };
        zone_pricings?: {
          currencies?: {
            code?: string;
            id?: number;
            currency_translations?: {
              locale?: string;
              name?: string;
            }[];
            tips?: {
              value?: number;
              id?: number;
            }[];
          };
          price_per_km?: Decimal; // decimal as string
          id?: number;
        }[];
      };
      cities?: {
        id?: number;
        city_translations?: {
          name?: string;
          locale?: string;
        }[];
        countries?: {
          id?: number;
          country_translations?: {
            name?: string;
            locale?: string;
          }[];
        };
      };
      store_branches?: {
        id?: number;
        store_branch_translations?: {
          name?: string;
          locale?: string;
        }[];
        store_branches_uploads?: {
          uploads?: {
            id?: number;
            object_key?: string;
            size?: number;
            mime_type?: string;
            extension?: string;
          };
        }[];
      };
    };
    _count?: {
      user_favorite_store_product_variants?: number;
    };
    store_product_variants?: {
      id?: number;
      material_code?: string;
      is_recommended?: boolean;
      is_organic?: boolean;
      is_halal?: boolean;
      is_vegan?: boolean;
      is_popular_item?: boolean;
      width?: string;
      height?: string;
      length?: string;
      quantity?: string;
      volume?: string;
      has_weight?: boolean;
      sold_by_gram?: boolean;
      store_product_variant_barcodes?: {
        barcode?: string;
      }[];
      store_product_variant_uploads?: {
        id?: number;
        object_key?: string;
        size?: number;
        mime_type?: string;
        extension?: string;
        type?: string;
      }[];
      units?: {
        id?: number;
        symbol?: string;
        conversion?: string;
        unit_translations?: {
          locale?: string;
          name?: string;
        }[];
        unit_types?: {
          id?: number;
          unit_type_translations?: {
            name?: string;
          }[];
        };
      };
      colors?: unknown;
      store_products?: {
        id?: number;
        tax_value?: string;
        tax_type?: string;
        brands?: {
          id?: number;
          brand_translations?: {
            name?: string;
            locale?: string;
          }[];
          brands_uploads?: {
            uploads?: {
              id?: number;
              object_key?: string;
              size?: number;
              mime_type?: string;
              extension?: string;
            };
          }[];
        };
        store_products_categories?: {
          categories?: {
            id?: number;
            categories_uploads?: {
              uploads?: {
                id?: number;
                object_key?: string;
                mime_type?: string;
                size?: number;
                extension?: string;
              };
            }[];
            category_translations?: {
              name?: string;
            }[];
          };
        }[];
      };
      store_product_variant_translations?: {
        name?: string;
        description?: unknown;
      }[];
    };
  }[];
  total?: number;
};

export type ProductDetailData = {
  id?: number;
  price?: Decimal; // decimal as string
  stock?: string;
  mrp?: Decimal; // decimal as string
  min_order_quantity?: unknown;
  max_order_quantity?: unknown;
  stores?: {
    id?: number;
    address?: string;
    store_bonus_percentages?: {
      percentage?: string;
      updated_at?: string;
      id?: number;
      created_at?: string;
      store_id?: number;
      start_date?: string;
      deleted_at?: string | null;
    }[]; // History of bonus rates, newest first. Current rate = the newest entry whose start_date has passed (do not take [0] blindly).
    has_packet?: boolean;
    have_not_vegan?: boolean;
    have_vegan?: boolean;
    stores_store_holidays?: unknown[];
    is_popular?: boolean;
    rating?: string;
    rating_count?: number;
    status?: string;
    store_code?: string;
    open_time?: string; // Baku wall-clock time written with a trailing Z (date part is 1970-01-01): read HH:mm literally, do NOT convert from UTC. GET /stores/{id} se
    close_time?: string; // Baku wall-clock time written with a trailing Z (date part is 1970-01-01): read HH:mm literally, do NOT convert from UTC. GET /stores/{id} se
    preparation_time?: number;
    store_translations?: {
      name?: string;
      locale?: string;
    }[];
    modules?: {
      id?: number;
      type?: string;
      module_translations?: {
        name?: string;
        locale?: string;
      }[];
    };
    currencies?: {
      id?: number;
      code?: string;
      currency_translations?: {
        name?: string;
        locale?: string;
      }[];
      tips?: {
        value?: number;
        id?: number;
      }[];
    };
    zones?: {
      id?: number;
      zone_translations?: {
        name?: string;
        locale?: string;
      }[];
      type?: string;
      cities?: {
        id?: number;
        city_translations?: {
          name?: string;
          locale?: string;
        }[];
        countries?: {
          id?: number;
          country_translations?: {
            name?: string;
            locale?: string;
          }[];
        };
      };
      zone_pricings?: {
        currencies?: {
          code?: string;
          id?: number;
          currency_translations?: {
            locale?: string;
            name?: string;
          }[];
          tips?: {
            value?: number;
            id?: number;
          }[];
        };
        price_per_km?: Decimal; // decimal as string
        id?: number;
      }[];
    };
    cities?: {
      id?: number;
      city_translations?: {
        name?: string;
        locale?: string;
      }[];
      countries?: {
        id?: number;
        country_translations?: {
          name?: string;
          locale?: string;
        }[];
      };
    };
    store_branches?: {
      id?: number;
      store_branch_translations?: {
        name?: string;
        locale?: string;
      }[];
      store_branches_uploads?: {
        uploads?: {
          id?: number;
          object_key?: string;
          size?: number;
          mime_type?: string;
          extension?: string;
        };
      }[];
    };
  };
  _count?: {
    user_favorite_store_product_variants?: number;
  };
  store_product_variants?: {
    id?: number;
    material_code?: string;
    is_recommended?: boolean;
    is_organic?: boolean;
    is_halal?: boolean;
    is_vegan?: boolean;
    is_popular_item?: boolean;
    width?: string;
    height?: string;
    length?: string;
    quantity?: string;
    volume?: string;
    has_weight?: boolean;
    sold_by_gram?: boolean;
    store_product_variant_barcodes?: {
      barcode?: string;
    }[];
    store_product_variant_uploads?: {
      id?: number;
      object_key?: string;
      size?: number;
      mime_type?: string;
      extension?: string;
      type?: string;
    }[];
    units?: {
      id?: number;
      symbol?: string;
      conversion?: string;
      unit_translations?: {
        locale?: string;
        name?: string;
      }[];
      unit_types?: {
        id?: number;
        unit_type_translations?: {
          name?: string;
        }[];
      };
    };
    colors?: unknown;
    store_products?: {
      id?: number;
      tax_value?: string;
      tax_type?: string;
      brands?: {
        id?: number;
        brand_translations?: {
          name?: string;
          locale?: string;
        }[];
        brands_uploads?: {
          uploads?: {
            id?: number;
            object_key?: string;
            size?: number;
            mime_type?: string;
            extension?: string;
          };
        }[];
      };
      store_products_categories?: {
        categories?: {
          id?: number;
          categories_uploads?: {
            uploads?: {
              id?: number;
              object_key?: string;
              mime_type?: string;
              size?: number;
              extension?: string;
            };
          }[];
          category_translations?: {
            name?: string;
          }[];
        };
      }[];
    };
    store_product_variant_translations?: {
      name?: string;
      description?: unknown;
    }[];
  };
};

export type ProductSimilarData = {
  products?: {
    _count?: {
      user_favorite_store_product_variants?: number;
    };
    store_product_variants?: {
      is_favorite?: boolean;
      id?: number;
      sold_by_gram?: boolean;
      is_halal?: boolean;
      has_weight?: boolean;
      width?: string;
      is_vegan?: boolean;
      material_code?: string;
      is_recommended?: boolean;
      volume?: string;
      colors?: unknown;
      units?: {
        unit_translations?: {
          locale?: string;
          name?: string;
        }[];
        conversion?: Decimal; // decimal as string
        unit_types?: {
          unit_type_translations?: {
            name?: string;
          }[];
          id?: number;
        };
        id?: number;
        symbol?: string;
      };
      length?: string;
      is_organic?: boolean;
      is_popular_item?: boolean;
      quantity?: string;
      store_products?: {
        brands?: {
          brand_translations?: {
            locale?: string;
            name?: string;
          }[];
          id?: number;
          brands_uploads?: {
            uploads?: {
              size?: number;
              mime_type?: string;
              id?: number;
              extension?: string;
              object_key?: string;
            };
          }[];
        };
        id?: number;
        store_products_categories?: {
          categories?: {
            category_translations?: {
              name?: string;
            }[];
            id?: number;
            categories_uploads?: {
              uploads?: {
                size?: number;
                mime_type?: string;
                id?: number;
                extension?: string;
                object_key?: string;
              };
            }[];
          };
        }[];
        tax_value?: string;
        tax_type?: string;
      };
      store_product_variant_uploads?: {
        size?: number;
        mime_type?: string;
        id?: number;
        extension?: string;
        object_key?: string;
        type?: string;
      }[];
      store_product_variant_translations?: {
        description?: unknown;
        name?: string;
      }[];
      height?: string;
      barcodes?: string[];
    };
    stores?: {
      id?: number;
      store_translations?: {
        locale?: string;
        name?: string;
      }[];
      store_branches?: {
        store_branch_translations?: {
          locale?: string;
          name?: string;
        }[];
        store_branches_uploads?: {
          uploads?: {
            size?: number;
            mime_type?: string;
            id?: number;
            extension?: string;
            object_key?: string;
          };
        }[];
        id?: number;
      };
      cities?: {
        countries?: {
          country_translations?: {
            locale?: string;
            name?: string;
          }[];
          id?: number;
        };
        city_translations?: {
          locale?: string;
          name?: string;
        }[];
        id?: number;
      };
      status?: string;
      has_packet?: boolean;
      is_popular?: boolean;
      close_time?: string; // Baku wall-clock time written with a trailing Z (date part is 1970-01-01): read HH:mm literally, do NOT convert from UTC. GET /stores/{id} se
      address?: string;
      store_bonus_percentages?: {
        percentage?: string;
        updated_at?: string;
        id?: number;
        created_at?: string;
        store_id?: number;
        start_date?: string;
        deleted_at?: string | null;
      }[]; // History of bonus rates, newest first. Current rate = the newest entry whose start_date has passed (do not take [0] blindly).
      store_code?: string;
      have_not_vegan?: boolean;
      modules?: {
        type?: string;
        module_translations?: {
          locale?: string;
          name?: string;
        }[];
        id?: number;
      };
      rating?: string;
      currencies?: {
        code?: string;
        id?: number;
        currency_translations?: {
          locale?: string;
          name?: string;
        }[];
        tips?: {
          value?: number;
          id?: number;
        }[];
      };
      open_time?: string; // Baku wall-clock time written with a trailing Z (date part is 1970-01-01): read HH:mm literally, do NOT convert from UTC. GET /stores/{id} se
      have_vegan?: boolean;
      stores_store_holidays?: unknown[];
      preparation_time?: number;
      zones?: {
        cities?: {
          countries?: {
            country_translations?: {
              locale?: string;
              name?: string;
            }[];
            id?: number;
          };
          city_translations?: {
            locale?: string;
            name?: string;
          }[];
          id?: number;
        };
        id?: number;
        zone_pricings?: {
          currencies?: {
            code?: string;
            id?: number;
            currency_translations?: {
              locale?: string;
              name?: string;
            }[];
            tips?: {
              value?: number;
              id?: number;
            }[];
          };
          price_per_km?: Decimal; // decimal as string
          id?: number;
        }[];
        type?: string;
        zone_translations?: {
          locale?: string;
          name?: string;
        }[];
      };
      rating_count?: number;
    };
    id?: number;
    mrp?: string;
    stock?: string;
    max_order_quantity?: unknown;
    price?: string;
    min_order_quantity?: unknown;
  }[];
  total?: number;
};

export type PartnersPlusCampaignsData = {
  total?: number;
  campaigns?: {
    id?: number;
    category_id?: number;
    name?: string;
    start_date?: string;
    end_date?: string;
  }[];
};


// ---------------------------------------------------------------------------
// Contract map: endpoint name -> request/response types (used by api-client.ts)
// ---------------------------------------------------------------------------
export interface EndpointContracts {
  AuthLogin: { query: void; body: AuthLoginBody; data: unknown; path: void };
  AuthOtpVerify: { query: void; body: AuthOtpVerifyBody; data: AuthOtpVerifyData; path: void };
  AuthCompleteRegistration: { query: void; body: AuthCompleteRegistrationBody; data: AuthCompleteRegistrationData; path: void };
  AuthRefresh: { query: void; body: AuthRefreshBody; data: AuthRefreshData; path: void };
  AuthLogout: { query: void; body: void; data: unknown; path: void };
  ProfileMe: { query: void; body: void; data: ProfileMeData; path: void };
  ProfileUpdateMe: { query: void; body: ProfileUpdateMeBody; data: unknown; path: void };
  ProfileDeleteMe: { query: void; body: void; data: unknown; path: void };
  PaymentCards: { query: void; body: void; data: PaymentCardsData; path: void };
  PaymentDeleteCard: { query: void; body: void; data: unknown; path: { id: number | string } };
  AddressList: { query: void; body: void; data: AddressListData; path: void };
  AddressCreate: { query: void; body: AddressCreateBody; data: unknown; path: void };
  AddressGet: { query: void; body: void; data: AddressGetData; path: { id: number | string } };
  AddressUpdate: { query: void; body: AddressUpdateBody; data: unknown; path: { id: number | string } };
  AddressDelete: { query: void; body: void; data: unknown; path: { id: number | string } };
  AddressPatch: { query: void; body: void; data: unknown; path: { id: number | string } };
  StoreSearch: { query: StoreSearchQuery; body: void; data: StoreSearchData; path: void };
  StoreDetail: { query: void; body: void; data: StoreDetailData; path: { id: number | string } };
  StoreFavoritesList: { query: void; body: void; data: StoreFavoritesListData; path: void };
  StoreFavoriteAdd: { query: void; body: StoreFavoriteAddBody; data: unknown; path: void };
  StoreFavoriteRemove: { query: StoreFavoriteRemoveQuery; body: void; data: unknown; path: void };
  StoreStoreCategories: { query: StoreStoreCategoriesQuery; body: void; data: StoreStoreCategoriesData; path: void };
  StoreProductCategories: { query: StoreProductCategoriesQuery; body: void; data: StoreProductCategoriesData; path: void };
  HomeHighlights: { query: void; body: void; data: HomeHighlightsData; path: void };
  HomeHighlightProducts: { query: void; body: void; data: HomeHighlightProductsData; path: { id: number | string } };
  CartList: { query: void; body: void; data: CartListData; path: void };
  CartAction: { query: void; body: CartActionBody; data: CartActionData; path: void };
  PartnersTenCarts: { query: void; body: void; data: PartnersTenCartsData; path: void };
  PartnersTenCartsAdd: { query: void; body: PartnersTenCartsAddBody; data: unknown; path: void };
  OrdersList: { query: OrdersListQuery; body: void; data: OrdersListData; path: void };
  OrdersCreate: { query: void; body: OrdersCreateBody; data: OrdersCreateData; path: void };
  OrdersDetail: { query: void; body: void; data: OrdersDetailData; path: { id: number | string } };
  OrdersCheckout: { query: void; body: OrdersCheckoutBody; data: OrdersCheckoutData; path: void };
  OrdersRate: { query: void; body: OrdersRateBody; data: unknown; path: { id: number | string } };
  PaymentSaveCard: { query: void; body: PaymentSaveCardBody; data: PaymentSaveCardData; path: void };
  PaymentWalletGooglePost: { query: void; body: void; data: unknown; path: void };
  PaymentWalletGoogleGet: { query: void; body: void; data: PaymentWalletGoogleGetData; path: void };
  CouponsPromoCodes: { query: void; body: void; data: CouponsPromoCodesData; path: void };
  CouponsPromoApply: { query: void; body: CouponsPromoApplyBody; data: CouponsPromoApplyData; path: void };
  CouponsGlobal: { query: void; body: void; data: CouponsGlobalData; path: void };
  LotteryActive: { query: void; body: void; data: LotteryActiveData; path: void };
  LotteryActiveDetails: { query: LotteryActiveDetailsQuery; body: void; data: LotteryActiveDetailsData; path: void };
  LotteryPolicy: { query: void; body: void; data: LotteryPolicyData; path: void };
  LotteryTickets: { query: LotteryTicketsQuery; body: void; data: LotteryTicketsData; path: void };
  LoyaltyBonusTransactions: { query: LoyaltyBonusTransactionsQuery; body: void; data: LoyaltyBonusTransactionsData; path: void };
  NotificationsList: { query: NotificationsListQuery; body: void; data: NotificationsListData; path: void };
  NotificationsClear: { query: void; body: void; data: unknown; path: void };
  NotificationsMarkRead: { query: void; body: NotificationsMarkReadBody; data: unknown; path: void };
  NotificationsUnreadCount: { query: void; body: void; data: NotificationsUnreadCountData; path: void };
  HomeSliders: { query: void; body: void; data: HomeSlidersData; path: void };
  ProfilePrivacyPolicies: { query: void; body: void; data: ProfilePrivacyPoliciesData; path: void };
  AuthCities: { query: AuthCitiesQuery; body: void; data: AuthCitiesData; path: void };
  PartnersPartners: { query: void; body: void; data: PartnersPartnersData; path: void };
  PartnersModule: { query: void; body: void; data: PartnersModuleData; path: { id: number | string } };
  PartnersBranches: { query: void; body: void; data: PartnersBranchesData; path: { id: number | string } };
  PartnersPlusCategories: { query: void; body: void; data: PartnersPlusCategoriesData; path: void };
  PartnersPlusProducts: { query: PartnersPlusProductsQuery; body: void; data: PartnersPlusProductsData; path: void };
  ProfileFileUpload: { query: void; body: ProfileFileUploadBody; data: ProfileFileUploadData; path: void };
  NotificationsSocket: { query: void; body: void; data: unknown; path: void };
  StoreProducts: { query: StoreProductsQuery; body: void; data: StoreProductsData; path: { storeId: number | string } };
  ProductDetail: { query: void; body: void; data: ProductDetailData; path: { storeId: number | string; id: number | string } };
  ProductSimilar: { query: void; body: void; data: ProductSimilarData; path: { storeId: number | string; id: number | string } };
  PartnersPlusCampaigns: { query: void; body: void; data: PartnersPlusCampaignsData; path: void };
}

// ===========================================================================
// HAND-WRITTEN AUGMENTATION (from the Flutter tolerant parsers, lib/modules/*/data)
// ===========================================================================

/** Normalised auth bundle (Flutter AuthTokens). Server keys vary: access_token|accessToken|token; refresh_token|refreshToken. */
export interface AuthTokens {
  accessToken?: string;
  refreshToken?: string;       // never seen on live so far; optional
  tokenType?: string;
  isRegistered: boolean;       // default TRUE when the key is missing
  isLoggedIn: boolean;
  deviceToken?: string;
}
/** Raw login bundle incl. aliases. May sit at data, data.data or be the bare map. */
export interface LoginBundleRaw {
  access_token?: string; accessToken?: string; token?: string;
  refresh_token?: string; refreshToken?: string;
  token_type?: string; tokenType?: string;
  is_registered?: boolean; isRegistered?: boolean; registered?: boolean;
  is_logged_in?: boolean; isLoggedIn?: boolean;
  device_token?: string; deviceToken?: string;
  data?: LoginBundleRaw;
}

// OrderStatus is the generated component type above.
export const ACTIVE_ORDER_STATUSES: OrderStatus[] = ['order_waiting', 'order_accepted', 'order_preparing', 'order_ready', 'order_picked_up'];
/** Lit segments (0..4) of the Accepted / Packing / On the way / Delivered strip. */
export const ORDER_STATUS_STEP: Record<OrderStatus, number> = {
  order_waiting: 0, order_accepted: 1, order_preparing: 2, order_ready: 2, order_picked_up: 3, order_delivered: 4, order_cancelled: 0, order_not_found: 0,
};
export type PaymentState = 'paid' | 'failed' | 'pending';
/** Substring classification used by Flutter (real payment_status values are not captured). Unknown => pending. */
export function paymentStateOf(raw: string | null | undefined): PaymentState {
  const s = (raw ?? '').trim().toLowerCase();
  if (!s) return 'pending';
  if (['fail', 'declin', 'reject', 'cancel', 'error', 'expire', 'refus', 'denied'].some((k) => s.includes(k))) return 'failed';
  if (['unpaid', 'not_paid', 'notpaid', 'not paid', 'pending', 'wait', 'process', 'hold'].some((k) => s.includes(k))) return 'pending';
  if (['paid', 'success', 'succeed', 'complete', 'approved', 'captured'].some((k) => s.includes(k))) return 'paid';
  return 'pending';
}

/** POST v2/carts/action body (verified). One call = one DELTA on the line. */
export interface CartActionRequest {
  store_id: number;
  product_id: number;          // store-product ROW id (NOT the variant id)
  quantity: number;            // product unit: count, or KG for sold_by_gram products. > 0, <= 3 decimals
  action: 'add' | 'remove';    // 'increase' | 'decrease' => 422
}
export function normalizeCartQuantity(q: number): number {
  const milli = Math.round(q * 1000);
  return milli % 1000 === 0 ? milli / 1000 : milli / 1000;
}
/** Request that moves a line from `current` to `target` (unit terms); null when nothing changes. */
export function cartChange(storeId: number, productId: number, current: number, target: number): CartActionRequest | null {
  const from = Math.max(0, current), to = Math.max(0, target);
  const delta = normalizeCartQuantity(to - from);
  if (delta === 0) return null;
  if (delta > 0) return { store_id: storeId, product_id: productId, quantity: delta, action: 'add' };
  if (to <= 0) return { store_id: storeId, product_id: productId, quantity: normalizeCartQuantity(from), action: 'remove' };
  return { store_id: storeId, product_id: productId, quantity: normalizeCartQuantity(-delta), action: 'remove' }; // partial remove: UNVERIFIED
}

/** POST v2/orders/checkout body as sent by Flutter. */
export interface CheckoutRequest {
  cart_id: number;
  delivery: { latitude: number; longitude: number; address_id?: number };
  payment_method: 'card' | 'cash';
  payment_card_id?: number;
  promo_code?: string;
  use_bonus: boolean;
}
/** POST v2/orders body (UNVERIFIED): checkout body + checkout_id. */
export interface CreateOrderRequest extends CheckoutRequest { checkout_id?: string }
export interface CheckoutBreakdown {
  item_total_price?: Decimal; item_total_mrp?: Decimal; total_discount?: Decimal; minimum_order_fee?: Decimal;
  service_fee?: Decimal; packet_fee?: Decimal; delivery_fee?: Decimal; courier_tip?: Decimal; bonus_payment?: Decimal;
}
/** Live checkout calc (2026-11-12) + legacy flat aliases still read by Flutter. */
export interface CheckoutCalcRaw {
  id?: string; checkout_id?: string;
  amount?: Decimal; payable_amount?: Decimal;
  breakdown?: CheckoutBreakdown;
  delivery_details?: { is_free?: boolean; out_of_zone?: boolean; distance_meters?: number; [k: string]: unknown };
  tip_config?: { max_allowed_tip?: number; options?: { value: number }[] };
  is_store_closed?: boolean; purchasing_disabled?: boolean; purchasing_disabled_reasons?: Record<string, string>;
  earned_bonus?: Decimal; total_bonus_earned?: Decimal; total_bonus?: Decimal;
  applied_promo?: unknown; expires_at?: number;
  // legacy
  items_total_price?: Decimal; delivery_fee?: Decimal; delivery_charge?: Decimal; service_fee?: Decimal; packet_fee?: Decimal;
  is_delivery_free?: boolean; total_amount?: Decimal; total_discount?: Decimal; bonus_payment?: Decimal; bonus_spent?: Decimal;
  delivery_time?: string; delivery_time_min?: number; delivery_time_max?: number;
  data?: CheckoutCalcRaw; price_details?: CheckoutCalcRaw;
}
export interface CreateOrderResultRaw {
  order_id?: number; id?: number; checkout_id?: string;
  order_status?: OrderStatus | string; status?: OrderStatus | string;
  payment_status?: string; redirect_url?: string; custom_url?: string;
}
/** GET v2/orders list data. Legacy keys are merged by Flutter and de-duplicated by order id. */
export interface OrdersListRaw {
  total?: number; limit?: number; offset?: number;
  orders?: unknown[]; active?: unknown[]; data?: unknown[]; past_delivered?: unknown[]; past?: unknown[]; history?: unknown[];
}

/** Bonus transaction row (live 2026-11-12). Amounts are numbers. */
export interface BonusTransactionRow {
  id?: number; source_id?: number; source_type?: 'offline' | 'online'; cardno?: string;
  created_at?: ISODateTime;  // UTC
  store_name?: string; total_amount?: number; earned_bonus?: number; spent_bonus?: number;
}
export interface BonusTransactionsPage { data?: BonusTransactionRow[]; total?: number }

export interface NotificationRow {
  id?: number; title?: string; content?: string; type?: string; isRead?: boolean;
  createdAt?: string;  // NO zone suffix, is UTC -> append 'Z' before parsing
  image?: { object_key?: string; mime_type?: string } | null;
}
export interface NotificationsPage { data?: NotificationRow[]; total?: number }

/** Coupon row of GET coupons/global (live). */
export interface GlobalCoupon {
  id?: number; code?: string; status?: 'unlimit' | 'used' | 'expired' | 'inactive' | string; name?: string; description?: string;
  price?: Decimal; type?: 'online' | 'offline' | 'both' | string; is_popular?: boolean;
  discount_type?: 'percent' | 'cashback' | 'fixed' | string; discount_value?: Decimal; is_qr?: boolean;
  start_date?: string;  // Baku wall-clock + trailing Z
  end_date?: string; is_expired?: boolean; used_at?: string | null; image?: { object_key?: string } | null;
}

export type Translations = Translation[] | null | undefined;

// ---------------------------------------------------------------------------
// Client-side failure union (mirror of Flutter Failure / FailureKind)
// ---------------------------------------------------------------------------
export type FailureKind = 'network' | 'timeout' | 'unauthorized' | 'notFound' | 'server' | 'parse' | 'unknown' | 'rateLimited';
export interface FieldError { path: string; message: string }
export interface Failure {
  kind: FailureKind;
  message: string;            // server's own text when hasServerMessage, else a client fallback (localise in UI)
  statusCode?: number;
  fieldErrors: FieldError[];  // 422 only
  hasServerMessage: boolean;
}
export type Result<T> = { ok: true; value: T; message?: string } | { ok: false; failure: Failure };

// ---------------------------------------------------------------------------
// Tolerant coercion helpers (port of lib/core/network/json.dart)
// ---------------------------------------------------------------------------
export const asArray = <T = unknown>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);
export const asMap = (v: unknown): Record<string, any> => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, any>) : {});
export function toNumber(v: unknown, fallback = 0): number {
  if (typeof v === 'number') return Number.isFinite(v) ? v : fallback;
  if (typeof v === 'string') { const n = Number(v.trim().replace(',', '.')); return Number.isFinite(n) ? n : fallback; }
  return fallback;
}
export const toNumberOrNull = (v: unknown): number | null => (v === null || v === undefined || v === '' ? null : (Number.isFinite(toNumber(v, NaN)) ? toNumber(v, NaN) : null));
export function toBool(v: unknown, fallback = false): boolean {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number') return v !== 0;
  if (typeof v === 'string') { const s = v.trim().toLowerCase(); if (['true', '1', 'yes'].includes(s)) return true; if (['false', '0', 'no'].includes(s)) return false; }
  return fallback;
}
/** First non-null value among candidate keys (API is inconsistent about names). */
export function pick(obj: Record<string, any>, keys: string[]): any {
  for (const k of keys) if (obj[k] !== undefined && obj[k] !== null) return obj[k];
  return undefined;
}
/** First translation text, preferring `locale`, then 'az', then any. */
export function tr(list: Translations, locale = 'az', key: 'name' | 'description' = 'name'): string {
  const rows = asArray<Translation>(list);
  const row = rows.find((r) => r.locale === locale) ?? rows.find((r) => r.locale === 'az') ?? rows[0];
  return (((row as Record<string, any> | undefined)?.[key]) ?? '').trim();
}
/** Current bonus %: newest entry with start_date <= now and not deleted. */
export function currentBonus(entries: { percentage?: Decimal; start_date?: string; deleted_at?: string | null }[] | null | undefined, now = new Date()): number {
  let best: Date | null = null; let bonus = 0;
  for (const b of asArray<any>(entries)) {
    if (b.deleted_at) continue;
    const d = b.start_date ? new Date(b.start_date) : null;
    if (!d || isNaN(+d) || d > now) continue;
    if (!best || d > best) { best = d; bonus = toNumber(b.percentage); }
  }
  return bonus;
}
/** Baku wall-clock time written with a trailing Z: read HH:mm literally. Returns "HH:mm". */
export const bakuClock = (iso: string | undefined): string => (iso ?? '').slice(11, 16);
/** `createdAt` without zone (notifications) is UTC. */
export const parseZoneless = (s: string): Date => new Date(/[zZ]|[+-]\d\d:?\d\d$/.test(s) ? s : s + 'Z');
/** 12.5 -> "12.50₼" (design). Use formatAzn(v,true) for "12.50 ₼". */
export function formatAzn(v: number | string | null | undefined, spaced = false): string {
  const n = toNumber(v);
  return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n) + (spaced ? ' ₼' : '₼');
}
export const formatPoints = (v: number | string | null | undefined): string => new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(toNumber(v));
/** grams -> "0.750 kq" | "250 q" (design weight format) */
export const formatGrams = (g: number): string => (g >= 1000 ? `${(g / 1000).toFixed(3)} kq` : `${Math.round(g)} q`);
