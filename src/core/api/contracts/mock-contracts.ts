/* mock-contracts.ts — standalone contracts + sample data for the feature-flagged MOCK modules.
 * Mirrors the Flutter mocks in lib/modules/<m>/data. No imports. See mock-modules.md.
 * Items marked PROPOSED in mock-modules.md are not in the real API.
 * Dates are ISO strings (Flutter DateTime). Money is AZN number. */

// ───────────────────────── shared ─────────────────────────
export type FailureKind =
  | 'network' | 'timeout' | 'unauthorized' | 'notFound' | 'server' | 'parse' | 'unknown' | 'rateLimited';

export interface Failure { kind: FailureKind; message: string; code?: string; statusCode?: number }
export type Result<T> = { ok: true; value: T } | { ok: false; failure: Failure };
export const ok = <T>(value: T): Result<T> => ({ ok: true, value });
export const fail = <T = never>(kind: FailureKind, message: string, code?: string): Result<T> =>
  ({ ok: false, failure: { kind, message, code } });

export interface Unsubscribe { (): void }
export interface Observable<T> { get(): T; subscribe(fn: (v: T) => void): Unsubscribe }

export interface FeatureFlagsShape {
  parcel: boolean; courier: boolean; courierPlus: boolean; courierShop: boolean; topup: boolean;
  imageSearch: boolean; rewards: boolean; referral: boolean; supportChat: boolean; loyaltyTiers: boolean;
  askToBuy: boolean; familyLimits: boolean; senior: boolean; groupBuy: boolean; priceLock: boolean;
  school: boolean; savingsJar: boolean; viral: boolean;
}
/** Flutter: first 8 flags exist in feature_flags.dart (all true); the rest are web-side gates (default true). */
export const FeatureFlags: Readonly<FeatureFlagsShape> = {
  parcel: true, courier: true, courierPlus: true, courierShop: true, topup: true,
  imageSearch: true, rewards: true, referral: true, supportChat: true, loyaltyTiers: true,
  askToBuy: true, familyLimits: true, senior: true, groupBuy: true, priceLock: true,
  school: true, savingsJar: true, viral: true,
};

export const MOCK_LATENCY_MS = {
  parcel: 500, courier: 450, courierPlus: 500, courierShop: 700, topupCharge: 1800, imageRecognize: 2200,
  askToBuy: 600, familyLimitsList: 600, familyLimitsOne: 400, familyLimitsSave: 500,
  seniorRead: 650, seniorToggle: 250, seniorOrder: 900, seniorCreate: 700, seniorStatus: 500,
  priceLock: 700, groupBuy: 600, school: 700, savingsJar: 600, savingsJarSave: 250, savingsJarClaim: 900,
  viral: 600, viralScan: 1500,
} as const;

// ───────────────────────── 1. parcel ─────────────────────────
export interface ParcelPoint { address: string; details: string; contactName: string; contactPhone: string; lat?: number; lng?: number }
export interface ParcelSpec { lengthCm: number; widthCm: number; heightCm: number; weightKg: number; fragile: boolean; contents: string }
export type ParcelSizePresetId = 'envelope' | 'small' | 'medium' | 'large';
export interface ParcelSizePreset { id: ParcelSizePresetId; lengthCm: number; widthCm: number; heightCm: number; maxWeightKg: number }
export type ParcelPayer = 'sender' | 'recipient';
export type ParcelPaymentMethod = 'cash' | 'card' | 'ozioBalance';
export interface ParcelRules { maxWeightKg: number; maxSideCm: number; presets: ParcelSizePreset[]; paymentMethods: ParcelPaymentMethod[] }
export interface ParcelDraft {
  pickup: ParcelPoint; dropoff: ParcelPoint; spec: ParcelSpec;
  payer: ParcelPayer; paymentMethod: ParcelPaymentMethod; cardId?: string; courierNote: string;
}
export interface ParcelQuote { price: number; baseFee: number; distanceFee: number; weightFee: number; fragileFee: number; distanceKm: number; etaMinutes: number }
export type ParcelStatus = 'searching' | 'assigned' | 'pickedUp' | 'delivered' | 'cancelled';
export type ParcelVehicle = 'foot' | 'bicycle' | 'scooter' | 'car';
export interface ParcelCourier { name: string; phone: string; vehicle: ParcelVehicle; rating: number }
export interface Parcel {
  id: string; number: string; status: ParcelStatus; draft: ParcelDraft; quote: ParcelQuote; courier?: ParcelCourier;
  pickupCode: string; deliveryCode: string; createdAt: string; pickedUpAt?: string; deliveredAt?: string;
}
export type ParcelFailureCode =
  | 'parcel/too-heavy' | 'parcel/side-too-long' | 'parcel/payment-method-unavailable'
  | 'parcel/recipient-cash-only' | 'parcel/card-missing' | 'parcel/not-found' | 'parcel/cancel-too-late';
export interface ParcelRepository {
  readonly isDemo: boolean;
  onChange(fn: () => void): Unsubscribe;
  rules(): Promise<Result<ParcelRules>>;
  quote(draft: ParcelDraft): Promise<Result<ParcelQuote>>;
  create(draft: ParcelDraft, quote: ParcelQuote): Promise<Result<Parcel>>;
  list(): Promise<Result<Parcel[]>>;
  byId(id: string): Promise<Result<Parcel>>;
  cancel(id: string): Promise<Result<Parcel>>;
  reset(): Promise<void>;
}
export const parcelIsActive = (p: Parcel) => p.status === 'searching' || p.status === 'assigned' || p.status === 'pickedUp';
export const parcelCanCancel = (p: Parcel) => p.status === 'searching' || p.status === 'assigned';
export const PARCEL_TIMERS_MS = { find: 6000, pickup: 20000, deliver: 30000 } as const;
export const PARCEL_FIRST_NUMBER = 73410; // first created = 73411
export const PARCEL_RULES: ParcelRules = {
  maxWeightKg: 30, maxSideCm: 120,
  presets: [
    { id: 'envelope', lengthCm: 33, widthCm: 24, heightCm: 2, maxWeightKg: 1 },
    { id: 'small', lengthCm: 30, widthCm: 20, heightCm: 15, maxWeightKg: 5 },
    { id: 'medium', lengthCm: 45, widthCm: 35, heightCm: 30, maxWeightKg: 15 },
    { id: 'large', lengthCm: 70, widthCm: 50, heightCm: 45, maxWeightKg: 30 },
  ],
  paymentMethods: ['cash', 'ozioBalance'],
};
export const PARCEL_SAMPLE_COURIERS: ParcelCourier[] = [
  { name: 'Elvin M.', phone: '', vehicle: 'scooter', rating: 4.9 },
  { name: 'Tural H.', phone: '', vehicle: 'bicycle', rating: 4.8 },
  { name: 'Kamran Ə.', phone: '', vehicle: 'car', rating: 5.0 },
];
/** Pricing formula of the mock (round2 = Math.round(x*100)/100). */
export function mockParcelQuote(spec: ParcelSpec, distanceKm: number): ParcelQuote {
  const r2 = (n: number) => Math.round(n * 100) / 100;
  const km = Math.round(distanceKm * 10) / 10;
  const baseFee = 2.5, distanceFee = r2(km * 0.6), weightFee = r2(Math.max(0, spec.weightKg - 3) * 0.3), fragileFee = spec.fragile ? 1 : 0;
  return { price: r2(baseFee + distanceFee + weightFee + fragileFee), baseFee, distanceFee, weightFee, fragileFee, distanceKm: km, etaMinutes: 15 + Math.round(km * 4) };
}

