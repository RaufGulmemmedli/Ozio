'use client';

/**
 * `Anbar · Kod modalı` (`ooPsK`): the hand-over code sheet.
 *
 * Four cells (`<OtpInput>` sized to the drawn 72×84 / r20 boxes), "Ləğv et" + "Təsdiqlə".
 * The code is **checked by the server** (`POST hub/handover`) — the component knows no codes, and
 * it never logs, stores or puts the entered digits in a query key. A wrong code renders inline
 * with `role="alert"`; `<Modal>` (Radix Dialog) supplies the focus trap, Esc and focus restore.
 *
 * The cells live in `<CpCodeEntry>`, mounted with `key={parcel.id}`, so moving to another row
 * resets the digits and the error by remounting instead of by an effect.
 */
import { useState } from 'react';
import { useTranslations } from 'next-intl';

import { Button, Modal, OtpInput } from '@/shared/ui';

import type { CpHubParcel } from '../data/models/courier-plus';

const CODE_LENGTH = 4;

export interface CpHubCodeModalProps {
  /** The row being handed over; `null` closes the modal. */
  parcel: CpHubParcel | null;
  onClose: () => void;
  /** Resolves `true` when the server accepted the code. */
  onSubmit: (code: string) => Promise<boolean>;
  pending?: boolean;
}

function CpCodeEntry({
  onClose,
  onSubmit,
  pending,
  labels,
}: {
  onClose: () => void;
  onSubmit: (code: string) => Promise<boolean>;
  pending: boolean;
  labels: {
    group: string;
    cell: (index: number, total: number) => string;
    cancel: string;
    confirm: string;
    wrong: string;
    short: string;
  };
}) {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  const confirm = async () => {
    if (code.length < CODE_LENGTH) {
      setError(labels.short);
      return;
    }
    setError(null);
    const accepted = await onSubmit(code);
    if (accepted) {
      onClose();
      return;
    }
    setCode('');
    setError(labels.wrong);
  };

  return (
    <>
      <div className="flex w-full flex-col items-center gap-3">
        <OtpInput
          length={CODE_LENGTH}
          value={code}
          onChange={(next) => {
            setCode(next);
            if (error) setError(null);
          }}
          onComplete={() => void confirm()}
          error={error !== null}
          disabled={pending}
          autoFocus
          aria-label={labels.group}
          cellLabel={labels.cell}
          // The drawn cells are 72×84, radius 20, 36/800 — the shared default is 64 high / r14.
          className="justify-center gap-3 [&>input]:h-21 [&>input]:w-18 [&>input]:flex-none [&>input]:rounded-lg [&>input]:bg-surface2 [&>input]:text-[36px] [&>input]:font-extrabold"
        />

        {error ? (
          <p role="alert" className="m-0 text-label font-semibold text-brand">
            {error}
          </p>
        ) : null}
      </div>

      <div className="flex w-full flex-row items-center justify-end gap-3 pt-2">
        <Button variant="soft" size="lg" onClick={onClose}>
          {labels.cancel}
        </Button>
        <Button variant="brand" size="lg" loading={pending} onClick={() => void confirm()}>
          {labels.confirm}
        </Button>
      </div>
    </>
  );
}

export function CpHubCodeModal({ parcel, onClose, onSubmit, pending = false }: CpHubCodeModalProps) {
  const t = useTranslations('courier_plus');

  return (
    <Modal
      open={parcel !== null}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      title={t('hub.code.title')}
      description={parcel ? t('hub.code.body', { recipient: parcel.recipient }) : undefined}
      size="m"
      closeLabel={t('close')}
    >
      {parcel ? (
        <CpCodeEntry
          key={parcel.id}
          onClose={onClose}
          onSubmit={onSubmit}
          pending={pending}
          labels={{
            group: t('hub.code.label'),
            cell: (index, total) => t('hub.code.cell', { index: index + 1, total }),
            cancel: t('hub.code.cancel'),
            confirm: t('hub.code.confirm'),
            wrong: t('hub.code.wrong'),
            short: t('hub.code.short'),
          }}
        />
      ) : null}
    </Modal>
  );
}
