/**
 * Flat-vector illustration for the login hero panel: the karst islets of
 * Piaynemo, an over-water homestay on stilts, longboats and a manta ray.
 *
 * Drawn inline rather than shipped as an asset so the panel needs no file in
 * `public/`, stays sharp at any panel size, and costs no extra request. The
 * ramp below is the app's teal brand palette from `globals.css`, stepped light
 * to dark so depth reads as distance — far islets pale, foreground saturated.
 */

const SKY_TOP = "#F3FAF7";
const SKY_LOW = "#DDEFE8";
const SUN = "#F8DFA0";
const SUN_GLOW = "#FBEBC6";
const CLOUD = "#FFFFFF";

const KARST_FAR = "#C6E4DA";
const KARST_MID = "#A2D3C5";
const KARST_NEAR = "#6FBBA8";
const KARST_BASE = "#3C9B86";
const VEG = "#2E8B77";
const VEG_DEEP = "#1E7A66";

const SEA_TOP = "#B9E2D8";
const SEA_LOW = "#8FCFC0";
const SEA_LAGOON = "#D2EDE6";
const SEA_DEEP = "#6FBCAC";

const WOOD = "#EFE0BF";
const WOOD_DARK = "#D3BC91";
const THATCH = "#E8C46E";
const WALL = "#FFFFFF";
const ROOF = "#0E7C6B";
const INK = "#0B5F52";
const AMBER = "#F6C445";

const HORIZON = 420;

/**
 * Limestone islet in the Piaynemo profile: a crown that bulges wider than the
 * waterline, pinched at the base where the sea has undercut the rock. The
 * pinch is the whole character of these islands — without it they read as
 * ordinary green hills.
 */
