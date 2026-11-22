/*
 * A tiny nearest-template classifier for hand-drawn logos.
 *
 * Every drawing is squeezed into a 40×40 grid (keeping its aspect ratio) and
 * compared to outline templates with a symmetric chamfer distance: how far the
 * user's ink sits from the template's lines, and how far the template's lines
 * sit from the user's ink. Stroke order, direction and speed don't matter.
 * Colored ink nudges the score toward brands that use that color.
 *
 * Each brand has hand-sketched templates (how people tend to draw it) plus,
 * where it helps, the official mark traced from simple-icons. The weights
 * below were tuned on a few thousand synthetic sloppy redraws of both.
 */

import { OFFICIAL_MARKS } from "./logo-official.generated";

export type Point = readonly [number, number];
type Line = Point[];

export const INKS = [
  { id: "black", label: "Black", hex: "#1c2422" },
  { id: "gray", label: "Gray", hex: "#8f9b97" },
  { id: "red", label: "Red", hex: "#e3262f" },
  { id: "orange", label: "Orange", hex: "#f5821f" },
  { id: "yellow", label: "Yellow", hex: "#f5bf1d" },
  { id: "green", label: "Green", hex: "#1fa855" },
  { id: "blue", label: "Blue", hex: "#1f63d1" },
  { id: "purple", label: "Purple", hex: "#8b3dbb" },
] as const;

export type InkId = (typeof INKS)[number]["id"];

export type Stroke = { ink: InkId; points: Point[] };

const TAU = Math.PI * 2;

function arc(cx: number, cy: number, rx: number, ry: number, from: number, to: number): Line {
  const n = Math.max(3, Math.ceil((48 * Math.abs(to - from)) / TAU) + 1);
  return Array.from({ length: n }, (_, i) => {
    const a = from + ((to - from) * i) / (n - 1);
    return [cx + rx * Math.cos(a), cy + ry * Math.sin(a)] as const;
  });
}

const ring = (cx: number, cy: number, r: number) => arc(cx, cy, r, r, 0, TAU);
const oval = (cx: number, cy: number, rx: number, ry: number) => arc(cx, cy, rx, ry, 0, TAU);
const line = (a: Point, b: Point): Line => [a, b];
const polygon = (...pts: Point[]): Line => [...pts, pts[0]];
const square = (x: number, y: number, s: number) => polygon([x, y], [x + s, y], [x + s, y + s], [x, y + s]);

/** A chain of cubic Béziers: each segment is [control 1, control 2, end]. */
function curve(start: Point, ...segments: [Point, Point, Point][]): Line {
  const out: Point[] = [start];
  let p0 = start;
  for (const [p1, p2, p3] of segments) {
    for (let i = 1; i <= 16; i++) {
      const t = i / 16;
      const u = 1 - t;
      const a = u * u * u;
      const b = 3 * u * u * t;
      const c = 3 * u * t * t;
      const d = t * t * t;
      out.push([a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0], a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1]]);
    }
    p0 = p3;
  }
  return out;
}

function roundedRect(x: number, y: number, w: number, h: number, r: number): Line {
  const pts = [
    ...arc(x + w - r, y + r, r, r, -Math.PI / 2, 0),
    ...arc(x + w - r, y + h - r, r, r, 0, Math.PI / 2),
    ...arc(x + r, y + h - r, r, r, Math.PI / 2, Math.PI),
    ...arc(x + r, y + r, r, r, Math.PI, Math.PI * 1.5),
  ];
  return [...pts, pts[0]];
}

/** Rotates lines around (cx, cy) by `deg` degrees. */
function turn(lines: Line[], deg: number, cx = 50, cy = 50): Line[] {
  const a = (deg * Math.PI) / 180;
  const cos = Math.cos(a);
  const sin = Math.sin(a);
  return lines.map((l) => l.map(([x, y]) => [cx + (x - cx) * cos - (y - cy) * sin, cy + (x - cx) * sin + (y - cy) * cos] as const));
}

function star(cx: number, cy: number, outer: number, inner: number): Line {
  return polygon(
    ...Array.from({ length: 10 }, (_, i) => {
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      const r = i % 2 ? inner : outer;
      return [cx + r * Math.cos(a), cy + r * Math.sin(a)] as const;
    }),
  );
}

