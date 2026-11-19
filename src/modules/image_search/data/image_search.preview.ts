/**
 * `?preview=results` seed — the eight cards the export draws (`wTkLV`), so a reviewer sees the
 * finished grid without the API and without a photo.
 *
 * These rows are **only** ever used under `?preview=`, which is itself build-gated
 * (`NEXT_PUBLIC_ENABLE_PREVIEW=1`, never production). Real traffic always goes through
 * `useImageProducts` → the store repository.
 */
import type { ProductRow } from '@/modules/store';

interface Seed {
  id: number;
  name: string;
  store: string;
  pack: string | null;
  price: number;
}

/** Names, pack sizes, stores and prices read straight off `image-search-results.html`. */
const SEEDS: readonly Seed[] = [
  { id: 9001, name: 'Qırmızı alma', store: 'Ozio Market', pack: '1 kq', price: 2.49 },
  { id: 9002, name: 'Yaşıl alma', store: 'Bravo', pack: '1 kq', price: 2.19 },
  { id: 9003, name: 'Qızıl alma', store: 'Ozio Market', pack: '1 kq', price: 2.79 },
  { id: 9004, name: 'Alma Semerenko', store: 'Araz Market', pack: '1 kq', price: 2.35 },
  { id: 9005, name: 'Alma şirəsi 1 L', store: 'Sədaf', pack: null, price: 3.4 },
  { id: 9006, name: 'Quru alma', store: 'Ozio Market', pack: '200 q', price: 4.1 },
  { id: 9007, name: 'Alma püresi', store: 'Bolmart', pack: '100 q', price: 1.25 },
  { id: 9008, name: 'Alma çipsi', store: 'Ozio Market', pack: '50 q', price: 2.05 },
];

function row(seed: Seed, index: number): ProductRow {
  return {
    id: seed.id,
    variantId: seed.id,
    storeId: 100 + (index % 4),
    storeName: seed.store,
    storeOpen: '09:00',
    storeClose: '23:00',
    name: seed.name,
    description: null,
    imageUrl: null,
    price: seed.price,
    mrp: seed.price,
    isDiscounted: false,
    discountPercent: 0,
    stock: 40,
    inStock: true,
    hasWeight: false,
    soldByGram: false,
    unitLabel: null,
    quantityLabel: seed.pack,
    minOrderQuantity: null,
    maxOrderQuantity: null,
    isFavorite: false,
    categoryId: null,
    categoryName: null,
    brandName: null,
    barcode: null,
    bonusPercentage: null,
  };
}

export const previewImageProducts = (): ProductRow[] => SEEDS.map(row);
