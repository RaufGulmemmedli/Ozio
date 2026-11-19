/**
 * Cashback rate table — node `NPqtl` (`screens/landing.md` §`/keshbek`):
 * "Kateqoriya / Nümunə partnyorlar / Keşbek", collapsing to cards on mobile.
 *
 * The percentages are **sample data**: the live rate is per-partner server data
 * (`cashback.rates.note` says so on the page). It is static here because the
 * endpoint that carries it requires a bearer token.
 *
 * One `<table>` for both layouts: below 768 the rows become stacked blocks with
 * `display: block`, which keeps a single, screen-reader-correct table in the DOM.
 */
import { cn } from '@/core/lib/cn';

export interface RateRow {
  id: string;
  category: string;
  partners: string;
  rate: string;
}

export interface RatesTableProps {
  head: { category: string; partners: string; rate: string };
  rows: RateRow[];
  note: string;
  className?: string;
}

export function RatesTable({ head, rows, note, className }: RatesTableProps) {
  return (
    <div className={cn('flex flex-col gap-5', className)}>
      <div className="overflow-hidden rounded-bento bg-surface">
        <table className="w-full border-collapse text-left">
          <thead className="hidden md:table-header-group">
            <tr className="border-b border-line">
              <th scope="col" className="px-6 py-4 text-micro font-bold uppercase tracking-[0.08em] text-ink2">
                {head.category}
              </th>
              <th scope="col" className="px-6 py-4 text-micro font-bold uppercase tracking-[0.08em] text-ink2">
                {head.partners}
              </th>
              <th scope="col" className="px-6 py-4 text-right text-micro font-bold uppercase tracking-[0.08em] text-ink2">
                {head.rate}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.id}
                className="flex flex-col gap-1 border-b border-line p-5 last:border-0 md:table-row md:p-0"
              >
                <th
                  scope="row"
                  className="text-left text-body font-semibold text-ink md:px-6 md:py-5 md:font-semibold"
                >
                  {row.category}
                </th>
                <td className="text-caption text-ink2 md:px-6 md:py-5 md:text-body-sm">
                  {row.partners}
                </td>
                <td className="text-h4 font-bold text-brand tabular-nums md:px-6 md:py-5 md:text-right">
                  {row.rate}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="m-0 text-caption text-ink3">{note}</p>
    </div>
  );
}
