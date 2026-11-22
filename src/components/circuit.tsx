"use client";

import { useReducedMotion } from "motion/react";
import { useEffect, useRef, useState, type CSSProperties } from "react";

type Point = [number, number];

type Wire = {
  id: string;
  points: Point[];
  length: number;
  color: string;
  reverse: boolean;
  delay: number;
  sparse: boolean;
};

type Box = { x: number; y: number; w: number; h: number };

const PACKET_COLORS = ["#8f7df5", "#4fa8ff", "#2fbf9b", "#ec3750"];
const PACKET_PX = 26;
const SPEED_PX_S = 260;
const RADIUS = 12;
const LANE_GAP = 14;
const BUS_GAP = 16;

/** Layout position ignoring CSS transforms, so in-flight reveal animations don't skew wires. */
function boxOf(el: HTMLElement, root: HTMLElement): Box {
  let x = 0;
  let y = 0;
  let node: HTMLElement | null = el;
  while (node && node !== root) {
    x += node.offsetLeft;
    y += node.offsetTop;
    node = node.offsetParent as HTMLElement | null;
  }
  return { x, y, w: el.offsetWidth, h: el.offsetHeight };
}

/** Deterministic 0–1 jitter so timings look random but match between renders. */
function scatter(seed: number) {
  const v = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return v - Math.floor(v);
}

function lengthOf(points: Point[]) {
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    total += Math.abs(points[i][0] - points[i - 1][0]) + Math.abs(points[i][1] - points[i - 1][1]);
  }
  return total;
}

/** Orthogonal polyline with rounded corners, like a PCB trace. */
function pathOf(points: Point[]) {
  let d = `M${points[0][0]},${points[0][1]}`;
  for (let i = 1; i < points.length - 1; i++) {
    const [px, py] = points[i - 1];
    const [cx, cy] = points[i];
    const [nx, ny] = points[i + 1];
    const r = Math.min(
      RADIUS,
      Math.abs(cx - px + (cy - py)) / 2,
      Math.abs(nx - cx + (ny - cy)) / 2,
    );
    const inX = cx - Math.sign(cx - px) * r;
    const inY = cy - Math.sign(cy - py) * r;
    const outX = cx + Math.sign(nx - cx) * r;
    const outY = cy + Math.sign(ny - cy) * r;
    d += ` L${inX},${inY} Q${cx},${cy} ${outX},${outY}`;
  }
  const end = points[points.length - 1];
  return `${d} L${end[0]},${end[1]}`;
}

function route(root: HTMLElement, wide: boolean): { wires: Wire[]; height: number } {
  const core = root.querySelector<HTMLElement>('[data-chip="core"]');
  if (!core) return { wires: [], height: 0 };
  const c = boxOf(core, root);
  const wires: Wire[] = [];
  let n = 0;
  const add = (id: string, points: Point[], reverse = false, sparse = false) => {
    wires.push({
      id,
      points,
      length: lengthOf(points),
      color: PACKET_COLORS[n % PACKET_COLORS.length],
      reverse,
      delay: sparse ? scatter(n) * 6 : (n * 0.73) % 3.2,
      sparse,
    });
    n++;
  };

  const bus = root.querySelector<HTMLElement>('[data-chip="bus"]');
  if (bus) {
    const b = boxOf(bus, root);
    const mid = b.x + b.w / 2;
    for (let i = -2; i <= 2; i++) {
      const x = mid + i * BUS_GAP;
      add(`bus${i}`, [[x, c.y + c.h], [x, b.y]], i % 2 !== 0, true);
    }
  }

  if (wide) {
    const targets = Array.from(root.querySelectorAll<HTMLElement>('[data-chip="node"]'));
    const lanes = { left: 0, right: 0 };
    targets.forEach((el, i) => {
      const t = boxOf(el, root);
      const side = i % 2 === 0 ? "left" : "right";
      const lane = lanes[side]++;
      const startY = c.y + c.h * (0.38 + lane * 0.12);
      const endY = t.y + 36 + (lane % 2) * 18;
      if (side === "left") {
        const x = Math.min(c.x, t.x) - 22 - lane * LANE_GAP;
        if (x < 6) return;
        add(`l${i}`, [[c.x, startY], [x, startY], [x, endY], [t.x, endY]], lane % 2 === 1);
      } else {
        const x = Math.max(c.x + c.w, t.x + t.w) + 22 + lane * LANE_GAP;
        if (x > root.offsetWidth - 6) return;
        add(`r${i}`, [[c.x + c.w, startY], [x, startY], [x, endY], [t.x + t.w, endY]], lane % 2 === 1);
      }
    });

    // Short stubs off the top corners so the core reads as a chip with pins all round.
    for (let i = 0; i < 3; i++) {
      const y = c.y + 40 + i * 22;
      add(`sl${i}`, [[c.x, y], [Math.max(c.x - 40 - i * 10, 4), y]], true);
      add(`sr${i}`, [[c.x + c.w, y], [Math.min(c.x + c.w + 40 + i * 10, root.offsetWidth - 4), y]], true);
    }
  }

  return { wires, height: root.scrollHeight };
}

export function Circuit() {
  const svgRef = useRef<SVGSVGElement>(null);
  const reduceMotion = useReducedMotion();
  const [layout, setLayout] = useState<{ wires: Wire[]; height: number }>({ wires: [], height: 0 });

  useEffect(() => {
    const root = svgRef.current?.parentElement;
    if (!root) return;
    let frame = 0;
    const measure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setLayout(route(root, window.innerWidth >= 1024)));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(root);
    window.addEventListener("resize", measure);
    document.fonts?.ready.then(measure);
    return () => {
      cancelAnimationFrame(frame);
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  return (
    <svg
      ref={svgRef}
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-0 -z-[5] w-full"
      style={{ height: layout.height || "100%" }}
    >
      {layout.wires.map((w, i) => {
        const d = pathOf(w.points);
        const [sx, sy] = w.points[0];
        const [ex, ey] = w.points[w.points.length - 1];
        const dash = PACKET_PX / w.length;
        return (
          <g key={w.id}>
            <path
              d={d}
              pathLength={1}
              fill="none"
              strokeWidth={1.5}
              className="wire-draw stroke-ink/15"
              style={{ animationDelay: `${1.1 + i * 0.04}s` } as CSSProperties}
            />
            {!reduceMotion && (
              <path
                d={d}
                pathLength={1}
                fill="none"
                stroke={w.color}
                strokeWidth={2}
                strokeOpacity={0.8}
                strokeLinecap="round"
                strokeDasharray={`${dash} 2`}
                className={w.sparse ? "wire-packet sparse" : "wire-packet"}
                style={
                  {
                    "--dash": dash,
                    animationDuration: w.sparse
                      ? `${(Math.max(w.length / SPEED_PX_S, 0.7) / 0.22) * (0.8 + scatter(i + 7) * 0.7)}s`
                      : `${Math.max(w.length / SPEED_PX_S, 0.8) / 0.6}s`,
                    animationDelay: `${2.4 + w.delay}s`,
                    animationDirection: w.reverse ? "reverse" : "normal",
                    filter: `drop-shadow(0 0 2px ${w.color})`,
                  } as CSSProperties
                }
              />
            )}
            <rect x={sx - 3} y={sy - 3} width={6} height={6} rx={1} className="wire-pad fill-ink/35" />
            <rect x={ex - 3} y={ey - 3} width={6} height={6} rx={1} className="wire-pad fill-ink/35" />
          </g>
        );
      })}
    </svg>
  );
}
