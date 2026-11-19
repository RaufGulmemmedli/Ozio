'use client';

/**
 * UN5 · "Yeni ünvan" as a form — `/addresses/new`.
 *
 * `/addresses/new` is a **modal** route (ROUTES.md): the intercepted `@modal/(.)addresses/new`
 * renders this inside `<Modal>` (a bottom sheet below 768, which `<Modal>` already does), and a
 * direct hit renders the same component full-page. The map variant of the same job lives at
 * `/addresses/pick`.
 *
 * The form saves without coordinates when the user only types an address: `lat`/`lng` are sent as
 * `null`, and the card then says so. Picking a point is the map screen's job.
 */
import { useCallback, useEffect, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';

import { useRouter } from '@/core/i18n/navigation';
import { useFailureMessage } from '@/core/i18n';
import { paths } from '@/core/routes';
import { Breadcrumbs, Button, toast } from '@/shared/ui';
import { ErrorState } from '@/shared/states';
import { FormSkeleton, Shimmer } from '@/shared/skeleton';
import { Map } from '@/shared/lucide';

import { AddressForm, type AddressFormSubmit, type AddressFormValues } from '../components/AddressForm';
import {
  useAddress,
  useCreateAddress,
  useSelectedAddress,
  useUpdateAddress,
} from '../hooks';
import { toAddressInput } from '../data/models/address';

export interface AddressFormViewProps {
  /** `true` when rendered inside the intercepted modal (no breadcrumb, no card chrome). */
  inModal?: boolean;
  onClose?: () => void;
}

export function AddressFormView({ inModal = false, onClose }: AddressFormViewProps) {
  const t = useTranslations('address');
  const failureMessage = useFailureMessage();
  const router = useRouter();
  const params = useSearchParams();
  const editId = Number(params?.get('id') ?? '') || null;

  const editing = useAddress(editId);
  const selected = useSelectedAddress();
  const create = useCreateAddress();
  const update = useUpdateAddress();

  const initial = useMemo<Partial<AddressFormValues>>(() => {
    if (!editId || !editing.data) return {};
    const input = toAddressInput(editing.data);
    return {
      kind: input.kind,
      line: input.line,
      road: input.road ?? '',
      buildingName: input.buildingName ?? '',
      floor: input.floor ?? '',
      apartmentRoom: input.apartmentRoom ?? '',
      entranceNumber: input.entranceNumber ?? '',
      personName: input.personName ?? '',
      phone: input.phone ?? '',
      details: input.details ?? '',
      makeDefault: selected.selectedId === editing.data.id,
    };
  }, [editId, editing.data, selected.selectedId]);

  const done = useCallback(() => {
    toast.success(t('toast.saved'));
    if (onClose) onClose();
    else router.push(paths.addresses);
  }, [onClose, router, t]);

  /** A 404 on the edited address → back to `/addresses` with a toast (the documented behaviour). */
  const notFound = editId !== null && editing.isError && editing.error?.kind === 'notFound';
  useEffect(() => {
    if (!notFound) return;
    toast.error(t('toast.notFound'));
    router.replace(paths.addresses);
  }, [notFound, router, t]);

  const onSubmit = useCallback(
    (input: AddressFormSubmit) => {
      const onError = (error: Parameters<typeof failureMessage>[0]) =>
        toast.error({ title: t('toast.saveFailed'), body: failureMessage(error) });

      if (editId) {
        update.mutate({ id: editId, input, makeSelected: input.makeSelected }, { onSuccess: done, onError });
        return;
      }
      create.mutate(input, { onSuccess: done, onError });
    },
    [create, update, editId, done, t, failureMessage],
  );

  if (editId && editing.isPending) {
    return (
      <Shimmer label={t('loading')} className="w-full">
        <FormSkeleton fields={6} />
      </Shimmer>
    );
  }

  if (editId && editing.isError) {
    return (
      <ErrorState
        failure={editing.error}
        title={t('error.title')}
        message={failureMessage(editing.error)}
        onRetry={() => editing.refetch()}
        retryLabel={t('error.retry')}
        secondaryAction={
          <Button as="a" href={paths.addresses} variant="soft" size="lg">
            {t('zones.back')}
          </Button>
        }
      />
    );
  }

  return (
    <div className="flex w-full flex-col gap-5">
      {inModal ? null : (
        <Breadcrumbs
          label={t('breadcrumbLabel')}
          items={[
            { label: t('title'), href: paths.addresses },
            { label: editId ? t('editTitle') : t('new') },
          ]}
        />
      )}

      <div className="flex w-full flex-col gap-4 md:max-w-[560px]">
        <Button
          as="a"
          href={editId ? `${paths.addressPick}?id=${editId}` : paths.addressPick}
          variant="soft"
          size="lg"
          leadingIcon={<Map size={18} aria-hidden="true" />}
        >
          {t('form.switchToMap')}
        </Button>

        <AddressForm
          bare={inModal}
          title={inModal ? undefined : editId ? t('editTitle') : t('new')}
          titleAs="h1"
          initial={initial}
          point={editing.data?.point ?? null}
          onSubmit={onSubmit}
          submitting={create.isPending || update.isPending}
          failure={create.error ?? update.error ?? null}
        />
      </div>
    </div>
  );
}
