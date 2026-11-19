'use client';

/**
 * `Topics` node: 380-wide `surface` / `rounded-xl` card, padding 28, gap 14 — the 20/700 title,
 * three 60-high `bg` rows (icon 20 + 15/600 label + chevron 18) and the FAQ link to `/help`.
 *
 * Tapping a topic **sends it as the user's message** (`api/mock-modules.md` §9), so the rows are
 * buttons, not links.
 */
import { Link } from '@/core/i18n';
import { paths } from '@/core/routes';
import { ArrowUpRight, ChevronRight, type LucideIcon } from '@/shared/lucide';

export interface SupportTopic {
  id: string;
  icon: LucideIcon;
  label: string;
}

export interface TopicsPanelProps {
  title: string;
  topics: readonly SupportTopic[];
  faqLabel: string;
  disabled?: boolean;
  onPick: (topic: SupportTopic) => void;
}

export function TopicsPanel({ title, topics, faqLabel, disabled = false, onPick }: TopicsPanelProps) {
  return (
    <section
      aria-label={title}
      className="flex w-full shrink-0 flex-col items-start gap-[14px] rounded-xl bg-surface p-7 lg:w-[380px]"
    >
      <h2 className="m-0 text-h4 font-bold text-ink">{title}</h2>

      <ul className="m-0 flex w-full list-none flex-col gap-[14px] p-0">
        {topics.map((topic) => {
          const Icon = topic.icon;
          return (
            <li key={topic.id} className="w-full">
              <button
                type="button"
                disabled={disabled}
                onClick={() => onPick(topic)}
                className="flex h-[60px] w-full flex-row items-center gap-3 rounded-lg bg-bg px-4 text-left transition-colors duration-[var(--oz-dur-fast)] ease-[var(--ease-out)] hover:bg-surface2 disabled:opacity-60"
              >
                <Icon aria-hidden="true" size={20} className="shrink-0 text-ink2" />
                <span className="min-w-0 flex-1 text-body-sm font-semibold text-ink">
                  {topic.label}
                </span>
                <ChevronRight aria-hidden="true" size={18} className="shrink-0 text-ink3" />
              </button>
            </li>
          );
        })}
      </ul>

      <Link
        href={paths.help}
        className="flex w-fit min-h-11 flex-row items-center gap-2 rounded-sm text-body-sm font-bold text-brand hover:text-brand-dark md:min-h-0"
      >
        {faqLabel}
        <ArrowUpRight aria-hidden="true" size={16} className="shrink-0" />
      </Link>
    </section>
  );
}
