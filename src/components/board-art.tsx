const PINS = Array.from({ length: 15 }, (_, i) => 52 + i * 17);
const GOLD = "#d4a94c";
const METAL = "#c9cdd3";

/** An ESP32 dev board, the kind of $5 chip MiniML projects run on. */
export function BoardArt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 240 350" className={className} role="img" aria-label="Drawing of an ESP32 development board">
      <rect x="20" y="20" width="200" height="300" rx="10" fill="#22314d" stroke="#16213a" strokeWidth="2" />

      {[
        [34, 34],
        [206, 34],
        [34, 306],
        [206, 306],
      ].map(([cx, cy]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="6" fill="var(--paper)" stroke={GOLD} strokeWidth="2.5" />
      ))}

      {PINS.map((y) => (
        <g key={y}>
          <rect x="29.5" y={y} width="9" height="9" rx="1" fill={GOLD} />
          <circle cx="34" cy={y + 4.5} r="2.2" fill="#15161a" />
          <rect x="201.5" y={y} width="9" height="9" rx="1" fill={GOLD} />
          <circle cx="206" cy={y + 4.5} r="2.2" fill="#15161a" />
        </g>
      ))}

      <rect x="58" y="26" width="124" height="160" rx="4" fill="#141414" />
      <path
        d="M70 58 V36 H86 V54 H100 V36 H114 V54 H128 V36 H142 V54 H156 V36 H170 V58"
        fill="none"
        stroke={GOLD}
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <rect x="66" y="70" width="108" height="108" rx="3" fill={METAL} stroke="#a8adb5" strokeWidth="1.5" />
      <text x="120" y="128" textAnchor="middle" fontFamily="var(--font-plex-mono)" fontSize="13" fontWeight="500" fill="#5f6570">
        ESP32
      </text>

      <rect x="96" y="222" width="38" height="38" rx="2" fill="#141414" />
      {[0, 1, 2, 3, 4].map((i) => (
        <g key={i} stroke="#9aa0a8" strokeWidth="1.5">
          <path d={`M${101 + i * 7} 218 v4 M${101 + i * 7} 260 v4`} />
          <path d={`M92 ${227 + i * 7} h4 M134 ${227 + i * 7} h4`} />
        </g>
      ))}

      <rect x="152" y="236" width="12" height="7" rx="1.5" fill="#ff5468" />
      <circle className="led" cx="158" cy="239.5" r="11" fill="#ff5468" opacity="0.35" />
      <text x="158" y="257" textAnchor="middle" fontFamily="var(--font-plex-mono)" fontSize="6.5" fill="#ffffff" opacity="0.6">
        LED
      </text>

      {[56, 158].map((x) => (
        <g key={x}>
          <rect x={x} y="276" width="26" height="20" rx="2" fill={METAL} />
          <circle cx={x + 13} cy="286" r="5.5" fill="#2a2a2a" />
        </g>
      ))}

      <rect x="94" y="296" width="52" height="34" rx="3" fill={METAL} stroke="#a8adb5" strokeWidth="1.5" />
      <rect x="104" y="318" width="32" height="6" rx="2" fill="#7a808a" />
    </svg>
  );
}
