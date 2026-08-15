/**
 * The flat-vector kit both the app and the public site draw their Raja Ampat
 * scenes from: limestone islets, reef life, palms, boats, people.
 *
 * Extracted from the login panel so the website can compose new arrangements
 * without a second copy of the same paths. Everything is inline SVG rather
 * than an asset — no file in `public/`, sharp at any size, no extra request,
 * and nothing to go missing on a deploy.
 *
 * The ramp is stepped light to dark so depth reads as distance: far islets
 * pale, foreground saturated. Scenes that want a different mood (dusk,
 * underwater) pass their own fills rather than editing these.
 */

export const SKY_TOP = "#F3FAF7";
export const SKY_LOW = "#DDEFE8";
export const SUN = "#F8DFA0";
export const SUN_GLOW = "#FBEBC6";
export const CLOUD = "#FFFFFF";

export const KARST_FAR = "#C6E4DA";
export const KARST_MID = "#A2D3C5";
export const KARST_NEAR = "#6FBBA8";
export const KARST_BASE = "#3C9B86";
export const VEG = "#2E8B77";
export const VEG_DEEP = "#1E7A66";

export const SEA_TOP = "#B9E2D8";
export const SEA_LOW = "#8FCFC0";
export const SEA_LAGOON = "#D2EDE6";
export const SEA_DEEP = "#6FBCAC";

export const WOOD = "#EFE0BF";
export const WOOD_DARK = "#D3BC91";
export const THATCH = "#E8C46E";
export const WALL = "#FFFFFF";
export const ROOF = "#0E7C6B";
export const INK = "#0B5F52";
export const AMBER = "#F6C445";

/**
 * Limestone islet in the Piaynemo profile: a crown that bulges wider than the
 * waterline, pinched at the base where the sea has undercut the rock. The
 * pinch is the whole character of these islands — without it they read as
 * ordinary green hills.
 */
export function Karst({
  x,
  w,
  h,
  fill,
  canopy,
  base,
}: {
  x: number;
  w: number;
  h: number;
  fill: string;
  canopy?: string;
  base: number;
}) {
  const bw = w * 0.72;
  const shoulder = base - h * 0.52;

  /* Scalloped crown: jungle canopy breaking the silhouette. Tufts ride the
     same ellipse the path's crown curve approximates, so they hug the edge. */
  const tufts: { cx: number; cy: number }[] = [];
  if (canopy) {
    const rx = w * 0.44;
    const ry = h * 0.48;
    const n = Math.max(5, Math.round(w / 20));
    for (let i = 0; i <= n; i += 1) {
      const t = Math.PI - (Math.PI * i) / n;
      tufts.push({ cx: x + rx * Math.cos(t), cy: shoulder - ry * Math.sin(t) });
    }
  }

  return (
    <g>
      <path
        fill={fill}
        d={`M ${x - bw / 2} ${base}
            C ${x - w * 0.52} ${base - h * 0.1} ${x - w * 0.5} ${base - h * 0.3} ${x - w * 0.44} ${shoulder}
            C ${x - w * 0.36} ${base - h * 0.8} ${x - w * 0.18} ${base - h} ${x} ${base - h}
            C ${x + w * 0.18} ${base - h} ${x + w * 0.36} ${base - h * 0.8} ${x + w * 0.44} ${shoulder}
            C ${x + w * 0.5} ${base - h * 0.3} ${x + w * 0.52} ${base - h * 0.1} ${x + bw / 2} ${base}
            Z`}
      />
      {canopy &&
        tufts.map((t, i) => (
          <circle key={i} cx={t.cx} cy={t.cy} r={w * 0.055} fill={canopy} />
        ))}
    </g>
  );
}

