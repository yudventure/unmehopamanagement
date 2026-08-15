/**
 * Artwork for the public site, composed from the shared kit in `scenery.tsx`.
 *
 * There are no photographs in this repository and no external host to fetch
 * them from, so every image on the site is drawn. That is a real constraint,
 * not a style choice: swap any of these for a photograph the moment there are
 * photographs to swap in — each one is a single component behind a fixed
 * aspect box, so nothing else has to move.
 *
 * The hero runs at dusk. The site's display type sits white across it, and a
 * pastel daylight sky cannot hold white type without a scrim heavy enough to
 * grey the whole picture.
 */

import {
  Bird,
  Boat,
  Coral,
  CoralHead,
  Diver,
  Fish,
  Karst,
  Manta,
  Palm,
  Person,
  Turtle,
} from "@/components/scenery";

// ------------------------------------------------------------- dusk palette

const DUSK_HIGH = "#1D4A45";
const DUSK_MID = "#B4704A";
const DUSK_LOW = "#E8A967";
const DUSK_SUN = "#FBD9A0";
const DUSK_SEA_TOP = "#C58A5A";
const DUSK_SEA_LOW = "#2C4F4C";
const RIDGE_FAR = "#3C5E5C";
const RIDGE_MID = "#25413F";
const RIDGE_NEAR = "#152C2B";

/**
 * Wide golden-hour panorama, cropped by the hero band it sits behind.
 *
 * The islets are deliberately small against the frame and spaced with sky
 * between them. Drawn tall and close they stop reading as islands on a
 * horizon and become one dark mass across the middle of the picture — which
 * is also where the display type sits.
 */
export function HeroScene({ className }: { className?: string }) {
  const H = 430;
  return (
    <svg
      viewBox="0 0 1440 720"
      preserveAspectRatio="xMidYMid slice"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="tw-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={DUSK_HIGH} />
          <stop offset="52%" stopColor={DUSK_MID} />
          <stop offset="100%" stopColor={DUSK_LOW} />
        </linearGradient>
        <linearGradient id="tw-sea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={DUSK_SEA_TOP} />
          <stop offset="100%" stopColor={DUSK_SEA_LOW} />
        </linearGradient>
        <radialGradient id="tw-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={DUSK_SUN} stopOpacity={0.85} />
          <stop offset="100%" stopColor={DUSK_SUN} stopOpacity={0} />
        </radialGradient>
      </defs>

      <rect width={1440} height={720} fill="url(#tw-sky)" />
      <circle cx={1046} cy={330} r={210} fill="url(#tw-glow)" />
      <circle cx={1046} cy={330} r={52} fill={DUSK_SUN} opacity={0.95} />

      <g opacity={0.45}>
        <Bird x={300} y={168} s={2} stroke="#F6DCBA" />
        <Bird x={368} y={132} s={1.4} stroke="#F6DCBA" />
        <Bird x={430} y={186} s={1.1} stroke="#F6DCBA" />
        <Bird x={1230} y={210} s={1.6} stroke="#F6DCBA" />
      </g>

      {/* Far range: low, pale, and broken by sky so it reads as distance. */}
      <g opacity={0.6}>
        <Karst x={210} w={230} h={86} fill={RIDGE_FAR} base={H} />
        <Karst x={470} w={180} h={62} fill={RIDGE_FAR} base={H} />
        <Karst x={760} w={210} h={74} fill={RIDGE_FAR} base={H} />
        <Karst x={1230} w={240} h={92} fill={RIDGE_FAR} base={H} />
      </g>

      {/* Mid range: the silhouettes the eye settles on. */}
      <Karst x={128} w={260} h={140} fill={RIDGE_MID} base={H + 4} />
      <Karst x={352} w={196} h={104} fill={RIDGE_MID} base={H + 4} />
      <Karst x={640} w={168} h={82} fill={RIDGE_MID} base={H + 4} />
      <Karst x={1330} w={250} h={132} fill={RIDGE_MID} base={H + 4} />

      {/* Near pair, framing the edges only — the middle stays open sky. */}
      <Karst x={30} w={210} h={186} fill={RIDGE_NEAR} canopy={RIDGE_NEAR} base={H + 14} />
      <Karst x={1432} w={220} h={172} fill={RIDGE_NEAR} canopy={RIDGE_NEAR} base={H + 14} />
      <Palm x={96} y={268} s={0.95} fill={RIDGE_NEAR} />
      <Palm x={1372} y={286} s={0.85} fill={RIDGE_NEAR} />

      <rect x={0} y={H + 14} width={1440} height={320} fill="url(#tw-sea)" />

      {/* The sun's road on the water, widening as it comes towards us. */}
      <g fill={DUSK_SUN} opacity={0.45}>
        <rect x={1012} y={H + 24} width={68} height={8} rx={4} />
        <rect x={1000} y={H + 46} width={92} height={9} rx={4.5} />
        <rect x={982} y={H + 74} width={128} height={10} rx={5} />
        <rect x={958} y={H + 110} width={176} height={11} rx={5.5} />
        <rect x={928} y={H + 156} width={236} height={12} rx={6} />
        <rect x={890} y={H + 212} width={312} height={13} rx={6.5} />
      </g>

      <g fill="#F3D3AB" opacity={0.35}>
        <rect x={150} y={H + 62} width={88} height={7} rx={3.5} />
        <rect x={368} y={H + 104} width={64} height={7} rx={3.5} />
        <rect x={244} y={H + 168} width={110} height={8} rx={4} />
        <rect x={560} y={H + 138} width={76} height={7} rx={3.5} />
        <rect x={1216} y={H + 96} width={94} height={7} rx={3.5} />
        <rect x={620} y={H + 232} width={132} height={8} rx={4} />
      </g>

      {/* Two longboats, silhouetted against the light on the water. */}
      <g opacity={0.92}>
        <Boat
          x={430}
          y={H + 152}
          s={1.5}
          hull={RIDGE_NEAR}
          stroke={RIDGE_NEAR}
          deck="#0F2423"
          roof={RIDGE_NEAR}
        />
        <Person x={430} y={H + 148} s={1.2} shirt={RIDGE_NEAR} skin={RIDGE_NEAR} />
        <Boat
          x={1080}
          y={H + 226}
          s={2}
          flip
          hull={RIDGE_NEAR}
          stroke={RIDGE_NEAR}
          deck="#0F2423"
          roof={RIDGE_NEAR}
        />
      </g>

      <g opacity={0.28}>
        <Manta x={236} y={H + 250} s={1.4} fill="#0F2423" />
      </g>
    </svg>
  );
}

