/**
 * Moving water behind the three season cards, one sea per season.
 *
 * The cards already say what each season is; this makes the difference
 * legible before the words are. Calm months get a long, almost flat swell and
 * a manta that takes most of a minute to cross. The mixed months get a shorter
 * swell and a cloud going over. The windy months get a real one, fast and
 * tall, with whitecaps and gusts streaking off the top. Read left to right, the
 * three cards get rougher, which is the whole point of the section.
 *
 * Three constraints shaped it:
 *
 * Legibility first. The card's text sits on top, so the water is a wash rather
 * than a picture: pale fills, and the busiest part kept low in the card where
 * the paragraph has already ended. Every run of text was measured against it
 * afterwards.
 *
 * Cheap. Only transform and opacity are animated, so nothing here causes
 * layout or paint. Six layers times three cards is affordable on a phone only
 * under that rule.
 *
 * Optional. `prefers-reduced-motion` stops all of it. The wave shapes stay,
 * because a still sea is still a sea; what goes is the movement, which is the
 * part that makes people ill.
 */

export type SeasonKey = "calm" | "mixed" | "windy";

/**
 * The boat, one per card, moving the way that season's water moves.
 *
 * This is the part of the section a reader understands without reading it:
 * in October the boat glides, in the shoulder months it works, and from May
 * to July it leaves the water and lands hard. The copy says the swell is
 * bigger and the further sites are sometimes called off; the boat says the
 * same thing before anyone gets to the sentence.
 *
 * `boat` names the keyframes, `beat` its period. Nothing else changes between
 * the three, which is the point: same boat, different sea.
 */
const BOAT: Record<SeasonKey, { boat: string; beat: number; spray: boolean }> = {
  calm: { boat: "boatGlide", beat: 6.5, spray: false },
  mixed: { boat: "boatChop", beat: 2.9, spray: false },
  windy: { boat: "boatLeap", beat: 1.7, spray: true },
};

/**
 * A speedboat, bow to the right, about seventy pixels across.
 *
 * Small on purpose. At any larger size it stops being weather on a card and
 * starts being a mascot, and the card's subject is the month, not the boat.
 */
function SpeedBoat() {
  return (
    <svg viewBox="0 0 120 56" className="h-auto w-full">
      {/* Hull, transom at the left and the bow running out to the right. */}
      <path d="M10 30h78l26 -5 -12 21H22Z" fill="#ffffff" />
      <path d="M10 30h78l26 -5 -3 5H14Z" fill="#c5e1d1" />
      <path d="M22 46h80l-4 5H26Z" fill="#216b4b" opacity=".55" />
      {/* Windscreen and canopy. */}
      <path d="M40 30V19h26l12 11Z" fill="#2f8a63" />
      <path d="M46 28v-6h16l6 6Z" fill="#eaf5ef" opacity=".85" />
      {/* Outboard at the stern. */}
      <rect x="2" y="22" width="10" height="15" rx="3" fill="#4a4238" />
      <rect x="5" y="35" width="4" height="10" rx="2" fill="#4a4238" />
    </svg>
  );
}

/** One period of a sine-ish wave, tiled across four periods. */
function wave(amp: number, mid: number, period = 100) {
  let d = `M0 ${mid}`;
  for (let i = 0; i < 4; i += 1) {
    const x = i * period;
    d += ` C ${x + period * 0.25} ${mid - amp}, ${x + period * 0.75} ${mid + amp}, ${x + period} ${mid}`;
  }
  return `${d} L 400 100 L 0 100 Z`;
}

interface Layer {
  amp: number;
  mid: number;
  fill: string;
  opacity: number;
  /** Seconds for one full tile. Lower is rougher. */
  drift: number;
}

const SEA: Record<SeasonKey, { layers: Layer[]; swell: number }> = {
  /* Glassy. The far layer barely moves at all. */
  calm: {
    swell: 11,
    layers: [
      { amp: 3, mid: 52, fill: "#2f8a63", opacity: 0.1, drift: 52 },
      { amp: 4, mid: 64, fill: "#2f8a63", opacity: 0.13, drift: 38 },
      { amp: 3, mid: 78, fill: "#216b4b", opacity: 0.14, drift: 27 },
    ],
  },
  /* Working weather: shorter period, more of it. */
  mixed: {
    swell: 7,
    layers: [
      { amp: 6, mid: 50, fill: "#b5842a", opacity: 0.1, drift: 30 },
      { amp: 8, mid: 63, fill: "#b5842a", opacity: 0.12, drift: 21 },
      { amp: 6, mid: 78, fill: "#8a6524", opacity: 0.13, drift: 15 },
    ],
  },
  /* Southeast wind. Tall, fast, and the top layer is nearly a whitecap. */
  windy: {
    swell: 4,
    layers: [
      { amp: 11, mid: 46, fill: "#6b6357", opacity: 0.1, drift: 15 },
      { amp: 14, mid: 60, fill: "#6b6357", opacity: 0.12, drift: 10 },
      { amp: 11, mid: 76, fill: "#4a4238", opacity: 0.13, drift: 6.5 },
    ],
  },
};

