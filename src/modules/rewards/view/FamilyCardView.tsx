'use client';

/**
 * N3 — `Web · Ailə kartı` (`family-card.html`) with its loading (`family-card-loading.html`) and
 * empty (`family-card-empty.html`) states; the error state reuses the shared `State Card` pattern
 * the screen spec points at.
 *
 * Member management is all mock: add a member, set or clear a per-member monthly limit, remove a
 * member. The pool and every contribution are server values — the view only formats them. The two
 * row actions (limit / remove) are not drawn in the export; see the report.
 */
import { useState } from 'react';
import { useTranslations } from 'next-intl';

import { cn } from '@/core/lib/cn';
import { useFormat } from '@/core/i18n';
import { useFailureMessage } from '@/core/i18n/failure-message';
import { paths } from '@/core/routes';
import { Pencil, Plus, Trash2, Users } from '@/shared/lucide';
import { Barcode } from '@/shared/media';
import { EmptyState, ErrorState } from '@/shared/states';
import { Button, ConfirmDialog, IconButton, Input, Modal, Switch, toast } from '@/shared/ui';

import { RewardsPage } from '../components/rewards-page';
import { StateCard } from '../components/state-card';
import { familyInitial, type FamilyCard, type FamilyMember } from '../data/models/family';
import { useFamilyAction, useFamilyCard } from '../hooks/use-family-card';
import { FamilyCardSkeleton } from './FamilyCardSkeleton';

/** The four cap choices the limit dialog offers; `null` clears the limit. */
const LIMIT_CHOICES: ReadonlyArray<number | null> = [5, 10, 20, null];

function MemberRow({
  member,
  onEditLimit,
  onRemove,
  busy,
}: {
  member: FamilyMember;
  onEditLimit: (member: FamilyMember) => void;
  onRemove: (member: FamilyMember) => void;
  busy: boolean;
}) {
  const t = useTranslations('rewards');
  const format = useFormat();

  return (
    <li className="flex min-h-[76px] flex-row items-center gap-4 border-t border-line py-3 first:border-t-0">
      <span
        aria-hidden="true"
        className={cn(
          'flex size-12 shrink-0 items-center justify-center rounded-pill text-body-l font-extrabold',
          member.owner ? 'bg-brand text-white' : 'bg-violet-soft text-violet',
        )}
      >
        {familyInitial(member.name)}
      </span>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="truncate text-body font-bold text-ink">{member.name}</p>
        <div className="flex flex-row flex-wrap items-center gap-2">
          <span className="text-caption text-ink3">
            {member.role === 'admin' ? t('family.role.admin') : t('family.role.member')}
          </span>
          {member.monthlyLimit !== null ? (
            <span className="rounded-pill bg-yellow px-2.5 py-[3px] text-micro font-bold text-on-yellow">
              {t('family.limit.pill', { amount: format.money(member.monthlyLimit) })}
            </span>
          ) : null}
        </div>
      </div>

      <span className="shrink-0 text-body font-extrabold text-success">
        +{format.money(member.contributed)}
      </span>

      {member.owner ? null : (
        <span className="flex shrink-0 flex-row items-center gap-1">
          <IconButton
            size={36}
            tone="ghost"
            aria-label={t('family.limit.edit')}
            disabled={busy}
            onClick={() => onEditLimit(member)}
          >
            <Pencil />
          </IconButton>
          <IconButton
            size={36}
            tone="ghost"
            aria-label={t('family.removeAction')}
            disabled={busy}
            onClick={() => onRemove(member)}
          >
            <Trash2 />
          </IconButton>
        </span>
      )}
    </li>
  );
}

function SettingRow({
  title,
  body,
  checked,
  onChange,
  disabled,
}: {
  title: string;
  body: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled: boolean;
}) {
  return (
    <div className="flex min-h-[76px] flex-row items-center justify-between gap-4 border-t border-line py-3 first:border-t-0">
      <div className="flex min-w-0 flex-col gap-1">
        <p className="text-body font-bold text-ink">{title}</p>
        <p className="text-caption text-ink2">{body}</p>
      </div>
      <Switch
        checked={checked}
        disabled={disabled}
        aria-label={title}
        onCheckedChange={onChange}
      />
    </div>
  );
}

