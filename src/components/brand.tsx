import Image from "next/image";

import { HACK_CLUB_URL } from "@/lib/site";

export function ChipMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <rect x="8" y="8" width="16" height="16" rx="3" fill="none" stroke="currentColor" strokeWidth="2.2" />
      <path
        d="M13 3.5v3.5M19 3.5v3.5M13 25v3.5M19 25v3.5M3.5 13H7M3.5 19H7M25 13h3.5M25 19h3.5"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <circle cx="16" cy="16" r="2.6" fill="var(--hc-red)" />
    </svg>
  );
}

export function HackClubFlag() {
  return (
    <a
      href={HACK_CLUB_URL}
      target="_blank"
      rel="noreferrer"
      aria-label="Hack Club"
      className="absolute top-0 left-3 z-30 block origin-top-left transition-transform duration-300 ease-out hover:rotate-[-5deg] focus-visible:rotate-[-5deg] sm:left-6"
    >
      <Image
        src="/flag-orpheus-top.svg"
        alt="Hack Club"
        width={280}
        height={158}
        priority
        className="h-auto w-[104px] sm:w-[132px]"
      />
    </a>
  );
}
