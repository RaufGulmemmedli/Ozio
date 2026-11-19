'use client';

/**
 * SC2's "Qiymətlərim" block.
 *
 * The export draws each grade as a 76-high white card row (score badge 44 at radius 14, subject
 * 16/700, "Qiymət 5 · 10 Noy" 13/400 `ink3`, a `+20 xal` success pill on the right). The brief
 * asks for a **real `<table>` with proper headers**, so this is `<Table mobile="cards">`: a
 * semantic table with `<th scope="col">` at ≥768 and exactly the drawn card rows below that.
 *
 * `points` is server data — the pill prints what the mock sent, it is not derived from `score`.
 */
import { useTranslations } from 'next-intl';

import { useFormat } from '@/core/i18n';
import { cn } from '@/core/lib/cn';
import { Table, type TableColumn } from '@/shared/ui';

import { scoreTone, type Grade } from '../data/models/grade';

const BADGE_TONE: Record<'success' | 'sky' | 'brand', string> = {
  success: 'bg-success-soft text-success',
  sky: 'bg-sky-soft text-sky',
  brand: 'bg-brand-soft text-brand',
};

export interface GradesTableProps {
  grades: Grade[];
  empty?: React.ReactNode;
}

export function GradesTable({ grades, empty }: GradesTableProps) {
  const t = useTranslations('school');
  const { date } = useFormat();

  const columns: TableColumn<Grade>[] = [
    {
      key: 'score',
      header: t('grades.table.score'),
      width: 96,
      render: (grade) => (
        <span
          className={cn(
            'inline-flex size-11 items-center justify-center rounded-md text-h4 font-extrabold',
            BADGE_TONE[scoreTone(grade.score)],
          )}
        >
          {grade.score}
        </span>
      ),
    },
    {
      key: 'subject',
      header: t('grades.table.subject'),
      emphasis: 'id',
      render: (grade) => <span className="text-body font-bold text-ink">{grade.subjectName}</span>,
    },
    {
      key: 'date',
      header: t('grades.table.date'),
      render: (grade) => (
        <span className="text-caption text-ink3">
          {grade.date ? date(grade.date, 'dayMonth') : '—'}
        </span>
      ),
    },
    {
      key: 'points',
      header: t('grades.table.points'),
      align: 'end',
      render: (grade) => (
        <span className="inline-flex h-7 items-center rounded-pill bg-success-soft px-2.5 text-micro font-bold text-success">
          {t('grades.points', { count: grade.points })}
        </span>
      ),
    },
  ];

  return (
    <Table<Grade>
      columns={columns}
      rows={grades}
      rowKey={(grade) => grade.id}
      caption={t('grades.table.caption')}
      mobile="cards"
      empty={empty}
    />
  );
}
