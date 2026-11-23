import { ArrowRight } from "lucide-react";

import { BoardArt } from "@/components/board-art";
import { ChipMark, HackClubFlag } from "@/components/brand";
import { LogoGuesser } from "@/components/logo-guesser";
import { PressButton } from "@/components/press-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { HACK_CLUB_URL, RSVP_URL, SLACK_URL } from "@/lib/site";

const IDEAS = [
  { thing: "A wand that knows which spell you just flicked", tags: ["accelerometer", "gesture detection"] },
  { thing: "A sensor that pings you when the laundry is done", tags: ["vibration sensor", "anomaly detection"] },
  { thing: "A desk lamp that switches on when you sit down", tags: ["camera", "person detection"] },
  { thing: "A tiny camera that logs every car brand that drives past your house", tags: ["camera", "object classification"] },
];

const FAQ = [
  {
    q: "Can I start now?",
    a: "Not yet, the YSWS is still in development. Join the waitlist and you'll be notified once it's ready for you to start shipping!",
  },
  {
    q: "Do I need to know machine learning?",
    a: "No. If you can write a bit of code and are excited about hardware and ML, that's enough. The guides start from zero.",
  },
  {
    q: "Who can join?",
    a: "Like every Hack Club YSWS, it's for teenagers 18 and under, anywhere in the world!",
  },
];

const SECTION_HEADING = "display text-[clamp(1.9rem,3.4vw,2.75rem)] leading-[1.05] font-bold text-ink";

function Scribble() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 100 12"
      preserveAspectRatio="none"
      className="pointer-events-none absolute -bottom-[0.1em] left-[-2%] h-[0.26em] w-[104%]"
    >
      <path
        d="M2 8 C 18 3, 30 11, 48 6.5 S 80 3, 98 7.5"
        pathLength={1}
        fill="none"
        stroke="var(--hc-red)"
        strokeWidth="3.5"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
        className="scribble"
      />
    </svg>
  );
}