// ───────────────────────── 2. courier ─────────────────────────
export type CourierStatus = 'none' | 'pending' | 'active' | 'rejected';
export type CourierVehicle = 'foot' | 'bicycle' | 'scooter' | 'car';
/** snake_case JSON exactly as CourierApplication.toJson (legacy alias payout_account for bank_account). */
export interface CourierApplication {
  full_name: string; phone: string; birth_date?: string | null; city: string; city_id?: number | null;
  vehicle: CourierVehicle; id_number: string; plate_number: string; has_thermal_bag: boolean;
  voen: string; bank_account: string; submitted_at?: string | null;
}
export type CourierOrderStatus = 'available' | 'accepted' | 'atStore' | 'pickedUp' | 'delivered' | 'cancelled';
export type CourierPayment = 'card' | 'cash';
export interface CourierOrderItem { name: string; quantity: number; unit: string }
export interface CourierOrder {
  id: string; number: string; status: CourierOrderStatus;
  storeName: string; storeAddress: string; storeLogoUrl?: string;
  customerName: string; customerAddress: string; customerAddressDetails: string; customerPhone: string; customerNote: string;
  items: CourierOrderItem[]; itemsTotal: number; fee: number; tip: number;
  payment: CourierPayment; cashToCollect: number;
  distanceToStoreKm: number; distanceKm: number; etaMinutes: number;
  createdAt: string; acceptedAt?: string; deliveredAt?: string;
}
export interface CourierDayEarning { day: string; amount: number; deliveries: number }
export interface CourierEarnings {
  today: number; week: number; month: number; balance: number; deliveriesToday: number; deliveriesTotal: number;
  rating: number; acceptanceRate: number; nextPayout?: string; days: CourierDayEarning[];
}
export interface CourierRepository {
  readonly isDemo: boolean;
  status: Observable<CourierStatus>;
  online: Observable<boolean>;
  activeOrder: Observable<CourierOrder | null>;
  onChange(fn: () => void): Unsubscribe;
  loadStatus(): Promise<Result<CourierStatus>>;
  application(): Promise<Result<CourierApplication | null>>;
  submitApplication(a: CourierApplication): Promise<Result<CourierStatus>>;
  setOnline(v: boolean): Promise<Result<void>>;
  availableOrders(): Promise<Result<CourierOrder[]>>;
  order(id: string): Promise<Result<CourierOrder>>;
  accept(id: string): Promise<Result<CourierOrder>>;
  decline(id: string): Promise<Result<void>>;
  advance(id: string): Promise<Result<CourierOrder>>;
  cancel(id: string, reason: string): Promise<Result<void>>;
  history(): Promise<Result<CourierOrder[]>>;
  earnings(): Promise<Result<CourierEarnings>>;
  reset(): Promise<void>;
}
export const COURIER_REVIEW_DELAY_MS = 4000;
export const COURIER_STORAGE_KEYS = { status: 'ozio_courier_status', application: 'ozio_courier_application' } as const;
/** Never persist FIN, VÖEN, IBAN, birth date. */
export const stripCourierIdentifiers = (a: CourierApplication): CourierApplication =>
  ({ ...a, id_number: '', voen: '', bank_account: '', birth_date: null });
export const COURIER_SAMPLE_OFFERS: Omit<CourierOrder, 'createdAt'>[] = [
  { id: 'c-48213', number: '48213', status: 'available', storeName: 'Bolmart Təzə bazar', storeAddress: 'Nizami küç. 203',
    customerName: 'Aysel M.', customerAddress: 'Ə. Şıxlinski küç. 14', customerAddressDetails: 'Blok 2 · mərtəbə 5 · mənzil 47', customerPhone: '',
    customerNote: 'Qapı kodu 47#. Zəng vurmayın, uşaq yatır.',
    items: [{ name: 'Atena ayran nanəli', quantity: 2, unit: '1 L' }, { name: 'Çörək', quantity: 1, unit: '500 q' }, { name: 'Pomidor', quantity: 1, unit: '1.2 kq' }],
    itemsTotal: 12.48, fee: 3.2, tip: 1, payment: 'card', cashToCollect: 0, distanceToStoreKm: 0.8, distanceKm: 2.4, etaMinutes: 18 },
  { id: 'c-48217', number: '48217', status: 'available', storeName: 'Grandmart', storeAddress: 'Babək pr. 76',
    customerName: 'Rəşad H.', customerAddress: 'Xətai pr. 38', customerAddressDetails: 'Giriş 1 · mərtəbə 9', customerPhone: '', customerNote: '',
    items: [{ name: 'Su 5 L', quantity: 2, unit: '5 L' }, { name: 'Yumurta', quantity: 1, unit: '10 ədəd' }],
    itemsTotal: 8.9, fee: 4.5, tip: 0, payment: 'cash', cashToCollect: 8.9, distanceToStoreKm: 1.6, distanceKm: 4.1, etaMinutes: 27 },
  { id: 'c-48221', number: '48221', status: 'available', storeName: 'Megastore', storeAddress: 'Təbriz küç. 51',
    customerName: 'Leyla Q.', customerAddress: 'Nərimanov, F. Xoyski 118', customerAddressDetails: '', customerPhone: '', customerNote: 'Resepşnə təhvil verin.',
    items: [{ name: 'Süd 3.2%', quantity: 3, unit: '1 L' }, { name: 'Pendir', quantity: 1, unit: '400 q' }, { name: 'Alma', quantity: 1, unit: '2 kq' }, { name: 'Makaron', quantity: 2, unit: '500 q' }],
    itemsTotal: 24.35, fee: 3.8, tip: 2, payment: 'card', cashToCollect: 0, distanceToStoreKm: 2.3, distanceKm: 3.2, etaMinutes: 24 },
];
/** [store, customerAddress, fee, tip, km, hoursAgo] — ids c-48109..c-48103, customerName "Müştəri", 1 item "Məhsullar" x4, itemsTotal 18.20, card. */
export const COURIER_SAMPLE_HISTORY_ROWS: [string, string, number, number, number, number][] = [
  ['Bolmart Təzə bazar', 'Ə. Şıxlinski küç. 14', 3.2, 1, 2.4, 2], ['Grandmart', 'Xətai pr. 38', 4.5, 0, 4.1, 4],
  ['Megastore', 'F. Xoyski 118', 3.8, 2, 3.2, 27], ['Bolmart Təzə bazar', 'Gənclik, A. Nemətulla 9', 3.4, 0.5, 2.9, 30],
  ['Grandmart', 'Yasamal, Ş. Mehdiyev 22', 5.1, 0, 5.6, 50], ['Megastore', '28 May, Dilarə Əliyeva 251', 2.9, 1.5, 1.8, 77],
  ['Bolmart Təzə bazar', 'Nəsimi, S. Vurğun 43', 3.6, 0, 3.0, 121],
];

