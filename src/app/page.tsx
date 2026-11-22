import { ArrowRight } from "lucide-react";

import { Backdrop } from "@/components/backdrop";
import { ChipMark, HackClubFlag } from "@/components/brand";
import { Circuit } from "@/components/circuit";
import { LogoGuesser } from "@/components/logo-guesser";
import { PressButton } from "@/components/press-button";
import { FadeIn, GlassPane, RevealText } from "@/components/reveal";
import { ThemeToggle } from "@/components/theme-toggle";
import { HACK_CLUB_URL, RSVP_URL, SLACK_URL } from "@/lib/site";

const IDEAS = [
  { thing: "A wand that knows which spell you just flicked", tags: ["accelerometer", "gesture detection"] },
  { thing: "A small sensor that notifies you when the laundry machine is done", tags: ["vibration sensor", "anomaly detection"] },
  { thing: "A desk lamp that switches on when you sit down", tags: ["camera", "person detection"] },
  { thing: "A tiny camera that logs every model and brand of car that passes by your house", tags: ["objection classification"] },
];

const FAQ = [
  {
    q: "Can I start now?",
    a: "Not yet. MiniML is still in development. Join the waitlist and you'll be notified once it's ready for you to start shipping!",
  },
  {
    q: "Do I need to know machine learning?",
    a: "No. If you can write a bit of code and are passionate about hardware and ML, that's enough. The guides start for beginners.",
  },
  {
    q: "Who can join?",
    a: "Like every Hack Club YSWS, it's for teenagers 18 and under, anywhere in the world!",
  },
];

const SECTION_HEADING = "display text-[clamp(1.9rem,3.6vw,2.9rem)] leading-[1.05] font-semibold text-ink";

function JoinButton() {
  return (
    <PressButton href={RSVP_URL}>
      Join the waitlist
      <ArrowRight className="size-[18px] transition-transform duration-200 group-hover:translate-x-0.5" />
    </PressButton>
  );
}

function SlackButton() {
  return (
    <PressButton href={SLACK_URL} variant="quiet">
      <span className="font-mono text-hc-red">#</span>
      Join the Slack channel
    </PressButton>
  );
}

