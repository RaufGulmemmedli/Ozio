/**
 * Numbered step row — node `CopsG` (`Step 01` … `Step 03`), reused by
 * `/cashback` (`YwTRH`), `/delivery` (`V2J5dE`, four steps) and `/ten` (`DuHo1`).
 *
 * Each step: a 2 px `ink` top border, 28 padding-top, number 56/800/-2 `brand`,
 * title 24/700 `ink`, text 16/24 `ink2`. Desktop gap 48, tablet 3 columns at
 * gap 20.
 *
 * The 10-lar variant numbers the steps 1/2/3 rather than 01/02/03, which is what
 * `pad` controls.
 */
import { cn } from '@/core/lib/cn';

import { typeStepNumber } from './type';

export interface StepEntry {
  id: string;
  title: string;
  text: string;
}

export interface HowStepsProps {
  steps: StepEntry[];
  /** `true` → "01", `false` → "1" (the `/ten` rules block). */
  pad?: boolean;
  className?: string;
}

export function HowSteps({ steps, pad = true, className }: HowStepsProps) {
  return (
    <ol
      className={cn(
        'm-0 grid list-none grid-cols-1 gap-8 p-0 sm:grid-cols-2',
        steps.length === 4
          ? 'md:grid-cols-4 md:gap-5 min-[1200px]:gap-8'
          : 'md:grid-cols-3 md:gap-5 min-[1200px]:gap-12',
        className,
      )}
    >
      {steps.map((step, index) => (
        <li
          key={step.id}
          className="flex flex-col gap-3 border-t-2 border-ink pt-6 md:gap-4 md:pt-7"
        >
          <span className={cn('text-brand', typeStepNumber)} aria-hidden="true">
            {pad ? String(index + 1).padStart(2, '0') : index + 1}
          </span>
          <h3 className="m-0 text-h3 font-bold text-ink">{step.title}</h3>
          <p className="m-0 text-body leading-6 text-ink2">{step.text}</p>
        </li>
      ))}
    </ol>
  );
}