// ───────────────────────── 3. courier_plus ─────────────────────────
export type CpTransport = 'walk' | 'metro' | 'bus' | 'car' | 'bike';
export interface CpRoute { from: string; to: string; departMinutes: number; transport: CpTransport; active: boolean }
export interface CpParcelOffer { id: string; pickup: string; dropoff: string; pay: number; detourMinutes: number; weightKg: number; distanceKm: number }
/** step: 0 accepted, 1 picked up, 2 on the way, 3 delivered */
export interface CpDelivery { offer: CpParcelOffer; step: 0 | 1 | 2 | 3 }
export interface CpEarningEntry { title: string; amount: number; when: string }
export interface CpEarnings { balance: number; today: number; month: number; deliveries: number; history: CpEarningEntry[] }
export interface CpOverview { balance: number; routeActive: boolean; hubRegistered: boolean; activeDeliveryId?: string }
export interface CpHubProfile { address: string; openMinutes: number; closeMinutes: number; capacity: number }
export interface CpHubParcel { id: string; recipient: string; code: string; waiting: string; commission: number }
export interface CpHubDashboard { profile: CpHubProfile; waiting: CpHubParcel[]; commissionToday: number; commissionMonth: number; handedToday: number }
export interface CpNearbyHub { id: string; name: string; address: string; distanceMeters: number; openMinutes: number; closeMinutes: number }
export interface CourierPlusRepository {
  overview(): Promise<Result<CpOverview>>;
  route(): Promise<Result<CpRoute>>;
  saveRoute(r: CpRoute): Promise<Result<void>>;
  matches(): Promise<Result<CpParcelOffer[]>>;
  accept(offerId: string): Promise<Result<CpDelivery>>;
  delivery(offerId: string): Promise<Result<CpDelivery>>;
  advance(offerId: string): Promise<Result<CpDelivery>>;
  earnings(): Promise<Result<CpEarnings>>;
  hubProfile(): Promise<Result<CpHubProfile | null>>;
  registerHub(p: CpHubProfile): Promise<Result<void>>;
  hubDashboard(): Promise<Result<CpHubDashboard>>;
  handOver(code: string): Promise<Result<CpHubParcel>>;
  nearbyHubs(): Promise<Result<CpNearbyHub[]>>;
}
export const CP_SAMPLE = {
  route: { from: 'Nizami küç. 12', to: 'Xətai prospekti 48', departMinutes: 18 * 60 + 10, transport: 'metro', active: false } as CpRoute,
  offers: [
    { id: 'o1', pickup: 'Ozio market, 28 May', dropoff: 'Nərimanov, Əhməd Rəcəbli 7', pay: 2.4, detourMinutes: 4, weightKg: 1.2, distanceKm: 2.1 },
    { id: 'o2', pickup: 'Ozio market, Nizami', dropoff: 'Xətai, Əliyar Əliyev 15', pay: 3.1, detourMinutes: 6, weightKg: 2.5, distanceKm: 3.4 },
    { id: 'o3', pickup: 'Gənclik metrosu', dropoff: 'Azadlıq pr. 90', pay: 1.8, detourMinutes: 2, weightKg: 0.6, distanceKm: 1.3 },
  ] as CpParcelOffer[],
  balance: 18.6, today: 0, month: 46.2, deliveries: 19,
  history: [
    { title: 'Nizami → Nərimanov', amount: 2.6, when: 'Dünən' },
    { title: 'Gənclik → Xətai', amount: 1.9, when: 'Dünən' },
    { title: '28 May → Əhmədli', amount: 3.3, when: '2 gün əvvəl' },
  ] as CpEarningEntry[],
  hubParcels: [
    { id: 'h1', recipient: 'Aygün M.', code: '4821', waiting: '2 saat', commission: 0.3 },
    { id: 'h2', recipient: 'Rəşad Ə.', code: '1937', waiting: '5 saat', commission: 0.3 },
    { id: 'h3', recipient: 'Leyla H.', code: '7203', waiting: '1 gün', commission: 0.3 },
    { id: 'h4', recipient: 'Kamran S.', code: '5560', waiting: '1 gün', commission: 0.3 },
  ] as CpHubParcel[],
  hubToday: 0.9, hubMonth: 27.3, handedToday: 3,
  nearbyHubs: [
    { id: 'n1', name: 'Aygün xanım', address: 'Nizami küç. 14, 2-ci mərtəbə', distanceMeters: 120, openMinutes: 540, closeMinutes: 1260 },
    { id: 'n2', name: 'Rəşad bəy', address: 'Ü. Hacıbəyov 6', distanceMeters: 340, openMinutes: 600, closeMinutes: 1320 },
    { id: 'n3', name: 'Leyla xanım', address: 'Xaqani küç. 31', distanceMeters: 710, openMinutes: 480, closeMinutes: 1200 },
  ] as CpNearbyHub[],
};

// ───────────────────────── 4. courier_shop ─────────────────────────
export type BagItemKind = 'battery' | 'chocolate' | 'coffee' | 'cable' | 'water' | 'gum';
export interface BagItem { id: string; kind: BagItemKind; price: number; oldPrice: number; stock: number }
export const bagDiscountPct = (i: BagItem) => (i.oldPrice <= 0 ? 0 : Math.round(((i.oldPrice - i.price) / i.oldPrice) * 100));
export interface BagReceipt { itemCount: number; total: number }
export interface FitProduct { name: string; brand: string; price: number; sizes: string[] }
export interface FitSession { product: FitProduct; sizes: string[]; startedAt: string; durationSec: number }
export interface FitResult { keptSizes: string[]; charged: number }
export type ExpertProductKind = 'bike' | 'tv' | 'hood';
export type ExpertServiceKind = 'install' | 'wall' | 'assemble';
export interface ExpertService { kind: ExpertServiceKind; price: number; minutes: number }
export interface ExpertCatalog { services: ExpertService[]; slots: string[] }
export interface ExpertBooking { ref: string; product: ExpertProductKind; service: ExpertService; slot: string; expertName: string }
export interface CourierShopRepository {
  failNextCall(): void; // debug hook
  bagItems(): Promise<Result<BagItem[]>>;
  confirmBag(count: number, total: number): Promise<Result<BagReceipt>>;
  fitProduct(): Promise<Result<FitProduct>>;
  startFit(sizes: string[]): Promise<Result<FitSession>>;
  currentFit(): Promise<Result<FitSession | null>>;
  confirmFit(s: FitSession, kept: string[]): Promise<Result<FitResult>>;
  expertCatalog(p: ExpertProductKind): Promise<Result<ExpertCatalog>>;
  book(p: ExpertProductKind, s: ExpertService, slot: string): Promise<Result<ExpertBooking>>;
}
export const COURIER_SHOP_SAMPLE = {
  bag: [
    { id: 'b1', kind: 'battery', price: 2.9, oldPrice: 4.5, stock: 5 },
    { id: 'b2', kind: 'chocolate', price: 1.6, oldPrice: 2.2, stock: 8 },
    { id: 'b3', kind: 'coffee', price: 3.4, oldPrice: 4.8, stock: 3 },
    { id: 'b4', kind: 'cable', price: 6.9, oldPrice: 11.9, stock: 2 },
    { id: 'b5', kind: 'water', price: 0.7, oldPrice: 1.0, stock: 12 },
    { id: 'b6', kind: 'gum', price: 0.9, oldPrice: 1.3, stock: 6 },
  ] as BagItem[],
  fitProduct: { name: 'Air Zoom Runner', brand: 'Ozio Sport', price: 129.9, sizes: ['38', '39', '40', '41', '42', '43', '44'] } as FitProduct,
  fitDurationSec: 600,
  expertServices: {
    bike: [{ kind: 'assemble', price: 15, minutes: 40 }],
    tv: [{ kind: 'install', price: 20, minutes: 30 }, { kind: 'wall', price: 35, minutes: 60 }],
    hood: [{ kind: 'install', price: 30, minutes: 60 }, { kind: 'wall', price: 40, minutes: 75 }],
  } as Record<ExpertProductKind, ExpertService[]>,
  expertSlots: ['10:00', '12:30', '15:00', '18:00'],
  expertName: 'Elvin M.',
  bookingRef: (n: number) => `KE-${1000 + n}`,
};

// ───────────────────────── 5. topup ─────────────────────────
export interface TopupAccount { balance: number; cardNumber: string; barcodeImage: string; holderName: string }
export interface TopupConfig { minAmount?: number | null; maxAmount?: number | null; quickAmounts: number[] }
export interface TopupQuote { amount: number; fee?: number | null; total: number }
export interface TopupReceipt { reference: string; amount: number; fee?: number | null; total: number; newBalance?: number | null; createdAt: string; simulated: boolean }
/** Mirror of the Flutter SavedCard (orders/models/saved_card.dart; real shape in api/types.ts). */
export interface TopupSavedCard { id: number; brand?: string; last4?: string; [k: string]: unknown }
export type TopupOutcome =
  | { success: true; receipt: TopupReceipt; cardLabel: string }
  | { success: false; amount: number; cardLabel: string; message: string; errorCode: string };