/** A rhombus with one tip at (cx, cy), pointing at `deg` (0 = right, 90 = down). */
function petal(cx: number, cy: number, deg: number, length: number, width: number): Line {
  const a = (deg * Math.PI) / 180;
  const [dx, dy] = [Math.cos(a), Math.sin(a)];
  const at = (along: number, across: number) => [cx + dx * along - dy * across, cy + dy * along + dx * across] as const;
  return polygon(at(0, 0), at(length / 2, width / 2), at(length, 0), at(length / 2, -width / 2));
}

type Brand = { id: string; name: string; inks: InkId[]; variants: Line[][] };

/** Templates live in a 100×100 box, y pointing down. */
export const BRANDS: Brand[] = [
  {
    id: "apple",
    name: "Apple",
    inks: ["black", "gray"],
    variants: [
      [
        curve(
          [50, 30],
          [[44, 26], [30, 24], [24, 34]],
          [[17, 46], [22, 66], [30, 76]],
          [[35, 83], [41, 86], [46, 83]],
          [[49, 81], [51, 81], [54, 83]],
          [[59, 86], [65, 83], [70, 76]],
          [[74, 70], [77, 64], [78, 60]],
          [[70, 56], [68, 46], [74, 40]],
          [[70, 33], [62, 27], [50, 30]],
        ),
        curve([50, 28], [[50, 20], [55, 14], [62, 12]], [[62, 20], [57, 26], [50, 28]]),
      ],
    ],
  },
  {
    id: "nike",
    name: "Nike",
    inks: ["black", "orange"],
    variants: [
      [
        curve(
          [8, 62],
          [[4, 72], [10, 80], [22, 78]],
          [[40, 74], [70, 54], [94, 34]],
          [[70, 48], [40, 64], [26, 66]],
          [[16, 67], [12, 64], [14, 56]],
          [[11, 59], [9, 60], [8, 62]],
        ),
      ],
      [curve([10, 58], [[8, 74], [24, 80], [40, 72]], [[56, 64], [76, 48], [92, 34]])],
    ],
  },
  {
    id: "mcdonalds",
    name: "McDonald's",
    inks: ["yellow", "red"],
    variants: [
      [
        curve(
          [12, 88],
          [[12, 40], [18, 16], [31, 16]],
          [[44, 16], [49, 40], [50, 60]],
          [[51, 40], [56, 16], [69, 16]],
          [[82, 16], [88, 40], [88, 88]],
        ),
      ],
    ],
  },
  {
    id: "target",
    name: "Target",
    inks: ["red"],
    variants: [
      [ring(50, 50, 40), ring(50, 50, 14)],
      [ring(50, 50, 40), ring(50, 50, 27), ring(50, 50, 13)],
    ],
  },
  {
    id: "olympics",
    name: "Olympics",
    inks: ["blue", "yellow", "black", "green", "red"],
    variants: [[ring(22, 40, 14), ring(50, 40, 14), ring(78, 40, 14), ring(36, 56, 14), ring(64, 56, 14)]],
  },
  {
    id: "youtube",
    name: "YouTube",
    inks: ["red"],
    variants: [[roundedRect(10, 24, 80, 52, 11), polygon([42, 38], [64, 50], [42, 62])]],
  },
  {
    id: "instagram",
    name: "Instagram",
    inks: ["purple", "red", "orange", "yellow"],
    variants: [[roundedRect(14, 14, 72, 72, 15), ring(50, 50, 17), ring(70, 30, 3)]],
  },
  {
    id: "microsoft",
    name: "Microsoft",
    inks: ["red", "green", "blue", "yellow"],
    variants: [
      [square(14, 14, 33), square(53, 14, 33), square(14, 53, 33), square(53, 53, 33)],
      [square(14, 14, 72), line([50, 14], [50, 86]), line([14, 50], [86, 50])],
    ],
  },
  {
    id: "mercedes",
    name: "Mercedes-Benz",
    inks: ["gray"],
    variants: [[ring(50, 50, 40), line([50, 50], [50, 11]), line([50, 50], [17, 69]), line([50, 50], [83, 69])]],
  },
  {
    id: "spotify",
    name: "Spotify",
    inks: ["green"],
    variants: [
      [
        ring(50, 50, 40),
        curve([26, 39], [[40, 32], [60, 32], [75, 40]]),
        curve([30, 52], [[42, 46], [58, 46], [70, 53]]),
        curve([34, 64], [[44, 59], [56, 59], [65, 65]]),
      ],
    ],
  },
  {
    id: "pepsi",
    name: "Pepsi",
    inks: ["blue", "red"],
    variants: [[ring(50, 50, 40), curve([11, 44], [[30, 32], [56, 66], [89, 52]])]],
  },
  {
    id: "google",
    name: "Google",
    inks: ["blue", "red", "yellow", "green"],
    variants: [[arc(50, 50, 38, 38, -Math.PI / 4, -2 * Math.PI), line([88, 50], [52, 50])]],
  },
  {
    id: "mastercard",
    name: "Mastercard",
    inks: ["red", "orange", "yellow"],
    variants: [[ring(36, 50, 27), ring(64, 50, 27)]],
  },
  {
    id: "audi",
    name: "Audi",
    inks: ["gray"],
    variants: [[ring(23, 50, 16), ring(41, 50, 16), ring(59, 50, 16), ring(77, 50, 16)]],
  },
  {
    id: "adidas",
    name: "adidas",
    inks: [],
    variants: [
      [line([18, 82], [9, 66]), line([53, 82], [32, 44]), line([87, 82], [54, 22])],
      [
        polygon([4, 82], [30, 82], [20, 62], [0, 72]),
        polygon([40, 82], [66, 82], [42, 40], [22, 51]),
        polygon([74, 82], [100, 82], [64, 18], [44, 30]),
      ],
    ],
  },
  {
    id: "amazon",
    name: "Amazon",
    inks: ["orange"],
    variants: [[curve([12, 56], [[32, 74], [62, 76], [84, 60]]), polygon([72, 56], [86, 58], [82, 71])]],
  },
  {
    id: "toyota",
    name: "Toyota",
    inks: ["red", "gray"],
    variants: [[oval(50, 50, 42, 28), oval(50, 36, 24, 10), oval(50, 53, 9, 21)]],
  },
  {
    id: "facebook",
    name: "Facebook",
    inks: ["blue"],
    variants: [
      [ring(50, 50, 40), curve([55, 90], [[55, 70], [55, 50], [55, 40]], [[55, 28], [61, 24], [70, 24]]), line([42, 52], [67, 52])],
      [roundedRect(12, 12, 76, 76, 14), curve([56, 88], [[56, 70], [56, 50], [56, 40]], [[56, 28], [62, 24], [72, 24]]), line([43, 52], [68, 52])],
      [curve([55, 90], [[55, 70], [55, 50], [55, 36]], [[55, 22], [62, 14], [74, 14]]), line([38, 50], [70, 50])],
    ],
  },
  {
    id: "whatsapp",
    name: "WhatsApp",
    inks: ["green"],
    variants: [
      [
        [...arc(52, 48, 38, 38, 2.45, 2.45 + TAU - 0.55), [12, 88], [52 + 38 * Math.cos(2.45), 48 + 38 * Math.sin(2.45)]],
        curve([38, 32], [[33, 40], [38, 54], [50, 62]], [[58, 68], [65, 67], [68, 62]]),
      ],
    ],
  },
  {
    id: "snapchat",
    name: "Snapchat",
    inks: ["yellow"],
    variants: [
      [
        curve(
          [50, 12],
          [[66, 12], [72, 24], [72, 38]],
          [[72, 44], [72, 48], [72, 50]],
          [[78, 48], [84, 50], [80, 56]],
          [[76, 60], [72, 62], [74, 66]],
          [[78, 74], [86, 76], [88, 78]],
          [[84, 84], [76, 82], [70, 86]],
          [[64, 92], [56, 88], [50, 90]],
          [[44, 88], [36, 92], [30, 86]],
          [[24, 82], [16, 84], [12, 78]],
          [[14, 76], [22, 74], [26, 66]],
          [[28, 62], [24, 60], [20, 56]],
          [[16, 50], [22, 48], [28, 50]],
          [[28, 48], [28, 44], [28, 38]],
          [[28, 24], [34, 12], [50, 12]],
        ),
      ],
    ],
  },
  {
    id: "tiktok",
    name: "TikTok",
    inks: ["red", "blue"],
    variants: [[ring(36, 70, 16), line([52, 70], [52, 12]), curve([52, 12], [[56, 24], [66, 32], [78, 32]])]],
  },
  {
    id: "netflix",
    name: "Netflix",
    inks: ["red"],
    variants: [
      [[[26, 90], [26, 10], [74, 90], [74, 10]]],
      [polygon([22, 90], [22, 10], [36, 10], [64, 72], [64, 10], [78, 10], [78, 90], [64, 90], [36, 28], [36, 90])],
    ],
  },
  {
    id: "starbucks",
    name: "Starbucks",
    inks: ["green"],
    variants: [
      [ring(50, 50, 42), ring(50, 50, 28), star(50, 34, 7, 3), ring(50, 56, 10)],
      [ring(50, 50, 42), ring(50, 50, 28), star(50, 50, 9, 4)],
    ],
  },
  {
    id: "bmw",
    name: "BMW",
    inks: ["blue", "gray"],
    variants: [[ring(50, 50, 42), ring(50, 50, 28), line([22, 50], [78, 50]), line([50, 22], [50, 78])]],
  },
  {
    id: "volkswagen",
    name: "Volkswagen",
    inks: ["blue", "gray"],
    variants: [
      [
        ring(50, 50, 42),
        [[30, 20], [50, 52], [70, 20]],
        [[16, 38], [33, 80], [50, 56], [67, 80], [84, 38]],
      ],
    ],
  },
  {
    id: "tesla",
    name: "Tesla",
    inks: ["red", "gray"],
    variants: [
      [
        curve([14, 16], [[36, 6], [64, 6], [86, 16]]),
        curve([22, 30], [[38, 24], [62, 24], [78, 30]]),
        line([50, 27], [50, 92]),
      ],
    ],
  },
  {
    id: "chrome",
    name: "Chrome",
    inks: ["red", "yellow", "green", "blue"],
    variants: [
      [
        ring(50, 50, 42),
        ring(50, 50, 16),
        ...[0, 120, 240].flatMap((deg) => turn([line([50, 34], [88.8, 34])], deg)),
      ],
    ],
  },
  {
    id: "android",
    name: "Android",
    inks: ["green"],
    variants: [
      [
        [...arc(50, 64, 32, 30, Math.PI, TAU), [18, 64]],
        ring(38, 50, 3),
        ring(62, 50, 3),
        line([34, 38], [26, 22]),
        line([66, 38], [74, 22]),
      ],
    ],
  },
  {
    id: "shell",
    name: "Shell",
    inks: ["yellow", "red"],
    variants: [
      [
        [[34, 88], [16, 52], ...arc(50, 52, 36, 38, Math.PI, TAU), [84, 52], [66, 88], [34, 88]],
        ...[-140, -115, -90, -65, -40].map((deg): Line => {
          const a = (deg * Math.PI) / 180;
          return line([50, 88], [50 + 34 * Math.cos(a), 52 + 36 * Math.sin(a)]);
        }),
      ],
    ],
  },
  {
    id: "pinterest",
    name: "Pinterest",
    inks: ["red"],
    variants: [
      [ring(50, 50, 42), line([47, 32], [38, 92]), curve([47, 32], [[72, 24], [78, 58], [48, 60]])],
      [line([47, 18], [36, 92]), curve([47, 18], [[78, 10], [84, 58], [46, 60]])],
    ],
  },
  {
    id: "airbnb",
    name: "Airbnb",
    inks: ["red"],
    variants: [
      [
        curve(
          [50, 14],
          [[44, 14], [40, 20], [36, 28]],
          [[28, 44], [14, 68], [18, 80]],
          [[22, 92], [38, 92], [50, 78]],
          [[62, 92], [78, 92], [82, 80]],
          [[86, 68], [72, 44], [64, 28]],
          [[60, 20], [56, 14], [50, 14]],
        ),
        curve([50, 78], [[40, 66], [38, 56], [44, 50]], [[48, 46], [52, 46], [56, 50]], [[62, 56], [60, 66], [50, 78]]),
      ],
    ],
  },
  {
    id: "chevrolet",
    name: "Chevrolet",
    inks: ["yellow"],
    variants: [
      [
        polygon(
          [8, 42],
          [36, 42],
          [38, 33],
          [64, 33],
          [62, 42],
          [96, 42],
          [90, 58],
          [62, 58],
          [60, 67],
          [34, 67],
          [36, 58],
          [2, 58],
        ),
      ],
    ],
  },
  {
    id: "gmail",
    name: "Gmail",
    inks: ["red", "blue", "green", "yellow"],
    variants: [
      [polygon([12, 22], [88, 22], [88, 78], [12, 78]), [[12, 22], [50, 54], [88, 22]]],
      [[[12, 78], [12, 22], [50, 52], [88, 22], [88, 78]]],
    ],
  },
  {
    id: "mitsubishi",
    name: "Mitsubishi",
    inks: ["red"],
    variants: [[petal(50, 54, -90, 44, 24), petal(50, 54, 30, 44, 24), petal(50, 54, 150, 44, 24)]],
  },
  {
    id: "reddit",
    name: "Reddit",
    inks: ["orange"],
    variants: [
      [
        oval(50, 62, 36, 24),
        ring(38, 58, 4),
        ring(62, 58, 4),
        curve([38, 72], [[44, 77], [56, 77], [62, 72]]),
        [[50, 38], [55, 16], [64, 18]],
        ring(70, 18, 6),
        ring(17, 48, 7),
        ring(83, 48, 7),
      ],
    ],
  },
  {
    id: "playstation",
    name: "PlayStation",
    inks: ["blue", "black"],
    variants: [
      [
        line([40, 12], [40, 78]),
        curve([40, 12], [[78, 12], [78, 50], [44, 48]]),
        curve([8, 76], [[30, 62], [62, 66], [50, 74]], [[40, 82], [70, 92], [94, 78]]),
      ],
    ],
  },
  {
    id: "discord",
    name: "Discord",
    inks: ["blue", "purple"],
    variants: [
      [
        curve(
          [22, 26],
          [[34, 20], [42, 18], [44, 22]],
          [[48, 20], [52, 20], [56, 22]],
          [[58, 18], [66, 20], [78, 26]],
          [[88, 42], [92, 60], [90, 72]],
          [[82, 80], [72, 84], [66, 84]],
          [[62, 80], [62, 78], [60, 76]],
          [[54, 78], [46, 78], [40, 76]],
          [[38, 78], [38, 80], [34, 84]],
          [[28, 84], [18, 80], [10, 72]],
          [[8, 60], [12, 42], [22, 26]],
        ),
        oval(37, 56, 7, 8),
        oval(63, 56, 7, 8),
      ],
    ],
  },
];

