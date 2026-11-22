/*
 * Turns official logo marks from simple-icons into compact outline data for
 * the logo guesser: `node scripts/build-logo-data.mjs`.
 *
 * Each SVG path is flattened into polylines, simplified, and scaled into the
 * same 100×100 box the hand-drawn templates use.
 */
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as icons from "simple-icons";

/**
 * Brand id in logo-model.ts → simple-icons slug. Only marks that improved
 * accuracy on sloppy redraws are kept: Toyota, Starbucks, Shell, Airbnb and
 * Audi are left out because their detailed official outlines pulled other
 * drawings toward them.
 */
const SLUGS = {
  apple: "apple",
  nike: "nike",
  mcdonalds: "mcdonalds",
  target: "target",
  youtube: "youtube",
  instagram: "instagram",
  spotify: "spotify",
  google: "google",
  mastercard: "mastercard",
  adidas: "adidas",
  facebook: "facebook",
  whatsapp: "whatsapp",
  snapchat: "snapchat",
  tiktok: "tiktok",
  netflix: "netflix",
  bmw: "bmw",
  volkswagen: "volkswagen",
  tesla: "tesla",
  chrome: "googlechrome",
  android: "android",
  pinterest: "pinterest",
  chevrolet: "chevrolet",
  gmail: "gmail",
  mitsubishi: "mitsubishi",
  reddit: "reddit",
  playstation: "playstation",
  discord: "discord",
};

const VIEWBOX = 24;
const SCALE = 100 / VIEWBOX;
/** Douglas–Peucker tolerance, in units of the 100×100 box. */
const TOLERANCE = 0.45;
/** Sub-paths shorter than this (same units) are specks no one would draw. */
const MIN_LENGTH = 6;

const bySlug = new Map(Object.values(icons).map((icon) => [icon.slug, icon]));
const root = join(dirname(fileURLToPath(import.meta.url)), "..");

