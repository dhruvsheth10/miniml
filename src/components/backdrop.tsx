const GRAIN =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.5 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")";

// Splashes are placed in page pixels, so new ones drift into view as you scroll.
const SPLASHES = [
  "radial-gradient(620px 460px at 88% 120px, rgb(190 178 255 / 0.55), transparent 70%)",
  "radial-gradient(680px 520px at 6% 560px, rgb(150 205 255 / 0.45), transparent 70%)",
  "radial-gradient(720px 540px at 80% 1450px, rgb(140 230 205 / 0.5), transparent 70%)",
  "radial-gradient(600px 480px at 10% 2300px, rgb(200 185 255 / 0.42), transparent 70%)",
  "radial-gradient(660px 520px at 92% 3100px, rgb(150 205 255 / 0.42), transparent 70%)",
  "radial-gradient(640px 480px at 30% 3900px, rgb(140 230 205 / 0.45), transparent 70%)",
].join(", ");

export function Backdrop() {
  return (
    <div aria-hidden className="pointer-events-none">
      <div
        className="absolute inset-0 -z-10 overflow-hidden transition-opacity duration-300"
        style={{ backgroundImage: SPLASHES, opacity: "var(--splash-opacity)" }}
      />
      <div
        className="fixed inset-0 -z-10 opacity-[0.07] mix-blend-multiply"
        style={{ backgroundImage: GRAIN }}
      />
    </div>
  );
}
