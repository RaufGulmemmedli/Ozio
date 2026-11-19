"use client";

import * as AccordionPrimitive from "@radix-ui/react-accordion";
import type { ReactNode } from "react";

import { cn } from "@/core/lib/cn";
import { Plus } from "@/shared/lucide";

import styles from "./ui.module.css";

export interface AccordionItem {
  /** Stable value used by Radix for open state. */
  value: string;
  /** Question, 18/700. */
  question: string;
  /** Answer, 16/400/1.5 `ink2`. */
  answer: ReactNode;
}

export interface AccordionProps {
  items: AccordionItem[];
  /** `single` (default, collapsible) or `multiple`. */
  type?: "single" | "multiple";
  /** Open item(s) on first render. */
  defaultValue?: string | string[];
  value?: string | string[];
  onValueChange?: (value: string | string[]) => void;
  className?: string;
  itemClassName?: string;
}

/**
 * FAQ accordion (components.md §9): padding-block 24, bottom 1px `line`,
 * question 18/700 + a 24px plus icon that rotates 45° when open,
 * answer 16/400/1.5 `ink2`, height animated 200ms.
 */
export function Accordion({
  items,
  type = "single",
  defaultValue,
  value,
  onValueChange,
  className,
  itemClassName,
}: AccordionProps) {
  const rows = items.map((item) => (
    <AccordionPrimitive.Item
      key={item.value}
      value={item.value}
      className={cn("border-b border-line", itemClassName)}
    >
      <AccordionPrimitive.Header className="flex">
        <AccordionPrimitive.Trigger
          className={cn(
            "group flex w-full items-start justify-between gap-4 py-6 text-left",
            "transition-colors duration-[var(--oz-dur-fast)] ease-out",
          )}
        >
          <span className="min-w-0 flex-1 text-[18px] font-bold leading-[1.35] text-ink">
            {item.question}
          </span>
          <Plus
            size={24}
            aria-hidden="true"
            className="mt-0.5 shrink-0 text-ink2 transition-transform duration-[var(--oz-dur-base)] ease-in-out group-data-[state=open]:rotate-45"
          />
        </AccordionPrimitive.Trigger>
      </AccordionPrimitive.Header>
      <AccordionPrimitive.Content className={styles.accordionContent}>
        <div className="flex flex-col gap-3 pb-6 pr-10 text-[16px] font-normal leading-[1.5] text-ink2">
          {item.answer}
        </div>
      </AccordionPrimitive.Content>
    </AccordionPrimitive.Item>
  ));

  if (type === "multiple") {
    return (
      <AccordionPrimitive.Root
        type="multiple"
        value={value as string[] | undefined}
        defaultValue={defaultValue as string[] | undefined}
        onValueChange={onValueChange as ((value: string[]) => void) | undefined}
        className={cn("flex flex-col", className)}
      >
        {rows}
      </AccordionPrimitive.Root>
    );
  }

  return (
    <AccordionPrimitive.Root
      type="single"
      collapsible
      value={value as string | undefined}
      defaultValue={defaultValue as string | undefined}
      onValueChange={onValueChange as ((value: string) => void) | undefined}
      className={cn("flex flex-col", className)}
    >
      {rows}
    </AccordionPrimitive.Root>
  );
}
