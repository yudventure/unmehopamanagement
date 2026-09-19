import { PROPERTY } from "@/lib/web-content";

/**
 * The homestay's own badge, used across the site in place of the Unmehopa
 * mark — the manager belongs to the company, this site belongs to one
 * property, and they are not the same brand.
 *
 * The file has a solid white background, so it is masked to a circle. Its ink
 * sits at most 134px from the centre of a 300px square, which is inside the
 * 150px mask: the corners go, the badge is untouched.
 *
 * Its own file rather than a function inside the front page, because the
 * checkout page wants it too and importing it from there would pull the whole
 * site — every scene, every map, both languages of copy — into a page that
 * shows one card.
 */
export function SiteLogo({ size }: { size: number }) {
  return (
    <span
      className="block shrink-0 overflow-hidden rounded-full bg-white"
      style={{ width: size, height: size }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo.png"
        alt={`Logo ${PROPERTY.name}`}
        width={size}
        height={size}
        className="h-full w-full object-cover"
      />
    </span>
  );
}
