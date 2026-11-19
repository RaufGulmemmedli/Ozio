'use client';

/**
 * `/notifications` — the inbox.
 *
 * Presentation per 02-routing.md: a **drawer** from 768 up (the route renders itself inside
 * `<Drawer>`; closing it goes back), a plain page below that.
 *
 * `GET /notification/api/v1/notifications` is verified (`{data: {data: [...], total}}`,
 * `limit` 10 + `offset`); `createdAt` is a zone-less **UTC** timestamp, normalised by the parser.
 * `POST …/notifications/read` and `DELETE …/notifications` are **unverified**, so nothing is marked
 * read optimistically: the list refetches only after the server confirms, and a response that does
 * not confirm surfaces as an error toast.
 */
import { useState } from 'react';
import { useTranslations } from 'next-intl';

import { useFormat, useRouter } from '@/core/i18n';
import { useIsMobile } from '@/core/lib/use-breakpoint';
import { paths } from '@/core/routes';
import { Bell } from '@/shared/lucide';
import { EmptyState } from '@/shared/states';
import { Button, ConfirmDialog, Drawer, toast } from '@/shared/ui';
import { PageHeader } from '@/shared/layout';

import { LinkButton, NotificationRow, SectionError } from '../components';
import {
  useClearNotifications,
  useMarkNotificationsRead,
  useNotificationFeed,
  useUnreadCount,
} from '../hooks';
import { NotificationsSkeleton } from './NotificationsSkeleton';

export function NotificationsView() {
  const t = useTranslations('notifications');
  const isMobile = useIsMobile();
  const router = useRouter();

  const body = <NotificationsBody />;

  if (isMobile) {
    return (
      <div className="flex w-full flex-col gap-6">
        <PageHeader title={t('title')} subtitle={<NotificationsSubtitle />} />
        {body}
      </div>
    );
  }

  return (
    <>
      {/* The page content stays rendered behind the drawer so a direct hit is never a blank page. */}
      <div className="flex w-full flex-col gap-6">
        <PageHeader title={t('title')} subtitle={<NotificationsSubtitle />} />
        {body}
      </div>
      <Drawer
        open
        onOpenChange={(open) => {
          if (!open) router.back();
        }}
        title={t('title')}
        width={480}
        closeLabel={t('close')}
      >
        <NotificationsBody compact />
      </Drawer>
    </>
  );
}

function NotificationsSubtitle() {
  const t = useTranslations('notifications');
  const unread = useUnreadCount();
  const count = unread.data ?? 0;
  return <>{count > 0 ? t('subtitleUnread', { count }) : t('subtitle')}</>;
}

function NotificationsBody({ compact = false }: { compact?: boolean }) {
  const t = useTranslations('notifications');
  const { relative } = useFormat();
  const feed = useNotificationFeed();
  const markRead = useMarkNotificationsRead();
  const clearAll = useClearNotifications();
  const [confirmClear, setConfirmClear] = useState(false);

  const unreadIds = feed.items.filter((item) => !item.isRead).map((item) => item.id);

  const runMarkRead = () => {
    markRead.mutate(unreadIds, {
      onSuccess: () => toast.success(t('markedRead')),
      onError: () => toast.error(t('markReadFailed')),
    });
  };

  const runClearAll = () => {
    clearAll.mutate(undefined, {
      onSuccess: () => {
        setConfirmClear(false);
        toast.success(t('cleared'));
      },
      onError: () => {
        setConfirmClear(false);
        toast.error(t('clearFailed'));
      },
    });
  };

  if (feed.isPending) return <NotificationsSkeleton label={t('loading')} count={compact ? 4 : 6} />;

  if (feed.isError && feed.error) {
    return (
      <SectionError error={feed.error} onRetry={feed.refetch} retryLabel={t('retry')} />
    );
  }

  if (feed.isEmpty) {
    return (
      <EmptyState
        icon={Bell}
        title={t('empty.title')}
        body={t('empty.body')}
        panel
        titleAs="p"
        action={
          <LinkButton href={paths.home} variant="primary" size="lg">
            {t('empty.cta')}
          </LinkButton>
        }
      />
    );
  }

  return (
    <div className="flex w-full flex-col gap-4">
      {(unreadIds.length > 0 || feed.items.length > 0) && !compact ? (
        <div className="flex w-full flex-row flex-wrap items-center justify-end gap-3">
          {unreadIds.length > 0 ? (
            <Button
              variant="soft"
              size="md"
              loading={markRead.isPending}
              onClick={runMarkRead}
            >
              {t('markAllRead')}
            </Button>
          ) : null}
          <Button variant="ghost" size="md" onClick={() => setConfirmClear(true)}>
            {t('clearAll')}
          </Button>
        </div>
      ) : null}

      <ul className="flex w-full flex-col gap-3">
        {feed.items.map((item) => (
          <li key={item.id}>
            <NotificationRow
              item={item}
              timeLabel={item.createdAt ? relative(item.createdAt) : null}
              unreadLabel={t('unread')}
            />
          </li>
        ))}
      </ul>

      {feed.hasMore ? (
        <Button
          variant="soft"
          size="lg"
          className="self-center"
          loading={feed.isFetchingNextPage}
          onClick={feed.loadMore}
        >
          {t('loadMore')}
        </Button>
      ) : null}

      <ConfirmDialog
        open={confirmClear}
        onOpenChange={setConfirmClear}
        onConfirm={runClearAll}
        busy={clearAll.isPending}
        destructive
        title={t('clearConfirm.title')}
        body={t('clearConfirm.body')}
        confirmLabel={t('clearConfirm.confirm')}
        cancelLabel={t('clearConfirm.cancel')}
      />
    </div>
  );
}
