/**
 * `@/modules/parcel` — the module's public surface. Other modules import **only** from here.
 *
 * What a host screen needs:
 * - `<ParcelQuickAction />` — the home quick-action tile / profile-menu row ("Bağlama göndər").
 *   It hides itself when the `parcel` flag is off.
 * - the hooks, if a screen wants to show "you have N shipments in flight".
 *
 * The route-level views are imported by the three `page.tsx` files only.
 */

export { parcelRoutes, type ParcelRoute } from './parcel.routes';
export { PARCEL_FLAG, PARCEL_MOCK_MODULE, parcelEnabled } from './parcel.flags';
export { parcelKeys, quoteKeyOf } from './parcel.query-keys';

export {
  emptyParcelDraft,
  emptyParcelPoint,
  matchesParcelFilter,
  parcelCanCancel,
  parcelIsActive,
  parcelLongestSide,
  parcelStep,
  presetForSpec,
  PRESET_CODE,
  type Parcel,
  type ParcelCourier,
  type ParcelDraft,
  type ParcelFilter,
  type ParcelPaymentMethod,
  type ParcelPayer,
  type ParcelPoint,
  type ParcelQuote,
  type ParcelRules,
  type ParcelSavedAddress,
  type ParcelSavedCard,
  type ParcelSizePreset,
  type ParcelSizePresetId,
  type ParcelSpec,
  type ParcelStatus,
  type ParcelVehicle,
} from './data/models/parcel';

export { parcelRepository, type ParcelRepository } from './data/parcel.repository';

export {
  PARCEL_POLL_MS,
  useCancelParcel,
  useCreateParcel,
  useParcelDetail,
  useParcelQuote,
  useParcelRules,
  useParcels,
} from './hooks/use-parcels';
export {
  useParcelDraft,
  validateParcelDraft,
  type ParcelField,
  type ParcelFieldIssue,
  type ParcelIssues,
  type ParcelPointKey,
} from './hooks/use-parcel-draft';

/* ---------------------------------------------------- entry points + screens */

export { ParcelQuickAction, type ParcelQuickActionProps } from './components/parcel-quick-action';
export { ParcelStatusTag } from './components/parcel-status-tag';

export { ParcelListView } from './view/ParcelListView';
export { ParcelNewView } from './view/ParcelNewView';
export { ParcelTrackView } from './view/ParcelTrackView';