// -------------------------------------------------------------- reef, below

const REEF_TOP = "#3E9DA6";
const REEF_LOW = "#0E4E5C";
const REEF_SAND = "#D8CBA8";
const CORAL_A = "#E88F6A";
const CORAL_B = "#EFC988";
const CORAL_C = "#7FC6B4";

/** Underwater scene for the dive centre: coral garden, school, manta, diver. */
export function ReefScene({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 640 480"
      preserveAspectRatio="xMidYMid slice"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="tw-reef" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={REEF_TOP} />
          <stop offset="100%" stopColor={REEF_LOW} />
        </linearGradient>
      </defs>
      <rect width={640} height={480} fill="url(#tw-reef)" />

      {/* Light shafts coming down through the surface. */}
      <g fill="#CFEDE8" opacity={0.16}>
        <path d="M 90 0 L 150 0 L 250 480 L 168 480 Z" />
        <path d="M 300 0 L 336 0 L 392 480 L 340 480 Z" />
        <path d="M 470 0 L 530 0 L 596 480 L 512 480 Z" />
      </g>

      <Manta x={430} y={128} s={1.35} fill="#0B3B47" />
      <g opacity={0.85}>
        <Diver x={150} y={196} s={1.5} suit="#12333C" tank={CORAL_B} />
      </g>

      {/* A school, drifting the other way. */}
      <g opacity={0.8}>
        {[
          [364, 268, 0.7],
          [406, 288, 0.55],
          [340, 300, 0.5],
          [432, 250, 0.45],
          [386, 322, 0.6],
          [452, 306, 0.5],
        ].map(([x, y, s], i) => (
          <Fish key={i} x={x} y={y} s={s} fill={CORAL_B} flip={i % 2 === 0} />
        ))}
      </g>

      <Turtle x={548} y={356} s={1.1} shell="#2C6B58" skin="#8FC9A8" />

      {/* Sea floor and the garden standing on it. */}
      <path
        d="M 0 480 L 0 424 C 120 400 220 434 330 420 C 450 404 540 430 640 412 L 640 480 Z"
        fill={REEF_SAND}
        opacity={0.75}
      />
      <CoralHead x={96} y={432} s={1.5} fill={CORAL_A} />
      <CoralHead x={286} y={444} s={1.1} fill={CORAL_C} />
      <CoralHead x={520} y={438} s={1.3} fill={CORAL_A} />
      <Coral x={190} y={436} s={1.6} fill={CORAL_B} />
      <Coral x={368} y={430} s={1.25} fill={CORAL_A} />
      <Coral x={442} y={444} s={1.5} fill={CORAL_C} />
      <Coral x={606} y={432} s={1.3} fill={CORAL_B} />

      <g fill="#FFFFFF" opacity={0.5}>
        <circle cx={214} cy={150} r={5} />
        <circle cx={228} cy={112} r={3.6} />
        <circle cx={220} cy={78} r={2.4} />
      </g>
    </svg>
  );
}

