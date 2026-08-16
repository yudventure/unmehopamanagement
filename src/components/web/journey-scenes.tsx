/**
 * One illustration per step of the journey, each deliberately hanging over the
 * edge of its card.
 *
 * The overhang is the whole idea: a plane's nose past the corner, a ferry's bow
 * out over the gutter, a park pass tipped off the top, a longboat nosing in
 * from the side. It only works if three things are true, and all three are
 * easy to break later:
 *
 *   1. The card must not clip. No `overflow-hidden` on the `li`.
 *   2. The card must stack above its neighbour, or the overhang slides under
 *      the next card instead of over it.
 *   3. The grid needs room in the gutter for something to hang into, and the
 *      section carries `overflow-x-clip` as a backstop: below the `sm`
 *      breakpoint a card sits against the section's own 20px padding, and an
 *      overhang wider than that pushes the whole page sideways. Measured at
 *      12px before the offsets below were brought in.
 *
 * Everything moves by transform and opacity alone, and `data-move` puts the
 * whole set under the reduced-motion rule in globals.css. What is left then is
 * a still plane, a still boat: the drawing survives, only the motion goes.
 */

const TEAL = "#2f8a63";
const DEEP = "#216b4b";
const GOLD = "#d9a94e";
const SAND = "#e7dbc9";
const INK = "#4a4238";

export type StepKey = "fly" | "ferry" | "fee" | "collect";

/** In the order the copy lists the four steps. */
export const STEP_SCENES: StepKey[] = ["fly", "ferry", "fee", "collect"];

export function JourneyScene({ step }: { step: StepKey }) {
  if (step === "fly") return <Fly />;
  if (step === "ferry") return <Ferry />;
  if (step === "fee") return <Fee />;
  return <Collect />;
}

/* 01 — the plane leaves the card by its top right corner. */
function Fly() {
  return (
    <div
      aria-hidden="true"
      data-move
      className="pointer-events-none absolute -top-6 -right-4 w-[104px] sm:-top-8 sm:-right-8 sm:w-[132px]"
    >
      {/* The contrail runs back into the card, so the plane reads as having
          come from inside it rather than as a sticker on the corner. */}
      <div className="absolute top-[52%] right-[62%] flex w-[86px] flex-col gap-[5px]">
        {[0, 0.7, 1.4].map((d) => (
          <span
            key={d}
            className="h-[2px] w-full rounded-full bg-slate-ghost"
            style={{ animation: `trail 2.6s ease-out ${d}s infinite` }}
          />
        ))}
      </div>

      <svg
        viewBox="0 0 120 90"
        className="relative h-auto w-full drop-shadow-[0_8px_14px_rgba(36,31,24,.14)]"
        style={{ animation: "bob 5.5s ease-in-out infinite" }}
      >
        <g transform="rotate(-18 60 45)">
          <path d="M18 46h74l16-6-9 14 9 14-16-6H18Z" fill={TEAL} />
          <path d="M52 46 74 16h11L70 46Z" fill={DEEP} />
          <path d="M52 48 74 78h11L70 48Z" fill={DEEP} />
          <circle cx="96" cy="46" r="3.5" fill="#ffffff" opacity=".9" />
          <rect x="28" y="42" width="10" height="3" rx="1.5" fill="#ffffff" opacity=".55" />
        </g>
      </svg>
    </div>
  );
}

/* 02 — the ferry's bow crosses the card's right edge. */
function Ferry() {
  return (
    <div
      aria-hidden="true"
      data-move
      className="pointer-events-none absolute -right-4 bottom-3 w-[118px] sm:-right-10 sm:w-[150px]"
    >
      {/* Wake, trailing back into the card. */}
      <div className="absolute bottom-[16%] right-[58%] flex w-[92px] flex-col gap-[6px]">
        {[0, 0.8, 1.6].map((d) => (
          <span
            key={d}
            className="h-[2px] w-full rounded-full bg-teal-line"
            style={{ animation: `trail 3s ease-out ${d}s infinite` }}
          />
        ))}
      </div>

      <svg
        viewBox="0 0 140 78"
        className="relative h-auto w-full drop-shadow-[0_8px_14px_rgba(36,31,24,.12)]"
        style={{ animation: "rock 4.2s ease-in-out infinite" }}
      >
        {/* Hull: flat stern at the left, bow running out to the right. */}
        <path d="M14 44h96l24 10-20 16H26Z" fill={TEAL} />
        <path d="M22 44V26h58l14 18Z" fill="#ffffff" opacity=".92" />
        <rect x="30" y="30" width="9" height="8" rx="2" fill={DEEP} opacity=".55" />
        <rect x="45" y="30" width="9" height="8" rx="2" fill={DEEP} opacity=".55" />
        <rect x="60" y="30" width="9" height="8" rx="2" fill={DEEP} opacity=".55" />
        <rect x="66" y="12" width="7" height="16" rx="2" fill={GOLD} />
      </svg>
    </div>
  );
}