export function FamilyCardView() {
  const t = useTranslations('rewards');
  const tc = useTranslations('common');
  const format = useFormat();
  const failureMessage = useFailureMessage();

  const query = useFamilyCard();
  const action = useFamilyAction();
  const card = query.data;

  const [addOpen, setAddOpen] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [nameError, setNameError] = useState(false);
  const [limitFor, setLimitFor] = useState<FamilyMember | null>(null);
  const [removeFor, setRemoveFor] = useState<FamilyMember | null>(null);

  const crumbs = [{ label: t('crumb.root'), href: paths.card }, { label: t('family.crumb') }];

  const page = (subtitle: string, children: React.ReactNode) => (
    <RewardsPage
      crumbs={crumbs}
      crumbsLabel={t('crumb.root')}
      title={t('family.title')}
      subtitle={subtitle}
      demoModule={t('demo.module')}
    >
      {children}
    </RewardsPage>
  );

  if (query.isPending) {
    return page(t('family.subtitle'), <FamilyCardSkeleton label={t('loading')} />);
  }

  if (query.isError || !card) {
    return page(
      t('subtitle.error'),
      <StateCard>
        <ErrorState
          failure={query.error}
          title={t('family.error.title')}
          message={query.error ? failureMessage(query.error) : t('error.body')}
          retryLabel={t('retry')}
          onRetry={() => query.refetch()}
        />
      </StateCard>,
    );
  }

  if (card.members.length === 0) {
    return page(
      t('family.subtitleEmpty'),
      <StateCard>
        <EmptyState
          icon={Users}
          tone="brand"
          title={t('family.empty.title')}
          body={t('family.empty.body')}
          action={
            <Button variant="primary" onClick={() => setAddOpen(true)}>
              {t('family.empty.cta')}
            </Button>
          }
        />
      </StateCard>,
    );
  }

  const saveSettings = (next: Partial<FamilyCard['settings']>) => {
    action.mutate(
      { kind: 'settings', settings: { ...card.settings, ...next } },
      {
        onSuccess: () => toast.success({ title: t('family.settings.saved') }),
        onError: (failure) => toast.error({ title: failureMessage(failure) }),
      },
    );
  };

  const submitMember = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setNameError(true);
      return;
    }
    action.mutate(
      { kind: 'addMember', member: { name: trimmed, phone: phone.trim(), monthly_limit: null } },
      {
        onSuccess: () => {
          setAddOpen(false);
          setName('');
          setPhone('');
          setNameError(false);
          toast.success({ title: t('family.add.done') });
        },
        onError: (failure) =>
          toast.error({ title: t('family.add.failed'), body: failureMessage(failure) }),
      },
    );
  };

  return (
    <>
      {page(
        t('family.subtitle'),
        <div className="flex w-full flex-col gap-6 lg:flex-row">
          {/* Card Column */}
          <div className="flex w-full flex-col gap-5 lg:w-[456px] lg:shrink-0">
            <section className="flex w-full flex-col gap-[18px] rounded-bento bg-block p-7">
              <h2 className="text-[22px] font-extrabold text-on-block">{t('family.title')}</h2>
              <div className="w-full rounded-lg bg-white p-5">
                <Barcode
                  value={card.cardNumber}
                  height={96}
                  label={t('family.barcodeAlt', { number: card.cardNumber })}
                />
              </div>
              <p className="text-label text-on-block2">{t('family.card.hint')}</p>
            </section>

            <section className="flex w-full flex-col gap-2 rounded-bento bg-brand p-7">
              <p className="text-label font-semibold text-white">{t('family.pool.label')}</p>
              <p className="text-[40px] font-extrabold leading-none tracking-[-0.03em] text-white md:text-[48px]">
                +{format.money(card.pool)}
              </p>
              <p className="text-label text-white">
                {t('family.pool.meta', { count: card.members.length })}
              </p>
            </section>
          </div>

          {/* Members Column */}
          <div className="flex min-w-0 flex-1 flex-col gap-5">
            <section className="flex w-full flex-col rounded-xl bg-surface p-6">
              <div className="flex flex-row flex-wrap items-center justify-between gap-3 pb-2.5">
                <h2 className="text-h4 font-extrabold text-ink">{t('family.members.title')}</h2>
                <Button
                  size="md"
                  variant="primary"
                  leadingIcon={<Plus size={18} aria-hidden="true" />}
                  onClick={() => setAddOpen(true)}
                >
                  {t('family.members.add')}
                </Button>
              </div>

              <ul className="flex w-full flex-col">
                {card.members.map((member) => (
                  <MemberRow
                    key={member.id}
                    member={member}
                    busy={action.isPending}
                    onEditLimit={setLimitFor}
                    onRemove={setRemoveFor}
                  />
                ))}
              </ul>
            </section>

            <section className="flex w-full flex-col rounded-xl bg-surface p-6">
              <SettingRow
                title={t('family.settings.notify.title')}
                body={t('family.settings.notify.body')}
                checked={card.settings.spendAlerts}
                disabled={action.isPending}
                onChange={(spendAlerts) => saveSettings({ spendAlerts })}
              />
              <SettingRow
                title={t('family.settings.childLimit.title')}
                body={t('family.settings.childLimit.body')}
                checked={card.settings.childLimit}
                disabled={action.isPending}
                onChange={(childLimit) => saveSettings({ childLimit })}
              />
              <SettingRow
                title={t('family.settings.sharedBonus.title')}
                body={t('family.settings.sharedBonus.body')}
                checked={card.settings.sharedBonus}
                disabled={action.isPending}
                onChange={(sharedBonus) => saveSettings({ sharedBonus })}
              />
            </section>
          </div>
        </div>,
      )}

      {/* Add member */}
      <Modal
        open={addOpen}
        onOpenChange={(open) => {
          setAddOpen(open);
          if (!open) setNameError(false);
        }}
        title={t('family.add.title')}
        size="s"
        footer={
          <>
            <Button variant="soft" onClick={() => setAddOpen(false)}>
              {tc('cancel')}
            </Button>
            <Button variant="primary" loading={action.isPending} onClick={submitMember}>
              {t('family.add.submit')}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-2">
            <span className="text-label font-semibold text-ink2">{t('family.add.name')}</span>
            <Input
              value={name}
              invalid={nameError}
              onChange={(event) => {
                setName(event.target.value);
                setNameError(false);
              }}
            />
            {nameError ? (
              <span role="alert" className="text-caption text-brand">
                {t('family.add.nameRequired')}
              </span>
            ) : null}
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-label font-semibold text-ink2">{t('family.add.phone')}</span>
            <Input
              value={phone}
              inputMode="tel"
              onChange={(event) => setPhone(event.target.value)}
            />
          </label>
        </div>
      </Modal>

      {/* Per-member monthly limit */}
      <Modal
        open={limitFor !== null}
        onOpenChange={(open) => {
          if (!open) setLimitFor(null);
        }}
        title={t('family.limit.title')}
        description={limitFor ? t('family.limit.body', { name: limitFor.name }) : undefined}
        size="s"
      >
        <div className="flex flex-row flex-wrap gap-2.5">
          {LIMIT_CHOICES.map((choice) => {
            const selected = (limitFor?.monthlyLimit ?? null) === choice;
            return (
              <button
                key={choice ?? 'none'}
                type="button"
                disabled={action.isPending}
                onClick={() => {
                  const member = limitFor;
                  if (!member) return;
                  action.mutate(
                    { kind: 'setLimit', id: member.id, limit: choice },
                    {
                      onSuccess: () => {
                        setLimitFor(null);
                        toast.success({ title: t('family.limit.saved') });
                      },
                      onError: (failure) => toast.error({ title: failureMessage(failure) }),
                    },
                  );
                }}
                className={cn(
                  'flex h-11 items-center rounded-pill px-[22px] text-body-sm font-bold',
                  selected ? 'bg-cta text-on-cta' : 'bg-surface2 text-ink',
                  'disabled:opacity-60',
                )}
              >
                {choice === null ? t('family.limit.none') : format.money(choice)}
              </button>
            );
          })}
        </div>
      </Modal>

      {/* Remove member */}
      <ConfirmDialog
        open={removeFor !== null}
        onOpenChange={(open) => {
          if (!open) setRemoveFor(null);
        }}
        title={t('family.remove.title')}
        body={removeFor ? t('family.remove.body', { name: removeFor.name }) : undefined}
        confirmLabel={t('family.remove.confirm')}
        cancelLabel={tc('cancel')}
        icon={Trash2}
        destructive
        busy={action.isPending}
        onConfirm={() => {
          const member = removeFor;
          if (!member) return;
          action.mutate(
            { kind: 'removeMember', id: member.id },
            {
              onSuccess: () => {
                setRemoveFor(null);
                toast.success({ title: t('family.remove.done') });
              },
              onError: (failure) => toast.error({ title: failureMessage(failure) }),
            },
          );
        }}
      />
    </>
  );
}