export type Guess = { id: string; name: string; confidence: number };

const GRID = 40;
const PAD = 3;
const CELLS = GRID * GRID;
/** Ink farther than this from the other shape costs the same, so one stray scribble can't dominate. */
const CAP = 10;
/** Softmax temperature, in grid cells of average distance. */
const TEMPERATURE = 0.2;
/** A hidden "none of these" option, so a random scribble doesn't get a confident answer. */
const UNKNOWN_DISTANCE = 2.5;
/**
 * Aspect ratio still counts, but is softened (ratio^0.28) so a sloppy square
 * isn't read as a rectangle while a wide oval still reads as wide.
 */
const ASPECT_WEIGHT = 0.28;
/** How far ink color can swing a distance: ±half of this. */
const COLOR_WEIGHT = 0.44;

/** Stroke directions are binned (—, ╱, |, ╲) so a square's sides don't line up with a circle. */
const BINS = 4;
/** Extra cost for matching ink running in a neighboring direction, or any direction at all. */
const NEAR_BIN_COST = 1.8;
const ANY_BIN_COST = 3.2;
/** Cells sampled per grid unit along a stroke, and how far either side to look for its direction. */
const SAMPLES_PER_CELL = 3;
const DIRECTION_REACH = 3;

/** `cells` holds grid indices; `bins` the direction of each (−1 for a lone dot). */
type Shape = { cells: Uint16Array; bins: Int8Array; field: Float32Array; binFields: Float32Array[] };