export function SeasonScene({ season }: { season: SeasonKey }) {
  const { layers, swell } = SEA[season];
  const b = BOAT[season];

  return (
    <div
      aria-hidden="true"
      /* The stylesheet's reduced-motion rule hangs off this attribute. It has
         to be a rule rather than a class because the durations are inline. */
      data-sea={season}
      className="pointer-events-none absolute inset-0 overflow-hidden rounded-[20px]"
    >
      {/* Each wave is its own 200%-wide svg sliding half its width. Stacking
          them at different speeds is what stops the sea reading as one sheet
          of moving wallpaper. */}
      {layers.map((l, i) => (
        <div
          key={i}
          className="absolute inset-x-0 bottom-0 h-[62%]"
          style={{
            animation: `seaSwell ${swell + i * 2}s ease-in-out ${i * 0.6}s infinite`,
          }}
        >
          <svg
            viewBox="0 0 400 100"
            preserveAspectRatio="none"
            className="absolute bottom-0 left-0 h-full w-[200%]"
            style={{ animation: `seaDrift ${l.drift}s linear infinite` }}
          >
            <path d={wave(l.amp, l.mid)} fill={l.fill} opacity={l.opacity} />
          </svg>
        </div>
      ))}

      {season === "calm" && (
        <>
          {/* Sun on flat water, and the manta the season is known for. Both
              sit down in the water band: run higher, a horizontal streak
              behind a heading reads as a strikethrough rather than as light. */}
          {[
            { top: 79, w: 22, right: 12 },
            { top: 87, w: 30, right: 22 },
            { top: 93, w: 16, right: 9 },
          ].map((g, i) => (
            <div
              key={g.top}
              className="absolute h-[2px] rounded-full bg-teal"
              style={{
                top: `${g.top}%`,
                right: `${g.right}%`,
                width: `${g.w}%`,
                animation: `seaGlint ${7 + i * 2}s ease-in-out ${i * 1.4}s infinite`,
              }}
            />
          ))}
          {/* Fifty seconds to cross, which is roughly how long it feels. */}
          <div
            className="absolute bottom-[3%] w-[20%]"
            style={{ animation: "seaCross 50s linear infinite" }}
          >
            <svg viewBox="0 0 100 42" className="h-auto w-full">
              <path
                d="M50 4c9 0 16 6 24 14 6 6 14 9 22 10-8 3-16 2-23 6-8 4-14 8-23 8s-15-4-23-8c-7-4-15-3-23-6 8-1 16-4 22-10C34 10 41 4 50 4Z"
                fill="#216b4b"
                opacity="0.22"
              />
            </svg>
          </div>
        </>
      )}

      {season === "mixed" && (
        /* A shower going over. Mixed weather is exactly that: it passes, and
           then the boat goes out anyway. Kept in the water band with the
           rest. */
        <div
          className="absolute top-[76%] bottom-0 w-[34%]"
          style={{ animation: "seaCross 26s linear infinite" }}
        >
          {[8, 26, 44, 62, 80].map((left, i) => (
            <span
              key={left}
              className="absolute h-[36%] w-[2px] rounded-full bg-amber-ink opacity-[.16]"
              style={{ left: `${left}%`, top: `${i % 2 ? 12 : 0}%` }}
            />
          ))}
        </div>
      )}

      {/* Offset in pixels, not per cent. The card's water band is a fixed
          64px of bottom padding, so a percentage of a card whose height varies
          with its paragraph does not stay inside it: on a phone the leap took
          the boat 22px up into the text. One value at both sizes, measured
          across 45 frames on each, so the clearance does not depend on how
          long the copy happens to be. */}
      <div
        className="absolute right-[9%] bottom-[8px] w-[62px] sm:w-[72px]"
        style={{ animation: `${b.boat} ${b.beat}s ease-in-out infinite` }}
      >
        <SpeedBoat />
      </div>

      {/* Spray, only where there is something to land on, and timed to the two
          landings in the leap rather than running on its own clock. */}
      {b.spray &&
        [
          { left: 4, size: 7, delay: 0 },
          { left: 16, size: 5, delay: 0.08 },
          { left: 26, size: 6, delay: 0.04 },
        ].map((s) => (
          <span
            key={s.left}
            className="absolute bottom-[6px] rounded-full bg-surface"
            style={{
              right: `${9 + s.left}%`,
              width: s.size,
              height: s.size,
              animation: `boatSpray ${b.beat}s ease-out ${s.delay}s infinite`,
            }}
          />
        ))}

      {season === "windy" && (
        <>
          {/* Gusts skimming the water, at the speed wind actually reads:
              six seconds to cross against the manta's fifty. */}
          {[78, 85, 91].map((top, i) => (
            <div
              key={top}
              className="absolute w-[28%]"
              style={{
                top: `${top}%`,
                animation: `seaCross ${5.5 + i * 1.6}s linear ${i * 0.9}s infinite`,
              }}
            >
              <div className="h-[2px] w-full rounded-full bg-ink opacity-[.13]" />
            </div>
          ))}
          {/* Whitecaps, riding the fastest wave layer. */}
          <div
            className="absolute inset-x-0 bottom-[13%] h-[3px]"
            style={{ animation: "seaDrift 6.5s linear infinite" }}
          >
            <div className="flex w-[200%] gap-[7%]">
              {Array.from({ length: 14 }).map((_, i) => (
                <span
                  key={i}
                  className="h-[3px] w-[4%] shrink-0 rounded-full bg-surface opacity-80"
                />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
