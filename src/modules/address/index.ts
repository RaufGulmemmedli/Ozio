/**
 * Public surface of the address module. **M5 (cart / checkout) and M6 import exactly these** —
 * nothing else in this folder is public, and these names do not change.
 *
 * `useSelectedAddress()` returns the delivery address **and its `lat`/`lng`**, because
 * `stores/search` is unusable without a point; it falls back to the selected city's centre and
 * flags that with `isFallback`.
 *
 * Endpoints behind the hooks:
 *   `useAddresses`      `GET v1/profile/address`           verified
 *   `useAddress`        `GET v1/profile/address/{id}`      verified
 *   `useCreateAddress`  `POST v1/profile/address`          unverified body
 *   `useUpdateAddress`  `PUT v1/profile/address/{id}`      unverified body
 *   `useDeleteAddress`  `DELETE v1/profile/address/{id}`   unverified (method inferred)
 *   `useSelectAddress`  no endpoint — client state + one best-effort `PUT`; `PATCH` is never called
 */
export {
  useAddresses,
  useAddress,
  useSelectedAddress,
  useSelectAddress,
  useCreateAddress,
  useUpdateAddress,
  useDeleteAddress,
} from './hooks';

export { AddressPicker } from './components/AddressPicker';

export { addressKeys } from './address.query-keys';

export type { Address } from './data/models/address';