export default function Home() {
  return (
    <div className="relative flex-1 overflow-x-clip">
      <HackClubFlag />

      <header className="mx-auto flex max-w-6xl items-center justify-end gap-1 px-5 pt-5 sm:px-8">
        <a href="#faq" className="rounded-lg px-3 py-2 text-[15px] font-medium text-ink-soft hover:text-ink">
          FAQs
        </a>
        <a
          href={SLACK_URL}
          target="_blank"
          rel="noreferrer"
          className="rounded-lg px-3 py-2 text-[15px] font-medium text-ink-soft hover:text-ink"
        >
          Slack
        </a>
        <ThemeToggle />
      </header>

      <main>
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 pt-16 pb-20 sm:px-8 sm:pt-20 md:grid-cols-[1.3fr_0.7fr] lg:pt-24 lg:pb-28">
          <div className="rise-in">
            <div className="flex items-center gap-3.5">
              <ChipMark className="size-12 text-ink sm:size-16" />
              <div>
                <p className="display text-[clamp(2.4rem,4.4vw,3.4rem)] leading-none font-bold text-ink">MiniML</p>
                <p className="mt-1.5 text-[16px] text-ink-soft">a Hack Club YSWS</p>
              </div>
            </div>

            <h1 className="display mt-6 max-w-[14ch] text-[clamp(2.6rem,6vw,4.9rem)] leading-[0.98] font-bold text-ink">
              Teach a{" "}
              <span className="relative inline-block">
                tiny
                <Scribble />
              </span>{" "}
              chip to see, think, and hear
            </h1>

            <p className="mt-7 max-w-[34rem] text-[18px] leading-relaxed text-ink-soft">
              Ever wanted to build a machine learning model that runs on something as small as an ESP32? With TinyML,
              you can. Ship one that runs on a $5–10 microcontroller, and we&apos;ll ship you the board, sensors, and
              other goodies.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <PressButton href={RSVP_URL}>
                Join the waitlist
                <ArrowRight className="size-[18px] transition-transform duration-150 group-hover:translate-x-0.5" />
              </PressButton>
              <PressButton href={SLACK_URL} variant="quiet">
                <span className="font-mono text-hc-red">#</span>
                Join the Slack channel
              </PressButton>
            </div>
          </div>

          <div className="flex justify-center md:justify-end">
            <BoardArt className="w-[230px] rotate-[5deg] drop-shadow-[0_14px_18px_rgb(31_28_23/0.18)] md:w-[260px] lg:w-[320px]" />
          </div>
        </section>

        <section className="border-y border-line">
          <div className="mx-auto grid max-w-6xl md:grid-cols-2">
            <div className="px-5 py-10 sm:px-8 md:border-r md:border-line">
              <p className="text-[15px] font-bold text-hc-red">You ship</p>
              <p className="display mt-2 text-[clamp(1.35rem,2.2vw,1.75rem)] leading-[1.15] font-semibold text-ink">
                A machine learning model running on a $5–10 microcontroller.
              </p>
              <p className="mt-3 text-[16px] leading-relaxed text-ink-soft">
                Gesture detection, object classification, person detection, or something nobody has thought of yet.
              </p>
            </div>
            <div className="border-t border-line px-5 py-10 sm:px-8 md:border-t-0">
              <p className="text-[15px] font-bold text-hc-red">We ship</p>
              <p className="display mt-2 text-[clamp(1.35rem,2.2vw,1.75rem)] leading-[1.15] font-semibold text-ink">
                The board, the sensors, and other goodies.
              </p>
              <p className="mt-3 text-[16px] leading-relaxed text-ink-soft">
                Everything you need to bring your model to life!
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-24 sm:px-8 lg:py-32">
          <LogoGuesser
            intro={
              <div>
                <h2 className={SECTION_HEADING}>Small chips can have big brains</h2>
                <p className="mt-5 max-w-md text-[17px] leading-relaxed text-ink-soft">
                  Sketch a logo on the whiteboard and a tiny model guesses it as you draw, right in your browser.
                  MiniML is similar to tiny models like this but on a microcontroller, so the chip can sense, decide,
                  and act on its own.
                </p>
              </div>
            }
          />
        </section>

        <section className="mx-auto grid max-w-6xl gap-6 px-5 pb-24 sm:px-8 lg:grid-cols-[1fr_1.2fr] lg:gap-16 lg:pb-32">
          <h2 className={SECTION_HEADING}>What&apos;s TinyML?</h2>
          <div className="space-y-4 text-[17px] leading-relaxed text-ink-soft lg:pt-1.5">
            <p className="text-[19px] font-medium text-ink">
              Machine learning small enough to fit on a chip smaller than your fingernail.
            </p>
            <p>
              Instead of sending data off to a big model in the cloud, a TinyML model runs right on the
              microcontroller. No internet, no server, and it makes decisions in milliseconds on a couple hundred KB of
              memory.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 pb-24 sm:px-8 lg:pb-32">
          <h2 className={SECTION_HEADING}>Stuff you could build</h2>
          <ul className="mt-8 border-t border-line">
            {IDEAS.map((idea) => (
              <li
                key={idea.thing}
                className="flex flex-col gap-1.5 border-b border-line py-5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-8"
              >
                <span className="text-[clamp(1.1rem,1.8vw,1.3rem)] font-medium text-ink">{idea.thing}</span>
                <span className="flex shrink-0 flex-wrap gap-2">
                  {idea.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-md border border-line bg-card px-2 py-1 font-mono text-[11px] leading-none text-ink-soft"
                    >
                      {tag}
                    </span>
                  ))}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section id="faq" className="mx-auto grid max-w-6xl scroll-mt-8 gap-8 px-5 pb-24 sm:px-8 lg:grid-cols-[1fr_1.2fr] lg:gap-16 lg:pb-32">
          <h2 className={SECTION_HEADING}>FAQs</h2>
          <dl className="space-y-7">
            {FAQ.map((item) => (
              <div key={item.q}>
                <dt className="text-[18px] font-semibold text-ink">{item.q}</dt>
                <dd className="mt-1.5 text-[16px] leading-relaxed text-ink-soft">{item.a}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="mx-auto max-w-6xl px-5 pb-16 sm:px-8">
          <div className="flex flex-col items-start gap-8 rounded-2xl bg-(--red-solid) p-8 text-white sm:p-12 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="display max-w-xl text-[clamp(2rem,4.2vw,3.2rem)] leading-[1] font-bold">
                Get on the waitlist
              </h2>
              <p className="mt-4 max-w-md text-[17px] leading-relaxed text-white/85">
                We&apos;ll tell you the second MiniML opens. Bring an idea, or steal one from above.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-5">
              <PressButton href={RSVP_URL} variant="light">
                Join the waitlist
                <ArrowRight className="size-[18px] transition-transform duration-150 group-hover:translate-x-0.5" />
              </PressButton>
              <a
                href={SLACK_URL}
                target="_blank"
                rel="noreferrer"
                className="text-[16px] font-semibold underline decoration-white/40 underline-offset-4 hover:decoration-white"
              >
                or say hi on Slack
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="mx-auto flex max-w-6xl items-center gap-2 px-5 pb-10 text-[14px] text-ink-faint sm:px-8">
        <ChipMark className="size-4 text-ink-soft" />
        MiniML, a{" "}
        <a
          href={HACK_CLUB_URL}
          target="_blank"
          rel="noreferrer"
          className="text-ink-soft underline decoration-ink/20 underline-offset-4 hover:text-hc-red"
        >
          Hack Club
        </a>{" "}
        program
      </footer>
    </div>
  );
}
