/**
 * What is in each gallery, in order.
 *
 * Filenames and their caption keys only — the captions themselves are words
 * and live in `web-content.ts` with the rest of the copy, in both languages.
 *
 * ── Adding a photograph ─────────────────────────────────────────────────────
 *
 *   1. Put the file in `public/`, lowercase, e.g. `dive-2.jpg`. The server is
 *      case-sensitive; a Mac is not.
 *   2. Add a line here with a new `caption` key.
 *   3. Add that key to `about.gallery.captions` in BOTH languages in
 *      `web-content.ts`. It is typed, so a missing translation fails the build
 *      rather than shipping an English caption onto the Indonesian page.
 *
 * The list is explicit rather than a directory scan on purpose: a gallery that
 * picks up whatever happens to be in `public/` will one day show a logo, a
 * screenshot, or a photo nobody meant to publish.
 *
 * ── The diving gallery is thin, and that is not an oversight ────────────────
 *
 * There is exactly one underwater photograph in this repository. Rather than
 * pad the gallery with land photos or with the drawn scenes, it shows the one
 * it has, full width. Add more with the three steps above and the layout
 * becomes a grid on its own.
 */

export interface GalleryItem {
  src: string;
  /** Key into `about.gallery.captions`. */
  caption: string;
}

/** The homestay: the place, the rooms, and a meal. */
export const STAY_GALLERY: GalleryItem[] = [
  { src: "/hero.jpg", caption: "aerial" },
  { src: "/3.jpg", caption: "boardwalk" },
  { src: "/standard.jpg", caption: "standardRow" },
  { src: "/family.jpg", caption: "familyFront" },
  { src: "/2.jpg", caption: "lunch" },
  { src: "/1.jpg", caption: "dusk" },
];

/** The dive centre. */
export const DIVE_GALLERY: GalleryItem[] = [
  { src: "/manta.jpg", caption: "manta" },
];