export default function Home() {
  return (
    <div className="relative flex-1 overflow-x-clip">
      <Backdrop />
      <Circuit />
      <HackClubFlag />

      <header className="absolute inset-x-0 top-0 z-20 mx-auto flex max-w-[1360px] items-center justify-end px-5 pt-6 sm:px-8 sm:pt-8 lg:px-20">
        <FadeIn delay={0.05} y={-6} className="flex items-center gap-4">
          <span className="font-bai text-[13px] tracking-[0.14em] text-ink-soft uppercase">Coming soon</span>
          <ThemeToggle />
        </FadeIn>
      </header>

      <main>
        <section className="mx-auto max-w-[1360px] px-4 pt-24 sm:px-8 sm:pt-[84px] lg:px-20">
          <div data-chip="core" className="lg:h-[calc(74svh-84px)] lg:min-h-[540px]">
            <GlassPane
              delay={0}
              className="flex h-full flex-col items-center justify-center rounded-[32px] px-6 py-16 text-center sm:px-12 sm:py-20"
            >
              <FadeIn delay={0.06} y={8} className="flex flex-col items-center">
                <div className="flex items-center gap-3 sm:gap-4">
                  <ChipMark className="size-10 text-ink sm:size-14" />
                  <span className="display text-[clamp(2.4rem,5vw,4rem)] leading-none font-bold text-ink">MiniML</span>
                </div>
                <span className="mt-3 font-mono text-[12px] tracking-wide text-ink-faint">a Hack Club YSWS</span>
              </FadeIn>

              <RevealText
                as="h1"
                text="Teach a tiny chip to see, think, and hear"
                delay={0.1}
                stagger={0.028}
                className="display mt-9 max-w-[16ch] text-[clamp(2.2rem,5.2vw,4.75rem)] leading-[0.98] font-semibold text-balance text-ink"
              />

              <RevealText
                as="p"
                text="Ever wanted to build a machine learning model that runs on something as small as an ESP32? With TinyML, you can. Ship one that runs on a $5–10 microcontroller, and we'll ship you the board, sensors, and other goodies."
                delay={0.3}
                stagger={0.008}
                className="mt-7 max-w-[38rem] text-[17px] leading-relaxed text-ink-soft sm:text-lg"
              />

              <FadeIn delay={0.42} className="mt-10 flex flex-wrap items-center justify-center gap-3">
                <JoinButton />
                <SlackButton />
              </FadeIn>
            </GlassPane>
          </div>
        </section>

        <section className="mx-auto mt-[10svh] max-w-6xl px-4 sm:px-8">
          <FadeIn trigger="view" y={24}>
            <LogoGuesser
              intro={
                <div className="px-1">
                  <RevealText
                    as="h2"
                    trigger="view"
                    stagger={0.04}
                    text="Small chips can have big brains"
                    className={SECTION_HEADING}
                  />
                  <p className="mt-5 max-w-md text-[17px] leading-relaxed text-ink-soft">
                    Sketch a logo on the whiteboard and a tiny model guesses it as you draw, right in your browser. MiniML is similar to tiny models like this but on a microcontroller, so the chip
                    can sense, decide, and act on its own.
                  </p>
                </div>
              }
            />
          </FadeIn>
        </section>

        <section className="mx-auto max-w-6xl px-4 pt-32 sm:px-8 lg:pt-40">
          <FadeIn trigger="view" y={20}>
            <div data-chip="node" className="glass grid overflow-hidden rounded-3xl md:grid-cols-2">
              <div className="p-8 sm:p-10">
                <p className="eyebrow">You ship</p>
                <p className="display mt-4 text-[clamp(1.5rem,2.6vw,2.1rem)] leading-[1.1] font-semibold text-ink">
                  A machine learning model running on a $5–10 microcontroller.
                </p>
                <p className="mt-4 text-[15px] leading-relaxed text-ink-soft">
                  Gesture detection, object classification, person detection, or something nobody has thought of yet.
                </p>
              </div>
              <div className="border-t border-border p-8 sm:p-10 md:border-t-0 md:border-l">
                <p className="eyebrow">We ship</p>
                <p className="display mt-4 text-[clamp(1.5rem,2.6vw,2.1rem)] leading-[1.1] font-semibold text-ink">
                  The board, the sensors, and other goodies.
                </p>
                <p className="mt-4 text-[15px] leading-relaxed text-ink-soft">
                  Everything you need to bring your model to life!
                </p>
              </div>
            </div>
          </FadeIn>
        </section>

        <section className="mx-auto max-w-6xl px-4 pt-24 sm:px-8 lg:pt-32">
          <div data-chip="node" className="glass grid gap-8 rounded-3xl p-8 sm:p-10 lg:grid-cols-[1.1fr_1fr] lg:gap-16 lg:p-12">
            <div>
              <RevealText
                as="h2"
                trigger="view"
                stagger={0.03}
                text="What is TinyML? It's a kind of machine learning that fits on a chip smaller than your fingernail."
                className={SECTION_HEADING}
              />
            </div>
            <FadeIn trigger="view" delay={0.15} className="text-[17px] leading-relaxed text-ink-soft lg:pt-2">
              <p>
                TinyML is an optimized, pretrained alternative to bulky models. It runs right on the microcontroller,
                with no internet, no cloud server, and makes decisions in milliseconds on a couple hundred KB of memory.
              </p>
            </FadeIn>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pt-24 sm:px-8 lg:pt-32">
          <div data-chip="node" className="glass rounded-3xl p-8 sm:p-10 lg:p-12">
            <h2 className={SECTION_HEADING}>Things you could build</h2>
            <ul className="mt-8 border-t border-border">
              {IDEAS.map((idea, i) => (
                <li key={idea.thing} className="border-b border-border last:border-b-0">
                  <FadeIn
                    trigger="view"
                    delay={i * 0.05}
                    y={8}
                    className="flex flex-col gap-1.5 py-5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-8"
                  >
                    <span className="text-[clamp(1.1rem,1.9vw,1.35rem)] font-medium tracking-tight text-ink">
                      {idea.thing}
                    </span>
                    <span className="flex shrink-0 flex-wrap gap-2">
                      {idea.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-md border border-border bg-card px-2 py-1 font-mono text-[11px] leading-none text-ink-soft"
                        >
                          {tag}
                        </span>
                      ))}
                    </span>
                  </FadeIn>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pt-24 sm:px-8 lg:pt-32">
          <div data-chip="node" className="glass grid gap-10 rounded-3xl p-8 sm:p-10 lg:grid-cols-[1fr_1.4fr] lg:gap-16 lg:p-12">
            <div>
              <RevealText as="h2" trigger="view" stagger={0.04} text="FAQs" className={SECTION_HEADING} />
            </div>
            <dl className="space-y-7">
              {FAQ.map((item, i) => (
                <FadeIn key={item.q} trigger="view" delay={i * 0.08}>
                  <dt className="text-lg font-medium text-ink">{item.q}</dt>
                  <dd className="mt-2 text-[16px] leading-relaxed text-ink-soft">{item.a}</dd>
                </FadeIn>
              ))}
            </dl>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pt-24 pb-16 sm:px-8 lg:pt-32">
          <FadeIn trigger="view" y={20}>
            <div
              data-chip="node"
              className="glass flex flex-col items-start gap-8 rounded-[28px] p-8 sm:p-12 lg:flex-row lg:items-end lg:justify-between lg:p-14"
            >
              <div>
                <h2 className="display max-w-xl text-[clamp(2rem,4.4vw,3.4rem)] leading-[1] font-bold text-ink">
                  Sign up on the waitlist now!
                </h2>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <JoinButton />
                <SlackButton />
              </div>
            </div>
          </FadeIn>
        </section>
      </main>

      <footer className="mx-auto flex max-w-6xl flex-col gap-3 px-5 pb-10 font-mono text-[11px] text-ink-faint sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <span className="flex items-center gap-2">
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
        </span>
      </footer>
    </div>
  );
}