function Karst({
  x,
  w,
  h,
  fill,
  canopy,
  base = HORIZON,
}: {
  x: number;
  w: number;
  h: number;
  fill: string;
  canopy?: string;
  base?: number;
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
function Manta({ x, y, s, fill }: { x: number; y: number; s: number; fill: string }) {
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

function Fish({
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
    <g transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`} fill={fill}>
      <path d="M 0 0 C 6 -7 18 -7 26 0 C 18 7 6 7 0 0 Z" />
      <path d="M 0.5 0 L -8 -6 L -8 6 Z" />
    </g>
  );
}

function Palm({ x, y, s, fill }: { x: number; y: number; s: number; fill: string }) {
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

function Bird({ x, y, s, stroke }: { x: number; y: number; s: number; stroke: string }) {
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
function Person({
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
      <path d="M -4 -17 C -4 -11 -4.4 -6 -4 -2 L 4 -2 C 4.4 -6 4 -11 4 -17 Z" fill={shirt} />
      <path d="M -3.4 -2 L -3.4 6 M 3.4 -2 L 3.4 6" stroke={skin} strokeWidth={2.2} strokeLinecap="round" />
    </g>
  );
}

function Boat({ x, y, s, flip = false }: { x: number; y: number; s: number; flip?: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`}>
      <path d="M -30 0 C -26 9 -20 13 0 13 C 20 13 26 9 30 0 Z" fill={WALL} />
      <path d="M -30 0 C -26 9 -20 13 0 13 C 20 13 26 9 30 0 Z" fill="none" stroke={KARST_BASE} strokeWidth={1.6} />
      <rect x={-30} y={-3} width={60} height={4} rx={2} fill={AMBER} />
      <path d="M 22 -3 L 30 -3 L 27 -12 L 21 -12 Z" fill={ROOF} />
    </g>
  );
}

export function LoginIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 720 760"
      preserveAspectRatio="xMidYMid slice"
      className={className}
      role="img"
      aria-label="Ilustrasi Raja Ampat: gugusan pulau karst, laut biru kehijauan, homestay panggung di atas air, perahu tradisional dan pari manta."
    >
      <defs>
        <linearGradient id="rp-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={SKY_TOP} />
          <stop offset="100%" stopColor={SKY_LOW} />
        </linearGradient>
        <linearGradient id="rp-sea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={SEA_TOP} />
          <stop offset="100%" stopColor={SEA_LOW} />
        </linearGradient>
      </defs>

      <rect width={720} height={760} fill="url(#rp-sky)" />

      {/* Sun, low and hazy over the horizon */}
      <circle cx={556} cy={132} r={78} fill={SUN_GLOW} opacity={0.5} />
      <circle cx={556} cy={132} r={50} fill={SUN} opacity={0.92} />

      {/* Clouds */}
      <g fill={CLOUD} opacity={0.8}>
        <path d="M 92 118 C 92 104 104 96 118 99 C 124 86 145 86 152 99 C 168 96 180 106 178 118 Z" />
        <path d="M 300 74 C 300 62 311 55 323 58 C 329 47 347 47 353 58 C 367 55 377 64 375 74 Z" />
        <path d="M 600 262 C 600 251 610 245 621 248 C 627 238 643 238 648 248 C 661 245 670 253 668 262 Z" />
      </g>

      <g opacity={0.55}>
        <Bird x={196} y={168} s={1.5} stroke={VEG_DEEP} />
        <Bird x={244} y={142} s={1.1} stroke={VEG_DEEP} />
        <Bird x={286} y={178} s={0.9} stroke={VEG_DEEP} />
        <Bird x={468} y={206} s={1.2} stroke={VEG_DEEP} />
      </g>

      {/* Far range — palest, reads as distance */}
      <g opacity={0.9}>
        <Karst x={64} w={132} h={112} fill={KARST_FAR} />
        <Karst x={196} w={112} h={78} fill={KARST_FAR} />
        <Karst x={454} w={148} h={106} fill={KARST_FAR} />
        <Karst x={634} w={124} h={84} fill={KARST_FAR} />
      </g>

      {/* Mid range */}
      <Karst x={136} w={152} h={154} fill={KARST_MID} canopy={KARST_MID} />
      <Karst x={556} w={166} h={142} fill={KARST_MID} canopy={KARST_MID} />
      <Palm x={116} y={286} s={0.7} fill={VEG} />
      <Palm x={572} y={298} s={0.64} fill={VEG} />

      {/* Hero islets */}
      <Karst x={352} w={194} h={198} fill={KARST_NEAR} canopy={KARST_NEAR} base={424} />
      <Karst x={684} w={108} h={124} fill={KARST_NEAR} canopy={KARST_NEAR} base={424} />
      <Palm x={326} y={246} s={0.92} fill={VEG_DEEP} />
      <Palm x={372} y={232} s={1.1} fill={VEG} />
      <Palm x={402} y={266} s={0.76} fill={VEG_DEEP} />
      <Palm x={682} y={318} s={0.66} fill={VEG} />

      {/* Shadow pooling in the undercut where limestone meets water */}
      <g fill={KARST_BASE}>
        <ellipse cx={356} cy={424} rx={74} ry={10} opacity={0.34} />
        <ellipse cx={678} cy={424} rx={40} ry={7} opacity={0.3} />
        <ellipse cx={148} cy={420} rx={60} ry={7} opacity={0.2} />
        <ellipse cx={556} cy={420} rx={64} ry={7} opacity={0.2} />
      </g>

      {/* Sea */}
      <rect x={0} y={HORIZON} width={720} height={340} fill="url(#rp-sea)" />
      <ellipse cx={300} cy={470} rx={280} ry={40} fill={SEA_LAGOON} opacity={0.75} />
      <ellipse cx={600} cy={540} rx={210} ry={46} fill={SEA_LAGOON} opacity={0.45} />
      <ellipse cx={210} cy={690} rx={250} ry={58} fill={SEA_DEEP} opacity={0.35} />

      {/* Reflections of the islets, cut into bands */}
      <g fill={KARST_BASE} opacity={0.14}>
        <rect x={262} y={428} width={188} height={9} rx={4.5} />
        <rect x={280} y={444} width={152} height={7} rx={3.5} />
        <rect x={300} y={458} width={112} height={6} rx={3} />
      </g>

      {/* Wave dashes */}
      <g fill={CLOUD} opacity={0.6}>
        <rect x={48} y={498} width={54} height={5} rx={2.5} />
        <rect x={140} y={534} width={38} height={5} rx={2.5} />
        <rect x={498} y={488} width={62} height={5} rx={2.5} />
        <rect x={612} y={520} width={44} height={5} rx={2.5} />
        <rect x={392} y={572} width={58} height={5} rx={2.5} />
        <rect x={86} y={612} width={46} height={5} rx={2.5} />
        <rect x={540} y={648} width={66} height={5} rx={2.5} />
        <rect x={286} y={702} width={52} height={5} rx={2.5} />
        <rect x={624} y={716} width={40} height={5} rx={2.5} />
      </g>

      {/* Reef gardens showing through shallow water */}
      <g fill={SEA_DEEP} opacity={0.3}>
        <ellipse cx={168} cy={734} rx={64} ry={22} />
        <ellipse cx={214} cy={716} rx={38} ry={15} />
        <ellipse cx={648} cy={742} rx={70} ry={24} />
        <ellipse cx={592} cy={724} rx={34} ry={13} />
      </g>

      {/* Manta gliding just under the surface */}
      <g opacity={0.34} transform="translate(556 596) rotate(-10)">
        <Manta x={0} y={0} s={1} fill={KARST_BASE} />
      </g>

      <g opacity={0.42}>
        <Fish x={424} y={694} s={0.8} fill={KARST_BASE} />
        <Fish x={462} y={714} s={0.6} fill={KARST_BASE} />
        <Fish x={398} y={722} s={0.5} fill={KARST_BASE} flip />
      </g>

      {/* Over-water homestay on stilts, with jetty running off frame */}
      <g>
        <g stroke={WOOD_DARK} strokeWidth={5} strokeLinecap="round">
          <path d="M 30 620 L 30 672" />
          <path d="M 86 618 L 86 674" />
          <path d="M 142 616 L 142 672" />
          <path d="M 198 614 L 198 670" />
          <path d="M 254 612 L 254 668" />
        </g>
        <rect x={-10} y={604} width={290} height={13} rx={5} fill={WOOD} />
        <rect x={-10} y={615} width={290} height={5} rx={2.5} fill={WOOD_DARK} opacity={0.7} />

        {/* Main hut */}
        <g>
          <path d="M 92 540 L 262 540 L 214 486 L 140 486 Z" fill={THATCH} />
          <path d="M 92 540 L 262 540 L 258 548 L 96 548 Z" fill={WOOD_DARK} />
          <rect x={116} y={548} width={122} height={58} fill={WALL} />
          <rect x={116} y={548} width={122} height={58} fill="none" stroke={WOOD_DARK} strokeWidth={1.6} />
          <rect x={132} y={562} width={28} height={26} rx={2} fill={SEA_LAGOON} />
          <rect x={194} y={562} width={28} height={26} rx={2} fill={SEA_LAGOON} />
          <rect x={168} y={566} width={20} height={40} rx={2} fill={ROOF} />
          <g stroke={WOOD_DARK} strokeWidth={4.5} strokeLinecap="round">
            <path d="M 124 606 L 124 664" />
            <path d="M 230 606 L 230 664" />
          </g>
        </g>

        {/* Smaller hut further out */}
        <g>
          <path d="M 296 566 L 396 566 L 368 532 L 324 532 Z" fill={THATCH} />
          <rect x={310} y={566} width={72} height={40} fill={WALL} />
          <rect x={310} y={566} width={72} height={40} fill="none" stroke={WOOD_DARK} strokeWidth={1.4} />
          <rect x={336} y={578} width={20} height={28} rx={2} fill={ROOF} />
          <rect x={280} y={604} width={116} height={10} rx={4} fill={WOOD} />
          <g stroke={WOOD_DARK} strokeWidth={4} strokeLinecap="round">
            <path d="M 306 612 L 306 660" />
            <path d="M 380 612 L 380 656" />
          </g>
        </g>

        <Person x={278} y={604} s={1.25} shirt={AMBER} />
        <Person x={62} y={606} s={1.15} shirt={ROOF} />
      </g>

      <Boat x={470} y={604} s={1.15} />
      <Person x={470} y={600} s={1} shirt={WALL} />
      <Boat x={630} y={706} s={1.4} flip />

      {/* Snorkeller: head above water, snorkel, and the ripple around them */}
      <g transform="translate(344 692)">
        <ellipse cx={0} cy={3} rx={30} ry={9} fill={CLOUD} opacity={0.45} />
        <circle cx={0} cy={-5} r={8} fill={INK} />
        <path
          d="M 6 -11 C 12 -14 14 -20 12 -25"
          stroke={AMBER}
          strokeWidth={3.2}
          fill="none"
          strokeLinecap="round"
        />
      </g>

      {/* Foreground palm leaning in from the left edge */}
      <path
        d="M -6 760 C 6 690 22 640 44 596"
        stroke={VEG_DEEP}
        strokeWidth={11}
        fill="none"
        strokeLinecap="round"
      />
      <Palm x={46} y={598} s={1.75} fill={VEG_DEEP} />
    </svg>
  );
}