// ------------------------------------------------------------- the homestay

const DAY_SKY = "#DCEFEA";
const DAY_SEA_TOP = "#9FD6CA";
const DAY_SEA_LOW = "#5FB0A0";

/** The over-water huts and the jetty, in flat daylight. */
export function JettyScene({ className }: { className?: string }) {
  const WATER = 250;
  return (
    <svg
      viewBox="0 0 640 480"
      preserveAspectRatio="xMidYMid slice"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="tw-jsea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={DAY_SEA_TOP} />
          <stop offset="100%" stopColor={DAY_SEA_LOW} />
        </linearGradient>
      </defs>
      <rect width={640} height={480} fill={DAY_SKY} />
      <circle cx={520} cy={84} r={54} fill="#FBEBC6" opacity={0.85} />
      <circle cx={520} cy={84} r={32} fill="#F8DFA0" />

      <Karst x={90} w={220} h={150} fill="#BFE1D6" base={WATER} />
      <Karst x={330} w={200} h={112} fill="#BFE1D6" base={WATER} />
      <Karst x={590} w={190} h={140} fill="#A2D3C5" canopy="#A2D3C5" base={WATER} />
      <Palm x={604} y={132} s={0.8} fill="#2E8B77" />

      <rect x={0} y={WATER} width={640} height={230} fill="url(#tw-jsea)" />
      <ellipse cx={220} cy={306} rx={250} ry={38} fill="#D2EDE6" opacity={0.55} />
      <g fill="#FFFFFF" opacity={0.55}>
        <rect x={40} y={340} width={54} height={5} rx={2.5} />
        <rect x={430} y={318} width={44} height={5} rx={2.5} />
        <rect x={300} y={396} width={62} height={5} rx={2.5} />
        <rect x={96} y={438} width={48} height={5} rx={2.5} />
      </g>

      {/* Jetty running out from the left, two huts standing on it. */}
      <g>
        <g stroke="#D3BC91" strokeWidth={7} strokeLinecap="round">
          {[24, 96, 168, 240, 312, 384].map((x) => (
            <path key={x} d={`M ${x} 358 L ${x} 440`} />
          ))}
        </g>
        <rect x={-12} y={340} width={430} height={18} rx={7} fill="#EFE0BF" />
        <rect
          x={-12}
          y={355}
          width={430}
          height={6}
          rx={3}
          fill="#D3BC91"
          opacity={0.7}
        />

        <g>
          <path d="M 44 268 L 232 268 L 180 206 L 96 206 Z" fill="#E8C46E" />
          <path d="M 44 268 L 232 268 L 228 278 L 48 278 Z" fill="#D3BC91" />
          <rect x={70} y={278} width={136} height={64} fill="#FFFFFF" />
          <rect
            x={70}
            y={278}
            width={136}
            height={64}
            fill="none"
            stroke="#D3BC91"
            strokeWidth={1.8}
          />
          <rect x={88} y={294} width={32} height={28} rx={2} fill="#D2EDE6" />
          <rect x={156} y={294} width={32} height={28} rx={2} fill="#D2EDE6" />
          <rect x={126} y={298} width={24} height={44} rx={2} fill="#0E7C6B" />
        </g>

        <g>
          <path d="M 274 296 L 388 296 L 356 256 L 306 256 Z" fill="#E8C46E" />
          <rect x={292} y={296} width={80} height={46} fill="#FFFFFF" />
          <rect
            x={292}
            y={296}
            width={80}
            height={46}
            fill="none"
            stroke="#D3BC91"
            strokeWidth={1.6}
          />
          <rect x={322} y={310} width={22} height={32} rx={2} fill="#0E7C6B" />
        </g>

        <Person x={412} y={340} s={1.5} shirt="#F6C445" />
        <Person x={252} y={340} s={1.35} shirt="#0E7C6B" />
      </g>

      <Boat x={520} y={392} s={1.6} flip />
      <g opacity={0.35}>
        <Fish x={112} y={410} s={0.8} fill="#3C9B86" />
        <Fish x={160} y={430} s={0.6} fill="#3C9B86" flip />
      </g>
    </svg>
  );
}