/* 03 — the park pass tips out over the top edge. */
function Fee() {
  return (
    <div
      aria-hidden="true"
      data-move
      className="pointer-events-none absolute -top-8 right-4 w-[104px] sm:-top-9 sm:w-[118px]"
    >
      <svg
        viewBox="0 0 110 74"
        className="h-auto w-full drop-shadow-[0_10px_16px_rgba(36,31,24,.16)]"
        style={{ animation: "tilt 6s ease-in-out infinite" }}
      >
        <rect x="2" y="2" width="106" height="70" rx="10" fill={GOLD} />
        <rect x="2" y="2" width="106" height="19" rx="10" fill={DEEP} />
        <rect x="2" y="14" width="106" height="7" fill={DEEP} />
        {/* A turtle on the pass, because that is what the fee pays for. */}
        <ellipse cx="30" cy="46" rx="13" ry="10" fill={DEEP} opacity=".9" />
        <circle cx="44" cy="43" r="4" fill={DEEP} opacity=".9" />
        <path d="M20 39l-7-4M20 53l-7 5M40 38l6-6M40 54l6 5" stroke={DEEP} strokeWidth="3" strokeLinecap="round" opacity=".9" />
        <rect x="54" y="38" width="44" height="4" rx="2" fill="#ffffff" opacity=".75" />
        <rect x="54" y="47" width="32" height="4" rx="2" fill="#ffffff" opacity=".6" />
        <rect x="54" y="56" width="38" height="4" rx="2" fill="#ffffff" opacity=".45" />
      </svg>
    </div>
  );
}

/* 04 — the homestay's own boat noses in over the bottom left corner. */
function Collect() {
  return (
    <div
      aria-hidden="true"
      data-move
      className="pointer-events-none absolute -bottom-5 -left-4 w-[116px] sm:-bottom-7 sm:-left-9 sm:w-[146px]"
    >
      {/* Rings, as if it had just pulled up. */}
      {[0, 1.6].map((d) => (
        <span
          key={d}
          className="absolute bottom-[14%] left-[52%] h-[26px] w-[76px] rounded-[50%] border-2 border-teal-line"
          style={{ animation: `ripple 3.2s ease-out ${d}s infinite` }}
        />
      ))}

      <svg
        viewBox="0 0 150 86"
        className="relative h-auto w-full drop-shadow-[0_8px_14px_rgba(36,31,24,.12)]"
        style={{ animation: "rock 5s ease-in-out infinite" }}
      >
        {/* Longboat: outrigger, thatch canopy, a person at the tiller. */}
        <path d="M10 60h122l-16 18H26Z" fill={GOLD} />
        <path d="M10 60h122l6-8H16Z" fill={SAND} />
        <path d="M40 52V38h56v14Z" fill={TEAL} opacity=".25" />
        <path d="M34 38h68l-8-10H42Z" fill={DEEP} />
        <circle cx="112" cy="46" r="6" fill={INK} />
        <path d="M112 52v8" stroke={INK} strokeWidth="3" strokeLinecap="round" />
        {/* Outrigger float, out to the near side. */}
        <path d="M22 74h64" stroke={INK} strokeWidth="2.5" strokeLinecap="round" opacity=".5" />
        <path d="M34 62v12M74 62v12" stroke={INK} strokeWidth="2.5" strokeLinecap="round" opacity=".5" />
      </svg>
    </div>
  );
}