export interface TopupRepository {
  onChange(fn: () => void): Unsubscribe;
  getAccount(): Promise<Result<TopupAccount>>;       // REAL: GET /customer/api/v1/profile/me -> bonus_cards[0]
  getSavedCards(): Promise<Result<TopupSavedCard[]>>; // REAL: GET /customer/api/v1/profile/me/cards
  getConfig(): Promise<Result<TopupConfig>>;          // MOCK
  quote(amount: number): Promise<Result<TopupQuote>>; // MOCK (no fee)
  createTopup(p: { amount: number; cardId: number }): Promise<Result<TopupReceipt>>; // MOCK, simulated:true
}
export const TOPUP_MOCK_CONFIG: TopupConfig = { quickAmounts: [5, 10, 20, 50, 100] };
export const topupDisplayNumber = (n: string) => n.replace(/\s+/g, '').replace(/(.{4})(?=.)/g, '$1 ');
export const topupIsFree = (q: TopupQuote) => q.fee != null && q.fee <= 0;

// ───────────────────────── 6. image_search ─────────────────────────
export interface RecognizedLabel { name: string; confidence: number }
export interface ImageRecognition { labels: RecognizedLabel[] }
export interface ImageRecognitionRepository { recognize(file: Blob): Promise<Result<ImageRecognition>> }
export const labelPercent = (l: RecognizedLabel) => Math.round(Math.min(1, Math.max(0, l.confidence)) * 100);
export const IMAGE_SEARCH_SAMPLES: RecognizedLabel[][] = [
  [{ name: 'süd', confidence: 0.94 }, { name: 'kefir', confidence: 0.71 }, { name: 'ayran', confidence: 0.58 }, { name: 'qatıq', confidence: 0.42 }],
  [{ name: 'banan', confidence: 0.91 }, { name: 'alma', confidence: 0.63 }, { name: 'meyvə', confidence: 0.47 }],
  [{ name: 'çörək', confidence: 0.88 }, { name: 'lavaş', confidence: 0.66 }, { name: 'un', confidence: 0.39 }],
];

// ───────────────────────── 7. rewards ─────────────────────────
export type WheelPrizeType = 'bonus' | 'coupon' | 'freeDelivery' | 'ticket' | 'nothing' | 'cashback';
export interface WheelSegment { id: string; label: string; type: WheelPrizeType; value: number; weight: number }
export interface Mission { id: string; title: string; description: string; progress: number; target: number; reward: number; rewardLabel: string; icon: string; claimed: boolean }
export interface FamilyMember { id: string; name: string; role: string; owner: boolean; contributed: number; monthlyLimit?: number | null; phone?: string | null }
export interface SmartListItem { id: string; title: string; quantity: number; checked: boolean; price?: number | null; oldPrice?: number | null; storeName: string; storeColor?: number | null }
export interface PriceAlert { id: string; productName: string; imageUrl?: string | null; emoji: string; storeName: string; currentPrice: number; trackedPrice: number; targetPrice?: number | null; active: boolean }
export type FeedKind = 'priceDrop' | 'lottery' | 'bonus' | 'order' | 'birthday';
export type FeedPeriod = 'today' | 'week';
export interface FeedNotification { id: string; kind: FeedKind; title: string; body: string; time: string; unread: boolean; period: FeedPeriod }
export interface ReceiptLine { name: string; quantity: number; unitPrice: number; total: number }
export interface Receipt {
  orderId: number; storeName: string; deliveryAddress: string; paymentMethod: string; createdAt?: string | null;
  lines: ReceiptLine[]; itemsTotal: number; deliveryFee: number; serviceFee: number; discount: number; payable: number; bonusEarned: number;
}
export interface RewardsRepository {
  wheelSegments(): Promise<Result<WheelSegment[]>>;
  missions(): Promise<Result<Mission[]>>;
  familyMembers(): Promise<Result<FamilyMember[]>>;
  smartList(): Promise<Result<SmartListItem[]>>;
  readonly smartListSharedWith: string;
  priceAlerts(): Promise<Result<PriceAlert[]>>;
  notifications(): Promise<Result<FeedNotification[]>>;
  receipt(orderId: string): Promise<Result<Receipt>>; // REAL: GET /customer/api/v2/orders/{id}
}
export const WHEEL_RULES = { maxSpinsPerDay: 2, paidSpinCost: 1 } as const; // 1st free, 2nd costs 1 AZN (mock-only counter)
/** Weighted pick as in WheelCubit (weight<=0 counts as 1). */
export function weightedPick(segments: WheelSegment[], rnd: () => number = Math.random): number {
  const w = (s: WheelSegment) => (s.weight <= 0 ? 1 : s.weight);
  let roll = rnd() * segments.reduce((a, s) => a + w(s), 0);
  for (let i = 0; i < segments.length; i++) { roll -= w(segments[i]); if (roll <= 0) return i; }
  return segments.length - 1;
}
export const missionRatio = (m: Mission) => (m.target <= 0 ? 0 : Math.min(1, Math.max(0, m.progress / m.target)));
export const priceAlertDelta = (a: PriceAlert) => a.currentPrice - a.trackedPrice;
export const priceAlertTargetHit = (a: PriceAlert) => a.targetPrice != null && a.currentPrice <= a.targetPrice;
export const REWARDS_SAMPLE = {
  wheel: [
    { id: 'w1', label: '0.50₼', type: 'bonus', value: 0.5, weight: 3 },
    { id: 'w2', label: '+1 bilet', type: 'ticket', value: 1, weight: 1 },
    { id: 'w3', label: '5% kupon', type: 'coupon', value: 5, weight: 2 },
    { id: 'w4', label: '1₼', type: 'bonus', value: 1, weight: 1 },
    { id: 'w5', label: '2x bonus', type: 'cashback', value: 2, weight: 2 },
    { id: 'w6', label: '0.20₼', type: 'bonus', value: 0.2, weight: 3 },
    { id: 'w7', label: 'Pulsuz\nçatdırılma', type: 'freeDelivery', value: 0, weight: 2 },
    { id: 'w8', label: 'Yenə\nfırlat', type: 'nothing', value: 0, weight: 2 },
  ] as WheelSegment[],
  missions: [
    { id: 'm1', title: 'Dostunu dəvət et', description: '1 dost dəvət et və qoşulsun', progress: 1, target: 1, reward: 3, rewardLabel: '+3 ₼', icon: 'user-plus', claimed: false },
    { id: 'm2', title: '3 fərqli partnyordan alış', description: 'Bu həftə 3 fərqli partnyordan alış et', progress: 2, target: 3, reward: 2, rewardLabel: '+2 ₼', icon: 'store', claimed: false },
    { id: 'm3', title: 'Ozio Market-dən çatdırılma sifarişi', description: 'Ozio Market-dən 1 çatdırılma sifarişi ver', progress: 0, target: 1, reward: 1, rewardLabel: '+1 ₼', icon: 'bike', claimed: false },
    { id: 'm4', title: 'Novas Home-da 30 ₼+ alış', description: 'Novas Home-da 30 ₼ və daha çox alış et', progress: 0, target: 1, reward: 1, rewardLabel: '+1 bilet', icon: 'sofa', claimed: false },
    { id: 'm5', title: '5 gün ardıcıl çarxı fırlat', description: 'Gündəlik çarxı 5 gün ardıcıl fırlat', progress: 4, target: 5, reward: 0, rewardLabel: '2x kupon', icon: 'rotate-cw', claimed: false },
  ] as Mission[],
  family: [
    { id: 'f1', name: 'Nurlan', role: 'Admin', owner: true, contributed: 18.65 },
    { id: 'f2', name: 'Leyla', role: 'Üzv', owner: false, contributed: 12.3 },
    { id: 'f3', name: 'Anam', role: 'Üzv', owner: false, contributed: 5.2 },
    { id: 'f4', name: 'Kamran · 14 yaş', role: 'Üzv', owner: false, contributed: 2.45, monthlyLimit: 5 },
  ] as FamilyMember[],
  smartList: [
    { id: 's1', title: 'Toyuq filesi 1 kq', quantity: 1, checked: false, price: 5.59, oldPrice: 6.19, storeName: 'Megastore', storeColor: 0xffe21f26 },
    { id: 's2', title: 'Ayran Milla 1 L', quantity: 1, checked: false, price: 2.25, oldPrice: 2.59, storeName: 'Bolmart', storeColor: 0xff16a34a },
    { id: 's3', title: 'Kərə yağı 200 q', quantity: 1, checked: false, price: 3.79, oldPrice: 4.49, storeName: 'Megastore', storeColor: 0xffe21f26 },
    { id: 's4', title: 'Pendir Lori', quantity: 1, checked: false, price: 4.19, oldPrice: 5.29, storeName: 'Grandmart', storeColor: 0xff1aa0dc },
    { id: 's5', title: 'Çörək', quantity: 1, checked: false, price: 0.6, storeName: '' },
    { id: 's6', title: 'Yumurta 10 əd', quantity: 1, checked: true, price: 2.4, storeName: '' },
  ] as SmartListItem[],
  smartListSharedWith: 'Leyla',
  priceAlerts: [
    { id: 'p1', productName: 'Kərə yağı 82%', emoji: '🧈', storeName: 'Megastore', currentPrice: 3.79, trackedPrice: 4.57, targetPrice: 4.0, active: true },
    { id: 'p2', productName: 'Jacobs Monarch', emoji: '☕', storeName: 'Bolmart', currentPrice: 7.49, trackedPrice: 7.49, targetPrice: 6.0, active: true },
  ] as PriceAlert[],
  feed: [
    { id: 'n1', kind: 'priceDrop', title: 'Kərə yağı endirimə düşdü', body: 'Megastore-da 3.79 ₼ — hədəfindən ucuz', time: '10:05', unread: true, period: 'today' },
    { id: 'n2', kind: 'lottery', title: 'Tiraja 2 gün qaldı', body: 'Şans Mövsümü · 2 biletin var', time: '09:00', unread: true, period: 'today' },
  ] as FeedNotification[],
};

