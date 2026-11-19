import { Link } from "@/core/i18n/navigation";
import { cn } from "@/core/lib/cn";
import { ChevronRight } from "@/shared/lucide";

export interface BreadcrumbItem {
  /** Visible label (pass a translated string). */
  label: string;
  /** Omit on the last item — it renders as the current page. */
  href?: string;
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  /** aria-label of the nav landmark. */
  label?: string;
  className?: string;
}

/**
 * Breadcrumbs (components.md §6): 14/500 `ink3`, 14px chevron-right
 * separators, gap 10, last item 14/700 `ink` with `aria-current="page"`.
 */
export function Breadcrumbs({ items, label = "Breadcrumb", className }: BreadcrumbsProps) {
  if (items.length === 0) return null;

  return (
    <nav aria-label={label} className={cn("min-w-0", className)}>
      <ol className="flex min-w-0 flex-wrap items-center gap-2.5">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="flex min-w-0 items-center gap-2.5">
              {index > 0 ? (
                <ChevronRight size={14} aria-hidden="true" className="shrink-0 text-ink3" />
              ) : null}
              {isLast || !item.href ? (
                <span
                  aria-current={isLast ? "page" : undefined}
                  className={cn(
                    "truncate",
                    isLast ? "text-[14px] font-bold text-ink" : "text-[14px] font-medium text-ink3",
                  )}
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="truncate text-[14px] font-medium text-ink3 transition-colors duration-[var(--oz-dur-fast)] ease-out hover:text-ink"
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
