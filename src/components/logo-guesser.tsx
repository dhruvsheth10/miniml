"use client";

import { Check, Shuffle, Trash2, Undo2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type PointerEvent, type ReactNode } from "react";

import { BRANDS, INKS, guessLogo, type Guess, type InkId, type Point, type Stroke } from "@/lib/logo-model";
import { cn } from "@/lib/utils";

const BRUSH = 5;
/** Pointer moves shorter than this (CSS px) are dropped, which also smooths jittery input. */
const MIN_STEP = 1.5;
const LIVE_GUESS_MS = 80;
/** Below this the board admits it isn't sure yet. */
const SURE = 0.45;

const INK_HEX = Object.fromEntries(INKS.map((i) => [i.id, i.hex])) as Record<InkId, string>;

function timedGuess(strokes: Stroke[]) {
  const start = performance.now();
  const guesses = guessLogo(strokes);
  return { guesses, ms: performance.now() - start };
}

/** True at most once per `LIVE_GUESS_MS`, so live guessing doesn't run on every pointer event. */
function throttle(lastRef: { current: number }) {
  const now = performance.now();
  if (now - lastRef.current < LIVE_GUESS_MS) return false;
  lastRef.current = now;
  return true;
}

function randomBrandExcept(id: string) {
  const others = BRANDS.filter((b) => b.id !== id);
  return others[Math.floor(Math.random() * others.length)].id;
}