// ───────────────────────── 8-10. referral / supportChat / loyaltyTiers ─────────────────────────
export const DEMO_REF_CODE = 'OZIO-DEMO';
export const referralCode = (profileRefCode: string | null | undefined) => (profileRefCode ?? '').trim() || DEMO_REF_CODE;
export interface SupportMessage { from: 'me' | 'agent'; text: string }
/** Every user message gets the same canned reply (l10n key supportDemoReply). */
export const SUPPORT_TOPIC_KEYS = ['supportTopicOrderLate', 'supportTopicBonusMissing', 'supportTopicLottery'] as const;
export interface LoyaltyTier { name: string; cashbackPercentage: number; threshold: number; perks: string[] }
export const OZIO_DESIGN_LADDER: LoyaltyTier[] = [
  { name: 'Bürünc', cashbackPercentage: 1, threshold: 0, perks: ['Bütün partnyorlarda keşbek'] },
  { name: 'Gümüş', cashbackPercentage: 1.5, threshold: 100, perks: ['Ad günü bonusu 5 ₼'] },
  { name: 'Qızıl', cashbackPercentage: 2, threshold: 200, perks: ['Ayda 2 pulsuz çatdırılma', 'Lotereyada +1 bilet'] },
  { name: 'Platin', cashbackPercentage: 3, threshold: 500, perks: ['Pulsuz çatdırılma', 'Xüsusi kuponlar'] },
];
export const designLadderFor = (apiTiers: LoyaltyTier[]) => (apiTiers.length ? apiTiers : OZIO_DESIGN_LADDER);
export const isCurrentTier = (t: LoyaltyTier, cashback: number) => Math.abs(cashback - t.cashbackPercentage) < 0.001;

// ───────────────────────── 11. ask_to_buy ─────────────────────────
export type AskStatus = 'pending' | 'approved' | 'declined' | 'expired';
export type ParentRelation = 'father' | 'mother';
export interface AskItem { name: string; qty: number; price: number }
export interface AskParent { id: string; name: string; relation: ParentRelation }
export interface AskCard { id: string; brand: string; last4: string }
export const askCardLabel = (c: AskCard) => `${c.brand} •••• ${c.last4}`;
export interface AskRequest {
  id: string; incoming: boolean; childName: string; parentName: string; items: AskItem[]; note: string;
  createdAt: string; status: AskStatus; paidWith?: string;
}
export interface AskToBuyRepository {
  readonly parents: AskParent[]; readonly cards: AskCard[]; readonly draftItems: AskItem[];
  list(): Promise<Result<AskRequest[]>>;
  get(id: string): Promise<Result<AskRequest>>;
  send(parent: AskParent, note: string): Promise<Result<AskRequest>>;
  approve(id: string, card: AskCard): Promise<Result<AskRequest>>;
  decline(id: string): Promise<Result<AskRequest>>;
}
export const ASK_SAMPLE = {
  parents: [{ id: 'p1', name: 'Anar Məmmədov', relation: 'father' }, { id: 'p2', name: 'Səbinə Məmmədova', relation: 'mother' }] as AskParent[],
  cards: [{ id: 'c1', brand: 'Visa', last4: '4821' }, { id: 'c2', brand: 'Mastercard', last4: '0937' }] as AskCard[],
  draftItems: [{ name: 'Süd 1L', qty: 2, price: 2.2 }, { name: 'Çörək', qty: 1, price: 0.8 }, { name: 'Şokolad', qty: 3, price: 1.9 }] as AskItem[],
  /** [id, incoming, child, parent, items, note, minutesAgo, status, paidWith?] */
  seed: [
    ['r1', true, 'Aysel', 'Mən', [{ name: 'Dəftər 48 vərəq', qty: 5, price: 1.2 }, { name: 'Qələm dəsti', qty: 1, price: 4.5 }], 'Məktəb üçün lazımdır', 4, 'pending'],
    ['r2', true, 'Tural', 'Mən', [{ name: 'Pizza', qty: 1, price: 12.9 }, { name: 'Cola 1L', qty: 2, price: 2.1 }], '', 35, 'pending'],
    ['r3', true, 'Leyla', 'Mən', [{ name: 'Meyvə səbəti', qty: 1, price: 18.4 }], 'Dostlarla görüş', 190, 'pending'],
    ['r4', true, 'Aysel', 'Mən', [{ name: 'Su 5L', qty: 2, price: 2.4 }], '', 1560, 'approved', 'Visa •••• 4821'],
    ['r5', true, 'Tural', 'Mən', [{ name: 'Çips', qty: 4, price: 2.3 }], 'Film üçün', 1800, 'declined'],
    ['r6', true, 'Leyla', 'Mən', [{ name: 'Dondurma', qty: 2, price: 3.6 }], '', 3000, 'expired'],
    ['r7', false, 'Mən', 'Anar Məmmədov', [{ name: 'Süd 1L', qty: 2, price: 2.2 }, { name: 'Pendir', qty: 1, price: 6.4 }], 'Səhər yeməyi üçün', 12, 'pending'],
  ] as [string, boolean, string, string, AskItem[], string, number, AskStatus, string?][],
};