/** Manta seen from above, wings spread — the animal Raja Ampat is known for. */
export function Manta({
  x,
  y,
  s,
  fill,
}: {
  x: number;
  y: number;
  s: number;
  fill: string;
}) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} fill={fill}>
      <path
        d="M 0 -16 C 20 -20 48 -10 72 8 C 50 6 28 12 12 26 C 7 33 -7 33 -12 26
           C -28 12 -50 6 -72 8 C -48 -10 -20 -20 0 -16 Z"
      />
      <path d="M -13 -15 C -17 -23 -13 -28 -8 -26 C -11 -22 -11 -18 -10 -15 Z" />
      <path d="M 13 -15 C 17 -23 13 -28 8 -26 C 11 -22 11 -18 10 -15 Z" />
      <path d="M -2.6 28 C -2 42 -1.6 54 -1.2 64 L 1.2 64 C 1.6 54 2 42 2.6 28 Z" />
    </g>
  );
}

export function Fish({
  x,
  y,
  s,
  fill,
  flip = false,
}: {
  x: number;
  y: number;
  s: number;
  fill: string;
  flip?: boolean;
}) {
  return (
    <g
      transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`}
      fill={fill}
    >
      <path d="M 0 0 C 6 -7 18 -7 26 0 C 18 7 6 7 0 0 Z" />
      <path d="M 0.5 0 L -8 -6 L -8 6 Z" />
    </g>
  );
}

export function Palm({
  x,
  y,
  s,
  fill,
}: {
  x: number;
  y: number;
  s: number;
  fill: string;
}) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} fill={fill}>
      <path d="M -2.2 0 C -3.4 -13 -3.2 -24 -5.6 -35 L 0.6 -35 C -0.6 -24 0.4 -13 2.2 0 Z" />
      <path d="M -5 -35 C -19 -41 -28 -35 -33 -28 C -22 -33 -13 -33 -4 -31 Z" />
      <path d="M 5 -35 C 19 -41 28 -35 33 -28 C 22 -33 13 -33 4 -31 Z" />
      <path d="M -4.4 -37 C -15 -49 -9 -58 -2.4 -63 C -6.6 -54 -4.4 -45 -1.2 -39 Z" />
      <path d="M 4.4 -37 C 15 -49 9 -58 2.4 -63 C 6.6 -54 4.4 -45 1.2 -39 Z" />
      <path d="M -6 -34 C -21 -30 -28 -23 -30 -16 C -21 -24 -12 -28 -5 -30 Z" />
      <path d="M 6 -34 C 21 -30 28 -23 30 -16 C 21 -24 12 -28 5 -30 Z" />
    </g>
  );
}

export function Bird({
  x,
  y,
  s,
  stroke,
}: {
  x: number;
  y: number;
  s: number;
  stroke: string;
}) {
  return (
    <path
      d="M -7 0 C -4 -5 -1.6 -5 0 -1.4 C 1.6 -5 4 -5 7 0"
      transform={`translate(${x} ${y}) scale(${s})`}
      fill="none"
      stroke={stroke}
      strokeWidth={1.8}
      strokeLinecap="round"
    />
  );
}

/** Head, torso and legs at a scale where anything more would turn to mush. */
export function Person({
  x,
  y,
  s,
  shirt,
  skin = INK,
}: {
  x: number;
  y: number;
  s: number;
  shirt: string;
  skin?: string;
}) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <circle cx={0} cy={-21} r={3.6} fill={skin} />
      <path
        d="M -4 -17 C -4 -11 -4.4 -6 -4 -2 L 4 -2 C 4.4 -6 4 -11 4 -17 Z"
        fill={shirt}
      />
      <path
        d="M -3.4 -2 L -3.4 6 M 3.4 -2 L 3.4 6"
        stroke={skin}
        strokeWidth={2.2}
        strokeLinecap="round"
      />
    </g>
  );
}

export function Boat({
  x,
  y,
  s,
  flip = false,
  hull = WALL,
  stroke = KARST_BASE,
  deck = AMBER,
  roof = ROOF,
}: {
  x: number;
  y: number;
  s: number;
  flip?: boolean;
  hull?: string;
  stroke?: string;
  deck?: string;
  roof?: string;
}) {
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`}>
      <path d="M -30 0 C -26 9 -20 13 0 13 C 20 13 26 9 30 0 Z" fill={hull} />
      <path
        d="M -30 0 C -26 9 -20 13 0 13 C 20 13 26 9 30 0 Z"
        fill="none"
        stroke={stroke}
        strokeWidth={1.6}
      />
      <rect x={-30} y={-3} width={60} height={4} rx={2} fill={deck} />
      <path d="M 22 -3 L 30 -3 L 27 -12 L 21 -12 Z" fill={roof} />
    </g>
  );
}

