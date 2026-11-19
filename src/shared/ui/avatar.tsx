"use client";

import { useState, type ReactNode } from "react";

import { cn } from "@/core/lib/cn";

export type AvatarSize = 36 | 40 | 44 | 48 | 56;
export type AvatarTone = "brand" | "yellow" | "violet" | "sky";

const TONE: Record<AvatarTone, string> = {
  brand: "bg-brand text-white",
  // white on #FFD43B is unreadable, so the yellow tone keeps `on-yellow`.
  yellow: "bg-yellow text-on-yellow",
  violet: "bg-violet text-white",
  sky: "bg-sky text-white",
};

const SIZE: Record<AvatarSize, string> = {
  36: "size-9 text-[18px] font-bold",
  40: "size-10 text-[18px] font-bold",
  44: "size-11 text-[18px] font-bold",
  48: "size-12 text-[18px] font-bold",
  56: "size-14 text-[24px] font-extrabold",
};

export interface AvatarProps {
  /** Full name; the first grapheme becomes the fallback initial. */
  name?: string;
  /** Explicit initial, when the name should not be derived. */
  initial?: string;
  src?: string | null;
  /** Image alt text. Defaults to `name`; pass "" for decorative avatars. */
  alt?: string;
  size?: AvatarSize;
  tone?: AvatarTone;
  className?: string;
  /** Extra overlay (e.g. a presence dot) rendered above the circle. */
  children?: ReactNode;
}

function firstLetter(value: string | undefined): string {
  if (!value) return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  return Array.from(trimmed)[0].toLocaleUpperCase();
}

/** Circle avatar with an initial fallback (components.md §5 store/courier tiles). */
export function Avatar({
  name,
  initial,
  src,
  alt,
  size = 40,
  tone = "brand",
  className,
  children,
}: AvatarProps) {
  const [failed, setFailed] = useState(false);
  const letter = initial ?? firstLetter(name);
  const showImage = Boolean(src) && !failed;

  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-pill",
        SIZE[size],
        TONE[tone],
        className,
      )}
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element -- avatars come from arbitrary CDN hosts
        <img
          src={src as string}
          alt={alt ?? name ?? ""}
          className="size-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <span aria-hidden={alt === "" ? "true" : undefined}>{letter}</span>
      )}
      {children}
    </span>
  );
}

export interface AvatarStackItem {
  name?: string;
  initial?: string;
  src?: string | null;
  tone?: AvatarTone;
}

export interface AvatarStackProps {
  items: AvatarStackItem[];
  size?: AvatarSize;
  /** Render at most this many circles. */
  max?: number;
  className?: string;
  /** Accessible summary, e.g. "12 000+ istifadəçi". */
  label?: string;
}

/** Overlapping avatars (-10px) with a 3px `bg` ring — the landing trust row. */
export function AvatarStack({ items, size = 36, max = 4, className, label }: AvatarStackProps) {
  const visible = items.slice(0, max);
  return (
    <span
      className={cn("inline-flex items-center", className)}
      role={label ? "img" : undefined}
      aria-label={label}
    >
      {visible.map((item, index) => (
        <Avatar
          key={`${item.name ?? item.initial ?? "avatar"}-${index}`}
          name={item.name}
          initial={item.initial}
          src={item.src}
          alt=""
          size={size}
          tone={item.tone ?? (["brand", "yellow", "violet", "sky"] as const)[index % 4]}
          className={cn("ring-[3px] ring-bg", index > 0 && "-ml-2.5")}
        />
      ))}
    </span>
  );
}
