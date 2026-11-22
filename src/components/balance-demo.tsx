"use client";

import { useReducedMotion } from "motion/react";
import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";

/*
 * Two-wheeled self-balancing robot, modeled as a cart-pole:
 * an inner PID loop holds the body upright, an outer PD loop leans it
 * slightly to drift back toward the middle of its track.
 */
const G = 9.81;
const BASE_MASS = 0.4; // wheels + motors, kg
const BODY_MASS = 0.6; // kg
const HALF_HEIGHT = 0.14; // axle to body center of mass, m
const WHEEL_RADIUS = 0.034; // m
const MAX_FORCE = 9; // N at the wheels

const KP = 40;
const KI = 20;
const KD = 4;
const KX = -0.3;
const KV = -0.3;
const MAX_LEAN = 0.15; // rad the outer loop may ask for

const PX_PER_M = 480;
/** The drawing is authored at 300 px/m and scaled up to match PX_PER_M. */
const DRAW_PX_PER_M = 300;
const DRAW_SCALE = PX_PER_M / DRAW_PX_PER_M;
const TIRE = "#1c2422";
const METAL = "#d4dbd8";
const SIM_HZ = 1200;
const TIME_SCALE = 0.75;
const FALL_ANGLE = 1.25;
const MAX_POKE = 5.5; // rad/s
const GROUND_OFFSET = 14; // px from the bottom of the stage

class Robot {
  theta = 0;
  omega = 0;
  x = 0;
  v = 0;
  integral = 0;
  ref = 0;
  p = 0;
  i = 0;
  d = 0;
  force = 0;
  fallenFor = -1;

  step(dt: number) {
    if (this.fallenFor >= 0) {
      this.fallenFor += dt;
      if (this.fallenFor > 1.4) this.standUp();
      return;
    }
    const thetaMeasured = this.theta + (Math.random() - 0.5) * 0.004;
    const gyro = this.omega + (Math.random() - 0.5) * 0.04;

    this.ref = Math.min(Math.max(KX * this.x + KV * this.v, -MAX_LEAN), MAX_LEAN);
    const error = thetaMeasured - this.ref;
    this.integral = Math.min(Math.max(this.integral + error * dt, -0.5), 0.5);
    this.p = KP * error;
    this.i = KI * this.integral;
    this.d = KD * gyro;
    this.force = Math.min(Math.max(this.p + this.i + this.d, -MAX_FORCE), MAX_FORCE);

    const total = BASE_MASS + BODY_MASS;
    const sin = Math.sin(this.theta);
    const cos = Math.cos(this.theta);
    const temp = (-this.force - BODY_MASS * HALF_HEIGHT * this.omega ** 2 * sin) / total;
    const alpha = (G * sin + cos * temp) / (HALF_HEIGHT * (4 / 3 - (BODY_MASS * cos * cos) / total));
    const accel = (this.force + BODY_MASS * HALF_HEIGHT * (this.omega ** 2 * sin - alpha * cos)) / total;

    this.omega += alpha * dt;
    this.theta += this.omega * dt;
    this.v += accel * dt;
    this.x += this.v * dt;

    if (Math.abs(this.theta) > FALL_ANGLE) {
      this.theta = Math.sign(this.theta) * FALL_ANGLE;
      this.omega = 0;
      this.v = 0;
      this.force = 0;
      this.fallenFor = 0;
    }
  }

  standUp() {
    this.theta = 0;
    this.omega = 0;
    this.v = 0;
    this.integral = 0;
    this.fallenFor = -1;
  }

  poke(omega: number) {
    if (this.fallenFor >= 0) return;
    this.omega += Math.max(Math.min(omega, MAX_POKE), -MAX_POKE);
  }
}

type Readout = { theta: number; ref: number; p: number; i: number; d: number; force: number; x: number };

function readoutOf(r: Robot): Readout {
  return { theta: r.theta, ref: r.ref, p: r.p, i: r.i, d: r.d, force: r.force, x: r.x };
}

