import { Palm } from "@/components/scenery";
import { IsletScene, JettyScene, ReefScene, SnorkelScene } from "@/components/web/scenes";
import type { ServiceKey } from "@/lib/eddo-content";

/**
 * A picture for every service card that has no photograph yet.
 *
 * The cards used to show the service's own small glyph in the middle of a
 * tinted box, under the words "photograph still to come". Honest, and it read
 * as seventeen holes in a page: the eye goes to the empty rectangle, not to
 * what is written beside it.
 *
 * Four of the eight services are already drawn, in `web/scenes.tsx`, and those
 * same four scenes are on this page already behind the "around us" cards. They
 * are reused here rather than redrawn. The four that were missing are the ones
 * that happen on land, which a library of reefs and islets had no reason to
 * have: a camera, a motorbike, a car, a shirt.
 *
 * ## These are drawings and stay drawings
 *
 * Not one of them is a picture of the family's actual motorbike, their actual
 * car or the shirt they actually print. Flat vector shapes cannot be mistaken
 * for a photograph, which is the point: a guest paying for a hire should not be
 * shown something that looks like the thing they are getting when nobody has
 * photographed it. The card keeps saying "photograph still to come" underneath,
 * and each of these is one component behind a fixed box, so the day a real
 * photograph arrives it goes in `content/site.json` as `photo` and this is
 * never rendered again.
 */

// The same flat palette the rest of the drawings on this page are built from.
const SKY = "#DCEFEA";
const SEA = "#9FD6CA";
const DEEP = "#1F6C74";
const SAND = "#D8CBA8";
const WARM = "#EFC988";
const INK = "#12333C";
const VEG = "#2E8B77";
const TEAL = "#2C6B58";

const BOX = {
  viewBox: "0 0 320 320",
  preserveAspectRatio: "xMidYMid slice",
  "aria-hidden": true,
} as const;

/**
 * The strip of ground every land scene stands on, so the three agree.
 *
 * `y` is 236 rather than the 266 it started at, and the vehicles are lifted to
 * match. The card these sit in is four by three and the drawing is a square
 * sliced to fill it, so the only part ever seen is the middle band, roughly 40
 * to 280. Drawn on a ground at 266 the wheels sat on the very edge of that,
 * half under the caption; measured on a real card rather than guessed at.
 */
function Ground({ y = 236 }: { y?: number }) {
  return (
    <>
      <rect width={320} height={320} fill={SKY} />
      <circle cx={252} cy={70} r={40} fill="#FBEBC6" />
      <rect x={0} y={y} width={320} height={320 - y} fill={SAND} />
      {/* A line of sea behind the sand: everything here is a few steps from it. */}
      <rect x={0} y={y - 22} width={320} height={22} fill={SEA} />
    </>
  );
}

/** Rent a camera. Front on, under water, because that is where it is used. */
export function CameraScene({ className }: { className?: string }) {
  return (
    <svg {...BOX} className={className}>
      <defs>
        <linearGradient id="eddo-cam" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7FCDC0" />
          <stop offset="100%" stopColor={DEEP} />
        </linearGradient>
      </defs>
      <rect width={320} height={320} fill="url(#eddo-cam)" />
      {/* Shafts of light, the one thing that says this is under water rather
          than against a plain green wall. */}
      <g fill="#CDEBE4" opacity={0.22}>
        <path d="M60 0l42 0-70 320-42 0z" />
        <path d="M188 0l30 0-52 320-30 0z" />
      </g>

      <g transform="translate(160 158)">
        {/* Housing, then the port, then the lens inside it. Three rings is
            what makes a rounded square read as a camera at this size. */}
        <rect x={-62} y={-52} width={124} height={104} rx={18} fill={INK} />
        <rect x={-54} y={-44} width={108} height={88} rx={14} fill="#1B4A52" />
        <circle cx={0} cy={0} r={36} fill="#0B2228" />
        <circle cx={0} cy={0} r={27} fill="#123B44" />
        <circle cx={0} cy={0} r={16} fill="#0B2228" />
        <circle cx={-7} cy={-8} r={6} fill="#5FA9A0" opacity={0.85} />
        <rect x={-50} y={-40} width={26} height={9} rx={4.5} fill={WARM} />
        <circle cx={44} cy={-34} r={5} fill="#E8795F" />
      </g>

      {/* Bubbles, rising the way they do off a housing. */}
      <g fill="#CDEBE4" opacity={0.7}>
        <circle cx={236} cy={112} r={7} />
        <circle cx={250} cy={84} r={5} />
        <circle cx={242} cy={58} r={3.5} />
      </g>
      <g fill="#E8795F" opacity={0.75}>
        <circle cx={52} cy={252} r={13} />
        <circle cx={276} cy={268} r={16} />
      </g>
    </svg>
  );
}

