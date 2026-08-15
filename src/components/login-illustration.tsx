/**
 * Flat-vector illustration for the login hero panel: the karst islets of
 * Piaynemo, an over-water homestay on stilts, longboats and a manta ray.
 *
 * Composed from the shared kit in `scenery.tsx`, which the public site draws
 * its scenes from as well — one set of paths, several arrangements.
 */

import {
  AMBER,
  Bird,
  Boat,
  CLOUD,
  Fish,
  INK,
  KARST_BASE,
  KARST_FAR,
  KARST_MID,
  KARST_NEAR,
  Karst,
  Manta,
  Palm,
  Person,
  ROOF,
  SEA_DEEP,
  SEA_LAGOON,
  SEA_LOW,
  SEA_TOP,
  SKY_LOW,
  SKY_TOP,
  SUN,
  SUN_GLOW,
  THATCH,
  VEG,
  VEG_DEEP,
  WALL,
  WOOD,
  WOOD_DARK,
} from "@/components/scenery";

const HORIZON = 420;

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
        <Karst x={64} w={132} h={112} fill={KARST_FAR} base={HORIZON} />
        <Karst x={196} w={112} h={78} fill={KARST_FAR} base={HORIZON} />
        <Karst x={454} w={148} h={106} fill={KARST_FAR} base={HORIZON} />
        <Karst x={634} w={124} h={84} fill={KARST_FAR} base={HORIZON} />
      </g>

      {/* Mid range */}
      <Karst x={136} w={152} h={154} fill={KARST_MID} canopy={KARST_MID} base={HORIZON} />
      <Karst x={556} w={166} h={142} fill={KARST_MID} canopy={KARST_MID} base={HORIZON} />
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