type Sample = { theta: number; ref: number; force: number };

function cssVar(name: string) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

const CHART_RANGE = 0.2; // rad, full scale

function drawChart(
  ctx: CanvasRenderingContext2D,
  buffer: Sample[],
  width: number,
  height: number,
  colors: { ink: string; red: string },
) {
  ctx.clearRect(0, 0, width, height);
  ctx.globalAlpha = 0.08;
  ctx.strokeStyle = colors.ink;
  ctx.lineWidth = 1;
  for (let i = 1; i < 4; i++) {
    const y = Math.round((height / 4) * i) + 0.5;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
  const step = width / (buffer.length - 1);
  const yOf = (v: number) => height / 2 - (v / CHART_RANGE) * (height / 2 - 6);

  const line = (pick: (s: Sample) => number, color: string, alpha: number, lineWidth: number, dash: number[] = []) => {
    ctx.beginPath();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.setLineDash(dash);
    ctx.lineJoin = "round";
    buffer.forEach((s, i) => {
      const y = Math.min(Math.max(yOf(pick(s)), 1), height - 1);
      if (i === 0) ctx.moveTo(0, y);
      else ctx.lineTo(i * step, y);
    });
    ctx.stroke();
    ctx.setLineDash([]);
  };

  line((s) => (s.force / MAX_FORCE) * CHART_RANGE, colors.ink, 0.22, 1.25);
  line((s) => s.ref, colors.red, 1, 1.25, [4, 4]);
  line((s) => s.theta, colors.ink, 1, 1.75);
  ctx.globalAlpha = 1;
}

/** Side view of a three-deck balancing bot. Axle sits at (0, 0); y grows downward. */
function RobotDrawing({
  bodyRef,
  wheelRef,
  ledRef,
}: {
  bodyRef: React.RefObject<SVGGElement | null>;
  wheelRef: React.RefObject<SVGGElement | null>;
  ledRef: React.RefObject<SVGCircleElement | null>;
}) {
  const r = WHEEL_RADIUS * DRAW_PX_PER_M;
  return (
    <g transform={`scale(${DRAW_SCALE})`}>
      <g ref={bodyRef}>
        {/* bottom deck with TT gear motor */}
        <rect x={-9} y={-9} width={18} height={11} rx={2} fill="#e9b949" />
        <rect x={-3} y={-12} width={6} height={4} rx={1} fill="#e9b949" opacity={0.85} />
        <rect x={-24} y={-16} width={48} height={4} rx={1.5} className="fill-ink/15 stroke-ink/40" strokeWidth={1} />
        {/* brass standoffs */}
        <rect x={-20} y={-88} width={2} height={72} fill="#c49a3c" />
        <rect x={18} y={-88} width={2} height={72} fill="#c49a3c" />
        {/* battery holder with two 18650 cells */}
        <rect x={-15} y={-38} width={30} height={20} rx={3} fill="#232a28" />
        <line x1={-12} y1={-28} x2={12} y2={-28} stroke={METAL} strokeOpacity={0.3} strokeWidth={1} />
        <rect x={-15} y={-37} width={4} height={18} rx={1} fill="#ec3750" opacity={0.9} />
        {/* middle deck + IMU */}
        <rect x={-24} y={-44} width={48} height={4} rx={1.5} className="fill-ink/15 stroke-ink/40" strokeWidth={1} />
        <rect x={6} y={-49} width={7} height={5} rx={1} fill="#232a28" />
        {/* motor driver */}
        <rect x={-14} y={-56} width={14} height={12} rx={1.5} fill="#c0392b" opacity={0.85} />
        {/* top deck: ESP32 dev board */}
        <rect x={-24} y={-90} width={48} height={4} rx={1.5} className="fill-ink/15 stroke-ink/40" strokeWidth={1} />
        <rect x={-17} y={-80} width={34} height={14} rx={2} fill="#1f6b5b" />
        <rect x={-9} y={-78} width={14} height={10} rx={1} fill="#c9d1d1" />
        <rect x={9} y={-76} width={5} height={4} rx={0.5} fill="#c9d1d1" />
        <circle ref={ledRef} cx={-13} cy={-73} r={1.6} fill="#ff5a6e" />
        {/* mast + "tap me!" pennant */}
        <rect x={13} y={-128} width={1.6} height={40} rx={0.8} fill="#9aa5a1" />
        <g className="robot-flag">
          <path
            d="M14.6 -127 H58 L52.5 -119.5 L58 -112 H14.6 Z"
            fill="#ffffff"
            stroke="rgb(15 42 36 / 0.25)"
            strokeWidth={0.6}
            strokeLinejoin="round"
          />
          <text
            x={18}
            y={-117.3}
            fontSize={7}
            fontWeight={600}
            fill="#0f2a24"
            style={{ fontFamily: "var(--font-plex-mono)" }}
          >
            tap me!
          </text>
        </g>
        {/* wiring */}
        <path d="M-6 -66 C -2 -60, 4 -58, 4 -50" fill="none" stroke="#ec3750" strokeWidth={1} opacity={0.8} />
        <path d="M-10 -44 C -14 -30, -14 -18, -6 -9" fill="none" className="stroke-ink/60" strokeWidth={1} />
      </g>
      {/* far wheel peeking out behind */}
      <circle cx={2.5} cy={-1} r={r} fill={TIRE} opacity={0.45} />
      <g ref={wheelRef}>
        <circle r={r} fill={TIRE} className="stroke-ink/20" strokeWidth={0.75} />
        <circle r={r - 3} fill="none" stroke={METAL} strokeOpacity={0.15} strokeWidth={1} />
        {[0, 60, 120].map((a) => (
          <line
            key={a}
            x1={0}
            y1={-(r - 3)}
            x2={0}
            y2={r - 3}
            transform={`rotate(${a})`}
            stroke={METAL}
            strokeOpacity={0.45}
            strokeWidth={1.4}
          />
        ))}
        <circle r={3.2} fill={METAL} />
      </g>
    </g>
  );
}

type Poke = { id: number; x: number; y: number };

export function BalanceDemo({ intro }: { intro: ReactNode }) {
  const reduceMotion = useReducedMotion();
  const robotRef = useRef(new Robot());
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const rigRef = useRef<SVGGElement>(null);
  const bodyRef = useRef<SVGGElement>(null);
  const wheelRef = useRef<SVGGElement>(null);
  const ledRef = useRef<SVGCircleElement>(null);
  const shadowRef = useRef<SVGEllipseElement>(null);
  const groundRef = useRef<SVGGElement>(null);
  const [readout, setReadout] = useState<Readout>(() => readoutOf(new Robot()));
  const [pokes, setPokes] = useState<Poke[]>([]);
  const pokeId = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    const stage = stageRef.current;
    if (!canvas || !ctx || !stage) return;
    const robot = robotRef.current;

    let colors = { ink: cssVar("--ink"), red: cssVar("--hc-red") };
    const themeObserver = new MutationObserver(() => {
      colors = { ink: cssVar("--ink"), red: cssVar("--hc-red") };
      drawChart(ctx, buffer, width, height, colors);
    });
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    let width = 0;
    let height = 0;
    let buffer: Sample[] = [];
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const len = Math.max(Math.ceil(width / 2), 2);
      buffer = Array.from(
        { length: len },
        (_, i) => buffer[buffer.length - len + i] ?? { theta: 0, ref: 0, force: 0 },
      );
    };
    resize();

    const render = () => {
      const stageW = stage.clientWidth;
      const half = stageW / 2 - 50;
      const px = Math.max(Math.min(robot.x * PX_PER_M, half), -half);
      groundRef.current?.setAttribute("transform", `translate(0 ${stage.clientHeight - GROUND_OFFSET})`);
      rigRef.current?.setAttribute("transform", `translate(${stageW / 2 + px} 0)`);
      bodyRef.current?.setAttribute("transform", `rotate(${(robot.theta * 180) / Math.PI})`);
      wheelRef.current?.setAttribute("transform", `rotate(${((robot.x / WHEEL_RADIUS) * 180) / Math.PI})`);
      shadowRef.current?.setAttribute("transform", `translate(${stageW / 2 + px} 0)`);
      ledRef.current?.setAttribute("opacity", robot.fallenFor >= 0 ? "0.25" : String(0.55 + Math.abs(robot.force) / MAX_FORCE));
    };

    const ro = new ResizeObserver(() => {
      resize();
      render();
      drawChart(ctx, buffer, width, height, colors);
    });
    ro.observe(canvas);
    ro.observe(stage);

    if (reduceMotion) {
      render();
      drawChart(ctx, buffer, width, height, colors);
      return () => {
        ro.disconnect();
        themeObserver.disconnect();
      };
    }

    let visible = true;
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    io.observe(stage);

    // Occasional small nudges, like a desk being bumped, keep the loop doing visible work.
    let nextNudge = 2.5;
    let clock = 0;
    let raf = 0;
    let last = performance.now();
    let lastReadout = 0;
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const frame = Math.min((now - last) / 1000, 1 / 30);
      last = now;
      if (!visible || document.hidden) return;
      const simDt = frame * TIME_SCALE;
      clock += simDt;
      if (clock > nextNudge) {
        robot.poke((Math.random() < 0.5 ? -1 : 1) * (0.6 + Math.random() * 1.2));
        nextNudge = clock + 3 + Math.random() * 3;
      }
      const steps = Math.max(1, Math.round(simDt * SIM_HZ));
      for (let s = 0; s < steps; s++) robot.step(simDt / steps);
      buffer.push({ theta: robot.theta, ref: robot.ref, force: robot.force });
      buffer.shift();
      render();
      drawChart(ctx, buffer, width, height, colors);
      if (now - lastReadout > 90) {
        lastReadout = now;
        setReadout(readoutOf(robot));
      }
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      themeObserver.disconnect();
    };
  }, [reduceMotion]);

  const pokeRobot = (e: MouseEvent<HTMLDivElement>) => {
    const stage = stageRef.current;
    if (!stage) return;
    const rect = stage.getBoundingClientRect();
    const robot = robotRef.current;
    const robotX = rect.width / 2 + robot.x * PX_PER_M;
    const axleY = rect.height - GROUND_OFFSET - WHEEL_RADIUS * PX_PER_M;
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    // Poking from the left pushes it right; higher pokes have more leverage.
    const side = clickX < robotX ? 1 : -1;
    const leverage = Math.min(Math.max((axleY - clickY) / (90 * DRAW_SCALE), 0.15), 1.1);
    robot.poke(side * (1.4 + 4 * leverage));
    const id = pokeId.current++;
    setPokes((p) => [...p, { id, x: clickX, y: clickY }]);
    window.setTimeout(() => setPokes((p) => p.filter((q) => q.id !== id)), 600);
  };

  const bumpFromKeyboard = () => robotRef.current.poke((Math.random() < 0.5 ? -1 : 1) * 3);

  const deg = (rad: number) => (rad * 180) / Math.PI;
  const terms = [
    { k: "P", v: readout.p },
    { k: "I", v: readout.i },
    { k: "D", v: readout.d },
  ];

  return (
    <div className="grid items-start gap-10 lg:grid-cols-[1fr_1.05fr] lg:gap-16">
      <div className="flex flex-col gap-10 lg:order-1">
        <div className="order-2 lg:order-1">{intro}</div>
        <div
          ref={stageRef}
          role="button"
          tabIndex={0}
          aria-label="Self-balancing robot. Click it to give it a poke."
          onClick={pokeRobot}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              bumpFromKeyboard();
            }
          }}
          className="relative order-1 h-72 cursor-pointer rounded-2xl outline-none select-none focus-visible:ring-3 focus-visible:ring-hc-red/40 lg:order-2"
        >
          <svg className="absolute inset-0 h-full w-full overflow-visible" aria-hidden>
            <g ref={groundRef}>
              <line x1="0" x2="100%" y1="0" y2="0" className="stroke-ink/15" strokeWidth={1} />
              <ellipse ref={shadowRef} cx={0} cy={2} rx={34} ry={4} className="fill-ink/10" />
              <g ref={rigRef}>
                <g transform={`translate(0 ${-WHEEL_RADIUS * PX_PER_M})`}>
                  <RobotDrawing bodyRef={bodyRef} wheelRef={wheelRef} ledRef={ledRef} />
                </g>
              </g>
            </g>
          </svg>
          {pokes.map((p) => (
            <span
              key={p.id}
              className="pointer-events-none absolute size-8 -translate-x-1/2 -translate-y-1/2 animate-[poke_0.6s_ease-out_forwards] rounded-full border-2 border-hc-red/60"
              style={{ left: p.x, top: p.y }}
            />
          ))}
        </div>
      </div>

      <div
        data-chip="bus"
        aria-label="PID controller readout for the balancing robot"
        className="inset-screen order-first flex w-full flex-col rounded-2xl p-4 text-left sm:p-5 lg:order-2"
      >
        <span className="font-mono text-[11px] tracking-wide text-ink">balance_pid.c</span>

        <div className="mt-4 flex w-full items-end justify-between">
          <span className="eyebrow">body tilt</span>
          <div className="flex gap-3">
            {[
              ["target", "bg-hc-red"],
              ["tilt", "bg-ink"],
              ["motor", "bg-ink/25"],
            ].map(([label, color]) => (
              <span key={label} className="flex items-center gap-1.5 font-mono text-[10px] text-ink-soft">
                <span className={`h-[2px] w-3 rounded-full ${color}`} />
                {label}
              </span>
            ))}
          </div>
        </div>
        <canvas ref={canvasRef} className="mt-2 h-32 w-full sm:h-36" aria-hidden />

        <div className="mt-4 w-full border-t border-border pt-4">
          <div className="flex items-baseline justify-between">
            <span className="eyebrow">terms</span>
            <span className="font-mono text-[11px] text-ink-faint">
              Kp {KP} · Ki {KI} · Kd {KD}
            </span>
          </div>
          <ul className="mt-3 space-y-2">
            {terms.map(({ k, v }) => {
              const w = Math.min(Math.abs(v) / MAX_FORCE, 1) * 50;
              return (
                <li key={k} className="grid grid-cols-[1.5rem_1fr_3.25rem] items-center gap-3">
                  <span className="font-mono text-[11px] text-ink">{k}</span>
                  <span className="relative h-1.5 rounded-full bg-ink/[0.06]">
                    <span className="absolute top-[-3px] left-1/2 h-3 w-px bg-ink/20" />
                    <span
                      className="absolute top-0 h-full rounded-full bg-ink transition-[width,left] duration-100"
                      style={{ width: `${w}%`, left: v >= 0 ? "50%" : `${50 - w}%` }}
                    />
                  </span>
                  <span className="text-right font-mono text-[11px] text-ink-soft tabular-nums">
                    {v >= 0 ? "+" : "−"}
                    {Math.abs(v).toFixed(2)}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        <dl className="mt-5 grid w-full grid-cols-3 gap-2 border-t border-border pt-4">
          {[
            ["tilt", `${deg(readout.theta) >= 0 ? "+" : "−"}${Math.abs(deg(readout.theta)).toFixed(1)}°`],
            ["motor", `${Math.round((readout.force / MAX_FORCE) * 100)}%`],
            ["drift", `${(readout.x * 100).toFixed(1)} cm`],
          ].map(([k, v]) => (
            <div key={k}>
              <dt className="eyebrow">{k}</dt>
              <dd className="mt-1 font-mono text-[13px] text-ink tabular-nums">{v}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
