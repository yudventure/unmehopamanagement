import {
  Bird,
  Boat,
  Coral,
  CoralHead,
  Diver,
  Fish,
  Karst,
  Palm,
  Person,
} from "@/components/scenery";

/**
 * The wide band between the reasons card and the room, cut at the waterline.
 *
 * The gap it fills used to be empty scroll: the card ends, the page goes white,
 * and the next thing to read is a price. A reader arriving at a price with
 * nothing in between has been given no reason to want it. This is that reason,
 * and it says what a day here actually looks like rather than decorating the
 * space.
 *
 * Cut at the waterline because both halves of the day are the point. Above it
 * the karst and a boat crossing between the islands; below it the reef that is
 * the reason anyone comes. Drawn as one picture rather than two so the eye
 * crosses the surface the way a swimmer does.
 *
 * Drawn, not photographed, and that is the honest choice rather than a stylish
 * one: there are no photographs of this shore in the repository. A drawing that
 * says "a boat, karst, a reef" promises nothing a guest can hold the homestay
 * to, while a stock photograph of somebody else's island would.
 *
 * Built from the same kit as the rest of the site's artwork, so it shares the
 * flat shapes and the single light source. The palette is Eddo's own turquoise
 * rather than Turtle's dusk, because this one runs at midday.
 */

// --------------------------------------------------------------- palette

const SKY = "#EAF7F8";
const SUN = "#FFF1D0";
const RIDGE_FAR = "#BEE4E6";
const RIDGE_MID = "#7FCBD0";
const RIDGE_NEAR = "#3E9FA8";
const VEG = "#1F7A80";
const SEA_TOP = "#63C4CC";
const SEA_DEEP = "#0C5B63";
const SAND = "#F4E4C4";
const CORAL_A = "#F0B27A";
const CORAL_B = "#E98B7B";
const CORAL_C = "#7FD4C4";

/**
 * Where the surface sits. Everything above floats, everything below swims.
 *
 * The box is 1200x300 and `slice` crops whatever does not fit, so the
 * composition is built to survive both crops rather than to look best in one.
 * At a desktop width the band keeps roughly y 25-275, so nothing that matters
 * sits nearer than that to an edge. On a phone it keeps roughly x 320-880, so
 * the boat, the diver and the paddle board all live inside that middle third
 * and the picture still tells the whole story on the smallest screen.
 */
const WATER = 150;

