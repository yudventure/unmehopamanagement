/**
 * Rumah Papua mark, redrawn as vector from the owner's logo artwork: a broken
 * ring around a leaf-roofed house, with a palm on one side and a leafy sprig on
 * the other.
 *
 * Inline SVG rather than a bitmap so it stays crisp at every size, needs no
 * file in `public/`, and costs no request. It renders mostly at 40px, where the
 * palm and sprig read as texture rather than detail — true of the original
 * artwork as well.
 *
 * Draw order carries the composition: chimney first so the roof crosses its
 * foot, then the house body, then the roof leaves over its shoulders, and the
 * ground leaves last to tuck the base away.
 */

const RING_DARK = "#2B5443";
const RING_LIGHT = "#8FBB6C";
const ROOF = "#24493A";
const LEAF = "#8FBB6C";
const CREAM = "#E9DCCE";

const R = 44;
const CIRC = 2 * Math.PI * R;
const arc = (deg: number) => `${(CIRC * deg) / 360} ${CIRC}`;

export function BrandLogo({
  size = 40,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label="Logo Rumah Papua"
    >
      {/* Broken ring: two crescents, gaps at the crown and lower right */}
      <g fill="none" strokeLinecap="round" strokeWidth={4.5}>
        <circle
          cx={50}
          cy={50}
          r={R}
          stroke={RING_DARK}
          strokeDasharray={arc(212)}
          transform="rotate(52 50 50)"
        />
        <circle
          cx={50}
          cy={50}
          r={R}
          stroke={RING_LIGHT}
          strokeDasharray={arc(118)}
          transform="rotate(283 50 50)"
        />
      </g>

      {/* Leaf standing above the roof */}
      <path d="M 50 8 C 60 21 62 33 50 44 C 38 33 40 21 50 8 Z" fill={LEAF} />
      <path
        d="M 50 13 L 50 42"
        stroke={CREAM}
        strokeWidth={0.9}
        opacity={0.55}
        fill="none"
      />

      {/* Chimney: only the stack above the roofline stays visible */}
      <rect x={63.5} y={30} width={5.5} height={22} fill={ROOF} />

      {/* House body — base later tucked behind the ground leaves */}
      <path d="M 50 50 L 74 82 L 74 86 L 26 86 L 26 82 Z" fill={CREAM} />
      <g fill={ROOF}>
        <rect x={44} y={68} width={5} height={5.5} rx={0.8} />
        <rect x={51} y={68} width={5} height={5.5} rx={0.8} />
        <rect x={44} y={75} width={5} height={5.5} rx={0.8} />
        <rect x={51} y={75} width={5} height={5.5} rx={0.8} />
      </g>

      {/* Roof: two thick leaves parted by a sliver of white at the ridge */}
      <path
        d="M 48.5 28 C 44 45 37 63 29 79 C 26 82 23 83 19 84 C 15 62 25 39 48.5 28 Z"
        fill={ROOF}
      />
      <path
        d="M 51.5 28 C 56 45 63 63 71 79 C 74 82 77 83 81 84 C 85 62 75 39 51.5 28 Z"
        fill={ROOF}
      />

      {/* Palm on the left, crossing in front of the roof */}
      <g fill={RING_DARK}>
        <path d="M 22 78 C 21 68 21 57 23 47 L 25.5 47 C 24 57 24 68 24.5 78 Z" />
        <path d="M 24 46 C 18 41 11 42 7 47 C 13 44 19 44 24 48 Z" />
        <path d="M 24 46 C 30 41 37 42 41 47 C 35 44 29 44 24 48 Z" />
        <path d="M 24 45 C 21 38 23 32 28 29 C 25 35 24 40 25 45 Z" />
        <path d="M 24 46 C 19 40 14 37 8 36 C 14 40 19 43 23 47 Z" />
        <path d="M 25 46 C 30 40 35 37 41 36 C 35 40 30 43 26 47 Z" />
        <path d="M 23 47 C 18 49 14 53 12 58 C 16 53 20 50 24 49 Z" />
        <path d="M 25 47 C 30 49 34 53 36 58 C 32 53 28 50 24 49 Z" />
      </g>

      {/* Leafy sprig on the right */}
      <g fill={LEAF}>
        <path
          d="M 81 56 L 81 84"
          stroke={LEAF}
          strokeWidth={1.6}
          fill="none"
          strokeLinecap="round"
        />
        <ellipse cx={81} cy={53} rx={3.6} ry={6.6} />
        <ellipse cx={75} cy={64} rx={6.6} ry={3.4} transform="rotate(-32 75 64)" />
        <ellipse cx={87} cy={64} rx={6.6} ry={3.4} transform="rotate(32 87 64)" />
        <ellipse cx={76} cy={74} rx={5.8} ry={3} transform="rotate(-32 76 74)" />
        <ellipse cx={86} cy={74} rx={5.8} ry={3} transform="rotate(32 86 74)" />
      </g>

      {/* Ground: a dark leaf and a light one closing the base */}
      <path d="M 50 91 C 37 91 25 87 17 80 C 31 77 43 81 50 88 Z" fill={ROOF} />
      <path d="M 50 91 C 63 91 75 87 83 80 C 69 77 57 81 50 88 Z" fill={LEAF} />
    </svg>
  );
}
