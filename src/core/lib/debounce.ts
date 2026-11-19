'use client';

/**
 * Debouncing. Search fields debounce 300 ms; the product quantity stepper debounces 250 ms and
 * sends the final quantity (04-data-layer.md).
 */
import { useEffect, useMemo, useState } from 'react';

export interface Debounced<A extends unknown[]> {
  (...args: A): void;
  /** Forget the pending call. */
  cancel(): void;
  /** Run the pending call now. */
  flush(): void;
  /** Is a call waiting? */
  pending(): boolean;
}

export function debounce<A extends unknown[]>(fn: (...args: A) => void, ms = 300): Debounced<A> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let lastArgs: A | undefined;

  const run = () => {
    timer = undefined;
    const args = lastArgs;
    lastArgs = undefined;
    if (args) fn(...args);
  };

  const debounced = ((...args: A) => {
    lastArgs = args;
    if (timer !== undefined) clearTimeout(timer);
    timer = setTimeout(run, ms);
  }) as Debounced<A>;

  debounced.cancel = () => {
    if (timer !== undefined) clearTimeout(timer);
    timer = undefined;
    lastArgs = undefined;
  };
  debounced.flush = () => {
    if (timer === undefined) return;
    clearTimeout(timer);
    run();
  };
  debounced.pending = () => timer !== undefined;

  return debounced;
}

/** Leading-edge throttle, for scroll/resize handlers. */
export function throttle<A extends unknown[]>(fn: (...args: A) => void, ms = 100): (...args: A) => void {
  let last = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  return (...args: A) => {
    const now = Date.now();
    const wait = ms - (now - last);
    if (wait <= 0) {
      last = now;
      fn(...args);
      return;
    }
    if (timer !== undefined) return;
    timer = setTimeout(() => {
      timer = undefined;
      last = Date.now();
      fn(...args);
    }, wait);
  };
}

/**
 * The debounced form of a value — the usual way to drive a search query:
 *
 * ```ts
 * const [term, setTerm] = useState('');
 * const debouncedTerm = useDebouncedValue(term, 300);
 * const q = useScreenQuery({ queryKey: searchKeys.list(debouncedTerm), ... });
 * ```
 */
export function useDebouncedValue<T>(value: T, ms = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    if (ms <= 0) return;
    const timer = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(timer);
  }, [value, ms]);

  // `ms <= 0` means "no debounce": the current value *is* the answer, so it is derived during
  // render instead of being copied into state by the effect.
  return ms <= 0 ? value : debounced;
}

/**
 * Ties one long-lived timer to the `fn` of the current render. A plain function, so the wrapper is
 * assembled before it is ever handed back from a hook.
 */
function bindDebounced<A extends unknown[]>(
  timer: Debounced<[() => void]>,
  fn: (...args: A) => void,
): Debounced<A> {
  const call = ((...args: A) => timer(() => fn(...args))) as Debounced<A>;
  call.cancel = timer.cancel;
  call.flush = timer.flush;
  call.pending = timer.pending;
  return call;
}

/**
 * A debounced callback. The **timer** is what survives re-renders — a pending call is never
 * dropped or restarted because the component rendered again, and `cancel` / `flush` / `pending`
 * always address that one timer. Only a change of `ms` builds a new one.
 *
 * What runs when the timer fires is the `fn` from the render that made the call, together with the
 * arguments of that call, so the two can never disagree. (The older "stable identity + latest
 * `fn` through a ref" shape is not expressible under the React 19 compiler rules: a ref may not be
 * read, or handed to another function, during render.)
 */
export function useDebouncedCallback<A extends unknown[]>(
  fn: (...args: A) => void,
  ms = 300,
): Debounced<A> {
  // One long-lived timer that debounces a thunk. Nothing about it depends on `fn`.
  const timer = useMemo(() => debounce<[() => void]>((run) => run(), ms), [ms]);

  // Unmounting forgets the pending call; a re-render does not.
  useEffect(() => () => timer.cancel(), [timer]);

  return useMemo(() => bindDebounced<A>(timer, fn), [timer, fn]);
}