/** Branching soft coral — a fan of arms off one stem. */
export function Coral({
  x,
  y,
  s,
  fill,
}: {
  x: number;
  y: number;
  s: number;
  fill: string;
}) {
  return (
    <g
      transform={`translate(${x} ${y}) scale(${s})`}
      stroke={fill}
      strokeWidth={4}
      strokeLinecap="round"
      fill="none"
    >
      <path d="M 0 0 L 0 -16" />
      <path d="M 0 -12 C -6 -18 -10 -24 -10 -32" />
      <path d="M 0 -12 C 6 -18 10 -24 10 -32" />
      <path d="M 0 -16 C -3 -24 -3 -32 -2 -40" />
      <path d="M 0 -16 C 4 -24 5 -32 5 -42" />
      <path d="M -8 -26 C -13 -30 -16 -34 -17 -40" />
      <path d="M 9 -26 C 14 -30 17 -34 18 -40" />
    </g>
  );
}

/** Boulder colony, drawn as stacked lobes. */
export function CoralHead({
  x,
  y,
  s,
  fill,
}: {
  x: number;
  y: number;
  s: number;
  fill: string;
}) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} fill={fill}>
      <ellipse cx={0} cy={0} rx={26} ry={13} />
      <ellipse cx={-12} cy={-8} rx={13} ry={9} />
      <ellipse cx={6} cy={-11} rx={16} ry={11} />
      <ellipse cx={20} cy={-5} rx={10} ry={7} />
    </g>
  );
}

/** Diver in trim, seen side-on: tank, fins, and a trail of bubbles. */
export function Diver({
  x,
  y,
  s,
  suit,
  tank = AMBER,
  flip = false,
}: {
  x: number;
  y: number;
  s: number;
  suit: string;
  tank?: string;
  flip?: boolean;
}) {
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`}>
      <rect x={-6} y={-13} width={24} height={9} rx={4.5} fill={tank} />
      <path d="M -18 0 C -6 -8 12 -8 24 -3 C 12 5 -6 6 -18 4 Z" fill={suit} />
      <circle cx={27} cy={-4} r={6} fill={suit} />
      <path d="M 29 -7 L 34 -7 L 34 -1 L 29 -1 Z" fill={SEA_LAGOON} />
      <path d="M -18 2 L -33 -5 L -31 6 Z" fill={suit} />
      <path d="M -17 3 L -30 10 L -24 12 Z" fill={suit} />
      <g fill={CLOUD} opacity={0.75}>
        <circle cx={33} cy={-14} r={2.6} />
        <circle cx={38} cy={-24} r={2} />
        <circle cx={35} cy={-33} r={1.4} />
      </g>
    </g>
  );
}

/** Green turtle from above — the animal the homestay is named for. */
export function Turtle({
  x,
  y,
  s,
  shell,
  skin,
}: {
  x: number;
  y: number;
  s: number;
  shell: string;
  skin: string;
}) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <g fill={skin}>
        <ellipse
          cx={-19}
          cy={-11}
          rx={12}
          ry={6}
          transform="rotate(-34 -19 -11)"
        />
        <ellipse cx={19} cy={-11} rx={12} ry={6} transform="rotate(34 19 -11)" />
        <ellipse cx={-15} cy={13} rx={8} ry={4.5} transform="rotate(28 -15 13)" />
        <ellipse cx={15} cy={13} rx={8} ry={4.5} transform="rotate(-28 15 13)" />
        <circle cx={0} cy={-20} r={6} />
      </g>
      <ellipse cx={0} cy={0} rx={17} ry={19} fill={shell} />
      <g fill={skin} opacity={0.28}>
        <circle cx={0} cy={-8} r={4} />
        <circle cx={-7} cy={1} r={4} />
        <circle cx={7} cy={1} r={4} />
        <circle cx={0} cy={9} r={4} />
      </g>
    </g>
  );
}