// ───────────────────────── 12. family_limits ─────────────────────────
export type LimitPeriod = 'weekly' | 'monthly';
export type LimitCategory = 'stationery' | 'books' | 'food' | 'toys' | 'snacks' | 'hygiene';
export interface LimitPurchase { id: string; title: string; category: LimitCategory; amount: number; date: string }
export interface LimitMember {
  id: string; name: string; role: string; age?: number; enabled: boolean; period: LimitPeriod;
  limit: number; spent: number; categories: LimitCategory[]; purchases: LimitPurchase[];
}
export const limitRemaining = (m: LimitMember) => Math.max(0, m.limit - m.spent);
export const limitExhausted = (m: LimitMember) => m.enabled && m.limit > 0 && m.spent >= m.limit;
export const limitProgress = (m: LimitMember) => (m.limit <= 0 ? 0 : Math.min(1, Math.max(0, m.spent / m.limit)));
export interface FamilyLimitsRepository {
  members(): Promise<Result<LimitMember[]>>;
  member(id: string): Promise<Result<LimitMember>>;
  /** Only enabled, period, limit, categories are editable. */
  save(m: LimitMember): Promise<Result<LimitMember>>;
}
export const LIMIT_STEP_AZN = 5;

// ───────────────────────── 13. senior ─────────────────────────
export interface SeniorPrefs { enabled: boolean; scale: number; highContrast: boolean }
export const SENIOR_PREFS = { minScale: 1.0, maxScale: 1.6, defaultOnScale: 1.3, keys: { on: 'ozio_senior_mode', scale: 'ozio_senior_scale', contrast: 'ozio_senior_contrast' } } as const;
export const seniorEffectiveScale = (p: SeniorPrefs) => (p.enabled ? p.scale : 1);
export interface BasketItem { id: string; nameKey: string; price: number; qty: number }
export interface PensionPlan { payday: string; pension: number; items: BasketItem[]; autoRepeat: boolean; ordered: boolean }
export const pensionTotal = (p: PensionPlan) => p.items.reduce((s, i) => s + i.price * i.qty, 0);
export type HelpKind = 'medicine' | 'groceries' | 'trash';
export type HelpStatus = 'open' | 'accepted' | 'completed';
export interface HelpRequest { id: string; kind: HelpKind; requester: string; note: string; helper?: string; distanceKm: number; bonus: number; status: HelpStatus; mine: boolean }
export interface SeniorRepository {
  plan(): Promise<Result<PensionPlan>>;
  setAutoRepeat(v: boolean): Promise<Result<PensionPlan>>;
  orderBasket(): Promise<Result<PensionPlan>>;
  requests(): Promise<Result<HelpRequest[]>>;
  create(kind: HelpKind, note: string): Promise<Result<HelpRequest[]>>;
  setStatus(id: string, status: HelpStatus, helper?: string): Promise<Result<HelpRequest[]>>;
}
export const SENIOR_SAMPLE = {
  plan: {
    payday: '2026-11-20', pension: 350, autoRepeat: false, ordered: false,
    items: [
      { id: 'bread', nameKey: 'seniorItemBread', price: 1.2, qty: 2 }, // Çörək
      { id: 'milk', nameKey: 'seniorItemMilk', price: 2.4, qty: 2 },   // Süd 1 L
      { id: 'rice', nameKey: 'seniorItemRice', price: 3.8, qty: 1 },   // Düyü 1 kq
      { id: 'oil', nameKey: 'seniorItemOil', price: 5.9, qty: 1 },     // Günəbaxan yağı
      { id: 'sugar', nameKey: 'seniorItemSugar', price: 2.2, qty: 1 }, // Şəkər 1 kq
      { id: 'eggs', nameKey: 'seniorItemEggs', price: 4.5, qty: 1 },   // Yumurta (10 ədəd)
    ],
  } as PensionPlan,
  requests: [
    { id: 'm1', kind: 'medicine', requester: 'Mən', note: '', distanceKm: 0, bonus: 2, status: 'open', mine: true },
    { id: 'r1', kind: 'groceries', requester: 'Səkinə x.', note: 'Çörək, süd, 1 kq düyü', distanceKm: 0.3, bonus: 2, status: 'open', mine: false },
    { id: 'r2', kind: 'medicine', requester: 'Rəşid b.', note: 'Aptekdən təzyiq dərmanı', distanceKm: 0.6, bonus: 3, status: 'open', mine: false },
    { id: 'r3', kind: 'trash', requester: 'Gülarə x.', note: 'Zibil torbası həyətdəki qutuya', distanceKm: 0.9, bonus: 1.5, status: 'open', mine: false },
  ] as HelpRequest[],
};

// ───────────────────────── 14. price_lock ─────────────────────────
export type GuaranteeStatus = 'notLinked' | 'linking' | 'active';
export interface StapleItem { id: string; name: string; lockedPrice: number; marketPrice: number }
export const stapleDifference = (s: StapleItem) => (s.marketPrice > s.lockedPrice ? s.marketPrice - s.lockedPrice : 0);
export interface Guarantee { status: GuaranteeStatus; maskedCard?: string; startedAt?: string; endsAt?: string; items: StapleItem[] }
export type PriceLockStatus = 'active' | 'used' | 'expired';
export interface PriceLockItem { id: string; productName: string; lockedPrice: number; currentPrice: number; deposit: number; expiresAt: string; status: PriceLockStatus }
export const PRICE_LOCK = { lockDays: 15, lockDeposit: 1 } as const;
export interface PriceLockRepository {
  guarantee(): Promise<Result<Guarantee>>;
  linkCard(cardNumber: string): Promise<Result<Guarantee>>;
  unlinkCard(): Promise<Result<Guarantee>>;
  locks(): Promise<Result<PriceLockItem[]>>;
  createLock(p: { productName: string; price: number }): Promise<Result<PriceLockItem>>;
  useLock(id: string): Promise<Result<void>>;
}
export const PRICE_LOCK_STAPLES: StapleItem[] = [
  { id: 's1', name: 'Günəbaxan yağı 1 L', lockedPrice: 3.2, marketPrice: 3.6 },
  { id: 's2', name: 'Buğda unu 2 kq', lockedPrice: 2.8, marketPrice: 2.8 },
  { id: 's3', name: 'Qara çay 100 q', lockedPrice: 2.1, marketPrice: 2.35 },
  { id: 's4', name: 'Şəkər tozu 1 kq', lockedPrice: 1.6, marketPrice: 1.9 },
  { id: 's5', name: 'Ağ düyü 1 kq', lockedPrice: 2.4, marketPrice: 2.4 },
  { id: 's6', name: 'Makaron 500 q', lockedPrice: 1.1, marketPrice: 1.1 },
  { id: 's7', name: 'Tualet sabunu', lockedPrice: 0.9, marketPrice: 1.05 },
  { id: 's8', name: 'Diş pastası', lockedPrice: 2.5, marketPrice: 2.5 },
];
/** [id, name, locked, current, daysFromNow (negative = past), status] — deposit 1. */
export const PRICE_LOCK_SEED: [string, string, number, number, number, PriceLockStatus][] = [
  ['l1', 'Günəbaxan yağı 1 L', 3.2, 3.65, 11.125, 'active'], ['l2', 'Ağ düyü 1 kq', 2.4, 2.4, 4.125, 'active'],
  ['l3', 'Tam südlü pendir 400 q', 5.9, 6.3, -20, 'used'], ['l4', 'Makaron 500 q', 1.1, 1.05, -40, 'expired'],
];