export function ShoreScene({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 1200 300"
      preserveAspectRatio="xMidYMid slice"
      className={className}
      role="img"
      aria-label="Perahu melintas di antara karst Raja Ampat, seorang pemain paddle board di permukaan, dan penyelam di antara terumbu karang."
    >
      <defs>
        <linearGradient id="eddo-sea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={SEA_TOP} />
          <stop offset="100%" stopColor={SEA_DEEP} />
        </linearGradient>
        {/* The surface itself, lit from above so the first few metres stay
            bright and the reef sits in the cooler water under it. */}
        <linearGradient id="eddo-shallow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.5} />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity={0} />
        </linearGradient>
      </defs>

      {/* ------------------------------------------------------------ sky */}
      <rect width={1200} height={WATER} fill={SKY} />
      <circle cx={1012} cy={54} r={30} fill={SUN} />
      <Bird x={262} y={48} s={0.9} stroke={RIDGE_NEAR} />
      <Bird x={306} y={36} s={0.7} stroke={RIDGE_NEAR} />
      <Bird x={912} y={58} s={0.8} stroke={RIDGE_NEAR} />

      {/* --------------------------------------------------------- karst
          `x` is the centre of each island, not its left edge, and `base` is the
          waterline they stand in. Three ranks at three weights: the far rank is
          nearly the colour of the sky, which is what gives a line of islands
          its distance without drawing any haze. */}
      <Karst x={120} w={260} h={82} fill={RIDGE_FAR} canopy={RIDGE_FAR} base={WATER} />
      <Karst x={392} w={210} h={64} fill={RIDGE_FAR} canopy={RIDGE_FAR} base={WATER} />
      <Karst x={706} w={280} h={88} fill={RIDGE_FAR} canopy={RIDGE_FAR} base={WATER} />
      <Karst x={1020} w={230} h={70} fill={RIDGE_FAR} canopy={RIDGE_FAR} base={WATER} />

      <Karst x={232} w={244} h={116} fill={RIDGE_MID} canopy={VEG} base={WATER} />
      <Karst x={628} w={268} h={124} fill={RIDGE_MID} canopy={VEG} base={WATER} />
      <Karst x={906} w={206} h={104} fill={RIDGE_MID} canopy={VEG} base={WATER} />

      <Karst x={52} w={196} h={96} fill={RIDGE_NEAR} canopy={VEG} base={WATER} />
      <Karst x={1156} w={200} h={104} fill={RIDGE_NEAR} canopy={VEG} base={WATER} />
      <Palm x={104} y={92} s={0.85} fill={VEG} />
      <Palm x={1116} y={96} s={0.78} fill={VEG} />

      {/* ------------------------------------------------------------ sea */}
      <rect x={0} y={WATER} width={1200} height={300 - WATER} fill="url(#eddo-sea)" />
      <rect x={0} y={WATER} width={1200} height={42} fill="url(#eddo-shallow)" />

      {/* Surface marks, kept sparse and uneven. A row of matching dashes reads
          as a pattern rather than as water. */}
      <g fill="#FFFFFF" opacity={0.4}>
        <rect x={150} y={172} width={62} height={4} rx={2} />
        <rect x={336} y={190} width={38} height={4} rx={2} />
        <rect x={690} y={178} width={74} height={4} rx={2} />
        <rect x={966} y={196} width={46} height={4} rx={2} />
      </g>

      {/* ---------------------------------------------------- on the water
          The boat crosses between two headlands rather than sitting in open
          water, which is what makes it look like it is going somewhere. */}
      <Boat x={430} y={162} s={1.7} />

      {/* Paddle board. The figure comes from the kit; the board and the paddle
          are drawn here because nothing else on the site needs them. */}
      <g transform="translate(760 156)">
        <ellipse cx={0} cy={18} rx={44} ry={6} fill={SEA_DEEP} opacity={0.2} />
        <rect x={-42} y={10} width={84} height={8} rx={4} fill="#FFFFFF" />
        <rect x={-42} y={10} width={84} height={3.5} rx={1.75} fill={CORAL_A} />
        {/* Shaft first, so the hands sit over it rather than beside it. */}
        <path d="M13 -34 L29 16" stroke="#8A6A46" strokeWidth={3} strokeLinecap="round" fill="none" />
        <path d="M24 10 L34 10 L29 22 Z" fill="#8A6A46" />
        <Person x={-4} y={10} s={0.9} shirt={CORAL_B} />
      </g>

      {/* ------------------------------------------------------ under water
          A floor to stand the garden on, so the coral is growing rather than
          floating in open blue. */}
      <path
        d="M0 274 Q 200 258 400 270 T 800 266 T 1200 272 L1200 300 L0 300 Z"
        fill={SAND}
        opacity={0.8}
      />

      <CoralHead x={120} y={270} s={1.0} fill={CORAL_C} />
      <Coral x={196} y={272} s={0.9} fill={CORAL_A} />
      <CoralHead x={300} y={268} s={0.85} fill={CORAL_A} />
      <Coral x={376} y={272} s={1.0} fill={CORAL_C} />
      <CoralHead x={472} y={270} s={0.95} fill={CORAL_B} />
      <Coral x={556} y={268} s={0.8} fill={CORAL_A} />
      <CoralHead x={664} y={272} s={1.05} fill={CORAL_C} />
      <Coral x={752} y={268} s={0.9} fill={CORAL_B} />
      <CoralHead x={860} y={270} s={0.95} fill={CORAL_A} />
      <Coral x={948} y={272} s={0.85} fill={CORAL_C} />
      <CoralHead x={1060} y={268} s={1.0} fill={CORAL_B} />
      <Coral x={1148} y={272} s={0.9} fill={CORAL_A} />

      {/* The diver sits at mid depth between the boat above and the reef
          below, which is the only place in the picture that links the two. */}
      <Diver x={600} y={222} s={1.2} suit={SEA_DEEP} tank={CORAL_A} />

      <Fish x={318} y={216} s={0.9} fill={CORAL_A} />
      <Fish x={356} y={234} s={0.7} fill="#FFE2A8" />
      <Fish x={396} y={208} s={0.6} fill={CORAL_A} />
      <Fish x={812} y={238} s={0.85} fill="#FFE2A8" flip />
      <Fish x={856} y={214} s={0.68} fill={CORAL_A} flip />
      <Fish x={1046} y={226} s={0.8} fill="#FFE2A8" flip />
    </svg>
  );
}
