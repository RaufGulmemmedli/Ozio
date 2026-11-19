'use client';

/**
 * AU6 — the country-code picker (`giris-olke-kodu-secimi.html` `KuJWx`). A **state, not a route**.
 *
 * Export: panel radius 20, padding 10, row gap 2; search 48 high radius 12 on `surface2`; rows 48
 * high radius 12, selected row filled `brand-soft`; flag tag 34x24 radius 6 `surface2` with an
 * 11/700 `ink2` code; country 15/700 (500 when unselected), dial 15/600 `ink2`.
 *
 * `<Sheet>` from `@/shared/ui` gives the focus trap, Esc and scroll lock (a bottom sheet below
 * 768, a side panel above). The list filters by country name or dial code and is keyboard
 * navigable because every row is a real button.
 */
import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';

import { cn } from '@/core/lib/cn';
import { Check, Search } from '@/shared/lucide';
import { Input, Sheet } from '@/shared/ui';

import { COUNTRIES, type CountryOption } from '../auth.constants';

export function CountrySheet({
  open,
  onOpenChange,
  selected,
  onSelect,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selected: CountryOption;
  onSelect: (country: CountryOption) => void;
}) {
  const t = useTranslations('auth');
  const [query, setQuery] = useState('');

  const rows = useMemo(() => {
    const q = query.trim().toLocaleLowerCase('az');
    if (!q) return COUNTRIES;
    return COUNTRIES.filter((c) => {
      const name = t(`country.${c.iso}`).toLocaleLowerCase('az');
      return name.includes(q) || c.dialCode.includes(q) || c.iso.toLowerCase().includes(q);
    });
  }, [query, t]);

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (!next) setQuery('');
        onOpenChange(next);
      }}
      title={t('login.country.title')}
      closeLabel={t('login.country.close')}
      size="md"
    >
      <div className="flex flex-col gap-2.5">
        <Input
          variant="pill"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t('login.country.search')}
          aria-label={t('login.country.search')}
          leadingIcon={<Search aria-hidden="true" />}
          autoComplete="off"
        />

        {rows.length === 0 ? (
          <p role="status" className="px-1 py-6 text-center text-body-sm text-ink2">
            {t('login.country.empty')}
          </p>
        ) : (
          <ul className="flex flex-col gap-0.5">
            {rows.map((country) => {
              const isSelected = country.iso === selected.iso;
              return (
                <li key={country.iso}>
                  <button
                    type="button"
                    aria-current={isSelected ? 'true' : undefined}
                    onClick={() => {
                      onSelect(country);
                      setQuery('');
                      onOpenChange(false);
                    }}
                    className={cn(
                      'flex h-12 w-full items-center gap-3 rounded-[12px] px-[14px] text-left',
                      'transition-colors duration-[var(--oz-dur-fast)] ease-[var(--oz-ease-out)]',
                      'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand',
                      isSelected ? 'bg-brand-soft' : 'bg-transparent hover:bg-surface2',
                    )}
                  >
                    <span className="flex h-6 w-[34px] shrink-0 items-center justify-center rounded-xs bg-surface2 text-nano font-bold text-ink2">
                      {country.iso}
                    </span>
                    <span
                      className={cn(
                        'flex-1 text-body-sm text-ink',
                        isSelected ? 'font-bold' : 'font-medium',
                      )}
                    >
                      {t(`country.${country.iso}`)}
                    </span>
                    <span className="shrink-0 text-body-sm font-semibold tabular-nums text-ink2">
                      {country.dialCode}
                    </span>
                    {isSelected ? (
                      <Check aria-hidden="true" className="size-[18px] shrink-0 text-brand" />
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {/* Only AZ can complete a login today (the API 422s anything else) — say so, don't hide it. */}
        <p className="px-1 pt-1 text-caption leading-5 text-ink3">{t('login.country.note')}</p>
      </div>
    </Sheet>
  );
}