/** Tokenizes SVG path data, including svgo's packed arc flags ("a1 1 0 011 1"). */
function* commands(d) {
  let i = 0;
  const skip = () => {
    while (i < d.length && /[\s,]/.test(d[i])) i++;
  };
  const number = () => {
    skip();
    const m = /^[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?/.exec(d.slice(i));
    if (!m) throw new Error(`Bad number at ${i} in ${d.slice(i, i + 20)}`);
    i += m[0].length;
    return Number(m[0]);
  };
  const flag = () => {
    skip();
    return Number(d[i++]);
  };
  const arity = { M: 2, L: 2, H: 1, V: 1, C: 6, S: 4, Q: 4, T: 2, A: 7, Z: 0 };
  let cmd = "";
  while (true) {
    skip();
    if (i >= d.length) return;
    if (/[a-zA-Z]/.test(d[i])) cmd = d[i++];
    const upper = cmd.toUpperCase();
    if (upper === "Z") {
      yield [cmd, []];
      continue;
    }
    const args =
      upper === "A"
        ? [number(), number(), number(), flag(), flag(), number(), number()]
        : Array.from({ length: arity[upper] }, number);
    yield [cmd, args];
    // Extra coordinate pairs after a moveto are implicit linetos.
    if (cmd === "M") cmd = "L";
    if (cmd === "m") cmd = "l";
  }
}

function arcPoints(x0, y0, rx, ry, phi, large, sweep, x, y) {
  if (rx === 0 || ry === 0) return [[x, y]];
  const rad = (phi * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const dx = (x0 - x) / 2;
  const dy = (y0 - y) / 2;
  const x1 = cos * dx + sin * dy;
  const y1 = -sin * dx + cos * dy;
  rx = Math.abs(rx);
  ry = Math.abs(ry);
  const lambda = (x1 * x1) / (rx * rx) + (y1 * y1) / (ry * ry);
  if (lambda > 1) {
    rx *= Math.sqrt(lambda);
    ry *= Math.sqrt(lambda);
  }
  const num = rx * rx * ry * ry - rx * rx * y1 * y1 - ry * ry * x1 * x1;
  const den = rx * rx * y1 * y1 + ry * ry * x1 * x1;
  const coef = (large === sweep ? -1 : 1) * Math.sqrt(Math.max(0, num / den));
  const cx1 = (coef * rx * y1) / ry;
  const cy1 = (-coef * ry * x1) / rx;
  const cx = cos * cx1 - sin * cy1 + (x0 + x) / 2;
  const cy = sin * cx1 + cos * cy1 + (y0 + y) / 2;
  const angle = (ux, uy, vx, vy) => Math.atan2(ux * vy - uy * vx, ux * vx + uy * vy);
  const t0 = angle(1, 0, (x1 - cx1) / rx, (y1 - cy1) / ry);
  let dt = angle((x1 - cx1) / rx, (y1 - cy1) / ry, (-x1 - cx1) / rx, (-y1 - cy1) / ry);
  if (!sweep && dt > 0) dt -= 2 * Math.PI;
  if (sweep && dt < 0) dt += 2 * Math.PI;
  const steps = Math.max(2, Math.ceil(Math.abs(dt) / (Math.PI / 16)));
  const out = [];
  for (let s = 1; s <= steps; s++) {
    const t = t0 + (dt * s) / steps;
    const ex = rx * Math.cos(t);
    const ey = ry * Math.sin(t);
    out.push([cos * ex - sin * ey + cx, sin * ex + cos * ey + cy]);
  }
  return out;
}

function flatten(d) {
  const lines = [];
  let line = [];
  let x = 0;
  let y = 0;
  let sx = 0;
  let sy = 0;
  let cx = 0;
  let cy = 0;
  let prev = "";
  const cubic = (x1, y1, x2, y2, ex, ey) => {
    for (let s = 1; s <= 12; s++) {
      const t = s / 12;
      const u = 1 - t;
      line.push([
        u * u * u * x + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t * ex,
        u * u * u * y + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t * ey,
      ]);
    }
  };
  for (const [cmd, a] of commands(d)) {
    const rel = cmd === cmd.toLowerCase();
    const ox = rel ? x : 0;
    const oy = rel ? y : 0;
    const up = cmd.toUpperCase();
    switch (up) {
      case "M":
        if (line.length > 1) lines.push(line);
        x = a[0] + ox;
        y = a[1] + oy;
        sx = x;
        sy = y;
        line = [[x, y]];
        break;
      case "L":
        x = a[0] + ox;
        y = a[1] + oy;
        line.push([x, y]);
        break;
      case "H":
        x = a[0] + ox;
        line.push([x, y]);
        break;
      case "V":
        y = a[0] + oy;
        line.push([x, y]);
        break;
      case "C":
        cubic(a[0] + ox, a[1] + oy, a[2] + ox, a[3] + oy, a[4] + ox, a[5] + oy);
        cx = a[2] + ox;
        cy = a[3] + oy;
        x = a[4] + ox;
        y = a[5] + oy;
        break;
      case "S": {
        const r = "CS".includes(prev);
        cubic(r ? 2 * x - cx : x, r ? 2 * y - cy : y, a[0] + ox, a[1] + oy, a[2] + ox, a[3] + oy);
        cx = a[0] + ox;
        cy = a[1] + oy;
        x = a[2] + ox;
        y = a[3] + oy;
        break;
      }
      case "Q":
      case "T": {
        const qx = up === "Q" ? a[0] + ox : "QT".includes(prev) ? 2 * x - cx : x;
        const qy = up === "Q" ? a[1] + oy : "QT".includes(prev) ? 2 * y - cy : y;
        const ex = (up === "Q" ? a[2] : a[0]) + ox;
        const ey = (up === "Q" ? a[3] : a[1]) + oy;
        cubic(x + (2 / 3) * (qx - x), y + (2 / 3) * (qy - y), ex + (2 / 3) * (qx - ex), ey + (2 / 3) * (qy - ey), ex, ey);
        cx = qx;
        cy = qy;
        x = ex;
        y = ey;
        break;
      }
      case "A":
        line.push(...arcPoints(x, y, a[0], a[1], a[2], a[3], a[4], a[5] + ox, a[6] + oy));
        x = a[5] + ox;
        y = a[6] + oy;
        break;
      case "Z":
        line.push([sx, sy]);
        lines.push(line);
        x = sx;
        y = sy;
        line = [[x, y]];
        break;
      default:
        throw new Error(`Unknown command ${cmd}`);
    }
    prev = up;
  }
  if (line.length > 1) lines.push(line);
  return lines;
}

function simplify(points, tolerance) {
  if (points.length < 3) return points;
  const keep = new Uint8Array(points.length);
  keep[0] = keep[points.length - 1] = 1;
  const stack = [[0, points.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop();
    const [ax, ay] = points[a];
    const [bx, by] = points[b];
    const len = Math.hypot(bx - ax, by - ay) || 1;
    let worst = -1;
    let index = -1;
    for (let i = a + 1; i < b; i++) {
      const [px, py] = points[i];
      const dist =
        len === 1 && bx === ax && by === ay
          ? Math.hypot(px - ax, py - ay)
          : Math.abs((bx - ax) * (ay - py) - (ax - px) * (by - ay)) / len;
      if (dist > worst) {
        worst = dist;
        index = i;
      }
    }
    if (worst > tolerance) {
      keep[index] = 1;
      stack.push([a, index], [index, b]);
    }
  }
  return points.filter((_, i) => keep[i]);
}

const lengthOf = (pts) => pts.reduce((s, p, i) => (i ? s + Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]) : 0), 0);

const out = {};
for (const [id, slug] of Object.entries(SLUGS)) {
  const icon = bySlug.get(slug);
  if (!icon) throw new Error(`simple-icons has no "${slug}"`);
  out[id] = flatten(icon.path)
    .map((l) => simplify(l.map(([x, y]) => [x * SCALE, y * SCALE]), TOLERANCE))
    .filter((l) => lengthOf(l) >= MIN_LENGTH)
    .map((l) => l.flatMap(([x, y]) => [Math.round(x * 10) / 10, Math.round(y * 10) / 10]));
}

const body = Object.entries(out)
  .map(([id, lines]) => `  ${JSON.stringify(id)}: [\n${lines.map((l) => `    [${l.join(",")}],`).join("\n")}\n  ],`)
  .join("\n");

writeFileSync(
  join(root, "src/lib/logo-official.generated.ts"),
  `// Generated by scripts/build-logo-data.mjs from simple-icons (CC0). Do not edit by hand.
// Each mark is a list of outlines as flat [x0, y0, x1, y1, ...] arrays in a 100×100 box.

export const OFFICIAL_MARKS: Record<string, number[][]> = {
${body}
};
`,
);

const points = Object.values(out).flat().reduce((s, l) => s + l.length / 2, 0);
console.log(`Wrote ${Object.keys(out).length} marks, ${points} points.`);
