/**
 * Result — the Either<Failure, T> equivalent used by every remote/repository function.
 *
 * Nothing in the data layer throws except `unwrap`, which is what turns a `Failure` into
 * TanStack Query's error channel (`useQuery().error` is typed as `Failure`, see query-error.d.ts).
 */
import { Failure } from './failure';

export type Result<T, F = Failure> = { ok: true; value: T } | { ok: false; failure: F };

export const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });

export const fail = <F = Failure>(failure: F): Result<never, F> => ({ ok: false, failure });

export const isOk = <T, F>(r: Result<T, F>): r is { ok: true; value: T } => r.ok;

export const isFail = <T, F>(r: Result<T, F>): r is { ok: false; failure: F } => !r.ok;

/** Map the success value, keep the failure. */
export function mapResult<T, U, F = Failure>(r: Result<T, F>, fn: (value: T) => U): Result<U, F> {
  return r.ok ? { ok: true, value: fn(r.value) } : { ok: false, failure: r.failure };
}

/** Map the success value to another Result (chaining remote -> parse -> validate). */
export function flatMapResult<T, U, F = Failure>(
  r: Result<T, F>,
  fn: (value: T) => Result<U, F>,
): Result<U, F> {
  return r.ok ? fn(r.value) : { ok: false, failure: r.failure };
}

/** Map the failure, keep the success value. */
export function mapFailure<T, F, G>(r: Result<T, F>, fn: (failure: F) => G): Result<T, G> {
  return r.ok ? { ok: true, value: r.value } : { ok: false, failure: fn(r.failure) };
}

/** Success value, or a fallback when the call failed. */
export function valueOr<T, F>(r: Result<T, F>, fallback: T): T {
  return r.ok ? r.value : fallback;
}

function settle<T, F>(r: Result<T, F>): T {
  if (r.ok) return r.value;
  // The ONLY throw in the data layer: hooks pass this straight into TanStack Query.
  throw r.failure instanceof Failure ? r.failure : new Failure('unknown', String(r.failure));
}

const isPromise = <T>(v: unknown): v is Promise<T> =>
  typeof v === 'object' && v !== null && typeof (v as { then?: unknown }).then === 'function';

/**
 * Returns the value or **throws the Failure**. Accepts a Result or a Promise of one, so a
 * queryFn can be written as `() => unwrap(repository.detail(id))`.
 */
export function unwrap<T, F = Failure>(r: Promise<Result<T, F>>): Promise<T>;
export function unwrap<T, F = Failure>(r: Result<T, F>): T;
export function unwrap<T, F = Failure>(r: Result<T, F> | Promise<Result<T, F>>): T | Promise<T> {
  return isPromise<Result<T, F>>(r) ? r.then(settle) : settle(r);
}