function rasterize(lines: readonly (readonly Point[])[]): Shape | null {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const l of lines) {
    for (const [x, y] of l) {
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }
  const w = maxX - minX;
  const h = maxY - minY;
  const size = Math.max(w, h);
  if (!Number.isFinite(size) || size < 1e-6) return null;

  const span = GRID - 1 - 2 * PAD;
  const fit = (side: number) => (side < size * 0.02 ? span / size : (span * Math.pow(side / size, ASPECT_WEIGHT)) / side);
  const sx = fit(w);
  const sy = fit(h);
  const ox = PAD + (span - w * sx) / 2 - minX * sx;
  const oy = PAD + (span - h * sy) / 2 - minY * sy;

  const all = new Uint8Array(CELLS);
  const binned = Array.from({ length: BINS }, () => new Uint8Array(CELLS));
  const dots = new Set<number>();
  const cellOf = ([x, y]: Point) => Math.round(y) * GRID + Math.round(x);

  for (const l of lines) {
    const samples = resample(l.map(([x, y]) => [x * sx + ox, y * sy + oy] as const));
    if (samples.length === 1) {
      const cell = cellOf(samples[0]);
      all[cell] = 1;
      dots.add(cell);
      continue;
    }
    for (let j = 0; j < samples.length; j++) {
      const a = samples[Math.max(0, j - DIRECTION_REACH)];
      const b = samples[Math.min(samples.length - 1, j + DIRECTION_REACH)];
      const angle = (Math.atan2(b[1] - a[1], b[0] - a[0]) + Math.PI) % Math.PI;
      const bin = Math.round(angle / (Math.PI / BINS)) % BINS;
      const cell = cellOf(samples[j]);
      all[cell] = 1;
      binned[bin][cell] = 1;
    }
  }

  const cells: number[] = [];
  const bins: number[] = [];
  for (let i = 0; i < CELLS; i++) {
    for (let k = 0; k < BINS; k++) {
      if (binned[k][i]) {
        cells.push(i);
        bins.push(k);
      }
    }
    if (dots.has(i) && !binned.some((g) => g[i])) {
      cells.push(i);
      bins.push(-1);
    }
  }
  return {
    cells: Uint16Array.from(cells),
    bins: Int8Array.from(bins),
    field: distanceField(all),
    binFields: binned.map(distanceField),
  };
}

