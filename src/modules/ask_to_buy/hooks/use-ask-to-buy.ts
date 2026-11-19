'use client';

/**
 * Query / mutation wrappers for ask_to_buy.
 *
 * `?preview=loading|empty|error` is handled by `useScreenQuery`; `?preview=parent|child` is read
 * here, because the parent / child split is **mock state**, not a query state — see
 * {@link useAskRole}.
 */
import { useMutation, useQueryClient, type UseMutationResult, type UseQueryResult } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';

import { unwrap, type Failure } from '@/core/network';
import { CACHE, useLocaleKey, usePreview, useScreenQuery, scoped } from '@/core/query';

import { askToBuyKeys } from '../ask_to_buy.query-keys';
import { askToBuyRepository, type AskInbox } from '../data/ask_to_buy.repository';
import {
  defaultDirection,
  type AskContext,
  type AskDirection,
  type AskRequest,
  type AskRole,
} from '../data/models/ask-request';

const EMPTY_INBOX: AskInbox = { items: [], total: 0, offset: 0, limit: 0, pendingIncoming: 0 };

const EMPTY_CONTEXT: AskContext = {
  role: 'child',
  parents: [],
  cards: [],
  draftItems: [],
  draftItemCount: 0,
  draftTotal: 0,
  pendingIncoming: 0,
};

/** The demo's side plus the static pickers (parents, cards, basket). */
export function useAskContext(): UseQueryResult<AskContext, Failure> {
  const locale = useLocaleKey();
  const seed = useMemo(() => ({ empty: EMPTY_CONTEXT }), []);

  return useScreenQuery<AskContext>(
    {
      queryKey: scoped(askToBuyKeys.context(), locale),
      queryFn: ({ signal }) => unwrap(askToBuyRepository.context(locale, signal)),
      ...CACHE.profile,
    },
    seed,
  );
}

export interface AskRoleState {
  /** The side the screens render for. */
  role: AskRole;
  /** `true` while `?preview=parent|child` pins the role (the switch is then read-only). */
  forced: boolean;
  /** Flip the mock role. Resolves once the lists have been invalidated. */
  setRole: (role: AskRole) => void;
  /** `true` while the flip is in flight. */
  switching: boolean;
}

/**
 * Who the signed-in person is in the demo.
 *
 * There is no family API, so the role lives in the mock db and is flipped from the UI — that is
 * what makes both sides of every ask_to_buy screen reachable. `?preview=parent` / `?preview=child`
 * pins it for screenshots without touching the stored state.
 */
export function useAskRole(): AskRoleState {
  const preview = usePreview();
  const context = useAskContext();
  const client = useQueryClient();

  const mutation = useMutation<AskRole, Failure, AskRole>({
    mutationFn: (role) => unwrap(askToBuyRepository.setRole(role)),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: askToBuyKeys.all });
    },
  });

  const forcedRole: AskRole | null =
    preview === 'parent' ? 'parent' : preview === 'child' ? 'child' : null;

  const setRole = useCallback(
    (role: AskRole) => {
      if (forcedRole !== null) return;
      mutation.mutate(role);
    },
    [forcedRole, mutation],
  );

  return {
    role: forcedRole ?? context.data?.role ?? 'child',
    forced: forcedRole !== null,
    setRole,
    switching: mutation.isPending,
  };
}

/** One inbox side. A parent reads "Gələn", a child reads "Göndərdiyim". */
export function useAskInbox(direction: AskDirection): UseQueryResult<AskInbox, Failure> {
  const locale = useLocaleKey();
  const seed = useMemo(() => ({ empty: EMPTY_INBOX }), []);

  return useScreenQuery<AskInbox>(
    {
      queryKey: scoped(askToBuyKeys.inbox(direction), locale),
      queryFn: ({ signal }) => unwrap(askToBuyRepository.list({ direction, locale }, signal)),
      ...CACHE.profile,
    },
    seed,
  );
}

/** One request. `?preview=parent|child` still decides which side's controls are rendered. */
export function useAskRequest(id: string): UseQueryResult<AskRequest, Failure> {
  const locale = useLocaleKey();
  const trimmed = id.trim();

  return useScreenQuery<AskRequest>({
    queryKey: scoped(askToBuyKeys.request(trimmed), locale),
    queryFn: ({ signal }) => unwrap(askToBuyRepository.get(trimmed, locale, signal)),
    enabled: trimmed.length > 0,
    ...CACHE.profile,
  });
}

export interface SendAskInput {
  parentId: string;
  note: string;
}

/** The child's "Sorğunu göndər". Nothing is ordered — this only adds a mock row. */
export function useSendAsk(): UseMutationResult<AskRequest, Failure, SendAskInput> {
  const locale = useLocaleKey();
  const client = useQueryClient();

  return useMutation<AskRequest, Failure, SendAskInput>({
    mutationFn: ({ parentId, note }) => unwrap(askToBuyRepository.send(parentId, note, locale)),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: askToBuyKeys.all });
    },
  });
}

export interface DecideAskInput {
  id: string;
  /** Required by `approve`, ignored by `decline`. */
  cardId?: string;
}

/**
 * The parent's "Təsdiq et və ödə". **Nothing is charged**: the handler stamps the card label on
 * the row and creates a demo order id, which is exactly what the demo banner warns about.
 */
export function useApproveAsk(): UseMutationResult<AskRequest, Failure, DecideAskInput> {
  const locale = useLocaleKey();
  const client = useQueryClient();

  return useMutation<AskRequest, Failure, DecideAskInput>({
    mutationFn: ({ id, cardId }) => unwrap(askToBuyRepository.approve(id, cardId ?? '', locale)),
    onSuccess: (request) => {
      client.setQueryData(scoped(askToBuyKeys.request(request.id), locale), request);
      void client.invalidateQueries({ queryKey: askToBuyKeys.all });
    },
  });
}

/** The parent's "İmtina et". */
export function useDeclineAsk(): UseMutationResult<AskRequest, Failure, DecideAskInput> {
  const locale = useLocaleKey();
  const client = useQueryClient();

  return useMutation<AskRequest, Failure, DecideAskInput>({
    mutationFn: ({ id }) => unwrap(askToBuyRepository.decline(id, locale)),
    onSuccess: (request) => {
      client.setQueryData(scoped(askToBuyKeys.request(request.id), locale), request);
      void client.invalidateQueries({ queryKey: askToBuyKeys.all });
    },
  });
}

/** The child's "Yenidən göndər" on an expired request. */
export function useResendAsk(): UseMutationResult<AskRequest, Failure, string> {
  const locale = useLocaleKey();
  const client = useQueryClient();

  return useMutation<AskRequest, Failure, string>({
    mutationFn: (id) => unwrap(askToBuyRepository.resend(id, locale)),
    onSuccess: (request) => {
      client.setQueryData(scoped(askToBuyKeys.request(request.id), locale), request);
      void client.invalidateQueries({ queryKey: askToBuyKeys.all });
    },
  });
}

export { defaultDirection };
