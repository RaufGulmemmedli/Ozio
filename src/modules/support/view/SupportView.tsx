'use client';

/**
 * `/support` — "Ozio dəstək" (`q3EAkg`, `Q2pEFJ`, `XOzRP`, `fONwT`).
 *
 * Honest about what it is: there is **no chat backend**. The agent is a script served by MSW
 * (`/api/mock/support/…`) — a greeting, keyword-matched replies and the documented catch-all — and
 * the thread lives in `createMockDb('support', …)`, so a reload keeps the conversation. The
 * "Demo rejim" notice says exactly that.
 *
 * States: loading (mirror skeleton) · new/empty · loaded · unavailable. All reachable from
 * `?preview=loading|empty|error|unavailable` as well as from the UI.
 *
 * Nothing that looks like a phone number, card number or one-time code is echoed back or stored:
 * `redactSensitive()` runs in the composer path, in the mock before it persists, and again in the
 * parser on read.
 */
import { useMemo, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';

import { mswMode } from '@/core/config';
import { Link, useFailureMessage, useFormat } from '@/core/i18n';
import { usePreview } from '@/core/query';
import { paths } from '@/core/routes';
import { ArrowLeft, Headphones, Package, Ticket, Wallet } from '@/shared/lucide';
import { DemoBanner, EmptyState, ErrorState, StateButton } from '@/shared/states';
import { Button } from '@/shared/ui';

import { CallButton } from '../components/CallButton';
import { ChatHeader } from '../components/ChatHeader';
import { Composer } from '../components/Composer';
import { DayDivider, MessageList } from '../components/MessageList';
import { MessageBubble, TypingBubble } from '../components/MessageBubble';
import { TopicsPanel, type SupportTopic } from '../components/TopicsPanel';
import { useSupportChat } from '../hooks/use-support-chat';
import { SupportChatSkeleton } from './SupportChatSkeleton';

const HEADING_ID = 'support-title';

/** Mocks switched off at build time → the scripted agent cannot answer at all. */
const MOCKS_OFF = mswMode === 'off';

/** `support-chat.html` keeps the conversation 640 tall; on mobile it fills the viewport instead. */
const CONVERSATION_CLASS =
  'flex h-[calc(100svh-19rem)] min-h-[420px] w-full min-w-0 flex-1 flex-col overflow-hidden rounded-xl bg-surface md:h-[640px]';

function sameDay(a: number, b: number): boolean {
  const x = new Date(a);
  const y = new Date(b);
  return (
    x.getFullYear() === y.getFullYear() &&
    x.getMonth() === y.getMonth() &&
    x.getDate() === y.getDate()
  );
}

export function SupportView() {
  const t = useTranslations('support');
  const format = useFormat();
  const failureMessage = useFailureMessage();
  const preview = usePreview();
  const chat = useSupportChat();

  const topics: SupportTopic[] = useMemo(
    () => [
      { id: 'orderLate', icon: Package, label: t('topic.orderLate') },
      { id: 'bonusMissing', icon: Wallet, label: t('topic.bonusMissing') },
      { id: 'lottery', icon: Ticket, label: t('topic.lottery') },
    ],
    [t],
  );

  const header = (
    <div className="flex w-full shrink-0 flex-col gap-2.5">
      {/* `Back` node: `arrow-left` 16 + 14/500 `ink3` — a link, not a button. */}
      <Link
        href={paths.profile}
        className="flex w-fit min-h-11 items-center gap-2 text-label font-medium text-ink3 hover:text-ink md:min-h-0"
      >
        <ArrowLeft aria-hidden="true" size={16} className="shrink-0" />
        {t('back')}
      </Link>
      <h1
        id={HEADING_ID}
        className="m-0 text-[28px] font-extrabold leading-[1.2] tracking-[-0.02em] text-ink md:text-h2 lg:text-h1-app"
      >
        {t('title')}
      </h1>
      <p className="m-0 max-w-[720px] text-body text-ink2">{t('subtitle')}</p>
    </div>
  );

  const shell = (children: ReactNode) => (
    <div className="flex w-full flex-col gap-8 pb-12 pt-2">
      {header}
      <DemoBanner module={t('title')} body={t('demo.body')} />
      {children}
    </div>
  );

  /* -------------------------------------------------------------- unavailable */

  const unavailablePanel = (
    <EmptyState
      panel
      tone="brand"
      icon={Headphones}
      titleAs="h2"
      title={t('unavailable.title')}
      body={t('unavailable.body')}
      action={
        <StateButton variant="primary" onClick={chat.refetch}>
          {t('action.refresh')}
        </StateButton>
      }
      secondaryAction={<CallButton phone={t('phone')} label={t('action.call')} />}
    />
  );

  // `NEXT_PUBLIC_MSW=off`: the flag is on, so the screen exists, but nothing can answer.
  if (MOCKS_OFF) {
    return shell(
      <ErrorState
        title={t('error.title')}
        message={t('unavailable.body')}
        icon={Headphones}
        secondaryAction={
          <StateButton variant="soft" href={paths.help}>
            {t('fallback.help')}
          </StateButton>
        }
      />,
    );
  }

  if (preview === 'unavailable') return shell(unavailablePanel);

  if (chat.isPending) return shell(<SupportChatSkeleton label={t('loading')} />);

  // The mock *is* the channel here, so a failed thread read is "çat hələ işləmir", not a bug page.
  if (chat.isError) {
    return shell(
      <ErrorState
        failure={chat.error}
        title={t('unavailable.title')}
        message={chat.error ? failureMessage(chat.error) : t('unavailable.body')}
        icon={Headphones}
        onRetry={chat.refetch}
        retryLabel={t('action.refresh')}
        secondaryAction={<CallButton phone={t('phone')} label={t('action.call')} />}
      />,
    );
  }

  /* -------------------------------------------------------------------- chat */

  const messages = chat.messages;
  // The reference for the "Bu gün" divider comes from the response (`chat.now`), so render stays
  // pure; with nothing to go on, the newest message's own day is treated as today.
  const today = chat.now > 0 ? chat.now : (messages[messages.length - 1]?.sentAt ?? 0);

  const rows: ReactNode[] = [];
  messages.forEach((message, index) => {
    const previous = messages[index - 1];
    if (!previous || !sameDay(previous.sentAt, message.sentAt)) {
      rows.push(
        <DayDivider
          key={`day-${message.id}`}
          label={
            sameDay(message.sentAt, today)
              ? t('day.today')
              : format.date(message.sentAt, 'dayMonth')
          }
        />,
      );
    }
    const time = format.date(message.sentAt, 'time');
    rows.push(
      <MessageBubble
        key={message.id}
        from={message.from}
        text={message.text}
        time={time}
        authorLabel={message.from === 'me' ? t('from.me') : t('agent.name')}
        timeLabel={t('sentAt', { time })}
      />,
    );
  });

  if (chat.typing) rows.push(<TypingBubble key="typing" label={t('typing')} />);

  return shell(
    <div className="flex w-full flex-col items-stretch gap-6 lg:flex-row lg:items-start">
      <section aria-labelledby={HEADING_ID} className={CONVERSATION_CLASS}>
        <ChatHeader
          name={t('agent.name')}
          status={t('agent.status')}
          actions={
            messages.length > 0 ? (
              <Button type="button" variant="ghost" size="md" onClick={chat.clear}>
                {t('action.clear')}
              </Button>
            ) : null
          }
        />

        {messages.length === 0 && !chat.typing ? (
          <div className="flex min-h-0 w-full flex-1 flex-col items-center justify-center gap-[14px] px-5 py-6 text-center md:px-6">
            <span
              aria-hidden="true"
              className="flex size-[88px] items-center justify-center rounded-pill bg-brand-soft text-brand"
            >
              <Headphones size={40} />
            </span>
            <p className="m-0 text-h3 font-extrabold text-ink md:text-[22px]">{t('empty.title')}</p>
            <p className="m-0 text-body-sm text-ink2">{t('empty.body')}</p>
          </div>
        ) : (
          <MessageList
            label={t('log.label')}
            revision={`${messages.length}-${chat.typing ? 'typing' : 'idle'}`}
          >
            {rows}
          </MessageList>
        )}

        <Composer
          label={t('composer.label')}
          placeholder={t('composer.placeholder')}
          sendLabel={t('composer.send')}
          hint={t('composer.hint')}
          busy={chat.sending}
          onSend={chat.send}
          error={chat.sendError ? failureMessage(chat.sendError) : null}
        />
      </section>

      <TopicsPanel
        title={t('topics.title')}
        topics={topics}
        faqLabel={t('faq')}
        disabled={chat.sending}
        onPick={(topic) => chat.send(topic.label)}
      />
    </div>,
  );
}