// ───────────────────────── 15. group_buy ─────────────────────────
export interface PriceTier { people: number; price: number }
export interface GroupParticipant { name: string; isMe: boolean }
export interface GroupProduct { id: string; title: string; pack: string; iconKey: string; retailPrice: number; tierFactors: number[] }
export interface GroupDeal {
  id: string; title: string; pack: string; iconKey: string; retailPrice: number; tiers: PriceTier[];
  participants: GroupParticipant[]; closesAt: string; address: string; sameBuilding: boolean; mine: boolean; myQty: number;
}
export const GROUP_TIER_PEOPLE = [3, 5, 10] as const;
export const GROUP_MY_ADDRESS = 'Nizami küç. 45, blok A';
export function groupTiersFor(p: GroupProduct, target: number): PriceTier[] {
  const out: PriceTier[] = [];
  for (let i = 0; i < GROUP_TIER_PEOPLE.length; i++) {
    if (GROUP_TIER_PEOPLE[i] > target) break;
    out.push({ people: GROUP_TIER_PEOPLE[i], price: Math.round(p.retailPrice * p.tierFactors[i] * 10) / 10 });
  }
  return out;
}
export const dealJoined = (d: GroupDeal) => d.participants.length;
export const dealTarget = (d: GroupDeal) => d.tiers[d.tiers.length - 1].people;
export const dealComplete = (d: GroupDeal) => dealJoined(d) >= dealTarget(d);
export const dealReachedTier = (d: GroupDeal) => d.tiers.filter(t => dealJoined(d) >= t.people).pop();
export const dealCurrentPrice = (d: GroupDeal) => (dealReachedTier(d) ?? d.tiers[0]).price;
export const percentOff = (retail: number, price: number) => (retail <= 0 ? 0 : Math.round((1 - price / retail) * 100));
export const dealInviteLink = (d: GroupDeal) => `https://ozio10.az/g/${d.id}`;
export interface JoinResult { deal: GroupDeal; qty: number; total: number; completed: boolean }
export interface GroupBuyRepository {
  overview(): Promise<Result<{ nearby: GroupDeal[]; mine: GroupDeal[] }>>;
  deal(id: string): Promise<Result<GroupDeal>>;
  products(): Promise<Result<GroupProduct[]>>;
  create(p: { product: GroupProduct; target: number; hours: number; qty: number }): Promise<Result<GroupDeal>>;
  join(id: string, qty: number): Promise<Result<JoinResult>>;
}
export const GROUP_CATALOG: GroupProduct[] = [
  { id: 'p-sugar', title: 'Şəkər tozu', pack: '10 kq', iconKey: 'wheat', retailPrice: 18.9, tierFactors: [0.88, 0.8, 0.72] },
  { id: 'p-diaper', title: 'Uşaq bezi Pampers', pack: '96 ədəd', iconKey: 'baby', retailPrice: 54, tierFactors: [0.88, 0.8, 0.72] },
  { id: 'p-oil', title: 'Günəbaxan yağı', pack: '5 litr', iconKey: 'droplet', retailPrice: 16.5, tierFactors: [0.88, 0.8, 0.72] },
  { id: 'p-clean', title: 'Təmizlik dəsti', pack: '12 ədəd', iconKey: 'sparkles', retailPrice: 32, tierFactors: [0.88, 0.8, 0.72] },
  { id: 'p-rice', title: 'Düyü', pack: '10 kq', iconKey: 'wheat', retailPrice: 24, tierFactors: [0.88, 0.8, 0.72] },
  { id: 'p-powder', title: 'Yuyucu toz', pack: '6 kq', iconKey: 'sparkles', retailPrice: 21, tierFactors: [0.88, 0.8, 0.72] },
];
/** [id, catalogIndex, target, closesInMs, participants, address?] — address undefined => GROUP_MY_ADDRESS & sameBuilding. */
export const GROUP_SEED: [string, number, number, number, string[], string?][] = [
  ['d1', 0, 10, (5 * 60 + 12) * 60000, ['Aysel', 'Rəşad', 'Leyla', 'Elvin', 'Nigar', 'Tural']],
  ['d2', 1, 5, (20 * 60 + 40) * 60000, ['Səbinə', 'Kamran', 'Günel', 'Orxan']],
  ['d3', 3, 3, (24 + 6) * 3600000, ['Fidan', 'Samir']],
  ['d4', 2, 10, 48 * 3600000, ['Zaur', 'Ülviyyə', 'Murad'], 'Nizami küç. 47'],
];

// ───────────────────────── 16. school ─────────────────────────
export type SchoolSubject = 'math' | 'az' | 'en' | 'science' | 'history';
export type RewardCategory = 'books' | 'sports' | 'accessories';
export interface Grade { id: string; subject: SchoolSubject; score: number; date: string; points: number }
export interface SchoolReward { id: string; category: RewardCategory; percent: number; cost: number }
export interface GradesData { grades: Grade[]; balance: number; rewards: SchoolReward[] }
export interface SchoolListItem { name: string; qty: number; cheapestSeller: string; unitPrice: number }
export interface ClassList { id: string; title: string; school: string; sharedBy: string; items: SchoolListItem[]; savings: number }
export const classListTotal = (l: ClassList) => l.items.reduce((s, i) => s + i.unitPrice * i.qty, 0);
export const classListCount = (l: ClassList) => l.items.reduce((s, i) => s + i.qty, 0);
export type StudentCardState = 'none' | 'pending' | 'linked';
export interface StudentCard { state: StudentCardState; number: string }
export const NIGHT_DISCOUNT_PERCENT = 15;
/** 22:00-06:00 local. */
export const isNightNow = (d: Date = new Date()) => d.getHours() >= 22 || d.getHours() < 6;
export interface SchoolRepository {
  grades(): Promise<Result<GradesData>>;
  uploadSample(): Promise<Result<GradesData>>;
  redeem(rewardId: string): Promise<Result<number>>;
  lists(): Promise<Result<ClassList[]>>;
  createList(title: string, school: string, lines: string[]): Promise<Result<ClassList>>;
  addListToCart(listId: string): Promise<Result<number>>;
  studentCard(): Promise<Result<StudentCard>>;
  linkCard(number: string): Promise<Result<StudentCard>>;
  unlinkCard(): Promise<Result<StudentCard>>;
}
export const SCHOOL_SAMPLE = {
  grades: [
    { id: 'g1', subject: 'math', score: 5, date: '2026-11-10', points: 20 },
    { id: 'g2', subject: 'az', score: 4, date: '2026-11-08', points: 12 },
    { id: 'g3', subject: 'science', score: 5, date: '2026-11-05', points: 20 },
  ] as Grade[],
  balance: 52,
  rewards: [
    { id: 'r1', category: 'books', percent: 5, cost: 100 },
    { id: 'r2', category: 'sports', percent: 7, cost: 150 },
    { id: 'r3', category: 'accessories', percent: 10, cost: 220 },
  ] as SchoolReward[],
  uploadSampleAdds: { grades: [{ subject: 'en', score: 5, points: 20 }, { subject: 'history', score: 4, points: 12 }], balanceDelta: 32 },
  lists: [{
    id: 'l1', title: '3-cü sinif A', school: 'Məktəb №132', sharedBy: 'Səbinə müəllimə', savings: 4.35,
    items: [
      { name: 'Dəftər 48 vərəq', qty: 10, cheapestSeller: 'Kitab Dünyası', unitPrice: 0.65 },
      { name: 'Rəsm albomu A4', qty: 2, cheapestSeller: 'Ozio Market', unitPrice: 2.4 },
      { name: 'Rəngli karandaş (12)', qty: 1, cheapestSeller: 'Ozio Market', unitPrice: 3.9 },
      { name: 'Riyaziyyat dərsliyi', qty: 1, cheapestSeller: 'Kitab Dünyası', unitPrice: 7.8 },
    ],
  }] as ClassList[],
};

