import { cn } from "@/core/lib/cn";
import type { LucideIcon } from "@/shared/lucide";
import { Check, Circle } from "@/shared/lucide";

export type StepState = "done" | "current" | "todo";

export interface StepperStep {
  /** Step label, 13/700 (todo: 13/500 `ink3`). */
  label: string;
  icon?: LucideIcon;
}

function stateOf(index: number, current: number): StepState {
  if (index < current) return "done";
  if (index === current) return "current";
  return "todo";
}

const CIRCLE: Record<StepState, string> = {
  done: "bg-brand-soft text-brand",
  current: "bg-brand text-white",
  todo: "bg-surface2 text-ink3",
};

const LABEL: Record<StepState, string> = {
  done: "font-bold text-ink",
  current: "font-bold text-ink",
  todo: "font-medium text-ink3",
};

export interface StepperProps {
  steps: StepperStep[];
  /** Zero-based index of the current step. */
  current: number;
  /** Accessible name of the list (pass a translated string). */
  label?: string;
  className?: string;
}

/**
 * Horizontal order stepper (components.md §5 Order Tracker): 48px circles,
 * 13/700 labels, joined by 56x4 radius-2 lines (`brand` done / `surface2` todo).
 */
export function Stepper({ steps, current, label, className }: StepperProps) {
  return (
    <ol aria-label={label} className={cn("flex items-start max-md:w-full", className)}>
      {steps.map((step, index) => {
        const state = stateOf(index, current);
        const Icon = step.icon ?? (state === "todo" ? Circle : Check);
        return (
          <li
            key={step.label}
            aria-current={state === "current" ? "step" : undefined}
            className="flex items-start max-md:min-w-0 max-md:flex-1"
          >
            {index > 0 ? (
              <span
                aria-hidden="true"
                className={cn(
                  "mt-[22px] h-1 w-14 shrink-0 rounded-[2px] max-md:w-auto max-md:min-w-2 max-md:flex-1",
                  index <= current ? "bg-brand" : "bg-surface2",
                )}
              />
            ) : null}
            <div className="flex w-24 flex-col items-center gap-2 max-md:w-auto max-md:min-w-0 max-md:shrink-0">
              <span
                aria-hidden="true"
                className={cn(
                  "flex size-12 items-center justify-center rounded-pill",
                  CIRCLE[state],
                )}
              >
                <Icon size={22} />
              </span>
              <span
                className={cn("text-center text-[13px] leading-[1.3]", LABEL[state])}
              >
                {step.label}
              </span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export interface VerticalStepperStep {
  /** Title, 15/700. */
  title: string;
  /** Meta line, 13/400 `ink2` (time, courier, address…). */
  meta?: string;
  icon?: LucideIcon;
}

export interface VerticalStepperProps {
  steps: VerticalStepperStep[];
  current: number;
  label?: string;
  className?: string;
}

/** Vertical variant for the order tracking page. */
export function VerticalStepper({ steps, current, label, className }: VerticalStepperProps) {
  return (
    <ol aria-label={label} className={cn("flex flex-col", className)}>
      {steps.map((step, index) => {
        const state = stateOf(index, current);
        const Icon = step.icon ?? (state === "todo" ? Circle : Check);
        const isLast = index === steps.length - 1;
        return (
          <li
            key={step.title}
            aria-current={state === "current" ? "step" : undefined}
            className="flex gap-4"
          >
            <div className="flex flex-col items-center">
              <span
                aria-hidden="true"
                className={cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-pill",
                  CIRCLE[state],
                )}
              >
                <Icon size={20} />
              </span>
              {isLast ? null : (
                <span
                  aria-hidden="true"
                  className={cn(
                    "my-1 w-1 flex-1 rounded-[2px]",
                    index < current ? "bg-brand" : "bg-surface2",
                  )}
                />
              )}
            </div>
            <div className={cn("min-w-0 flex-1", isLast ? "pb-0" : "pb-6")}>
              <p className={cn("text-[15px]", LABEL[state])}>{step.title}</p>
              {step.meta ? (
                <p className="mt-1 text-[13px] font-normal text-ink2">{step.meta}</p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
