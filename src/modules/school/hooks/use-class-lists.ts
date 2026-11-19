'use client';

/**
 * The class shopping lists.
 *
 * The list read is an `offset`/`limit` infinite query (`useOffsetInfinite`), the shape every real
 * list endpoint in this app uses, so `<InfiniteList>` works unchanged when a backend appears.
 */
import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { useCallback } from 'react';

import { unwrap, type Failure } from '@/core/network';
import { CACHE, scoped, useLocaleKey, useOffsetInfinite, type UseOffsetInfiniteResult } from '@/core/query';

import { schoolKeys } from '../school.query-keys';
import { schoolRepository, type CreateClassListBody } from '../data/school.repository';
import type { AddListToCartResult, ClassList } from '../data/models/class-list';

const PAGE_SIZE = 10;

export function useClassLists(): UseOffsetInfiniteResult<ClassList> {
  const locale = useLocaleKey();

  const fetchPage = useCallback(
    ({ offset, limit, signal }: { offset: number; limit: number; signal: AbortSignal }) =>
      unwrap(schoolRepository.classLists({ offset, limit, locale }, signal)),
    [locale],
  );

  return useOffsetInfinite<ClassList>({
    key: scoped(schoolKeys.classLists(), locale),
    limit: PAGE_SIZE,
    fetchPage,
    staleTime: CACHE.profile.staleTime,
    gcTime: CACHE.profile.gcTime,
  });
}

/** "Siyahı yarat" — the create dialog. Field errors (empty class / no lines) arrive as a 422. */
export function useCreateClassList(): UseMutationResult<ClassList, Failure, CreateClassListBody> {
  const locale = useLocaleKey();
  const client = useQueryClient();

  return useMutation<ClassList, Failure, CreateClassListBody>({
    mutationFn: (body) => unwrap(schoolRepository.createClassList(body, locale)),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: schoolKeys.classLists() });
    },
  });
}

export function useDeleteClassList(): UseMutationResult<string, Failure, string> {
  const client = useQueryClient();

  return useMutation<string, Failure, string>({
    mutationFn: (id) => unwrap(schoolRepository.deleteClassList(id)),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: schoolKeys.classLists() });
    },
  });
}

/**
 * "Hamısını səbətə at". **Nothing is ordered** — the mock answers with the count and total that
 * would go into the cart and flags the answer `simulated`, and the screen says so.
 */
export function useAddListToCart(): UseMutationResult<AddListToCartResult, Failure, string> {
  return useMutation<AddListToCartResult, Failure, string>({
    mutationFn: (id) => unwrap(schoolRepository.addListToCart(id)),
  });
}
