'use client';

/**
 * `/school/class-list` — SC3 "Sinif siyahısı" (`sc3-school-class-list.html`, frame `cnxeJ`).
 *
 * The export draws one list; the data is a paged collection, so the lists are rendered through
 * `<InfiniteList>` + `useOffsetInfinite` and the summary card follows the list the user is looking
 * at (the first one, which is what the export shows).
 *
 * States from `sc-states-dialogs.html`:
 *  - `State · Hələ siyahı yoxdur` → the empty state, with "Siyahı yarat";
 *  - `State · Yüklənmədi` → the error state, with "Yenidən cəhd et";
 *  - `Dialog · Siyahı yarat` → `<CreateListDialog>`.
 *
 * "Hamısını səbətə at" is a **demo action**: the mock answers with the count and total that would
 * go into the cart and nothing is ordered — the toast and the summary's footnote both say so.
 * Deleting a list uses `confirmDialog()` (brief-mandated; not drawn in the export).
 */
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { useFailureMessage, useFormat } from '@/core/i18n';
import { shareOrCopy } from '@/core/lib/clipboard';
import { paths } from '@/core/routes';
import { PageHeader } from '@/shared/layout';
import { Plus, Trash2 } from '@/shared/lucide';
import { EmptyState, ErrorState } from '@/shared/states';
import { Button, confirmDialog, IconButton, InfiniteList, toast } from '@/shared/ui';

import { ClassListCard } from '../components/class-list-card';
import { ClassListSummary } from '../components/class-list-summary';
import { CreateListDialog } from '../components/create-list-dialog';
import { NotebookPen } from '../components/icons';
import { SchoolDemoBanner } from '../components/school-demo-banner';
import type { ClassList } from '../data/models/class-list';
import {
  useAddListToCart,
  useClassLists,
  useCreateClassList,
  useDeleteClassList,
} from '../hooks/use-class-lists';
import { ClassListSkeleton } from './ClassListSkeleton';

export function ClassListView() {
  const t = useTranslations('school');
  const { money } = useFormat();
  const failureMessage = useFailureMessage();

  const lists = useClassLists();
  const create = useCreateClassList();
  const remove = useDeleteClassList();
  const addToCart = useAddListToCart();

  const [createOpen, setCreateOpen] = useState(false);
  const [sharingId, setSharingId] = useState<string | null>(null);

  const primary: ClassList | undefined = lists.items[0];

  const share = async (list: ClassList) => {
    setSharingId(list.id);
    try {
      const outcome = await shareOrCopy({
        title: list.title,
        text: t('lists.shareText', { title: list.title, school: list.school }),
        url: list.shareLink,
      });
      if (outcome === 'failed') toast.error(t('lists.shareFailed'));
      else toast.success(outcome === 'shared' ? t('lists.shared') : t('lists.copied'));
    } finally {
      setSharingId(null);
    }
  };

  const confirmDelete = async (list: ClassList) => {
    const ok = await confirmDialog({
      title: t('delete.title'),
      body: t('delete.body', { title: list.title }),
      confirmLabel: t('delete.confirm'),
      cancelLabel: t('delete.cancel'),
      destructive: true,
    });
    if (ok) {
      remove.mutate(list.id, {
        onSuccess: () => toast.success(t('delete.done')),
        onError: (failure) => toast.error(failureMessage(failure)),
      });
    }
  };

  const header = (
    <>
      <PageHeader
        title={t('lists.title')}
        subtitle={t('lists.subtitle')}
        backHref={paths.school}
        backLabel={t('crumb.school')}
        actions={
          <Button
            variant="soft"
            size="lg"
            leadingIcon={<Plus size={20} aria-hidden="true" />}
            onClick={() => {
              create.reset();
              setCreateOpen(true);
            }}
          >
            {t('lists.create')}
          </Button>
        }
      />
      <SchoolDemoBanner />
    </>
  );

  const dialog = (
    <CreateListDialog
      open={createOpen}
      onOpenChange={setCreateOpen}
      busy={create.isPending}
      failure={create.error ?? null}
      onSubmit={(body) =>
        create.mutate(body, {
          onSuccess: (list) => {
            setCreateOpen(false);
            toast.success({ title: t('create.done'), body: list.title });
          },
        })
      }
    />
  );

  if (lists.isPending) {
    return (
      <>
        {header}
        <ClassListSkeleton />
        {dialog}
      </>
    );
  }

  if (lists.isError) {
    return (
      <>
        {header}
        <ErrorState
          failure={lists.error}
          title={t('error.title')}
          message={t('error.body')}
          retryLabel={t('error.retry')}
          onRetry={lists.refetch}
          retrying={lists.isFetching}
        />
        {dialog}
      </>
    );
  }

  if (lists.isEmpty) {
    return (
      <>
        {header}
        <EmptyState
          panel
          tone="brand"
          icon={NotebookPen}
          title={t('lists.empty.title')}
          body={t('lists.empty.body')}
          action={
            <Button variant="primary" size="md" onClick={() => setCreateOpen(true)}>
              {t('lists.create')}
            </Button>
          }
        />
        {dialog}
      </>
    );
  }

  return (
    <>
      {header}

      <div className="flex w-full flex-col gap-8 lg:flex-row">
        <div className="flex min-w-0 flex-1 flex-col gap-5">
          <InfiniteList<ClassList>
            items={lists.items}
            itemKey={(list) => list.id}
            hasNextPage={lists.hasMore}
            isFetchingNextPage={lists.isFetchingNextPage}
            fetchNextPage={lists.loadMore}
            loadingLabel={t('loading')}
            className="flex w-full flex-col gap-5"
            renderItem={(list) => (
              <div className="relative w-full">
                <ClassListCard list={list} />
                {/* Only a list the user created can be removed; a shared one has a teacher. */}
                {list.sharedBy ? null : (
                  <div className="absolute right-5 top-5">
                    <IconButton
                      size={36}
                      aria-label={t('delete.action', { title: list.title })}
                      loading={remove.isPending && remove.variables === list.id}
                      onClick={() => void confirmDelete(list)}
                    >
                      <Trash2 size={18} aria-hidden="true" />
                    </IconButton>
                  </div>
                )}
              </div>
            )}
          />
        </div>

        {primary ? (
          <ClassListSummary
            list={primary}
            addingToCart={addToCart.isPending}
            sharing={sharingId === primary.id}
            onShare={() => void share(primary)}
            onAddToCart={() =>
              addToCart.mutate(primary.id, {
                onSuccess: (result) =>
                  toast.success({
                    title: t('lists.addedDemo', { count: result.itemCount }),
                    body: money(result.total),
                  }),
                onError: (failure) => toast.error(failureMessage(failure)),
              })
            }
          />
        ) : null}
      </div>

      {dialog}
    </>
  );
}