function paint(ctx: CanvasRenderingContext2D, { ink, points }: Stroke) {
  ctx.strokeStyle = INK_HEX[ink];
  ctx.fillStyle = INK_HEX[ink];
  if (points.length === 1) {
    ctx.beginPath();
    ctx.arc(points[0][0], points[0][1], BRUSH / 2, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length - 1; i++) {
    const [x, y] = points[i];
    const [nx, ny] = points[i + 1];
    ctx.quadraticCurveTo(x, y, (x + nx) / 2, (y + ny) / 2);
  }
  const [lx, ly] = points[points.length - 1];
  ctx.lineTo(lx, ly);
  ctx.stroke();
}

const toolButton =
  "inline-flex h-8 items-center gap-1.5 rounded-lg border border-line bg-card px-2.5 text-[13px] font-medium text-ink-soft transition-colors hover:border-ink-faint hover:text-ink disabled:pointer-events-none disabled:opacity-40";

export function LogoGuesser({ intro }: { intro: ReactNode }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const strokesRef = useRef<Stroke[]>([]);
  const liveRef = useRef<Stroke | null>(null);
  const frameRef = useRef(0);
  const lastGuessRef = useRef(0);
  const [strokeCount, setStrokeCount] = useState(0);
  const [ink, setInk] = useState<InkId>("black");
  const [target, setTarget] = useState("nike");
  const [guesses, setGuesses] = useState<Guess[]>([]);
  const [ms, setMs] = useState<number | null>(null);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = BRUSH;
    for (const s of strokesRef.current) paint(ctx, s);
    if (liveRef.current) paint(ctx, liveRef.current);
  }, []);

  const scheduleRedraw = () => {
    cancelAnimationFrame(frameRef.current);
    frameRef.current = requestAnimationFrame(redraw);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = canvas.clientWidth * dpr;
      canvas.height = canvas.clientHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      redraw();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    return () => {
      ro.disconnect();
      cancelAnimationFrame(frameRef.current);
    };
  }, [redraw]);

  const runModel = (strokes: Stroke[]) => {
    if (!strokes.length) {
      setGuesses([]);
      setMs(null);
      return;
    }
    const result = timedGuess(strokes);
    setGuesses(result.guesses);
    setMs(result.ms);
  };

  const commit = (strokes: Stroke[]) => {
    strokesRef.current = strokes;
    setStrokeCount(strokes.length);
    runModel(strokes);
    scheduleRedraw();
  };

  const pointOf = (e: PointerEvent<HTMLCanvasElement>): Point => {
    const rect = e.currentTarget.getBoundingClientRect();
    return [e.clientX - rect.left, e.clientY - rect.top];
  };

  const onPointerDown = (e: PointerEvent<HTMLCanvasElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    liveRef.current = { ink, points: [pointOf(e)] };
    scheduleRedraw();
  };

  const onPointerMove = (e: PointerEvent<HTMLCanvasElement>) => {
    const live = liveRef.current;
    if (!live) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const coalesced = e.nativeEvent.getCoalescedEvents?.();
    for (const ev of coalesced?.length ? coalesced : [e.nativeEvent]) {
      const p: Point = [ev.clientX - rect.left, ev.clientY - rect.top];
      const last = live.points[live.points.length - 1];
      if (Math.hypot(p[0] - last[0], p[1] - last[1]) >= MIN_STEP) live.points.push(p);
    }
    scheduleRedraw();
    if (throttle(lastGuessRef)) runModel([...strokesRef.current, live]);
  };

  const endStroke = () => {
    const live = liveRef.current;
    if (!live) return;
    liveRef.current = null;
    commit([...strokesRef.current, live]);
  };

  const clear = () => commit([]);
  const undo = () => commit(strokesRef.current.slice(0, -1));

  const pickTarget = (id: string) => {
    setTarget(id);
    clear();
  };

  const shuffleTarget = () => pickTarget(randomBrandExcept(target));

  const targetName = BRANDS.find((b) => b.id === target)?.name ?? "";
  const top = guesses[0];
  const sure = top !== undefined && top.confidence >= SURE;
  const solved = sure && top.id === target;
  const rows = Array.from({ length: 3 }, (_, i) => guesses[i]);

  return (
    <div className="grid items-start gap-10 lg:grid-cols-[1fr_1.05fr] lg:gap-16">
      <div className="flex flex-col gap-10">
        {intro}
        <div>
          <p className="text-[15px] font-semibold text-ink">Logos it knows</p>
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {BRANDS.map((b) => (
              <li key={b.id}>
                <button
                  type="button"
                  onClick={() => pickTarget(b.id)}
                  aria-pressed={b.id === target}
                  className={cn(
                    "rounded-md border px-2 py-1 text-[13px] leading-none transition-colors",
                    b.id === target
                      ? "border-ink bg-ink text-paper"
                      : "border-line text-ink-soft hover:border-ink-faint hover:text-ink",
                  )}
                >
                  {b.name}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="panel flex w-full flex-col rounded-2xl p-4 text-left sm:p-5">
        <div className="flex items-center gap-2">
          <span className="flex gap-1.5" aria-hidden>
            <span className="size-2.5 rounded-full bg-line" />
            <span className="size-2.5 rounded-full bg-line" />
            <span className="size-2.5 rounded-full bg-line" />
          </span>
          <span className="ml-1 font-mono text-[12px] text-ink-soft">logo_guess.py</span>
        </div>

        <div className="mt-4 flex min-h-8 items-center justify-between gap-3">
          {solved ? (
            <p className="flex items-center gap-2 text-[15px] font-medium text-emerald-700 dark:text-emerald-400">
              <Check className="size-4" strokeWidth={2.5} />
              Got it, that&apos;s {targetName}!
            </p>
          ) : (
            <p className="text-[15px] text-ink-soft">
              Draw the <span className="font-semibold text-ink">{targetName}</span> logo
            </p>
          )}
          <button type="button" onClick={shuffleTarget} className={toolButton}>
            <Shuffle className="size-3.5" />
            {solved ? "next" : "another"}
          </button>
        </div>

        <div
          className="relative mt-3 overflow-hidden rounded-xl border border-line bg-(--board)"
          style={{
            backgroundImage: "radial-gradient(var(--board-dot) 1px, transparent 1px)",
            backgroundSize: "18px 18px",
            backgroundPosition: "9px 9px",
          }}
        >
          <canvas
            ref={canvasRef}
            role="img"
            aria-label={`Whiteboard. Draw the ${targetName} logo and the model will guess which logo it is.`}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endStroke}
            onPointerCancel={endStroke}
            className="block h-64 w-full cursor-crosshair touch-none sm:h-72"
          />
          {strokeCount === 0 && (
            <span className="pointer-events-none absolute inset-0 grid place-items-center text-[14px] text-[#8a8478]">
              draw here
            </span>
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div role="radiogroup" aria-label="Pen color" className="flex flex-wrap items-center gap-1.5">
            {INKS.map((c) => (
              <button
                key={c.id}
                type="button"
                role="radio"
                aria-checked={ink === c.id}
                aria-label={c.label}
                title={c.label}
                onClick={() => setInk(c.id)}
                className={cn(
                  "size-6 rounded-full border border-black/10 transition-transform hover:scale-110",
                  ink === c.id && "scale-110 ring-2 ring-ink ring-offset-2 ring-offset-card",
                )}
                style={{ backgroundColor: c.hex }}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={undo} disabled={strokeCount === 0} className={toolButton}>
              <Undo2 className="size-3.5" />
              undo
            </button>
            <button type="button" onClick={clear} disabled={strokeCount === 0} className={toolButton}>
              <Trash2 className="size-3.5" />
              clear
            </button>
          </div>
        </div>

        <div className="mt-4 w-full border-t border-line pt-4" aria-live="polite">
          <div className="flex items-baseline justify-between">
            <span className="text-[13px] font-semibold text-ink-soft">Best guess</span>
            <span className="font-mono text-[11px] text-ink-faint tabular-nums">
              {ms === null ? "idle" : `${ms.toFixed(2)} ms`}
            </span>
          </div>
          <p className="display mt-2 text-[1.6rem] leading-tight font-semibold text-ink">
            {!top ? "Waiting for ink…" : sure ? top.name : "Hmm, keep going…"}
          </p>
          <ul className="mt-3 space-y-2">
            {rows.map((g, i) => (
              <li key={i} className="grid grid-cols-[7rem_1fr_2.75rem] items-center gap-3">
                <span className={cn("truncate text-[13px]", g ? "text-ink" : "text-ink-faint")}>
                  {g?.name ?? "—"}
                </span>
                <span className="relative h-1.5 overflow-hidden rounded-full bg-ink/[0.06]">
                  <span
                    className={cn(
                      "absolute inset-y-0 left-0 rounded-full transition-[width] duration-150",
                      i === 0 ? "bg-hc-red" : "bg-ink/30",
                    )}
                    style={{ width: `${(g?.confidence ?? 0) * 100}%` }}
                  />
                </span>
                <span className="text-right font-mono text-[12px] text-ink-soft tabular-nums">
                  {g ? `${Math.round(g.confidence * 100)}%` : "—"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