// ───────────────────────── 17. savings_jar ─────────────────────────
export type RoundStepCents = 50 | 100 | 500;
export interface JarSettings { enabled: boolean; stepCents: RoundStepCents; monthlyCap: number } // cap 0 = none
export interface JarContribution { orderNo: string; memberName: string; amount: number; at: string }
export interface JarMember { name: string; contributed: number }
export interface SavingsJar { balance: number; daysLeft: number; bonusCredited: number; contributions: JarContribution[]; members: JarMember[]; settings: JarSettings }
export const JAR_BONUS_RATE = 0.1;
export const jarProjectedBonus = (j: SavingsJar) => Math.round(j.balance * JAR_BONUS_RATE * 100) / 100;
export const jarClaimable = (j: SavingsJar) => j.daysLeft <= 0 && j.balance > 0;
export const jarCapProgress = (j: SavingsJar) => (j.settings.monthlyCap > 0 ? Math.min(1, Math.max(0, j.balance / j.settings.monthlyCap)) : null);
export const DEFAULT_JAR_SETTINGS: JarSettings = { enabled: true, stepCents: 100, monthlyCap: 50 };
/** Integer-cents round-up (18.40, 100 -> total 18.40, rounded 19.00, extra 0.60). */
export function roundUp(total: number, stepCents: RoundStepCents): { total: number; rounded: number; extra: number } {
  const cents = Math.round(total * 100), rem = cents % stepCents, extra = rem === 0 ? 0 : stepCents - rem;
  return { total: cents / 100, rounded: (cents + extra) / 100, extra: extra / 100 };
}
export interface SavingsJarRepository {
  readonly settings: JarSettings;
  jar(): Promise<Result<SavingsJar>>;
  saveSettings(s: JarSettings): Promise<Result<SavingsJar>>;
  claim(): Promise<Result<number>>;
}
/** [orderNo, member, amount, daysAgo] — seed balance = sum + 14.75 = 18.00; members Nurlan 9.45, Aysel 5.20, Leyla 2.30. */
export const JAR_SEED_CONTRIBUTIONS: [string, string, number, number][] = [
  ['48213', 'Nurlan', 0.6, 0], ['48177', 'Aysel', 0.35, 2], ['48102', 'Nurlan', 0.9, 4],
  ['48066', 'Leyla', 0.25, 7], ['47990', 'Aysel', 0.7, 9], ['47931', 'Nurlan', 0.45, 12],
];
export const JAR_SEED_BASE_BALANCE = 14.75;
export const JAR_SEED_MEMBERS: JarMember[] = [{ name: 'Nurlan', contributed: 9.45 }, { name: 'Aysel', contributed: 5.2 }, { name: 'Leyla', contributed: 2.3 }];

// ───────────────────────── 18. viral ─────────────────────────
export interface GiftProduct { id: string; name: string; price: number }
export type Occasion = 'birthday' | 'wedding' | 'graduation';
export interface Contribution { name: string; amount: number; at: string }
export interface Campaign { id: string; product: GiftProduct; occasion: Occasion; targetDate: string; message: string; contributions: Contribution[]; link: string }
export const campaignRaised = (c: Campaign) => c.contributions.reduce((s, x) => s + x.amount, 0);
export const campaignProgress = (c: Campaign) => (c.product.price <= 0 ? 0 : Math.min(1, campaignRaised(c) / c.product.price));
export const campaignCompleted = (c: Campaign) => campaignRaised(c) >= c.product.price;
export interface Auction { id: string; title: string; startPrice: number; floorPrice: number; totalStock: number; step: number }
export const AUCTION_SECONDS_PER_DROP = 3;
export const auctionDurationSec = (a: Auction) => Math.ceil((a.startPrice - a.floorPrice) / a.step) * AUCTION_SECONDS_PER_DROP;
export const auctionPriceAt = (a: Auction, elapsedSec: number) => Math.max(a.floorPrice, a.startPrice - Math.floor(elapsedSec / AUCTION_SECONDS_PER_DROP) * a.step);
export type AuctionOutcome = 'live' | 'bought' | 'missed';
export interface ReceiptItem { name: string; qty: number; storePrice: number; ozioPrice: number }
export interface ScannedReceipt { storeName: string; date: string; items: ReceiptItem[] }
export const scannedStoreTotal = (r: ScannedReceipt) => r.items.reduce((s, i) => s + i.storePrice * i.qty, 0);
export const scannedOzioTotal = (r: ScannedReceipt) => r.items.reduce((s, i) => s + i.ozioPrice * i.qty, 0);
export interface ViralRepository {
  products(): Promise<Result<GiftProduct[]>>;
  campaigns(): Promise<Result<Campaign[]>>;
  campaign(id: string): Promise<Result<Campaign>>;
  createCampaign(p: { product: GiftProduct; occasion: Occasion; date: string; message: string }): Promise<Result<Campaign>>;
  contribute(id: string, amount: number): Promise<Result<Campaign>>;
  auctions(): Promise<Result<Auction[]>>;
  auction(id: string): Promise<Result<Auction>>;
  scanReceipt(): Promise<Result<ScannedReceipt>>;
  addToCart(r: ScannedReceipt): Promise<Result<void>>;
}
export const VIRAL_SAMPLE = {
  products: [
    { id: 'p1', name: 'Velosiped Trek 26"', price: 480 }, { id: 'p2', name: 'Smartfon Galaxy A55', price: 620 },
    { id: 'p3', name: 'Qulaqlıq AirPods', price: 260 }, { id: 'p4', name: 'Robot tozsoran', price: 340 },
    { id: 'p5', name: 'Qəhvə maşını', price: 190 },
  ] as GiftProduct[],
  /** contributions: [name, amount, hoursAgo] */
  campaigns: [
    { id: 'c1', productId: 'p1', occasion: 'birthday' as Occasion, inDays: 12, message: 'Ad günümə velosiped istəyirəm!', link: 'https://ozio10.az/g/c1',
      contributions: [['Leyla', 20, 3], ['Rəşad', 10, 24], ['Nigar', 50, 48]] as [string, number, number][] },
    { id: 'c2', productId: 'p5', occasion: 'wedding' as Occasion, inDays: 40, message: 'Toyumuza qəhvə maşını!', link: 'https://ozio10.az/g/c2',
      contributions: [['Elnur', 100, 120], ['Aysel', 90, 144]] as [string, number, number][] },
  ],
  auctions: [
    { id: 'a1', title: 'Televizor 55" 4K', startPrice: 900, floorPrice: 700, totalStock: 100, step: 1 },
    { id: 'a2', title: 'Smart saat', startPrice: 250, floorPrice: 150, totalStock: 60, step: 1 },
    { id: 'a3', title: 'Blender dəsti', startPrice: 120, floorPrice: 70, totalStock: 40, step: 1 },
  ] as Auction[],
  receipt: {
    storeName: 'Bravo Supermarket', date: 'yesterday',
    items: [
      { name: 'Süd 1L', qty: 2, storePrice: 2.1, ozioPrice: 1.89 }, { name: 'Çörək', qty: 3, storePrice: 0.8, ozioPrice: 0.72 },
      { name: 'Yumurta 10 ədəd', qty: 1, storePrice: 4.5, ozioPrice: 4.05 }, { name: 'Pendir 400q', qty: 1, storePrice: 7.9, ozioPrice: 7.11 },
      { name: 'Alma 1kq', qty: 2, storePrice: 2.6, ozioPrice: 2.34 },
    ] as ReceiptItem[],
  },
};

// ───────────────────────── registry ─────────────────────────
export interface MockRepositories {
  parcel?: ParcelRepository; courier?: CourierRepository; courierPlus?: CourierPlusRepository; courierShop?: CourierShopRepository;
  topup?: TopupRepository; imageSearch?: ImageRecognitionRepository; rewards?: RewardsRepository;
  askToBuy?: AskToBuyRepository; familyLimits?: FamilyLimitsRepository; senior?: SeniorRepository;
  priceLock?: PriceLockRepository; groupBuy?: GroupBuyRepository; school?: SchoolRepository;
  savingsJar?: SavingsJarRepository; viral?: ViralRepository;
}
/** Build only repositories whose flag is on; route guards redirect to Home when a flag is off. */
export function enabledMocks(flags: FeatureFlagsShape, factories: { [K in keyof MockRepositories]?: () => MockRepositories[K] }): MockRepositories {
  const out: Record<string, unknown> = {};
  for (const k of Object.keys(factories) as (keyof MockRepositories)[]) {
    if ((flags as unknown as Record<string, boolean>)[k]) out[k] = factories[k]!();
  }
  return out as MockRepositories;
}