/** Evenly spaced points along a polyline, already in grid units. */
function resample(line: readonly Point[]): Point[] {
  const out: Point[] = [line[0]];
  const step = 1 / SAMPLES_PER_CELL;
  let carry = 0;
  for (let i = 1; i < line.length; i++) {
    const [x0, y0] = line[i - 1];
    const [x1, y1] = line[i];
    const len = Math.hypot(x1 - x0, y1 - y0);
    let t = step - carry;
    while (t <= len) {
      out.push([x0 + ((x1 - x0) * t) / len, y0 + ((y1 - y0) * t) / len]);
      t += step;
    }
    carry = len - (t - step);
  }
  return out;
}

/** Two-pass chamfer distance transform (1 for edges, √2 for diagonals). */
function distanceField(grid: Uint8Array): Float32Array {
  const d = new Float32Array(CELLS);
  for (let i = 0; i < CELLS; i++) d[i] = grid[i] ? 0 : 1e6;
  const D = Math.SQRT2;
  for (let y = 0; y < GRID; y++) {
    for (let x = 0; x < GRID; x++) {
      const i = y * GRID + x;
      if (x > 0) d[i] = Math.min(d[i], d[i - 1] + 1);
      if (y > 0) {
        d[i] = Math.min(d[i], d[i - GRID] + 1);
        if (x > 0) d[i] = Math.min(d[i], d[i - GRID - 1] + D);
        if (x < GRID - 1) d[i] = Math.min(d[i], d[i - GRID + 1] + D);
      }
    }
  }
  for (let y = GRID - 1; y >= 0; y--) {
    for (let x = GRID - 1; x >= 0; x--) {
      const i = y * GRID + x;
      if (x < GRID - 1) d[i] = Math.min(d[i], d[i + 1] + 1);
      if (y < GRID - 1) {
        d[i] = Math.min(d[i], d[i + GRID] + 1);
        if (x < GRID - 1) d[i] = Math.min(d[i], d[i + GRID + 1] + D);
        if (x > 0) d[i] = Math.min(d[i], d[i + GRID - 1] + D);
      }
    }
  }
  return d;
}