/** Rent a motorbike in Waisai. Side on, on the one road there is. */
export function MotorbikeScene({ className }: { className?: string }) {
  return (
    <svg {...BOX} className={className}>
      <Ground />
      <Palm x={30} y={82} s={0.9} fill={VEG} />
      <Palm x={286} y={104} s={0.7} fill={VEG} />

      <g transform="translate(0 -30)">
        {/* Built from flat pieces rather than one silhouette path: a seat, a
            footboard, a legshield and a bar is what a scooter is, and each
            piece placed separately survives being read at card size. */}
        <rect x={56} y={186} width={92} height={26} rx={13} fill={TEAL} />
        <path d="M74 212h58l22 18h-58z" fill={TEAL} />
        <rect x={116} y={216} width={84} height={15} rx={5} fill={INK} />
        <path d="M188 231l14-56h22l-6 56z" fill={TEAL} />
        <rect x={196} y={158} width={54} height={11} rx={5.5} fill={INK} />
        <ellipse cx={224} cy={180} rx={11} ry={9} fill={WARM} />
        <path d="M250 163l10-12" stroke={INK} strokeWidth={5} strokeLinecap="round" />
        <circle cx={262} cy={148} r={7} fill={INK} />

        <circle cx={92} cy={238} r={29} fill={INK} />
        <circle cx={92} cy={238} r={11} fill={SAND} />
        <circle cx={222} cy={238} r={29} fill={INK} />
        <circle cx={222} cy={238} r={11} fill={SAND} />
      </g>
    </svg>
  );
}

/** Rent a car in Waisai. The shape a whole group and its bags arrives in. */
export function CarScene({ className }: { className?: string }) {
  return (
    <svg {...BOX} className={className}>
      <Ground />
      <Palm x={26} y={96} s={0.75} fill={VEG} />
      <Palm x={292} y={78} s={0.9} fill={VEG} />

      <g transform="translate(0 -30)">
        <path
          d="M34 240l4-38c1-11 9-19 20-20l38-4 26-28c6-6 13-9 21-9h76c10 0 18 5 23 13l20 32 28 6c12 3 20 13 20 25v23z"
          fill={TEAL}
        />
        {/* Two windows with a post between them, which is what stops a car
            shape reading as a shoe. */}
        <path d="M112 172l20-22c3-3 6-4 10-4h26v26z" fill={SKY} />
        <path d="M180 146h34c5 0 9 2 11 6l13 20h-58z" fill={SKY} />
        <rect x={168} y={146} width={8} height={26} fill={TEAL} />
        <rect x={34} y={222} width={252} height={9} fill="#1F5145" />

        <circle cx={92} cy={240} r={27} fill={INK} />
        <circle cx={92} cy={240} r={10} fill={SAND} />
        <circle cx={230} cy={240} r={27} fill={INK} />
        <circle cx={230} cy={240} r={10} fill={SAND} />
      </g>
    </svg>
  );
}

/** Eddo's merch. The shirt, with the mark that is on it. */
export function MerchScene({ className }: { className?: string }) {
  return (
    <svg {...BOX} className={className}>
      <rect width={320} height={320} fill={SKY} />
      <circle cx={160} cy={144} r={104} fill={SEA} opacity={0.45} />

      <g transform="translate(160 150) scale(.86) translate(-160 -150)">
        {/* Sleeves first and wide, then the body narrower: a shirt drawn as
            one even-width slab reads as a paper bag. */}
        <path
          d="M118 78l26-12c10 12 42 12 52 0l26 12 28 36-30 20-6-8v130c-30 8-88 8-118 0V126l-6 8-30-20z"
          fill={TEAL}
        />
        <path d="M144 66c10 12 42 12 52 0l-8-4c-8 8-28 8-36 0z" fill="#1F5145" />
        {/* The mark on the chest, the homestay's own shape said simply. */}
        <circle cx={160} cy={152} r={26} fill="#E9F6F2" />
        <path
          d="M142 156q9-8 18 0t18 0"
          stroke={TEAL}
          strokeWidth={5}
          fill="none"
          strokeLinecap="round"
        />
        <circle cx={160} cy={138} r={7} fill={TEAL} />
      </g>

      <g fill={WARM} opacity={0.8}>
        <circle cx={54} cy={238} r={14} />
        <circle cx={272} cy={222} r={10} />
      </g>
    </svg>
  );
}

/**
 * Which picture belongs to which service.
 *
 * The four water ones borrow scenes this page already shows further up, which
 * is deliberate: a reader who has scrolled past the islets and then meets them
 * again over "whole day excursion" is being told the two are the same place,
 * not being shown a repeat by accident.
 */
export function ServiceScene({
  service,
  className,
}: {
  service: ServiceKey;
  className?: string;
}) {
  switch (service) {
    case "snorkeling":
      return <SnorkelScene className={className} />;
    case "diving":
      return <ReefScene className={className} />;
    case "excursion":
      return <IsletScene className={className} warm />;
    case "transfer":
      return <JettyScene className={className} />;
    case "camera":
      return <CameraScene className={className} />;
    case "motorbike":
      return <MotorbikeScene className={className} />;
    case "car":
      return <CarScene className={className} />;
    case "merch":
      return <MerchScene className={className} />;
  }
}
