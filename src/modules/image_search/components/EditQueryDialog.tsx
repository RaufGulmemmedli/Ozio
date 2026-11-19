'use client';

/**
 * `image-search-edit-query-dialog.html` (`RI4zf`) — the web replacement for the mobile bottom
 * sheet: `Dialog` 500 wide, radius 28, padding 32, gap 18; head 24/800 + a 40 close circle; the
 * 15/400 `ink2` hint; one 56-high `bg` input labelled "Sənin sorğun"; Ləğv et / Axtar at the end.
 *
 * `<Modal>` supplies the focus trap, Esc, scroll lock and focus restore. Submitting is a real form,
 * so Enter searches.
 */
import { useState } from 'react';

import { Search } from '@/shared/lucide';
import { Button, Field, Input, Modal } from '@/shared/ui';

export interface EditQueryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  hint: string;
  label: string;
  placeholder: string;
  closeLabel: string;
  cancelLabel: string;
  searchLabel: string;
  /** Pre-filled with the query the AI proposed. */
  initialQuery: string;
  onSubmit: (query: string) => void;
}

const FORM_ID = 'oz-image-search-edit-query';

export function EditQueryDialog({
  open,
  onOpenChange,
  title,
  hint,
  label,
  placeholder,
  closeLabel,
  cancelLabel,
  searchLabel,
  initialQuery,
  onSubmit,
}: EditQueryDialogProps) {
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={hint}
      size="m"
      closeLabel={closeLabel}
      footer={
        <>
          <Button type="button" variant="soft" size="xl" onClick={() => onOpenChange(false)}>
            {cancelLabel}
          </Button>
          <Button
            type="submit"
            form={FORM_ID}
            variant="primary"
            size="xl"
            leadingIcon={<Search size={18} aria-hidden="true" />}
          >
            {searchLabel}
          </Button>
        </>
      }
    >
      {/*
        Mounted only while the dialog is open and keyed by the proposed query, so the field
        initialises from props on mount. That is what re-seeds it every time it opens — no effect
        writing state, and no stale value from the previous open.
      */}
      {open ? (
        <QueryForm
          key={initialQuery}
          initialQuery={initialQuery}
          label={label}
          placeholder={placeholder}
          onSubmit={onSubmit}
        />
      ) : null}
    </Modal>
  );
}

function QueryForm({
  initialQuery,
  label,
  placeholder,
  onSubmit,
}: {
  initialQuery: string;
  label: string;
  placeholder: string;
  onSubmit: (query: string) => void;
}) {
  const [value, setValue] = useState(initialQuery);
  const trimmed = value.trim();

  return (
    <form
      id={FORM_ID}
      onSubmit={(e) => {
        e.preventDefault();
        if (trimmed.length === 0) return;
        onSubmit(trimmed);
      }}
    >
      <Field label={label}>
        <Input
          value={value}
          placeholder={placeholder}
          autoComplete="off"
          enterKeyHint="search"
          onChange={(e) => setValue(e.target.value)}
        />
      </Field>
    </form>
  );
}
