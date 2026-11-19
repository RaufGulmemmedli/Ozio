'use client';

/**
 * The chat's data layer.
 *
 * The thread is a real query (so `?preview=loading|empty|error` work) against the MSW-backed
 * scripted agent, and it is persisted by `createMockDb('support', …)` — a reload shows the same
 * conversation. Sending is a mutation whose response already contains the agent's answer; the
 * answer is **held back** for `replyDelayMs` so the typing indicator means something.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocale } from 'next-intl';

import { unwrap, type Failure } from '@/core/network';
import { CACHE, scoped, useScreenQuery } from '@/core/query';

import {
  redactSensitive,
  type SupportMessage,
  type SupportThread,
} from '../data/models/support-message';
import { MAX_MESSAGE_LENGTH } from '../data/support.fixtures';
import { supportRepository } from '../data/support.repository';
import { supportKeys } from '../support.query-keys';

const EMPTY_THREAD: SupportThread = { messages: [], replyDelayMs: 0, now: 0 };

export interface UseSupportChatResult {
  /** What the message list renders, newest last, including the optimistic outgoing bubble. */
  messages: SupportMessage[];
  /** First load in flight → the mirror skeleton. */
  isPending: boolean;
  isError: boolean;
  error: Failure | null;
  /** Loaded and nothing has been said yet → the "Yeni söhbət" state. */
  isEmpty: boolean;
  /**
   * The clock the thread was read with, for the "Bu gün" divider. Supplied by the response so the
   * view never calls `Date.now()` during render; `0` when unknown.
   */
  now: number;
  /** The agent's answer is being withheld → show the typing indicator. */
  typing: boolean;
  /** A send is in flight. */
  sending: boolean;
  /** The send failed; the composer keeps the text so nothing is lost. */
  sendError: Failure | null;
  send: (text: string) => void;
  clear: () => void;
  refetch: () => void;
}

export function useSupportChat(): UseSupportChatResult {
  const locale = useLocale();
  const queryClient = useQueryClient();

  const query = useScreenQuery<SupportThread>(
    {
      queryKey: scoped(supportKeys.thread(), locale),
      queryFn: ({ signal }) => unwrap(supportRepository.thread({ signal })),
      ...CACHE.profile,
      refetchOnWindowFocus: false,
    },
    { empty: EMPTY_THREAD },
  );

  /** The agent reply withheld while the typing indicator runs. */
  const [heldId, setHeldId] = useState<string | null>(null);
  /** The user's own message, shown before the round trip comes back. Timestamped on send. */
  const [outgoing, setOutgoing] = useState<SupportMessage | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current !== null) clearTimeout(timer.current);
    },
    [],
  );

  const apply = useCallback(
    (thread: SupportThread) => {
      queryClient.setQueryData(scoped(supportKeys.thread(), locale), thread);
    },
    [queryClient, locale],
  );

  const mutation = useMutation<SupportThread, Failure, string>({
    mutationKey: supportKeys.send(),
    retry: false,
    mutationFn: (text) => unwrap(supportRepository.send(text, locale)),
    onSuccess: (thread) => {
      setOutgoing(null);
      apply(thread);

      const last = thread.messages[thread.messages.length - 1];
      if (!last || last.from !== 'agent' || thread.replyDelayMs <= 0) {
        setHeldId(null);
        return;
      }
      setHeldId(last.id);
      if (timer.current !== null) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        timer.current = null;
        setHeldId(null);
      }, thread.replyDelayMs);
    },
    onError: () => {
      setOutgoing(null);
      setHeldId(null);
    },
  });

  const clearMutation = useMutation<SupportThread, Failure, void>({
    retry: false,
    mutationFn: () => unwrap(supportRepository.clear()),
    onSuccess: (thread) => {
      setHeldId(null);
      setOutgoing(null);
      apply(thread);
    },
  });

  const thread = query.data ?? EMPTY_THREAD;

  const messages = useMemo(() => {
    const visible = heldId === null
      ? thread.messages
      : thread.messages.filter((m) => m.id !== heldId);
    if (outgoing === null) return visible;
    return [...visible, outgoing];
  }, [thread.messages, heldId, outgoing]);

  const send = useCallback(
    (text: string) => {
      // Masked here as well as in the mock, so the optimistic bubble can never show a raw number.
      const value = redactSensitive(text.trim()).slice(0, MAX_MESSAGE_LENGTH);
      if (!value) return;
      // `Date.now()` belongs in the event handler, never in render.
      setOutgoing({ id: 'outgoing', from: 'me', text: value, sentAt: Date.now() });
      mutation.mutate(value);
    },
    [mutation],
  );

  return {
    messages,
    isPending: query.isPending,
    isError: query.isError,
    error: query.error ?? null,
    isEmpty: !query.isPending && !query.isError && messages.length === 0,
    now: thread.now,
    typing: heldId !== null || mutation.isPending,
    sending: mutation.isPending,
    sendError: mutation.error ?? null,
    send,
    clear: () => clearMutation.mutate(),
    refetch: () => {
      void query.refetch();
    },
  };
}