/** Average cost of `a`'s ink against `b`: distance to the nearest ink running the same way. */
function chamfer(a: Shape, b: Shape) {
  let sum = 0;
  for (let n = 0; n < a.cells.length; n++) {
    const i = a.cells[n];
    const k = a.bins[n];
    let cost = b.field[i] + (k < 0 ? 0 : ANY_BIN_COST);
    if (k >= 0) {
      cost = Math.min(
        cost,
        b.binFields[k][i],
        b.binFields[(k + 1) % BINS][i] + NEAR_BIN_COST,
        b.binFields[(k + BINS - 1) % BINS][i] + NEAR_BIN_COST,
      );
    }
    sum += Math.min(cost, CAP);
  }
  return sum / a.cells.length;
}

const shapeDistance = (a: Shape, b: Shape) => (chamfer(a, b) + chamfer(b, a)) / 2;

let compiled: { brand: Brand; shapes: Shape[] }[] | null = null;

/** The official mark for a brand as polylines, if simple-icons has one. */
export function officialVariant(id: string): Line[] | null {
  const mark = OFFICIAL_MARKS[id];
  if (!mark) return null;
  return mark.map((flat) => Array.from({ length: flat.length / 2 }, (_, i) => [flat[2 * i], flat[2 * i + 1]] as const));
}

