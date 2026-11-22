"use client";

import { motion, type Variants } from "motion/react";
import type { CSSProperties, ReactNode } from "react";

const EASE = [0.2, 0.75, 0.25, 1] as const;

const motionTags = {
  h1: motion.h1,
  h2: motion.h2,
  h3: motion.h3,
  p: motion.p,
  span: motion.span,
};

const plainTags = { h1: "h1", h2: "h2", h3: "h3", p: "p", span: "span" } as const;

type Trigger = "mount" | "view";

function triggerProps(trigger: Trigger) {
  return trigger === "mount"
    ? { initial: "hidden", animate: "show" }
    : {
        initial: "hidden",
        whileInView: "show",
        viewport: { once: true, amount: 0.5 },
      };
}

const word: Variants = {
  hidden: { opacity: 0, y: "0.45em", filter: "blur(8px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.55, ease: EASE },
    transitionEnd: { filter: "none" },
  },
};

/** Splits text into words that land one after another. */
export function RevealText({
  text,
  as = "span",
  delay = 0,
  stagger = 0.04,
  trigger = "mount",
  className,
}: {
  text: string;
  as?: keyof typeof motionTags;
  delay?: number;
  stagger?: number;
  trigger?: Trigger;
  className?: string;
}) {
  const words = text.split(" ");

  // CSS, so the words start landing the moment the HTML paints.
  if (trigger === "mount") {
    const Tag = plainTags[as];
    return (
      <Tag className={className}>
        <span className="sr-only">{text}</span>
        {words.map((w, i) => (
          <span key={i} aria-hidden>
            <span className="word-in" style={{ animationDelay: `${delay + i * stagger}s` }}>
              {w}
            </span>
            {i < words.length - 1 ? " " : null}
          </span>
        ))}
      </Tag>
    );
  }

  const Tag = motionTags[as];
  return (
    <Tag
      className={className}
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: stagger, delayChildren: delay } },
      }}
      {...triggerProps(trigger)}
    >
      <span className="sr-only">{text}</span>
      {words.map((w, i) => (
        <span key={i} aria-hidden>
          <motion.span className="inline-block will-change-transform" variants={word}>
            {w}
          </motion.span>
          {i < words.length - 1 ? " " : null}
        </span>
      ))}
    </Tag>
  );
}

export function FadeIn({
  children,
  delay = 0,
  trigger = "mount",
  y = 14,
  className,
}: {
  children: ReactNode;
  delay?: number;
  trigger?: Trigger;
  y?: number;
  className?: string;
}) {
  if (trigger === "mount") {
    return (
      <div
        className={`rise-in ${className ?? ""}`}
        style={{ animationDelay: `${delay}s`, "--rise": `${y}px` } as CSSProperties}
      >
        {children}
      </div>
    );
  }

  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y, filter: "blur(6px)" },
        show: {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          transition: { duration: 0.65, delay, ease: EASE },
          // A lingering filter would stop glass children from blurring what's behind them.
          transitionEnd: { filter: "none" },
        },
      }}
      {...triggerProps(trigger)}
    >
      {children}
    </motion.div>
  );
}

/**
 * A pane that frosts over as it appears. Animating backdrop-filter instead of
 * filter keeps blur off the children, so their own reveals stay crisp.
 */
export function GlassPane({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <div className={`glass pane-in ${className ?? ""}`} style={{ animationDelay: `${delay}s` }}>
      {children}
    </div>
  );
}
