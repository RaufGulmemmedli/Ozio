import type { Failure } from './failure';

/**
 * Every repository failure reaches TanStack Query through `unwrap()`, so `useQuery().error` and
 * `useMutation().error` are always a `Failure` — never `unknown`.
 */
declare module '@tanstack/react-query' {
  interface Register {
    defaultError: Failure;
  }
}