function templates() {
  compiled ??= BRANDS.map((brand) => {
    const official = officialVariant(brand.id);
    const variants = official ? [...brand.variants, official] : brand.variants;
    return { brand, shapes: variants.map((v) => rasterize(v)).filter((s): s is Shape => s !== null) };
  });
  return compiled;
}

function strokeLength(points: readonly Point[]) {
  let len = 0;
  for (let i = 1; i < points.length; i++) {
    len += Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]);
  }
  return len;
}

/**
 * Scales distance between 0.78 (all ink in the brand's colors) and 1.22 (all
 * ink in colors the brand never uses). Black is neutral: plenty of people
 * sketch everything in black.
 */
function colorFactor(weights: Map<InkId, number>, brand: Brand) {
  let total = 0;
  let score = 0;
  for (const [ink, w] of weights) {
    total += w;
    score += w * (ink === "black" ? 0.5 : brand.inks.includes(ink) ? 1 : 0);
  }
  return total > 0 ? 1 + COLOR_WEIGHT / 2 - COLOR_WEIGHT * (score / total) : 1;
}

export function guessLogo(strokes: readonly Stroke[]): Guess[] {
  const drawing = rasterize(strokes.map((s) => s.points));
  if (!drawing) return [];

  const weights = new Map<InkId, number>();
  for (const s of strokes) weights.set(s.ink, (weights.get(s.ink) ?? 0) + strokeLength(s.points) + 1);

  const scored = templates().map(({ brand, shapes }) => {
    const best = Math.min(...shapes.map((t) => shapeDistance(drawing, t)));
    return { brand, distance: best * colorFactor(weights, brand) };
  });

  const nearest = Math.min(UNKNOWN_DISTANCE, ...scored.map((s) => s.distance));
  const exp = (d: number) => Math.exp(-(d - nearest) / TEMPERATURE);
  const total = scored.reduce((sum, s) => sum + exp(s.distance), exp(UNKNOWN_DISTANCE));

  return scored
    .map(({ brand, distance }) => ({ id: brand.id, name: brand.name, confidence: exp(distance) / total }))
    .sort((a, b) => b.confidence - a.confidence);
}
