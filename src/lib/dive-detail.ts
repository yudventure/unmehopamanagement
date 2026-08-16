import type { DiveKey } from "./web-content";

/**
 * The shape of each dive package's day, and how deep it goes.
 *
 * Language-neutral, so it lives here rather than in the copy: a stage lasts
 * the same forty-five minutes whichever language is reading about it.
 *
 * ── What is real and what is reconstructed ──────────────────────────────────
 *
 * Real, taken from the price list and the section copy: how many dives each
 * package has, its total duration, the boat being 20 to 45 minutes out, the
 * twelve-metre ceiling on Discover Scuba, the four days of the Open Water
 * course, six divers per guide.
 *
 * Reconstructed: the minutes given to each individual stage. They are a
 * plausible division of a stated total, not a schedule anybody has kept, and
 * the page says so under the diagram rather than presenting them as fact. Only
 * the proportions are drawn, never a clock time. **Worth an owner's five
 * minutes to correct**; nothing else on the page depends on them.
 */

export type StageKey =
  | "brief"
  | "boat"
  | "dive"
  | "interval"
  | "lunch"
  | "back"
  | "shallow"
  | "snorkel"
  | "rest";

export interface Stage {
  key: StageKey;
  minutes: number;
  /** In the water, as opposed to on the boat or at the homestay. */
  water?: boolean;
}

export interface DiveDetailFacts {
  /** Empty where the package is not a trip with a shape, like gear hire. */
  stages: Stage[];
  /** Metres, or null where the package never leaves the surface. */
  depth: number | null;
  /** Days, for the course. Null for everything that happens in one go. */
  days: number | null;
  /** From `public/`. */
  photo: string;
}

const d = (key: StageKey, minutes: number, water = false): Stage => ({
  key,
  minutes,
  water,
});

export const DIVE_DETAIL: Record<DiveKey, DiveDetailFacts> = {
  /* ~4 hrs, two dives. */
  fun2: {
    stages: [
      d("brief", 15),
      d("boat", 35),
      d("dive", 45, true),
      d("interval", 55),
      d("dive", 45, true),
      d("back", 45),
    ],
    depth: 18,
    days: null,
    photo: "/manta.jpg",
  },
  /* Full day, three dives, lunch on the boat. */
  fun3: {
    stages: [
      d("brief", 20),
      d("boat", 45),
      d("dive", 45, true),
      d("interval", 60),
      d("dive", 45, true),
      d("lunch", 60),
      d("boat", 40),
      d("dive", 45, true),
      d("back", 60),
    ],
    depth: 18,
    days: null,
    photo: "/manta.jpg",
  },
  /* ~3 hrs. Shallows in front of the homestay first, then one shallow dive. */
  dsd: {
    stages: [
      d("brief", 30),
      d("shallow", 45, true),
      d("boat", 20),
      d("dive", 40, true),
      d("back", 20),
      d("rest", 25),
    ],
    depth: 12,
    days: null,
    /* The aerial: the shallow turquoise in front of the homestay is exactly
       where this one starts. */
    photo: "/hero.jpg",
  },
  /* Four days: theory in the afternoons, water in the mornings. */
  ow: {
    stages: [],
    depth: 18,
    days: 4,
    /* The boardwalk and the calm water in front of it: the theory happens at
       the homestay and the practice happens right there. Not `1.jpg`, which is
       a close portrait of a guest — a recognisable face should not headline a
       paid product page unless we know they agreed to it. */
    photo: "/3.jpg",
  },
  /* ~5 hrs on the surface. */
  snorkel: {
    stages: [
      d("brief", 15),
      d("boat", 55),
      d("snorkel", 65, true),
      d("rest", 40),
      d("snorkel", 55, true),
      d("back", 55),
    ],
    depth: null,
    days: null,
    photo: "/manta.jpg",
  },
  /* Kit for the day. No trip of its own, so no shape to draw. */
  gear: {
    stages: [],
    depth: null,
    days: null,
    photo: "/3.jpg",
  },
};
