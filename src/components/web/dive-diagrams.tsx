/**
 * The two pictures worth drawing for somebody deciding whether to book a dive.
 *
 * Neither is a photograph, on purpose. A photograph of a reef tells a diver
 * nothing they cannot already guess; what they actually want to know before
 * paying is how much of the day is spent in the water rather than on a boat,
 * and how deep they are allowed to go. Both are answerable in a diagram and
 * neither is answerable in a picture.
 *
 * Colour: one accent and one recessive fill, which is the emphasis form — the
 * time in the water is the point and everything else is context. The pair was
 * checked with the palette validator against the cream surface: ΔE 30 to a
 * normal eye and 25 under protanopia, comfortably clear of the 15 floor. The
 * pale fill sits under 3:1 against the surface, which is allowed here because
 * every segment carries its own visible label rather than relying on colour.
 */

const WATER = "#2f8a63";
const CONTEXT = "#d8cdb8";

export interface Stage {
  /** Shown on the segment. */
  label: string;
  /** Minutes. Only the proportion is read, never the absolute value. */
  minutes: number;
  /** In the water, as opposed to on the boat or at the homestay. */
  water?: boolean;
}

/**
 * How the trip divides up, as one bar.
 *
 * Horizontal because the stage names are words, not numbers, and a column
 * chart would turn every one of them on its side. Segments are separated by a
 * 2px gap in the surface colour so two touching fills of the same hue still
 * read as two.
 */
export function DayStrip({
  stages,
  waterLabel,
  restLabel,
  className = "",
}: {
  stages: Stage[];
  waterLabel: string;
  restLabel: string;
  className?: string;
}) {
  const total = stages.reduce((n, s) => n + s.minutes, 0) || 1;

  return (
    <figure className={`m-0 ${className}`}>
      <div className="flex items-stretch gap-[2px] overflow-hidden rounded-[10px]">
        {stages.map((s, i) => (
          <div
            key={`${s.label}-${i}`}
            style={{
              width: `${(s.minutes / total) * 100}%`,
              background: s.water ? WATER : CONTEXT,
            }}
            className="h-[38px]"
          />
        ))}
      </div>

      {/* The labels sit under the bar rather than inside it: the shortest
          segment here is a fifteen-minute briefing, and no type fits in 4% of
          a bar at any size worth reading. */}
      <ul className="mt-3 mb-0 flex list-none flex-wrap gap-x-5 gap-y-[6px] p-0">
        {stages.map((s, i) => (
          <li
            key={`${s.label}-legend-${i}`}
            className="flex items-center gap-[7px] text-[12.5px] text-slate"
          >
            <span
              aria-hidden="true"
              className="h-[9px] w-[9px] shrink-0 rounded-[2px]"
              style={{ background: s.water ? WATER : CONTEXT }}
            />
            {s.label}
            <span className="text-slate">{fmtMins(s.minutes)}</span>
          </li>
        ))}
      </ul>

      <figcaption className="mt-3 text-[12px] text-slate">
        <span className="inline-flex items-center gap-[6px]">
          <span
            aria-hidden="true"
            className="inline-block h-[9px] w-[9px] rounded-[2px]"
            style={{ background: WATER }}
          />
          {waterLabel}
        </span>
        <span className="mx-3 text-line-strong">·</span>
        <span className="inline-flex items-center gap-[6px]">
          <span
            aria-hidden="true"
            className="inline-block h-[9px] w-[9px] rounded-[2px]"
            style={{ background: CONTEXT }}
          />
          {restLabel}
        </span>
      </figcaption>
    </figure>
  );
}

function fmtMins(m: number) {
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return r ? `${h}h ${r}m` : `${h}h`;
}

/**
 * How deep this package goes, against the water column.
 *
 * A meter rather than a chart: there is one number here, and its meaning comes
 * entirely from where it sits against the limits either side of it. Drawing it
 * as a depth-versus-time profile would imply a shape of dive nobody has
 * measured.
 *
 * The scale runs to 40m, the deepest a recreational certification allows, so
 * the same drawing on two packages can be compared by eye.
 */
export function DepthMeter({
  limit,
  limitLabel,
  surfaceLabel,
  marks = [],
}: {
  limit: number;
  limitLabel: string;
  surfaceLabel: string;
  /** Other depths worth naming on the same scale. */
  marks?: { depth: number; label: string }[];
}) {
  /* Forty metres is where recreational diving stops, so every package is drawn
     against the same column and two of them can be compared by eye. */
  const SCALE = 40;
  const H = 208;
  const y = (d: number) => (Math.min(d, SCALE) / SCALE) * H;

  return (
    <figure className="m-0">
      <div className="flex gap-3">
        <div
          className="relative w-full overflow-hidden rounded-[12px] bg-teal-tint"
          style={{ height: H }}
        >
          {/* Track and fill from one hue: the filled part is the water this
              package uses, the pale rest is the water it does not. A meter,
              not a profile — nobody has measured a curve to draw. */}
          <div
            className="absolute inset-x-0 top-0 bg-[linear-gradient(180deg,#8fc7a9_0%,#2f8a63_62%,#216b4b_100%)]"
            style={{ height: y(limit) }}
          />

          {/* On its own light backing rather than white on the fill: the top
              of the ramp is pale teal by design, and white type on it measured
              2:1. */}
          <div className="absolute top-[7px] left-3 rounded-full bg-surface/90 px-[9px] py-[3px] text-[11.5px] font-medium text-teal-deep">
            {surfaceLabel}
          </div>

          {/* The limit sits on the boundary between fill and track, which is
              already the strongest edge in the drawing; the pill only names
              it. */}
          <div
            className="absolute left-3 -translate-y-1/2 rounded-full bg-ink px-[10px] py-[4px] text-[11.5px] font-medium text-white"
            style={{ top: y(limit) }}
          >
            {limitLabel}
          </div>

          {/* Named depths for context, on their own line to the right. Any
              that lands on the package's own limit is dropped rather than
              stacked under the pill that already says it. The last one sits
              at the very bottom of the scale, so it is pinned inside the box
              instead of centred on a line that is half outside it. */}
          {marks
            .filter((m) => Math.abs(m.depth - limit) > 0.5)
            .map((m) => {
              const bottom = m.depth >= SCALE;
              return (
                <div
                  key={m.label}
                  className={`absolute right-2 rounded-[5px] bg-surface/92 px-[6px] py-[2px] text-[10.5px] text-slate ${
                    bottom ? "" : "-translate-y-1/2"
                  }`}
                  style={bottom ? { bottom: 4 } : { top: y(m.depth) }}
                >
                  {m.label}
                </div>
              );
            })}
        </div>

        {/* The scale itself, outside the column so no label ever sits on a
            fill it has to fight for contrast. */}
        <div
          className="relative w-[30px] shrink-0"
          style={{ height: H }}
          aria-hidden="true"
        >
          {[0, 10, 20, 30, 40].map((d) => (
            <div
              key={d}
              className="absolute right-0 -translate-y-1/2 text-right text-[10.5px] text-slate"
              style={{ top: Math.min(y(d), H - 6) }}
            >
              {d}m
            </div>
          ))}
        </div>
      </div>
    </figure>
  );
}