// ------------------------------------------------------- small square cards

/** A single islet against a warm sky — filler artwork for the small cards. */
export function IsletScene({
  className,
  warm = false,
}: {
  className?: string;
  warm?: boolean;
}) {
  const sky = warm ? "#F6DCBA" : "#DCEFEA";
  const sea = warm ? "#D9A26B" : "#9FD6CA";
  const rock = warm ? "#3E5B52" : "#6FBBA8";
  const veg = warm ? "#26403A" : "#2E8B77";
  return (
    <svg
      viewBox="0 0 320 320"
      preserveAspectRatio="xMidYMid slice"
      className={className}
      aria-hidden="true"
    >
      <rect width={320} height={320} fill={sky} />
      <circle cx={232} cy={80} r={38} fill={warm ? "#FBD9A0" : "#FBEBC6"} />
      <Karst x={92} w={210} h={168} fill={rock} canopy={rock} base={210} />
      <Karst x={266} w={130} h={104} fill={rock} canopy={rock} base={210} />
      <Palm x={72} y={92} s={0.85} fill={veg} />
      <rect x={0} y={210} width={320} height={110} fill={sea} />
      <g fill="#FFFFFF" opacity={0.45}>
        <rect x={28} y={250} width={44} height={5} rx={2.5} />
        <rect x={196} y={276} width={56} height={5} rx={2.5} />
        <rect x={104} y={300} width={38} height={5} rx={2.5} />
      </g>
      <Boat x={230} y={252} s={1.2} flip />
    </svg>
  );
}

/** Snorkeller over a shallow garden — the non-diver half of the offer. */
export function SnorkelScene({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 320 320"
      preserveAspectRatio="xMidYMid slice"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="tw-snork" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7FCDC0" />
          <stop offset="100%" stopColor="#1F6C74" />
        </linearGradient>
      </defs>
      <rect width={320} height={320} fill="url(#tw-snork)" />
      <rect x={0} y={0} width={320} height={54} fill="#CDEBE4" opacity={0.55} />

      <g transform="translate(96 62)">
        <ellipse cx={0} cy={4} rx={38} ry={10} fill="#FFFFFF" opacity={0.4} />
        <circle cx={0} cy={-8} r={11} fill="#12333C" />
        <path
          d="M 8 -16 C 16 -20 19 -28 16 -35"
          stroke="#EFC988"
          strokeWidth={4}
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M -10 6 C 8 14 34 18 58 12"
          stroke="#12333C"
          strokeWidth={9}
          fill="none"
          strokeLinecap="round"
        />
      </g>

      <Turtle x={228} y={166} s={1.15} shell="#2C6B58" skin="#8FC9A8" />
      <g opacity={0.8}>
        <Fish x={62} y={196} s={0.7} fill="#EFC988" />
        <Fish x={112} y={218} s={0.55} fill="#EFC988" flip />
        <Fish x={158} y={188} s={0.5} fill="#EFC988" />
      </g>
      <path
        d="M 0 320 L 0 268 C 90 250 180 278 320 254 L 320 320 Z"
        fill="#D8CBA8"
        opacity={0.7}
      />
      <CoralHead x={54} y={276} s={1.2} fill="#E88F6A" />
      <Coral x={150} y={272} s={1.3} fill="#EFC988" />
      <CoralHead x={252} y={266} s={1} fill="#7FC6B4" />
      <Coral x={300} y={270} s={1.1} fill="#E88F6A" />
    </svg>
  );
}
