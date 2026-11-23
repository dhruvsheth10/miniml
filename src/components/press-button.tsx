import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

const variants = {
  primary:
    "bg-(--red-solid) text-white shadow-[0_3px_0_#8f1a2b] hover:bg-(--red-solid-hover) active:translate-y-[2px] active:shadow-[0_1px_0_#8f1a2b]",
  quiet:
    "border border-line bg-card text-ink shadow-[0_3px_0_var(--line)] hover:border-ink-faint active:translate-y-[2px] active:shadow-[0_1px_0_var(--line)]",
  light:
    "bg-white text-(--red-solid) shadow-[0_3px_0_#8f1a2b] hover:bg-[#fff1f2] active:translate-y-[2px] active:shadow-[0_1px_0_#8f1a2b]",
} as const;

/** A link styled as a button that presses down like a key. Opens in a new tab. */
export function PressButton({
  children,
  href,
  variant = "primary",
  className,
}: {
  children: ReactNode;
  href: string;
  variant?: keyof typeof variants;
  className?: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={cn(
        "group inline-flex h-12 items-center justify-center gap-2 rounded-xl px-5 text-[16px] font-semibold whitespace-nowrap transition-[background-color,border-color,transform,box-shadow] duration-100 outline-none select-none focus-visible:ring-3 focus-visible:ring-hc-red/40",
        variants[variant],
        className,
      )}
    >
      {children}
    </a>
  );
}
