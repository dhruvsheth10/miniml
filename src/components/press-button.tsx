"use client";

import { AnimatePresence, motion } from "motion/react";
import { useRef, useState, type PointerEvent, type ReactNode } from "react";

import { cn } from "@/lib/utils";

type Ripple = { id: number; x: number; y: number; size: number };

const variants = {
  primary:
    "h-14 rounded-2xl bg-ink px-7 text-[17px] font-medium text-paper shadow-[inset_0_1px_0_rgb(255_255_255/0.14),0_10px_24px_-10px_rgb(15_42_36/0.55)] hover:bg-(--button-hover)",
  quiet:
    "glass h-11 rounded-xl px-4 text-[14px] font-medium text-ink after:pointer-events-none after:absolute after:inset-0 after:-z-10 after:transition-colors hover:after:bg-ink/[0.035]",
} as const;

const rippleColor = {
  primary: "var(--ripple-primary)",
  quiet: "rgb(236 55 80 / 0.28)",
} as const;

/**
 * A link styled as a button that answers the press with a little give and a
 * ring of light spreading from where it was touched. Opens in a new tab.
 */
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
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const nextId = useRef(0);

  const onPointerDown = (e: PointerEvent<HTMLAnchorElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const size = Math.hypot(rect.width, rect.height) * 2;
    const id = nextId.current++;
    setRipples((r) => [...r, { id, x: e.clientX - rect.left, y: e.clientY - rect.top, size }]);
  };

  return (
    <motion.a
      href={href}
      target="_blank"
      rel="noreferrer"
      onPointerDown={onPointerDown}
      whileTap={{ scale: 0.965 }}
      transition={{ type: "spring", stiffness: 520, damping: 26 }}
      className={cn(
        "group relative isolate inline-flex cursor-pointer items-center justify-center gap-2 overflow-hidden whitespace-nowrap transition-colors outline-none select-none focus-visible:ring-3 focus-visible:ring-hc-red/40",
        variants[variant],
        className,
      )}
    >
      <AnimatePresence>
        {ripples.map((r) => (
          <motion.span
            key={r.id}
            aria-hidden
            className="pointer-events-none absolute -z-10 rounded-full"
            style={{
              left: r.x - r.size / 2,
              top: r.y - r.size / 2,
              width: r.size,
              height: r.size,
              background: `radial-gradient(circle, ${rippleColor[variant]} 0%, transparent 65%)`,
            }}
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 1, opacity: 0 }}
            transition={{ duration: 0.75, ease: [0.2, 0.75, 0.25, 1] }}
            onAnimationComplete={() => setRipples((all) => all.filter((x) => x.id !== r.id))}
          />
        ))}
      </AnimatePresence>
      {children}
    </motion.a>
  );
}
