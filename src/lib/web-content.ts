import { seedRooms, TURTLE_RATES } from "./data";
import { MAX_SPAN } from "./days";
import { SITE_CONFIG, siteConfig } from "./site-config";

/**
 * Everything the public site says, in all seven languages, in one place — so
 * copy can be edited without reading a component, and so nothing is stated
 * twice in a way that could drift apart.
 *
 * The split is between **facts** and **words**. A price, a room count and a
 * phone number are the same in every language and live once, at the top. Every
 * string that a reader reads lives in `COPY`, which is typed by one interface
 * so a missing translation is a build error rather than a page that silently
 * falls back to the wrong language.
 *
 * The contact details and the dive prices are NOT here. They come from
 * `content/site.json` by way of `site-config.ts`, because those are the things
 * an owner changes without wanting to open an editor — the CMS tab in the
 * manager writes that file. Room rates come from `seedRooms()`, the same table
 * the manager prices bookings from, so the site and the manager cannot
 * disagree about what a room costs.
 */

export type Lang = "en" | "id" | "fr" | "ja" | "de" | "ru" | "zh";

/**
 * The seven languages this site is written in, in the order the picker lists
 * them.
 *
 * English first: most guests reaching this page are not Indonesian. The five
 * after Indonesian are the ones Eddo already spoke, added here so that the two
 * homestays answer the same reader in the same language — a guest who walked
 * from one site to the other used to arrive to find the words had changed
 * back to English.
 *
 * Each one is named in itself. Somebody hunting for their own language is
 * looking for the shape of their own word, and a reader who needs the Japanese
 * page cannot be expected to first find the English word "Japanese".
 */
export const LANGS: { key: Lang; short: string; label: string }[] = [
  { key: "en", short: "EN", label: "English" },
  { key: "id", short: "ID", label: "Bahasa Indonesia" },
  { key: "fr", short: "FR", label: "Français" },
  { key: "ja", short: "JA", label: "日本語" },
  { key: "de", short: "DE", label: "Deutsch" },
  { key: "ru", short: "RU", label: "Русский" },
  { key: "zh", short: "ZH", label: "中文" },
];

export const DEFAULT_LANG: Lang = "en";

/**
 * Whether a stored or supplied value is one of them.
 *
 * Checked against the list rather than against a hand-written union, so adding
 * a language is one edit rather than two that have to agree.
 */
export function isLang(v: unknown): v is Lang {
  return typeof v === "string" && LANGS.some((l) => l.key === v);
}

// ------------------------------------------------------------------- facts

/** Edited in the CMS tab, stored in `content/site.json`. */
const TURTLE = siteConfig("turtle");
export const WHATSAPP = TURTLE.contact.whatsapp;
export const EMAIL = TURTLE.contact.email;

/**
 * Proper nouns, which stay as they are in every language.
 *
 * The place is written the way the family writes it on their own pages:
 * Mansuar Kecil, the islet, which is the one everybody else calls Pulau Kri.
 * It used to say Yenbuba, Pulau Mansuar — the village across the channel,
 * where Eddo is — and that put this homestay on the wrong island in seven
 * languages, in the page title, and in the line under the map.
 */
export const PROPERTY = {
  name: "Turtle Dive Homestay",
  /** The hamlet, as the address on their own site names it. */
  village: "Mansuar Kecil",
  /** The island a diver would recognise it by. */
  island: "Pulau Kri",
};

/**
 * Where the homestay is.
 *
 * The plus code is what the owner gave; `lat`/`lng` are that code decoded and
 * round-tripped back to the same code, so the two cannot drift apart. The cell
 * a full plus code names is about three metres across, which is a doorway, not
 * a village.
 *
 * Every map link is built from the coordinates rather than from the address
 * text: a place name has to be searched and can match the wrong thing, while a
 * coordinate lands where it lands.
 */
export const LOCATION = {
  plusCode: "CMP9+HJR",
  lat: -0.563516,
  lng: 130.669038,
  area: "Mansuar Kecil (Pulau Kri)",
  /* Word for word from the family's own contact page, province and postcode
     included: an address is a thing somebody copies into a form. */
  admin: "Distrik Meos Mansar, Kepulauan Raja Ampat, Papua Barat Daya 98472",
};

export const MAP_LINKS = {
  google: `https://www.google.com/maps/search/?api=1&query=${LOCATION.lat},${LOCATION.lng}`,
  osm: `https://www.openstreetmap.org/?mlat=${LOCATION.lat}&mlon=${LOCATION.lng}#map=14/${LOCATION.lat}/${LOCATION.lng}`,
  /** Documented, key-free embed. Loaded only once the dialog is open. */
  embed: `https://www.openstreetmap.org/export/embed.html?bbox=${LOCATION.lng - 0.055},${LOCATION.lat - 0.035},${LOCATION.lng + 0.055},${LOCATION.lat + 0.035}&layer=mapnik&marker=${LOCATION.lat},${LOCATION.lng}`,
};

export function waLink(message: string) {
  return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(message)}`;
}

/**
 * Rupiah either way, since the currency does not change with the reader, but
 * the grouping does: 450.000 to an Indonesian eye, 450,000 to an English one,
 * 450 000 to a Russian or a French one.
 *
 * Takes a language tag rather than a union. It used to be a two-value union
 * mapped to one of two locales, which meant every reader who was neither
 * English nor Indonesian silently got English grouping — true of nobody while
 * this site had two languages, and true of five readers in seven the moment it
 * had seven. A tag is also what the browser wants anyway, so the map in the
 * middle was doing nothing but narrowing.
 */
export function money(n: number, locale: string) {
  /* An unknown tag makes `toLocaleString` throw, and a price is not worth a
     blank page. */
  try {
    return "Rp " + Math.round(n).toLocaleString(locale || "en");
  } catch {
    return "Rp " + Math.round(n).toLocaleString("en");
  }
}

/**
 * The one kind of bungalow, as a list as well as a union, because a room key
 * that arrives in a request body has to be checked against something at
 * runtime and a type is gone by then.
 *
 * One rather than two: the family's own price list offers the Deluxe Bungalow
 * and nothing else. A "standard" and a "family" room lived here before, at
 * 450 and 650 thousand, and neither was ever theirs — they were invented to
 * fill a two-column grid while the site was being designed. A list is kept
 * rather than a single value so that a second kind, if they ever build one,
 * is a line of data instead of a rewrite.
 */
export const ROOM_KEYS = ["deluxe"] as const;
export type RoomKey = (typeof ROOM_KEYS)[number];

export interface RoomFacts {
  key: RoomKey;
  /** Per night, with one person in it. */
  rateOne: number;
  /** Per night, with two. */
  rateTwo: number;
  count: number;
}

/**
 * The bungalow, priced from the table the manager prices bookings from.
 *
 * Individual bungalows are deliberately not listed: which of the ten a guest
 * gets is an operational decision, and one out for renovation must never
 * appear here as something to book.
 *
 * Two figures rather than one, because the family charges by how many people
 * sleep in it and the second head is cheaper than the first. The two-person
 * figure is the room table's own column, so the site and the manager cannot
 * disagree about the usual sale; the single figure sits beside it in
 * `TURTLE_RATES`, where the manager has no column for it.
 */
export function roomFacts(): RoomFacts[] {
  const rooms = seedRooms().filter((r) => r.prop === "turtle");
  return [
    {
      key: "deluxe",
      rateOne: TURTLE_RATES.one,
      rateTwo: rooms[0]?.rate ?? 0,
      count: rooms.length,
    },
  ];
}

/**
 * What an extra bed costs, by the age of whoever sleeps in it.
 *
 * Printed on the page and never charged by it. Adding a third person means
 * saying an age out loud and somebody agreeing there is room for the bed, so
 * the site states the figures and asks for a message. The price list allows
 * one extra bed per bungalow.
 */
export const EXTRA_BED = TURTLE_RATES.extraBed;

/** The three age bands, so the words and the figures cannot fall out of step. */
export type ExtraBedKey = keyof typeof EXTRA_BED;

/**
 * The hours the day runs to, from the notes on the family's own price list.
 *
 * Facts, not words: 12:30 is 12:30 in all seven languages, and the labels
 * beside these — "check-in", "the generator runs" — are the part that gets
 * translated. Written once here so that seven copies of a time cannot drift
 * apart, which is how a site ends up promising breakfast at 07:00 in English
 * and 08:00 in German.
 */
export const HOUSE = {
  checkIn: "12:30",
  checkOut: "11:00",
  /** The generator's hours. There is no power outside them. */
  power: { from: "18:00", to: "24:00" },
  meals: { breakfast: "07:00", lunch: "12:00", dinner: "19:00" },
} as const;

/**
 * The six packages that can be described at length, and paid for here.
 *
 * Not the whole list — `PRICE_ROWS` is, and every row of it is now a card on
 * the page. These six are the ones with a name, a blurb, a duration and a list
 * of what is included, written and checked in seven languages; the other
 * fifteen carry the sentence the family's own list carries and nothing
 * invented on top of it.
 *
 * They are also the only six `priceTurtle` will take money for. A card outside
 * this list shows its price and is arranged by message, which is what the
 * family does with them anyway.
 *
 * `guide` used to be `gear`, a day's equipment hire at 350,000. No such thing
 * is sold: the family's list says equipment and the boat are included in every
 * local dive, and a diver who brings their own pays 100,000 less. A private
 * guide at 400,000 a day is real, is charged by the day like the hire was, and
 * is what that card is now.
 */
export const DIVE_KEYS = [
  "fun2",
  "fun3",
  "dsd",
  "ow",
  "snorkel",
  "guide",
] as const;
export type DiveKey = (typeof DIVE_KEYS)[number];

/**
 * Every figure the dive centre charges, edited in the CMS tab and stored in
 * `content/site.json`.
 *
 * Keyed loosely rather than by `DiveKey`, because the card keys are only six
 * of the twenty-one: the price list and the excursion boats are in here too,
 * and all of them are looked up the same way. A key with no figure, or a zero,
 * is not a thing that can be bought — it reads as "ask" on the page and
 * `priceTurtle` refuses it — which is how the two rows the family's own list
 * leaves unreadable or unpriced are carried without being invented.
 */
export const DIVE_PRICE = SITE_CONFIG.divePrices as Record<string, number>;

/** Rupiah, or 0 when nobody has filled it in. */
export function divePrice(key: string): number {
  const v = DIVE_PRICE[key];
  return typeof v === "number" && v > 0 ? v : 0;
}

/** What a figure on the price list is charged per. */
export type PriceUnit = "person" | "day" | "tank" | "boat";

/**
 * How the price list is grouped on the page.
 *
 * Twenty-one cards in one run is a wall, and the family's own list is not one
 * run either: it is dives you can do from here, dives that go out at night,
 * learning to dive or getting back into it, the two things that are neither,
 * and the boat for a day that leaves the island. The groups are that, and
 * nothing finer — a heading for every two lines is a page of headings.
 */
export type PriceGroup = "fun" | "night" | "learn" | "extra" | "boat";

/**
 * The dive price list, in the order the family prints it.
 *
 * Facts only — a key, what it is charged per, and the smallest party the boat
 * will go out with. The words for each line are in `COPY[*].dive.list.rows`,
 * and the figures are in `content/site.json`, so a price change is a number in
 * one file and a translation change is a sentence in another.
 *
 * Four of these keys are also card keys (`fun2`, `fun3`, `dsd`, `guide`). That
 * is deliberate: the card and the row are the same sale, and sharing the key
 * means they cannot end up quoting different figures for it.
 */
export const PRICE_ROWS: {
  key: string;
  per: PriceUnit;
  min?: number;
  group: PriceGroup;
}[] = [
  { key: "one", per: "person", group: "fun" },
  { key: "fun2", per: "person", group: "fun" },
  { key: "fun3", per: "person", group: "fun" },
  { key: "piaynemo2", per: "person", group: "fun" },
  { key: "manta2", per: "person", min: 3, group: "fun" },
  { key: "mantaPm", per: "person", min: 3, group: "fun" },
  { key: "yangefo2", per: "person", min: 3, group: "fun" },
  { key: "p47", per: "person", min: 3, group: "fun" },
  { key: "houseReef", per: "person", group: "fun" },
  /* Not on the family's 2025 list, and real all the same: they take
     snorkellers out, and they teach the course. Both sit at the end of their
     group rather than in the middle of it, because the order above is the
     order the family prints and these two were never in it. Neither is
     priced, so both cards ask. */
  { key: "snorkel", per: "person", group: "fun" },
  { key: "nightYenbuba", per: "person", min: 2, group: "night" },
  { key: "nightSawandarek", per: "person", min: 2, group: "night" },
  { key: "dsd", per: "person", group: "learn" },
  { key: "refresh", per: "person", group: "learn" },
  { key: "ow", per: "person", group: "learn" },
  { key: "guide", per: "day", group: "extra" },
  { key: "tank", per: "tank", group: "extra" },
  /* Chartered whole rather than sold by the head, which is why they are their
     own group and not a footnote under the dives. */
  { key: "boatPiaynemo", per: "boat", group: "boat" },
  { key: "boatPiaynemoJoin", per: "boat", group: "boat" },
  { key: "boatYangefo", per: "boat", group: "boat" },
  { key: "boatBatanta", per: "boat", group: "boat" },
];

/** The groups in the order they are drawn. */
export const PRICE_GROUPS: PriceGroup[] = [
  "fun",
  "night",
  "learn",
  "extra",
  "boat",
];

/**
 * How many cards a group shows before the rest go behind a button.
 *
 * Six is two full rows at the width this grid uses, so the fold lands on a
 * row boundary rather than in the middle of one. Only the fun dives are over
 * it today; the button exists per group so that adding a night dive or a
 * course does not mean rethinking the section.
 */
export const PRICE_SHOWN = 6;

/**
 * The boat for an excursion, which is chartered rather than sold by the head.
 *
 * Derived rather than listed, now that the boats are rows like any other: a
 * second list would be a second place to forget. Kept as a name because the
 * CMS and the copy both talk about the boats as a thing of their own.
 */
export const BOAT_ROWS: string[] = PRICE_ROWS.filter(
  (r) => r.group === "boat",
).map((r) => r.key);

/** Drawn as the accented card. */
export const DIVE_FEATURED: DiveKey = "fun3";

/**
 * What each package's price is multiplied by.
 *
 * A fact, not a word: five of the six are charged per person and the guide is
 * charged per day, and that is true whichever language the page is being read
 * in. The copy says "per person" and "per hari" beside the figure, which is
 * the same fact written for a reader; this is the one the arithmetic uses.
 *
 * Keeping them apart matters because the words are translated and the rule is
 * not. Deciding how to multiply by looking at whether the unit string reads
 * "per day" would work in English and quietly charge a day of a guide per
 * person to everyone reading Indonesian.
 */
export const DIVE_PER: Record<DiveKey, "person" | "day"> = {
  fun2: "person",
  fun3: "person",
  dsd: "person",
  ow: "person",
  snorkel: "person",
  guide: "day",
};

/**
 * How many people a bungalow sleeps, before an extra bed is arranged.
 *
 * The same number as the `cap` line in the room table and the `cap` line in
 * the copy, written once more here because this is the one of the three that
 * is arithmetic: it is the top of the guest picker, and it is what the price
 * list has a figure for. Reading it out of either of the others would mean
 * parsing "2 dewasa" for its digits, which is a sentence, not a number.
 *
 * A third person is not refused, only not sold here: the page prints the
 * extra-bed prices and asks for a message, because the figure depends on an
 * age nobody has been told.
 */
export const ROOM_SLEEPS: Record<RoomKey, number> = { deluxe: 2 };

/**
 * Per night, for that many people in the bungalow. Null when it is not a
 * number of people this bungalow is sold for.
 *
 * Two prices and a lookup rather than a rate multiplied by heads: one person
 * pays 850 and two pay 1,550, and `850 × 2` would take 1,700,000 from a
 * couple — 150,000 a night more than the family charges, every night, in a
 * way a guest only notices against the price list.
 */
export function roomRate(key: RoomKey, guests: number): number | null {
  const facts = roomFacts().find((r) => r.key === key);
  if (!facts) return null;
  if (!Number.isInteger(guests) || guests < 1 || guests > ROOM_SLEEPS[key]) {
    return null;
  }
  const rate = guests === 1 ? facts.rateOne : facts.rateTwo;
  return rate > 0 ? rate : null;
}

/** Six divers per guide is the boat's limit, and the copy says so out loud. */
export const MAX_DIVERS = 6;

/** What a Turtle order comes to, and what the number of them counts. */
export interface TurtleSale {
  /**
   * What it is, in English, for the Midtrans dashboard and the receipt.
   *
   * English rather than the reader's language for the same reason Eddo's items
   * are: this line is read by the family in the dashboard and by a guest who
   * may have been reading the site in either language. One language beats a
   * different one every time.
   */
  name: string;
  /** Rupiah, per whatever `per` says. */
  unitPrice: number;
  count: number;
  total: number;
  /** Nights, divers, or days a private guide is booked for. */
  per: "night" | "person" | "day";
}

/**
 * The one place a Turtle order is priced.
 *
 * Called three times for every payment and never with a figure from the
 * browser: the checkout page calls it to show a total, `/api/pay` calls it
 * again before asking Midtrans for a token, and the two agree because they are
 * the same function reading the same two tables. A price that arrives in a
 * request body is a price the sender chose.
 *
 * Returns null for anything it cannot price — a room type that does not exist,
 * a package whose price the owner has not filled in, a count outside what the
 * boat and the calendar allow. Null is what the endpoint answers 422 to and
 * what the summary page shows as nothing to pay, which is the right answer for
 * a draft that was tampered with and for one that went stale.
 */
export function priceTurtle(v: {
  kind: string;
  /** For a room. */
  room?: string;
  /** For a dive package. */
  pack?: string;
  /** Nights, divers or days, depending on which of the two this is. */
  count: number;
  /**
   * For a room, how many people sleep in it — which is half of what it costs,
   * not a detail for the housekeeping note. Anything the bungalow is not sold
   * for is priced as nothing at all rather than rounded down to two: a party
   * of four quietly charged for two is four people at a door with two beds,
   * after the money has moved.
   */
  guests?: number;
}): TurtleSale | null {
  const count = Math.floor(v.count);
  if (!Number.isFinite(count) || count < 1) return null;

  if (v.kind === "room") {
    const key = ROOM_KEYS.find((k) => k === v.room);
    if (!key) return null;
    if (count > MAX_SPAN) return null;
    const guests = Math.floor(Number(v.guests));
    const rate = roomRate(key, guests);
    if (!rate) return null;
    return {
      /* The head count is part of the name because it is part of the price:
         the same bungalow on the same night is two different figures, and a
         receipt that says only "Deluxe Bungalow" cannot be checked against
         the price list by the family or by the guest. */
      name: `${EN.rooms.types[key].name}, ${guests === 1 ? "1 guest" : `${guests} guests`}`,
      unitPrice: rate,
      count,
      total: rate * count,
      per: "night",
    };
  }

  if (v.kind === "dive") {
    const key = DIVE_KEYS.find((k) => k === v.pack);
    if (!key) return null;
    /* A package the owner has not priced is not for sale. The CMS can leave a
       figure out, and a missing one must read as "ask us" rather than as free. */
    const price = DIVE_PRICE[key];
    if (typeof price !== "number" || price <= 0) return null;
    const per = DIVE_PER[key];
    /* Gear is hired by the day and the rest are sold by the head, so the two
       are capped by different things: the calendar, and the boat. */
    if (count > (per === "day" ? MAX_SPAN : MAX_DIVERS)) return null;
    return {
      name: EN.dive.packages[key].name,
      unitPrice: price,
      count,
      total: price * count,
      per,
    };
  }

  return null;
}

/**
 * Everything either site can be asked about, in one list.
 *
 * Neither site offers all of it. Turtle has a dive centre and no hire;
 * Eddo has hire and sends divers to Turtle. So this is the vocabulary, not the
 * menu: each site passes the subset it can actually answer for, and the
 * enquiry dialog has no default of its own so that picking is never skipped by
 * accident.
 */
export const ACTIVITY_KEYS = [
  "stay",
  "diving",
  "snorkeling",
  "both",
  "motorbike",
  "camera",
  "package",
  /* The rest of what Eddo's family arranges, added when the site grew a
     section listing it. They are here rather than in Eddo's own file because
     this list is the shared vocabulary the enquiry dialog speaks, and a word
     only one site uses is still a word. Turtle does not name them and does not
     have to, which is what `activities` being partial below is for. */
  "excursion",
  "merch",
  "car",
  "transfer",
] as const;
export type ActivityKey = (typeof ACTIVITY_KEYS)[number];

/** What Turtle answers for: a dive centre, and no hire desk. */
export const TURTLE_ACTIVITIES = ["stay", "diving", "snorkeling", "both"] as const;

// ------------------------------------------------------------------- words

interface CardCopy {
  title: string;
  sub: string;
  badge: string;
  alt: string;
}

interface RoomCopy {
  name: string;
  blurb: string;
  cap: string;
  features: string[];
  /** Describes the photograph, for a reader who cannot see it. */
  alt: string;
}

interface DiveCopy {
  name: string;
  blurb: string;
  duration: string;
  level: string;
  unit: string;
  includes: string[];
}

/** The long form of a package, on its own page. */
interface DivePackDetail {
  lede: string;
  forYou: string[];
  notIncluded: string[];
  bring: string[];
}

interface DiveDetailCopy {
  back: string;
  dayHeading: string;
  daysHeading: string;
  depthHeading: string;
  includedHeading: string;
  notIncludedHeading: string;
  bringHeading: string;
  forHeading: string;
  /** Names each stage of the day; shared by every package. */
  stages: Record<string, string>;
  inWater: string;
  onLand: string;
  surface: string;
  hourShort: string;
  minShort: string;
  limitLabel: (m: number) => string;
  depthMarks: { depth: number; label: string }[];
  noDepth: string;
  /** Says out loud that the per-stage minutes are approximate. */
  approxNote: string;
  courseDays: { title: string; body: string }[];
  cta: string;
  priceUnit: string;
  packs: Record<DiveKey, DivePackDetail>;
}

interface BandCopy {
  label: string;
  months: string;
  note: string;
}

export interface SiteCopy {
  htmlLang: string;
  nav: { home: string; rooms: string; diving: string; season: string; journey: string; faq: string };
  book: string;
  openMenu: string;
  /** Names the currency picker for a screen reader. */
  currencyLabel: string;
  /** Names the language picker for a screen reader. */
  langLabel: string;
  /** Says the second price line is a conversion, not the charge. */
  currencyNote: string;
  meta: { title: string; description: string };
  /** The holding page, shown on every public route while the switch is on. */
  maintenance: {
    eyebrow: string;
    title: string;
    body: string;
    contactLead: string;
    whatsapp: string;
    email: string;
  };
  hero: { sub: string };
  value: {
    heading: string;
    headingBreak: string;
    eyebrow: string;
    title: string;
    body: string;
    cta: string;
    ctaNote: string;
  };
  cards: CardCopy[];
  rooms: {
    eyebrow: string;
    title: string;
    intro: string;
    perNight: string;
    /** Beside each of the two figures, saying which one it is. */
    forOne: string;
    forTwo: string;
    roomsLabel: (n: number) => string;
    ask: string;
    askNote: (name: string) => string;
    otaNote: string;
    types: Record<RoomKey, RoomCopy>;
    /**
     * The third person in a bungalow. The figures are in `EXTRA_BED`; these
     * are the words that go beside them.
     */
    extra: {
      heading: string;
      ages: Record<ExtraBedKey, string>;
      per: string;
      note: string;
    };
    /**
     * The house rules from the family's own price list. Labels only: the
     * times themselves are in `HOUSE`, where they are written once for all
     * seven languages rather than seven times.
     */
    rules: {
      heading: string;
      checkIn: string;
      checkOut: string;
      power: string;
      meals: string;
      diet: string;
      refund: string;
    };
  };
  dive: {
    badge: string;
    title: string;
    body: string;
    /**
     * The card's link through to the package's own page.
     *
     * Not drawn anywhere today. The owner asked for the link off the cards —
     * every row of the price list is a card now, only six of them have a page
     * behind one, and a link on a quarter of the cards reads as though those
     * four are the real ones. The pages are still served at
     * `/turtle/dive/<key>` and this is still the word for reaching them, in
     * seven languages, for whenever they are linked again.
     */
    details: string;
    /** Sits over the SSI mark. Names the relationship, nothing more. */
    partner: string;
    orderNote: (name: string) => string;
    footnote: string;
    /** Stands where a figure would, for anything the owner has not priced. */
    askPrice: string;
    /**
     * Names the clip above the booking bar, for a reader who cannot see it.
     *
     * The video itself is filled in from the CMS, not here: if there is none,
     * nothing is drawn and this is never read out.
     */
    videoLabel: string;
    /**
     * Stands in the band while nobody has put a clip in it.
     *
     * The slot is filled from the CMS and is empty until somebody fills it.
     * Drawing nothing was the first answer and the wrong one: the person who
     * most needs to see where the clip goes is the owner, on their own site,
     * and they could not. So the space is shown and says what belongs in it.
     * It is gone the moment an address is saved.
     */
    videoSoon: string;
    /**
     * On the still that a YouTube clip shows until somebody asks for it.
     *
     * Read out with the clip's name after it, so a screen reader announces
     * "Play: diving with Turtle Dive Center" rather than a bare "Play" that
     * could belong to anything on the page.
     */
    videoPlay: string;
    /**
     * The family's own price list, which is longer than the six cards.
     *
     * Words only: every figure comes from `content/site.json` and every unit
     * and minimum from `PRICE_ROWS`, so a price that changes is one number in
     * one file rather than seven sentences in seven languages.
     */
    list: {
      heading: string;
      intro: string;
      /** A heading per group of cards, and the label on its tab. */
      groups: Record<PriceGroup, string>;
      /**
       * The line under a group's heading, once its tab is open.
       *
       * Says what the group is for in the reader's own words, and names the
       * places rather than repeating the prices underneath it. Every one of
       * them is built out of the rows in that group — the sites, the
       * minimums, what is neither a trip nor a course — so nothing here is a
       * claim the price list does not already make.
       */
      groupNote: Record<PriceGroup, string>;
      /** The smallest party the boat goes out with, for the rows that have one. */
      min: (n: number) => string;
      per: Record<PriceUnit, string>;
      /**
       * The heading on a card, for the rows that need one.
       *
       * A long row — "two fun dives at the manta cleaning station and Arborek
       * — Manta Ridge or Manta Sandy" — is a description, not a heading, so it
       * gets a short form here and keeps the sentence underneath. A short one
       * — "one fun dive", "night dive at Sawandarek" — is already its own
       * heading, and giving it a name as well made the card say the same
       * thing twice in a row. Those are simply not in here, and `diveCards`
       * reads a missing entry as "the sentence is the heading".
       *
       * The six packages are not in here either: they have a name of their
       * own in `packages`, written before this existed and better than a short
       * form would be.
       */
      names: Record<string, string>;
      rows: Record<string, string>;
      notes: string[];
      boats: Record<string, string>;
      /** What happens after dinner, and how a dive is actually reserved. */
      plan: string;
      reserve: string;
    };
    packages: Record<DiveKey, DiveCopy>;
    detail: DiveDetailCopy;
    /** The booking bar above the packages. */
    bar: {
      pack: string;
      when: string;
      divers: string;
      diverCount: (n: string) => string;
      submit: string;
      note: (pack: string, divers: string) => string;
    };
  };
  season: { eyebrow: string; title: string; intro: string; bands: BandCopy[] };
  journey: {
    eyebrow: string;
    title: string;
    intro: string;
    steps: { title: string; body: string }[];
    map: {
      open: string;
      title: string;
      here: string;
      sorong: string;
      waisai: string;
      sketchAlt: string;
      copy: string;
      copied: string;
      google: string;
      osm: string;
      live: string;
      note: string;
    };
  };
  enquiry: {
    modalTitle: string;
    modalIntro: string;
    close: string;
    name: string;
    namePlaceholder: string;
    phone: string;
    phonePlaceholder: string;
    email: string;
    emailPlaceholder: string;
    contactNote: string;
    what: string;
    when: string;
    people: string;
    nights: string;
    notes: string;
    notesPlaceholder: string;
    submit: string;
    sending: string;
    sent: string;
    needContact: string;
    failed: string;
  };
  /**
   * Booking and paying, which the enquiry above is deliberately not.
   *
   * Two different things a reader can do about the same room, and the site
   * offers both: a message when they want to ask something, and an order when
   * they have decided. The words are kept apart for the same reason — nothing
   * in the enquiry should read as a purchase, and nothing here should read as
   * a question.
   */
  booking: {
    /** On a room card, a dive card, and a package's own page. */
    cta: string;
    title: string;
    intro: string;
    /** Names the thing being bought, at the top of the dialog. */
    what: string;
    close: string;
    checkIn: string;
    checkOut: string;
    nights: string;
    nightsValue: (n: number) => string;
    guests: string;
    guestsValue: (n: number) => string;
    /** The one day a dive is booked for. */
    day: string;
    /** Gear is hired for a stretch of days, so it asks for two. */
    fromDay: string;
    untilDay: string;
    days: string;
    daysValue: (n: number) => string;
    divers: string;
    diversValue: (n: number) => string;
    total: string;
    /** The dialog's button. It goes to the summary, not to Midtrans. */
    next: string;
    /** Under whichever box was asked for and left empty. */
    required: string;
    failed: string;
    /** Says out loud that paying does not hold a night by itself. */
    hold: string;
    /** The summary page an order is looked over on before it is paid. */
    order: {
      title: string;
      intro: string;
      what: string;
      who: string;
      empty: string;
      back: string;
      pay: string;
      payNote: string;
      paid: string;
      paidNote: string;
      failed: string;
      home: string;
    };
  };
  about: {
    /** The button on the home page that leads here. */
    cta: string;
    back: string;
    title: string;
    lede: string;
    storyHeading: string;
    story: string[];
    roomsHeading: string;
    roomsIntro: (total: number) => string;
    roomsTotal: (total: number) => string;
    serviceHeading: string;
    serviceIntro: string;
    services: { title: string; body: string }[];
    diveHeading: string;
    diveStory: string[];
    /** Reads differently depending on which years the owner has filled in. */
    since: (year: number) => string;
    diveSince: (year: number, gap: number) => string;
    diveSinceNoYear: string;
    diveLink: string;
    gallery: {
      stayHeading: string;
      stayIntro: string;
      diveHeading: string;
      diveIntro: string;
      open: string;
      prev: string;
      next: string;
      /** Keyed by the caption names in `lib/gallery.ts`. */
      captions: Record<string, string>;
    };
    whereHeading: string;
    closeHeading: string;
    closeBody: string;
    closeCta: string;
  };
  faq: { eyebrow: string; title: string; items: { q: string; a: string }[] };
  footer: {
    contact: string;
    manager: string;
    colophon: string;
    /** Takes the founding year when there is one, and drops it when there is not. */
    tagline: (year: number | null) => string;
    social: string;
    feedback: {
      heading: string;
      intro: string;
      message: string;
      messagePlaceholder: string;
      email: string;
      emailPlaceholder: string;
      submit: string;
      sending: string;
      sent: string;
      empty: string;
      failed: string;
    };
  };
  /**
   * What each thing a visitor can ask about is called, in this site's words.
   *
   * Partial, because the list above is the vocabulary and not the menu: Eddo
   * arranges cars, boats and guides and names them, Turtle does not and should
   * not have to invent words for a hire desk it has never had. The dialog only
   * ever looks up the keys a site passed it, and falls back to the key itself
   * if one is somehow missing, so a gap here is a plain label rather than an
   * empty option nobody can choose.
   */
  activities: Partial<Record<ActivityKey, string>>;
  months: string[];
  /** The WhatsApp text, assembled from whatever the visitor filled in. */
  message: (v: {
    activity: string;
    name: string;
    phone: string;
    email: string;
    when: string;
    people: string;
    nights: string;
    notes: string;
    withNights: boolean;
  }) => string;
}

const EN: SiteCopy = {
  htmlLang: "en",
  nav: {
    home: "Home",
    rooms: "Rooms",
    diving: "Diving",
    season: "Season",
    journey: "Getting Here",
    faq: "Questions",
  },
  book: "Book",
  openMenu: "Open menu",
  currencyLabel: "Show an approximate price in",
  langLabel: "Read this site in",
  currencyNote: "Prices are charged in rupiah. The second line is an approximate conversion, refreshed a few times a day.",
  meta: {
    title: `${PROPERTY.name} · Homestay & Dive Center in Raja Ampat`,
    description:
      "A family homestay and dive centre on Pulau Kri, Raja Ampat. Bungalows on stilts at the water's edge, three meals a day, and daily diving in the Dampier Strait.",
  },
  maintenance: {
    eyebrow: "Back shortly",
    title: "We are working on\nthis page",
    body: "The site is having some work done and will be back on its own. Nothing about the homestay has changed: the rooms are there, the boat goes out, and we are answering messages as usual.",
    contactLead: "Reach us in the meantime",
    whatsapp: "Message on WhatsApp",
    email: "Send an email",
  },
  hero: {
    sub: "A homestay on Pulau Kri, built by hand from local timber and standing at the edge of a reef we leave the way we found it. Kept by the family who has always lived in this bay, at the pace the tide sets.",
  },
  value: {
    heading: "One jetty, one family,",
    headingBreak: "and the reef right in front of it",
    eyebrow: "01 · Why here",
    title: "Hospitality that feels\nlike family.",
    body: "Guests are looked after by the family who built this homestay and still live here. The rooms are traditional Papuan work in timber and thatch, simple by design, and a Starlink connection reaches almost every one of them, fast enough for a video call. Every deck opens onto the same view: the Dampier Strait, the karst islands beyond it, and the reef directly below.",
    cta: "Ask about availability",
    ctaNote: "I would like to know what rooms are free.",
  },
  cards: [
    {
      title: "Evening on the jetty",
      sub: "Sunset from the end of the walkway",
      badge: "Jetty",
      alt: "A guest sitting at the end of the jetty at sunset",
    },
    {
      title: "Eating together",
      sub: "Three meals a day, one table",
      badge: "Dining hut",
      alt: "Two guests eating under a thatched wooden hut",
    },
    {
      title: "Rooms at the water's edge",
      sub: "Ten rooms along one boardwalk",
      badge: "Pulau Kri",
      alt: "The boardwalk in front of a row of thatched bungalows",
    },
  ],
  rooms: {
    eyebrow: "The bungalow & rates",
    title: "Where You Sleep",
    intro:
      "One kind of bungalow, ten of them, three meals a day included. What a night costs depends on whether one or two of you sleep in it.",
    perNight: "per night",
    forOne: "one person",
    forTwo: "two people",
    roomsLabel: (n) => `${n} bungalows`,
    ask: "Ask about the bungalow",
    askNote: (name) => `I am interested in the ${name}.`,
    otaNote:
      "The bungalows are also listed on stayrajaampat.com and on Booking.com. If you would rather book there, please do. What no platform can sell you is a place on the dive boat, and that is arranged here.",
    types: {
      deluxe: {
        name: "Deluxe Bungalow",
        blurb:
          "Traditional homestay work, built from the timber and thatch that grow around it. Its own terrace faces the sea, with a sun bed on it, and the bathroom is inside rather than across the sand.",
        cap: "Up to 2 people",
        features: [
          "Own terrace facing the sea",
          "Sun bed on the terrace",
          "Bathroom inside the bungalow",
          "Three meals a day included",
        ],
        alt: "A row of timber bungalows standing on stilts at the edge of the sand, shaded by trees, the water a few steps away.",
      },
    },
    extra: {
      heading: "Adding a third person",
      ages: {
        child: "3 to 9 years old",
        teen: "10 to 16 years old",
        adult: "17 and over",
      },
      per: "per person, per night",
      note: "One extra bed per bungalow. Tell us the ages when you write and we will say what fits — an extra bed is arranged by message rather than booked here.",
    },
    rules: {
      heading: "Good to know",
      checkIn: "Check-in from",
      checkOut: "Check-out by",
      power: "Power",
      meals: "Breakfast, lunch, dinner",
      diet: "Vegetarian, a restricted diet or an allergy: tell us before you arrive, so the kitchen knows.",
      refund: "After the day you check in, a stay is not refunded.",
    },
  },
  dive: {
    badge: "Turtle Dive Center",
    title: "Dive in the morning,\nback before lunch",
    body: "We dive the Dampier Strait: Cape Kri, Mike's Point, Sardine Reef, Manta Point, all of them 20 to 45 minutes by boat from the jetty. The boat goes out twice a day, six divers per guide at most.",
    details: "Details",
    partner: "Training partner",
    orderNote: (name) => `I am interested in the "${name}" package.`,
    footnote:
      "Certified divers, please bring your card and logbook. For the Open Water course, let us know at least a week ahead so the materials and the instructor's schedule can be arranged.",
    askPrice: "Ask the price",
    videoLabel: "Diving with Turtle Dive Center",
    videoSoon: "A clip of the diving is coming here.",
    videoPlay: "Play",
    list: {
      heading: "Dive price list 2025",
      intro:
        "The whole list, as the dive centre keeps it. A card with a Book and pay button is one you can settle here and now; everything else is arranged by message, or in the evening once the plan for tomorrow is made.",
      groups: {
        fun: "Fun dives and day trips",
        night: "Night dives",
        learn: "Try dives and refreshers",
        extra: "A guide, and a tank",
        boat: "The boat for an excursion",
      },
      groupNote: {
        fun: "What the boat does in daylight: two tanks before lunch, a full day, or a run out to Piaynemo, the manta cleaning station, Yangefo or the P47.",
        night: "After dark, at Yenbuba or Sawandarek, once there are two of you.",
        learn: "Never dived, or not for a few years.",
        extra: "Neither a trip nor a course: a guide to yourself for the day, and a tank for the reef in front of the homestay.",
        boat: "Chartered by the boat rather than by the head, and separate from the dives above.",
      },
      min: (n) => `minimum ${n} divers`,
      per: {
        person: "per person",
        day: "per day",
        tank: "per tank",
        boat: "per boat",
      },
      names: {
        piaynemo2: "Piaynemo · 2 dives",
        manta2: "Manta station · 2 dives",
        mantaPm: "Manta station · afternoon",
        yangefo2: "Yangefo · 2 dives",
        p47: "P47 wreck · 2 dives",
        houseReef: "House reef",
        tank: "Tank hire",
        boatPiaynemo: "Piaynemo",
        boatPiaynemoJoin: "Piaynemo, shared",
        boatYangefo: "Yangefo",
        boatBatanta: "Batanta waterfall",
      },
      rows: {
        one: "One fun dive",
        fun2: "Two fun dives, one morning",
        fun3: "Three dives in one day",
        piaynemo2: "Two fun dives on the Piaynemo excursion, boat not included",
        manta2: "Two fun dives at the manta cleaning station and Arborek — Manta Ridge or Manta Sandy",
        mantaPm: "One afternoon dive at the manta cleaning station — Manta Ridge or Manta Sandy",
        yangefo2: "Two fun dives at Yangefo — Citrus and Mayhem",
        p47: "Two fun dives at the P47 wreck off Batanta, and Manta Way",
        nightYenbuba: "Night dive at Yenbuba or Ransiwor Island",
        nightSawandarek: "Night dive at Sawandarek",
        houseReef: "On your own with no guide — experienced divers",
        refresh: "Skill update and refresh",
        dsd: "Try dive, for anyone without a certificate",
        guide: "A guide to yourself",
        tank: "For guests diving our house reef",
      },
      notes: [
        "Equipment and the boat are included at local sites. An excursion trip is not, and no price includes a dive computer.",
        "A far local site may carry a fuel charge of Rp 300,000 to Rp 500,000 when fewer than three divers go.",
        "Divers with their own complete kit pay Rp 100,000 less, except on an excursion trip.",
        "Bring your own mask if you have one that fits your face.",
        "Insurance that covers scuba diving is recommended.",
      ],
      boats: {
        boatPiaynemo:
          "Up to 5 divers — includes the viewpoint entry fee and a lunch box for Turtle guests",
        boatPiaynemoJoin:
          "With snorkellers along, 6 or 7 people in all and five of them divers — same entry fee and lunch box",
        boatYangefo:
          "Up to 5 divers — includes the Kabuy Bay passage and a stop at the bat cave",
        boatBatanta:
          "Up to 5 divers — includes the waterfall entry fee",
      },
      plan: "Where the boat goes tomorrow is decided together every evening after dinner, around 20:00.",
      reserve: "To reserve a dive, message or call the office, or come to the restaurant in the evening around 20:00.",
    },
    bar: {
      pack: "Package",
      when: "When",
      divers: "Divers",
      diverCount: (n) => (n === "1" ? "1 diver" : `${n} divers`),
      submit: "Check availability",
      note: (pack, divers) =>
        `I am interested in the "${pack}" package, for ${divers === "1" ? "one diver" : `${divers} divers`}.`,
    },
    detail: {
      back: "All dive packages",
      dayHeading: "How the trip divides up",
      daysHeading: "The four days",
      depthHeading: "How deep you go",
      includedHeading: "Included in the price",
      notIncludedHeading: "Not included",
      bringHeading: "Bring with you",
      forHeading: "Right for you if",
      stages: {
        brief: "Briefing and kit check",
        boat: "Boat out",
        dive: "Dive",
        interval: "Surface interval",
        lunch: "Lunch on the boat",
        back: "Boat back",
        shallow: "Shallows in front of the homestay",
        snorkel: "In the water",
        rest: "Rest and rinse gear",
      },
      inWater: "In the water",
      onLand: "On the boat or ashore",
      surface: "Surface",
      hourShort: "h",
      minShort: "m",
      limitLabel: (m) => `${m} m limit`,
      depthMarks: [
        { depth: 18, label: "18 m · Open Water" },
        { depth: 30, label: "30 m · Advanced" },
        { depth: 40, label: "40 m · recreational limit" },
      ],
      noDepth: "This one stays on the surface. No certificate, no depth limit to think about, and you can stop and float whenever you like.",
      approxNote:
        "The lengths above are the usual shape of the trip, not a timetable. Tide, weather and how far the site is move them around, and the guide will say what the day looks like at the briefing.",
      courseDays: [
        {
          title: "Day 1",
          body: "Theory and the first skills in shallow water in front of the homestay: mask, regulator, buoyancy. Nothing deep, nothing rushed.",
        },
        {
          title: "Day 2",
          body: "The rest of the confined water skills, then the first open water dive from the boat.",
        },
        {
          title: "Day 3",
          body: "Two more open water dives, with more of the diving and less of the drilling as the skills settle.",
        },
        {
          title: "Day 4",
          body: "The last dive, the written exam, and the certification paperwork. The card follows by post or in the app.",
        },
      ],
      cta: "Ask about this package",
      priceUnit: "per person",
      packs: {
        fun2: {
          lede: "The standard morning out. One boat trip, two dives, back at the homestay in time for lunch. Sites are picked on the morning by tide and current rather than booked in advance, which is why the guide asks about your logbook before deciding where to take you.",
          forYou: [
            "You are certified Open Water or above",
            "You have dived within the last two years, or are happy to take the first dive gently",
            "You would rather keep the afternoon free",
          ],
          notIncluded: [
            "Equipment beyond tank and weights. Full kit is a separate line at Rp 350.000 a day",
            "Nitrox, and any speciality course",
            "Insurance",
          ],
          bring: [
            "Certification card and logbook",
            "Swimwear, towel, and a hat for the boat",
            "Reef-safe sunscreen",
          ],
        },
        fun3: {
          lede: "The whole day on the water, three sites instead of two, with lunch eaten on the boat between the second and the third. Most guests staying more than three nights take this at least once, because the third dive is usually the one that goes furthest out.",
          forYou: [
            "You are certified Open Water or above and diving comfortably",
            "You want the sites further along the strait, not only the ones close to home",
            "A full day on a boat sounds like a good day",
          ],
          notIncluded: [
            "Equipment beyond tank and weights. Full kit is a separate line at Rp 350.000 a day",
            "Nitrox, and any speciality course",
            "Insurance",
          ],
          bring: [
            "Certification card and logbook",
            "Swimwear, towel, and a hat for the boat",
            "Reef-safe sunscreen, and a dry layer for the ride back",
          ],
        },
        dsd: {
          lede: "A first breath underwater, with an instructor beside you the whole time. It starts standing up in the shallows in front of the homestay, where you can put your head above water any time you want, and only moves to a proper dive once that feels ordinary. It is not a certification and there is no exam.",
          forYou: [
            "You have never dived and want to find out whether you like it",
            "You can swim and are comfortable putting your face in the water",
            "You are travelling with divers and would rather not spend the week on the boat watching",
          ],
          notIncluded: [
            "A certification. If you want the card, that is the Open Water course",
            "Insurance",
          ],
          bring: [
            "Swimwear and a towel",
            "Nothing else. Every piece of equipment is included",
          ],
        },
        ow: {
          lede: "The certification that lets you dive anywhere in the world to eighteen metres, done over four days without leaving the island. Theory in the afternoons at the homestay, water each morning. The e-learning is sent before you arrive, so tell us at least a week ahead and you can have the reading done on the plane.",
          forYou: [
            "You want the licence, not only a taste of it",
            "You can swim, and are staying at least four full days",
            "You would rather learn in warm, calm water than in a quarry at home",
          ],
          notIncluded: [
            "Insurance",
            "Fun dives after the course. Those are the Fun Dive lines",
          ],
          bring: [
            "Swimwear and a towel",
            "A photo of yourself for the certification, or a phone to take one",
            "Your reading, done. The e-learning arrives by email",
          ],
        },
        snorkel: {
          lede: "The same water, from the top. Manta Point when the season and the tide are right, Piaynemo for the view, or nothing further than the coral garden in front of the jetty if a short day suits you better. No certificate, no tank, and children come along.",
          forYou: [
            "You do not dive, or are on a day off from diving",
            "You are travelling with children",
            "You want to see mantas without doing a course first",
          ],
          notIncluded: [
            "The Piaynemo viewpoint entry fee, if that is the day chosen",
            "Wetsuit hire",
          ],
          bring: [
            "Swimwear, towel, hat",
            "Reef-safe sunscreen, or a rash guard, which works better",
          ],
        },
        guide: {
          lede: "A guide who dives with you and nobody else, for as many days as you like. The dives themselves are priced on the list further down this section; this line is the guide, and it is what to add when you would rather not follow a group.",
          forYou: [
            "You are diving as a pair and would rather not join a group",
            "You are taking photographs and want to stay where the subject is",
            "You are coming back to diving and would like somebody watching closely",
          ],
          notIncluded: [
            "The dives themselves, which are on the price list",
            "The boat to an excursion site, which is chartered per boat",
            "Computer, torch, and camera gear",
          ],
          bring: [
            "Certification card and logbook",
            "Anything of your own you would rather dive in, especially a mask that fits",
          ],
        },
      },
    },
    packages: {
      fun2: {
        name: "Fun Dive · 2 tank",
        blurb:
          "Two dives in one morning trip, at sites around Mansuar and in the Dampier Strait.",
        duration: "~4 hrs",
        level: "Open Water and up",
        unit: "per person",
        includes: ["Guide", "Tank & weights", "Boat", "Water & snacks"],
      },
      fun3: {
        name: "Fun Dive · 3 tank",
        blurb:
          "A full day, three different sites. The one most guests take if they are staying more than three nights.",
        duration: "full day",
        level: "Open Water and up",
        unit: "per person",
        includes: ["Guide", "Tank & weights", "Boat", "Lunch on the boat"],
      },
      dsd: {
        name: "Discover Scuba",
        blurb:
          "No certificate? Start in the shallows in front of the homestay, then one shallow dive with an instructor.",
        duration: "~3 hrs",
        level: "no certificate needed",
        unit: "per person",
        includes: ["Instructor", "All equipment", "12 metres maximum"],
      },
      ow: {
        name: "Open Water Course",
        blurb:
          "Full certification over four days. Theory in the afternoons at the homestay, practice in calm water each morning.",
        duration: "4 days",
        level: "beginner",
        unit: "per person",
        includes: ["Instructor", "Materials & e-learning", "Full kit", "Certificate"],
      },
      snorkel: {
        name: "Snorkelling Trip",
        blurb:
          "Manta Point, Piaynemo, or the coral garden in front of the jetty. No diving required.",
        duration: "~5 hrs",
        level: "all ages",
        unit: "per person",
        includes: ["Guide", "Mask & fins", "Boat", "Water & fruit"],
      },
      guide: {
        name: "Private Guide",
        blurb:
          "One guide for you alone, for the day. Your pace, your sites, and nobody else's air to wait for.",
        duration: "per day",
        level: "Open Water and up",
        unit: "per day",
        includes: ["A guide to yourself", "Sites picked with you", "Your own pace"],
      },
    },
  },
  season: {
    eyebrow: "When to come",
    title: "The sea has its seasons",
    intro:
      "Raja Ampat can be visited all year, but the water is not the same every month. This is what we see from our own jetty.",
    bands: [
      {
        label: "Best season",
        months: "October – February",
        note: "The calmest water and the longest visibility. Mantas show up most often between December and February. Rooms fill early, so book well ahead.",
      },
      {
        label: "Still good",
        months: "March – April, August – September",
        note: "Mixed weather, but diving runs almost every day. Quieter, and the jetty is yours more often.",
      },
      {
        label: "Quiet season",
        months: "May – July",
        note: "The southeast wind is up, the swell is bigger, and the further sites are sometimes called off. The emptiest months, and the right ones if you want the island to yourself.",
      },
    ],
  },
  journey: {
    eyebrow: "Getting here",
    title: "Four steps from Jakarta",
    intro:
      "A long trip, but a straight one. Tell us your boat time and ours will be waiting at Waisai.",
    steps: [
      {
        title: "Fly to Sorong",
        body: "Domine Eduard Osok airport (SOQ). Daily flights from Jakarta, Makassar and Manado.",
      },
      {
        title: "Ferry to Waisai",
        body: "Fast ferry from Sorong harbour, about 2 hours. Two departures a day, morning and midday.",
      },
      {
        title: "Pay the park fee",
        body: "The Raja Ampat environmental services card is arranged in Waisai. Valid for one year.",
      },
      {
        title: "We collect you",
        body: "Our boat meets you at Waisai harbour, about an hour to Pulau Kri. Send us your ferry time on WhatsApp.",
      },
    ],
    map: {
      open: "Open the map",
      title: "Where we are",
      here: "Us",
      sorong: "Sorong",
      waisai: "Waisai",
      sketchAlt:
        "A sketch map of the route: Sorong on the mainland, a ferry north-east to Waisai on Waigeo, then a boat south-west to the homestay on Pulau Kri.",
      copy: "Copy the address",
      copied: "Copied",
      google: "Open in Google Maps",
      osm: "Open in OpenStreetMap",
      live: "Load the live map",
      note: "The drawing is a sketch, there to show the three places in relation to each other. Both links, and the live map, are on the exact coordinates. The live map is loaded only when you ask for it, so nothing here talks to a map server unless you press the button.",
    },
  },
  enquiry: {
    modalTitle: "Send us a message",
    modalIntro:
      "Fill in as much as you like. Your message goes straight to the family who run the homestay, and one of us will write back. Nothing is paid here and there is no account to create.",
    close: "Close",
    name: "Name",
    namePlaceholder: "Your name",
    phone: "WhatsApp",
    phonePlaceholder: "+62 …",
    email: "Email",
    emailPlaceholder: "you@example.com",
    contactNote: "Leave at least one, so we can reach you.",
    what: "Looking for",
    when: "When",
    people: "People",
    nights: "Nights",
    notes: "Notes",
    notesPlaceholder:
      "Food allergies, ferry times, dive certification, anything at all.",
    submit: "Send",
    sending: "Sending…",
    sent: "Thank you, your message is with us. We answer the same day, usually within a few hours.",
    needContact: "Please leave a WhatsApp number or an email, so we can answer.",
    failed: "That did not go through. Please try again, or message us on WhatsApp.",
  },
  booking: {
    cta: "Book and pay",
    title: "Book directly",
    intro:
      "The days, who you are, and what it comes to. Payment is taken on the next page, through Midtrans.",
    what: "What you are booking",
    close: "Close",
    checkIn: "Check in",
    checkOut: "Check out",
    nights: "Nights",
    nightsValue: (n) => (n === 1 ? "1 night" : `${n} nights`),
    guests: "Guests",
    guestsValue: (n) => (n === 1 ? "1 guest" : `${n} guests`),
    day: "Day",
    fromDay: "From",
    untilDay: "Until",
    days: "Days",
    daysValue: (n) => (n === 1 ? "1 day" : `${n} days`),
    divers: "Divers",
    diversValue: (n) => (n === 1 ? "1 diver" : `${n} divers`),
    total: "Total",
    next: "Review the order",
    required: "This one is needed",
    failed: "That did not go through. Try again, or message us on WhatsApp.",
    hold:
      "Paying sends the money and the booking together. We read every order the same day and confirm on WhatsApp — the rooms are sold on other sites too, so the days are certain once we have answered.",
    order: {
      title: "Your order",
      intro: "Look it over, then pay. Anything wrong is fixed by going back.",
      what: "Booking",
      who: "Who it is for",
      empty:
        "Nothing has been chosen yet. Pick a room or a dive package and it will appear here.",
      back: "Back to the homestay",
      pay: "Pay with Midtrans",
      payNote:
        "Cards, bank transfer, QRIS, GoPay and ShopeePay. The payment window is Midtrans's own; we never see your card.",
      paid: "Thank you",
      paidNote:
        "The payment reached us and the family has been told. We answer on WhatsApp the same day with the room and the boat time.",
      failed:
        "The payment did not go through. Nothing was charged; try again, or message us on WhatsApp.",
      home: "Back to the homestay",
    },
  },
  about: {
    cta: "Know us better",
    back: "Back to the homestay",
    title: "The family, the rooms,\nand the dive centre",
    lede:
      "Turtle Dive Homestay is one family's house and the ten bungalows they built beside it, on Pulau Kri in the Dampier Strait. This page is the long version: who runs it, what a bungalow actually gives you, and how the dive centre came to sit at the end of the same jetty.",
    storyHeading: "Who you are staying with",
    story: [
      "The family who built this homestay live here, in the house at the top of the sand. They were born in this bay and so were their parents, and the reef in front of the jetty is the one they grew up swimming over. Nobody is on shift. If you need something, you are asking the person whose home it is.",
      "The rooms are traditional Papuan work, timber and thatch, put up by hand and repaired the same way when a storm takes a panel. That is a choice rather than a shortage: a room built like this can be mended with what is on the island, which matters four hours from the nearest hardware shop.",
      "What the family will not do is tidy the reef. It is left the way it was found, which is why the snorkelling starts at the bottom of the steps.",
    ],
    roomsHeading: "The bungalows",
    roomsIntro: (total) =>
      `${total} bungalows, all of one kind, all of them along one boardwalk, all of them facing the same water. Which one you get is worked out when you book; one out for repair never appears as available.`,
    roomsTotal: (total) => `${total} bungalows in total`,
    serviceHeading: "What comes with the room",
    serviceIntro:
      "No cleaning fee, no service charge, no resort fee. The rate is the rate.",
    services: [
      {
        title: "Three meals a day",
        body: "Cooked by the family and eaten at one table in the dining hut. Fish that morning, rice, vegetables, fruit. Tell us before you arrive about allergies or anything you do not eat.",
      },
      {
        title: "Starlink",
        body: "Fast enough for a video call, and it reaches almost every room. Say so when you book if a reliable connection matters and we will put you where the signal is strongest.",
      },
      {
        title: "Fresh water and power",
        body: "Fresh water for washing. Power is on in the evening only — the hours are on the front page, beside the rates — so that is when a camera and a phone get charged.",
      },
      {
        title: "The boat",
        body: "Ours meets you at Waisai harbour and brings you the last hour. Going home, it takes you back for the ferry you name.",
      },
      {
        title: "Snorkelling from the jetty",
        body: "Mask and fins are here. The house reef starts a few metres out, and you do not need to book anything or wait for a boat.",
      },
      {
        title: "Getting your washing done",
        body: "Ask. It comes back the next day. There is no machine on the island, so allow for the weather.",
      },
    ],
    diveHeading: "And then the dive centre",
    diveStory: [
      "The homestay came first. Guests kept asking to be taken out to the sites they had read about, and for a while that meant borrowing a boat and finding somebody with a compressor.",
      "Turtle Dive Center is the answer to that: the family's own boat, their own tanks and kit, and guides who have dived the Dampier Strait since they were children. Cape Kri, Mike's Point, Sardine Reef and Manta Point are all between twenty and forty-five minutes from the jetty, and the boat goes out twice a day with at most six divers to a guide.",
      "You do not have to dive to stay here, and plenty of guests never put a tank on. But if you came for the water, this is the part of the homestay that was built for you.",
    ],
    since: (year) => `Homestay since ${year}`,
    diveSince: (year, gap) =>
      `Dive centre since ${year}, ${gap === 1 ? "a year" : `${gap} years`} after the homestay`,
    diveSinceNoYear: "The dive centre came later than the homestay",
    diveLink: "See the packages and prices",
    gallery: {
      stayHeading: "The place itself",
      stayIntro:
        "Photographs taken here, not staged for a brochure. Press any of them to see it larger.",
      diveHeading: "Under the boat",
      diveIntro: "The reason most people come this far.",
      open: "open larger",
      prev: "Previous photograph",
      next: "Next photograph",
      captions: {
        aerial:
          "The whole place from above. The jetty, the sand, and the reef that starts a few metres out.",
        boardwalk:
          "The boardwalk that runs in front of every room, and the water at the end of it.",
        bungalowRow:
          "The bungalows, on stilts at the top of the sand under the trees.",
        bungalowFront:
          "A bungalow seen head on: a wide terrace, a hammock across it, and the water in front.",
        lunch:
          "Lunch under the dining hut, with the hammocks strung behind and the bungalows beyond.",
        dusk: "The jetty in the last of the light, looking back across the bay.",
        manta:
          "A manta over the reef in the Dampier Strait, twenty to forty-five minutes from the jetty.",
      },
    },
    whereHeading: "Where we are",
    closeHeading: "Come and see",
    closeBody:
      "Ask us anything before you book. We answer the same day, usually within a few hours, and there is no deposit to pay to ask a question.",
    closeCta: "Send us a message",
  },
  faq: {
    eyebrow: "Asked often",
    title: "You have to know!",
    items: [
      {
        q: "Is there electricity and internet?",
        a: "There is power in the evening only — the hours are with the rates above, and that is when everything gets charged. Alongside the phone signal there is Starlink, fast enough for a video call, and it reaches almost every bungalow. If a reliable connection matters to your stay, say so when you book and we will put you in one of the bungalows where the signal is strongest.",
      },
      {
        q: "What about food?",
        a: "Three meals a day are included: breakfast, lunch and dinner, at the times listed with the rates above, and the kitchen does not serve outside them. Local food, cooked the way the family cooks it. Tell us before you arrive if you are vegetarian, have a restricted diet, or any allergy.",
      },
      {
        q: "Do I need to swim well to snorkel?",
        a: "You do not need to be strong in the water. We provide floats and a guide is always in the water with you.",
      },
      {
        q: "Can I pay by card?",
        a: "There is no card machine on the island. If the booking button took you to a payment page, that page takes cards, bank transfer and the usual e-wallets; otherwise pay by transfer before you arrive or in cash at check-in — and bring enough cash from Sorong or Waisai either way.",
      },
      {
        q: "Are children welcome?",
        a: "Yes. A bungalow sleeps two, and a third person sleeps on an extra bed — one per bungalow, priced by age, and the figures are with the rates above. Tell us the ages when you write. The snorkelling trip is safe for children who are comfortable in the water.",
      },
    ],
  },
  footer: {
    contact: "Contact",
    manager: "Manager sign-in",
    colophon: `© ${PROPERTY.name}, ${PROPERTY.island}. Run together with Eddo Homestay in Yenbuba, Pulau Mansuar.`,
    tagline: (year) => (year ? `Raja Ampat · est. ${year}` : "Raja Ampat"),
    social: "Follow us",
    feedback: {
      heading: "Tell us how we did",
      intro:
        "Tell us what fell short and what worked. Every message is read by the family who run the homestay, and we follow it up promptly.",
      message: "Your message",
      messagePlaceholder: "What would you change?",
      email: "Email, if you would like a reply",
      emailPlaceholder: "Email, only if you want an answer",
      submit: "Send",
      sending: "Sending…",
      sent: "Thank you. Your message has reached us, and we will follow it up promptly.",
      empty: "Write something first, then send.",
      failed: "That did not go through. Please try again later.",
    },
  },
  activities: {
    stay: "Staying",
    diving: "Diving",
    snorkeling: "Snorkelling",
    both: "Staying + diving",
    motorbike: "Motorbike hire",
    camera: "Camera hire",
    package: "Full package",
  },
  months: [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ],
  message: (v) =>
    [
      `Hello ${PROPERTY.name}, I would like to ask about ${v.activity.toLowerCase()}.`,
      "",
      v.name.trim() && `Name: ${v.name.trim()}`,
      v.phone.trim() && `WhatsApp: ${v.phone.trim()}`,
      v.email.trim() && `Email: ${v.email.trim()}`,
      `Dates: ${v.when}`,
      `People: ${v.people}`,
      v.withNights && `Nights: ${v.nights}`,
      v.notes.trim() && `Notes: ${v.notes.trim()}`,
      "",
      "Thank you.",
    ]
      .filter(Boolean)
      .join("\n"),
};

const ID: SiteCopy = {
  htmlLang: "id",
  nav: {
    home: "Beranda",
    rooms: "Kamar",
    diving: "Diving",
    season: "Musim",
    journey: "Cara Sampai",
    faq: "Tanya",
  },
  book: "Pesan",
  openMenu: "Buka menu",
  currencyLabel: "Tampilkan perkiraan harga dalam",
  langLabel: "Baca situs ini dalam bahasa",
  currencyNote: "Harga ditagih dalam rupiah. Baris keduanya perkiraan konversi, diperbarui beberapa kali sehari.",
  meta: {
    title: `${PROPERTY.name} · Homestay & Dive Center di Raja Ampat`,
    description:
      "Homestay keluarga dan dive center di Pulau Kri, Raja Ampat. Bungalow berpanggung di tepi air, tiga kali makan, dan penyelaman harian di Selat Dampier.",
  },
  maintenance: {
    eyebrow: "Sebentar lagi kembali",
    title: "Halamannya sedang\nkami perbaiki",
    body: "Situsnya sedang dikerjakan dan akan kembali dengan sendirinya. Tidak ada yang berubah di homestay-nya: kamarnya ada, perahunya tetap berangkat, dan pesan tetap kami balas seperti biasa.",
    contactLead: "Sementara itu, hubungi kami di",
    whatsapp: "Chat lewat WhatsApp",
    email: "Kirim email",
  },
  hero: {
    sub: "Homestay di Pulau Kri, dibangun dengan tangan dari kayu setempat dan berdiri di tepi karang yang kami jaga apa adanya. Dirawat keluarga yang memang lahir dan besar di teluk ini, dengan irama yang diatur pasang surut.",
  },
  value: {
    heading: "Satu dermaga, satu keluarga,",
    headingBreak: "dan karang tepat di depannya",
    eyebrow: "01 · Kenapa di sini",
    title: "Keramahan yang terasa\nseperti keluarga sendiri.",
    body: "Tamu dijaga langsung oleh keluarga yang membangun homestay ini dan masih tinggal di sini. Kamarnya dikerjakan dengan cara tradisional Papua, kayu dan rumbia, sederhana memang disengaja, dan jaringan Starlink menjangkau hampir seluruhnya, cukup cepat untuk panggilan video. Semua teras menghadap pemandangan yang sama: Selat Dampier, gugusan karst di seberangnya, dan karang tepat di bawahnya.",
    cta: "Tanya ketersediaan",
    ctaNote: "Saya ingin tahu ketersediaan kamar.",
  },
  cards: [
    {
      title: "Sore di dermaga",
      sub: "Senja dari ujung jetty",
      badge: "Dermaga",
      alt: "Tamu duduk di ujung dermaga saat matahari terbenam",
    },
    {
      title: "Makan bersama",
      sub: "Tiga kali sehari, satu meja",
      badge: "Pondok makan",
      alt: "Dua tamu makan di bawah pondok kayu beratap rumbia",
    },
    {
      title: "Kamar di tepi air",
      sub: "Sepuluh kamar, satu jalur papan",
      badge: "Pulau Kri",
      alt: "Jalur papan di depan deretan bungalow beratap rumbia",
    },
  ],
  rooms: {
    eyebrow: "Bungalow & harga",
    title: "Tempat Kamu Tidur",
    intro:
      "Satu jenis bungalow, sepuluh unit, sudah termasuk tiga kali makan. Harga semalamnya tergantung kamu menginap sendiri atau berdua.",
    perNight: "per malam",
    forOne: "satu orang",
    forTwo: "dua orang",
    roomsLabel: (n) => `${n} bungalow`,
    ask: "Tanya bungalow ini",
    askNote: (name) => `Saya tertarik ${name}.`,
    otaNote:
      "Bungalow-nya juga ada di stayrajaampat.com dan Booking.com. Kalau kamu lebih nyaman pesan lewat sana, silakan. Yang tidak dijual platform mana pun adalah tempat di perahu selam, dan itu diatur langsung di sini.",
    types: {
      deluxe: {
        name: "Deluxe Bungalow",
        blurb:
          "Homestay tradisional, dibangun dari kayu dan daun yang tumbuh di sekitarnya. Terasnya sendiri menghadap laut, ada sun bed di situ, dan kamar mandinya di dalam — bukan menyeberang pasir.",
        cap: "Maksimal 2 orang",
        features: [
          "Teras sendiri menghadap laut",
          "Sun bed di teras",
          "Kamar mandi di dalam",
          "Termasuk 3x makan sehari",
        ],
        alt: "Deretan bungalow kayu berpanggung di tepi pasir, teduh di bawah pepohonan, air hanya beberapa langkah dari teras.",
      },
    },
    extra: {
      heading: "Kalau ada orang ketiga",
      ages: {
        child: "Usia 3–9 tahun",
        teen: "Usia 10–16 tahun",
        adult: "17 tahun ke atas",
      },
      per: "per orang, per malam",
      note: "Satu extra bed per bungalow. Sebutkan usianya waktu menghubungi kami, nanti kami kabari muat atau tidak — extra bed diatur lewat pesan, bukan dipesan di sini.",
    },
    rules: {
      heading: "Yang perlu diketahui",
      checkIn: "Check-in mulai",
      checkOut: "Check-out sebelum",
      power: "Listrik",
      meals: "Sarapan, makan siang, makan malam",
      diet: "Vegetarian, ada pantangan, atau alergi: kabari sebelum datang supaya dapurnya tahu.",
      refund: "Setelah hari check-in, menginap tidak bisa direfund.",
    },
  },
  dive: {
    badge: "Turtle Dive Center",
    title: "Selam pagi,\npulang sebelum makan siang",
    body: "Kami menyelam di Selat Dampier: Cape Kri, Mike's Point, Sardine Reef, Manta Point, semuanya dalam 20 sampai 45 menit perahu dari dermaga. Perahu berangkat dua kali sehari, maksimal enam penyelam per guide.",
    details: "Detail",
    partner: "Mitra pelatihan",
    orderNote: (name) => `Saya tertarik paket "${name}".`,
    footnote:
      "Penyelam bersertifikat harap membawa kartu dan buku log. Untuk kursus Open Water, kabari minimal satu minggu sebelumnya supaya materi dan jadwal instruktur bisa disiapkan.",
    askPrice: "Tanya harga",
    videoLabel: "Menyelam bersama Turtle Dive Center",
    videoSoon: "Klip menyelamnya akan muncul di sini.",
    videoPlay: "Putar",
    list: {
      heading: "Daftar harga selam 2025",
      intro:
        "Daftar lengkapnya, persis seperti yang dipakai dive center-nya. Kartu yang ada tombol Pesan & bayar bisa dibereskan sekarang juga di sini; sisanya diatur lewat pesan, atau malam hari waktu rencana besok disusun.",
      groups: {
        fun: "Fun dive dan trip harian",
        night: "Night dive",
        learn: "Coba selam dan penyegaran",
        extra: "Pemandu dan sewa tabung",
        boat: "Perahu untuk trip excursion",
      },
      groupNote: {
        fun: "Yang dikerjakan perahunya di siang hari: dua tabung sebelum makan siang, satu hari penuh, atau keluar ke Piaynemo, manta cleaning station, Yangefo, atau bangkai P47.",
        night: "Sesudah gelap, di Yenbuba atau Sawandarek, begitu sudah ada dua orang.",
        learn: "Belum pernah menyelam, atau sudah beberapa tahun tidak.",
        extra: "Bukan trip, bukan kursus: pemandu khusus untukmu sehari, dan tabung untuk karang di depan homestay.",
        boat: "Disewa per perahu, bukan per orang, dan terpisah dari harga penyelaman di atas.",
      },
      min: (n) => `minimal ${n} penyelam`,
      per: {
        person: "per orang",
        day: "per hari",
        tank: "per tabung",
        boat: "per perahu",
      },
      names: {
        piaynemo2: "Piaynemo · 2 penyelaman",
        manta2: "Manta cleaning station · 2 penyelaman",
        mantaPm: "Manta cleaning station · sore",
        yangefo2: "Yangefo · 2 penyelaman",
        p47: "Bangkai P47 · 2 penyelaman",
        houseReef: "House reef",
        tank: "Sewa tabung",
        boatPiaynemo: "Piaynemo",
        boatPiaynemoJoin: "Piaynemo, gabungan",
        boatYangefo: "Yangefo",
        boatBatanta: "Air terjun Batanta",
      },
      rows: {
        one: "Satu kali fun dive",
        fun2: "Dua fun dive dalam satu pagi",
        fun3: "Tiga penyelaman dalam satu hari",
        piaynemo2: "Dua fun dive di trip Piaynemo, belum termasuk perahu",
        manta2: "Dua fun dive di manta cleaning station dan Arborek — Manta Ridge atau Manta Sandy",
        mantaPm: "Satu penyelaman sore di manta cleaning station — Manta Ridge atau Manta Sandy",
        yangefo2: "Dua fun dive di Yangefo — Citrus dan Mayhem",
        p47: "Dua fun dive di bangkai P47 dekat Batanta, dan Manta Way",
        nightYenbuba: "Night dive di Yenbuba atau Pulau Ransiwor",
        nightSawandarek: "Night dive di Sawandarek",
        houseReef: "Menyelam sendiri tanpa pemandu — penyelam berpengalaman",
        refresh: "Skill update & refresh",
        dsd: "Try dive, untuk yang belum bersertifikat",
        guide: "Pemandu khusus untukmu sendiri",
        tank: "Untuk tamu yang menyelam di house reef kami",
      },
      notes: [
        "Alat dan perahu sudah termasuk untuk titik selam lokal. Trip excursion tidak, dan tidak ada harga yang sudah termasuk komputer selam.",
        "Titik lokal yang jauh bisa kena tambahan bahan bakar Rp 300.000 sampai Rp 500.000 kalau penyelamnya kurang dari tiga orang.",
        "Penyelam yang bawa alat lengkap sendiri dapat potongan Rp 100.000, kecuali untuk trip excursion.",
        "Bawa masker sendiri kalau punya yang pas di wajah.",
        "Disarankan punya asuransi yang menanggung kegiatan menyelam.",
      ],
      boats: {
        boatPiaynemo:
          "Maksimal 5 penyelam — termasuk tiket masuk view point dan kotak makan untuk tamu Turtle",
        boatPiaynemoJoin:
          "Bersama snorkeler, total 6–7 orang dan lima di antaranya penyelam — tiket masuk dan kotak makan sama",
        boatYangefo:
          "Maksimal 5 penyelam — termasuk lewat Kabuy Bay Passage dan mampir ke gua kelelawar",
        boatBatanta:
          "Maksimal 5 penyelam — termasuk tiket masuk air terjunnya",
      },
      plan: "Besok perahunya ke mana diputuskan bersama tiap malam sesudah makan, sekitar pukul 20.00.",
      reserve: "Untuk memesan penyelaman, kirim pesan atau telepon ke nomor kantor, atau datang ke restoran malam sekitar pukul 20.00.",
    },
    bar: {
      pack: "Paket",
      when: "Kapan",
      divers: "Berapa orang",
      diverCount: (n) => `${n} orang`,
      submit: "Cek ketersediaan",
      note: (pack, divers) =>
        `Saya tertarik paket "${pack}", untuk ${divers} orang.`,
    },
    detail: {
      back: "Semua paket selam",
      dayHeading: "Pembagian waktunya",
      daysHeading: "Empat harinya",
      depthHeading: "Sedalam apa",
      includedHeading: "Sudah termasuk",
      notIncludedHeading: "Belum termasuk",
      bringHeading: "Yang perlu dibawa",
      forHeading: "Cocok kalau",
      stages: {
        brief: "Briefing dan cek alat",
        boat: "Perahu berangkat",
        dive: "Menyelam",
        interval: "Istirahat permukaan",
        lunch: "Makan siang di perahu",
        back: "Perahu pulang",
        shallow: "Air dangkal depan homestay",
        snorkel: "Di air",
        rest: "Istirahat dan bilas alat",
      },
      inWater: "Di dalam air",
      onLand: "Di perahu atau di darat",
      surface: "Permukaan",
      hourShort: "j",
      minShort: "mnt",
      limitLabel: (m) => `Batas ${m} m`,
      depthMarks: [
        { depth: 18, label: "18 m · Open Water" },
        { depth: 30, label: "30 m · Advanced" },
        { depth: 40, label: "40 m · batas rekreasi" },
      ],
      noDepth: "Yang ini di permukaan saja. Tidak perlu sertifikat, tidak ada batas kedalaman yang perlu dipikirkan, dan kamu bisa berhenti mengapung kapan saja.",
      approxNote:
        "Lama tiap bagian di atas adalah bentuk umum perjalanannya, bukan jadwal. Pasang surut, cuaca, dan jarak titik selamnya menggeser semuanya, dan pemandu akan menjelaskan rencana harinya saat briefing.",
      courseDays: [
        {
          title: "Hari 1",
          body: "Teori dan keterampilan pertama di air dangkal depan homestay: masker, regulator, daya apung. Tidak dalam, tidak buru-buru.",
        },
        {
          title: "Hari 2",
          body: "Sisa keterampilan air tenang, lalu penyelaman perairan terbuka pertama dari perahu.",
        },
        {
          title: "Hari 3",
          body: "Dua penyelaman terbuka lagi, dengan porsi menyelam yang makin banyak dan latihan yang makin sedikit begitu keterampilannya mapan.",
        },
        {
          title: "Hari 4",
          body: "Penyelaman terakhir, ujian tulis, dan pengurusan sertifikat. Kartunya menyusul lewat pos atau lewat aplikasi.",
        },
      ],
      cta: "Tanya paket ini",
      priceUnit: "per orang",
      packs: {
        fun2: {
          lede: "Paket pagi yang paling umum. Satu kali jalan, dua penyelaman, sudah kembali di homestay sebelum makan siang. Titik selamnya dipilih pagi itu juga berdasarkan pasang dan arus, bukan dipesan jauh hari, dan itu sebabnya pemandu menanyakan buku log sebelum menentukan mau dibawa ke mana.",
          forYou: [
            "Kamu bersertifikat Open Water atau di atasnya",
            "Kamu menyelam dalam dua tahun terakhir, atau tidak keberatan penyelaman pertama dibuat santai",
            "Kamu ingin sorenya tetap kosong",
          ],
          notIncluded: [
            "Peralatan selain tabung dan pemberat. Set lengkap ada di baris terpisah, Rp 350.000 per hari",
            "Nitrox dan kursus spesialisasi apa pun",
            "Asuransi",
          ],
          bring: [
            "Kartu sertifikasi dan buku log",
            "Baju renang, handuk, dan topi untuk di perahu",
            "Tabir surya yang aman untuk karang",
          ],
        },
        fun3: {
          lede: "Sehari penuh di air, tiga titik bukan dua, dengan makan siang di perahu antara penyelaman kedua dan ketiga. Tamu yang menginap lebih dari tiga malam biasanya mengambil ini setidaknya sekali, karena penyelaman ketiga umumnya yang paling jauh ke tengah selat.",
          forYou: [
            "Kamu bersertifikat Open Water atau di atasnya dan sudah nyaman menyelam",
            "Kamu ingin titik yang lebih jauh di selat, bukan cuma yang dekat rumah",
            "Sehari penuh di perahu terdengar menyenangkan buatmu",
          ],
          notIncluded: [
            "Peralatan selain tabung dan pemberat. Set lengkap ada di baris terpisah, Rp 350.000 per hari",
            "Nitrox dan kursus spesialisasi apa pun",
            "Asuransi",
          ],
          bring: [
            "Kartu sertifikasi dan buku log",
            "Baju renang, handuk, dan topi untuk di perahu",
            "Tabir surya yang aman untuk karang, dan baju kering untuk perjalanan pulang",
          ],
        },
        dsd: {
          lede: "Tarikan napas pertama di bawah air, dengan instruktur di sebelahmu terus-menerus. Mulainya sambil berdiri di air dangkal depan homestay, tempat kepalamu bisa keluar kapan saja, dan baru pindah ke penyelaman sungguhan setelah itu terasa biasa. Ini bukan sertifikasi dan tidak ada ujian.",
          forYou: [
            "Kamu belum pernah menyelam dan ingin tahu apakah kamu suka",
            "Kamu bisa berenang dan tidak masalah memasukkan wajah ke air",
            "Kamu ikut rombongan penyelam dan tidak mau seminggu cuma menonton dari perahu",
          ],
          notIncluded: [
            "Sertifikasi. Kalau mau kartunya, itu kursus Open Water",
            "Asuransi",
          ],
          bring: [
            "Baju renang dan handuk",
            "Tidak ada lagi. Semua peralatan sudah termasuk",
          ],
        },
        ow: {
          lede: "Sertifikasi yang membuatmu bisa menyelam sampai delapan belas meter di mana pun di dunia, diselesaikan empat hari tanpa keluar dari pulau. Teori sore hari di homestay, praktik air setiap pagi. Materi e-learning dikirim sebelum kamu datang, jadi kabari minimal seminggu sebelumnya dan bacaannya bisa kelar di pesawat.",
          forYou: [
            "Kamu mau lisensinya, bukan cuma mencicipi",
            "Kamu bisa berenang dan menginap minimal empat hari penuh",
            "Kamu lebih suka belajar di air hangat dan tenang daripada di kolam bekas galian",
          ],
          notIncluded: [
            "Asuransi",
            "Fun dive setelah kursus selesai. Itu masuk paket Fun Dive",
          ],
          bring: [
            "Baju renang dan handuk",
            "Foto diri untuk sertifikat, atau ponsel untuk memotretnya di tempat",
            "Bacaanmu, sudah selesai. E-learning-nya dikirim lewat email",
          ],
        },
        snorkel: {
          lede: "Air yang sama, dilihat dari atas. Manta Point kalau musim dan pasangnya pas, Piaynemo untuk pemandangannya, atau tidak jauh-jauh dari taman karang depan dermaga kalau kamu ingin hari yang lebih singkat. Tanpa sertifikat, tanpa tabung, dan anak-anak boleh ikut.",
          forYou: [
            "Kamu tidak menyelam, atau sedang libur dari menyelam",
            "Kamu bepergian bersama anak-anak",
            "Kamu ingin melihat manta tanpa harus kursus dulu",
          ],
          notIncluded: [
            "Tiket masuk puncak Piaynemo, kalau hari itu ke sana",
            "Sewa wetsuit",
          ],
          bring: [
            "Baju renang, handuk, topi",
            "Tabir surya yang aman untuk karang, atau rash guard yang sebetulnya lebih efektif",
          ],
        },
        guide: {
          lede: "Pemandu yang menyelam denganmu saja, sebanyak hari yang kamu mau. Harga penyelamannya sendiri ada di daftar harga di bawah bagian ini; baris ini pemandunya, dan ini yang ditambahkan kalau kamu lebih suka tidak ikut rombongan.",
          forYou: [
            "Kamu menyelam berdua dan malas ikut rombongan",
            "Kamu sedang memotret dan ingin bertahan lama di satu titik",
            "Kamu baru mulai menyelam lagi dan ingin diawasi lebih dekat",
          ],
          notIncluded: [
            "Penyelamannya sendiri, ada di daftar harga",
            "Perahu untuk trip excursion, disewa per perahu",
            "Komputer selam, senter, dan alat foto",
          ],
          bring: [
            "Kartu sertifikasi dan buku log",
            "Alat pribadi yang lebih nyaman kamu pakai, terutama masker yang pas di wajah",
          ],
        },
      },
    },
    packages: {
      fun2: {
        name: "Fun Dive · 2 tank",
        blurb:
          "Dua penyelaman dalam satu perjalanan pagi, di titik sekitar Mansuar dan Selat Dampier.",
        duration: "±4 jam",
        level: "Open Water ke atas",
        unit: "per orang",
        includes: ["Guide", "Tabung & timbang", "Perahu", "Air & snack"],
      },
      fun3: {
        name: "Fun Dive · 3 tank",
        blurb:
          "Seharian penuh, tiga titik berbeda. Pilihan paling sering diambil tamu yang menginap lebih dari tiga malam.",
        duration: "seharian",
        level: "Open Water ke atas",
        unit: "per orang",
        includes: ["Guide", "Tabung & timbang", "Perahu", "Makan siang di perahu"],
      },
      dsd: {
        name: "Discover Scuba",
        blurb:
          "Belum punya sertifikat? Mulai dari kolam dangkal di depan homestay, lalu satu penyelaman dangkal bersama instruktur.",
        duration: "±3 jam",
        level: "tanpa sertifikat",
        unit: "per orang",
        includes: ["Instruktur", "Seluruh alat", "Maksimal 12 meter"],
      },
      ow: {
        name: "Kursus Open Water",
        blurb:
          "Sertifikasi penuh, empat hari. Teori dikerjakan sore hari di homestay, praktik pagi di perairan tenang.",
        duration: "4 hari",
        level: "pemula",
        unit: "per orang",
        includes: ["Instruktur", "Materi & e-learning", "Alat lengkap", "Sertifikat"],
      },
      snorkel: {
        name: "Trip Snorkeling",
        blurb:
          "Manta Point, Piaynemo, atau taman karang di depan dermaga. Tidak perlu bisa menyelam.",
        duration: "±5 jam",
        level: "semua umur",
        unit: "per orang",
        includes: ["Pemandu", "Masker & fin", "Perahu", "Air & buah"],
      },
      guide: {
        name: "Pemandu Pribadi",
        blurb:
          "Satu pemandu khusus untukmu, sepanjang hari. Iramamu sendiri, titik selam pilihanmu, tanpa menunggu sisa udara orang lain.",
        duration: "per hari",
        level: "Open Water ke atas",
        unit: "per hari",
        includes: ["Pemandu khusus untukmu", "Titik selam dipilih bersamamu", "Iramamu sendiri"],
      },
    },
  },
  season: {
    eyebrow: "Kapan sebaiknya datang",
    title: "Laut punya musimnya",
    intro:
      "Raja Ampat bisa dikunjungi sepanjang tahun, tapi airnya tidak sama tiap bulan. Ini yang kami lihat dari dermaga sendiri.",
    bands: [
      {
        label: "Musim terbaik",
        months: "Oktober – Februari",
        note: "Air paling tenang dan jarak pandang paling jauh. Manta paling sering muncul Desember–Februari. Kamar cepat penuh, pesan dari jauh hari.",
      },
      {
        label: "Masih bagus",
        months: "Maret – April, Agustus – September",
        note: "Cuaca campur tapi menyelam tetap jalan hampir setiap hari. Lebih longgar, lebih tenang di dermaga.",
      },
      {
        label: "Musim sepi",
        months: "Mei – Juli",
        note: "Angin tenggara, ombak lebih besar, beberapa titik jauh kadang dibatalkan. Paling sepi, dan paling cocok kalau mau pulau untuk diri sendiri.",
      },
    ],
  },
  journey: {
    eyebrow: "Cara sampai",
    title: "Empat langkah dari Jakarta",
    intro:
      "Perjalanan panjang, tapi lurus. Kabari kami jadwal kapalmu dan perahu sudah menunggu di Waisai.",
    steps: [
      {
        title: "Terbang ke Sorong",
        body: "Bandara Domine Eduard Osok (SOQ). Ada penerbangan harian dari Jakarta, Makassar, dan Manado.",
      },
      {
        title: "Kapal ke Waisai",
        body: "Kapal cepat dari Pelabuhan Sorong, ±2 jam. Berangkat dua kali sehari, pagi dan siang.",
      },
      {
        title: "Bayar retribusi",
        body: "Kartu Jasa Lingkungan Raja Ampat diurus di Waisai. Berlaku satu tahun.",
      },
      {
        title: "Kami jemput",
        body: "Perahu kami menjemput di dermaga Waisai, ±1 jam ke Pulau Kri. Kabari jadwal kapalmu lewat WhatsApp.",
      },
    ],
    map: {
      open: "Buka peta",
      title: "Lokasi kami",
      here: "Kami",
      sorong: "Sorong",
      waisai: "Waisai",
      sketchAlt:
        "Peta sketsa rutenya: Sorong di daratan, kapal ke timur laut menuju Waisai di Waigeo, lalu perahu ke barat daya menuju homestay di Pulau Kri.",
      copy: "Salin alamat",
      copied: "Tersalin",
      google: "Buka di Google Maps",
      osm: "Buka di OpenStreetMap",
      live: "Muat peta sungguhan",
      note: "Gambarnya sketsa, gunanya menunjukkan posisi ketiga tempat itu satu sama lain. Kedua tautannya, dan peta sungguhannya, memakai koordinat yang persis. Peta sungguhan baru dimuat kalau kamu memintanya, jadi tidak ada yang menghubungi server peta sebelum tombolnya ditekan.",
    },
  },
  enquiry: {
    modalTitle: "Kirim pesan ke kami",
    modalIntro:
      "Isi seadanya. Pesanmu langsung sampai ke keluarga yang mengelola homestay, dan salah satu dari kami akan membalas. Tidak ada pembayaran di sini dan tidak ada akun yang perlu dibuat.",
    close: "Tutup",
    name: "Nama",
    namePlaceholder: "Nama kamu",
    phone: "WhatsApp",
    phonePlaceholder: "08…",
    email: "Email",
    emailPlaceholder: "kamu@contoh.com",
    contactNote: "Isi salah satu, supaya kami bisa membalas.",
    what: "Mau apa",
    when: "Kapan",
    people: "Orang",
    nights: "Malam",
    notes: "Catatan",
    notesPlaceholder:
      "Alergi makanan, jadwal kapal, sertifikat selam, apa saja.",
    submit: "Kirim",
    sending: "Mengirim…",
    sent: "Terima kasih, pesanmu sudah kami terima. Kami balas hari itu juga, biasanya dalam beberapa jam.",
    needContact: "Isi nomor WhatsApp atau email dulu, supaya kami bisa membalas.",
    failed: "Pesannya gagal terkirim. Coba lagi, atau hubungi kami lewat WhatsApp.",
  },
  booking: {
    cta: "Pesan & bayar",
    title: "Pesan langsung",
    intro:
      "Tanggalnya, siapa kamu, dan totalnya. Pembayaran dilakukan di halaman berikutnya, lewat Midtrans.",
    what: "Yang dipesan",
    close: "Tutup",
    checkIn: "Check-in",
    checkOut: "Check-out",
    nights: "Malam",
    nightsValue: (n) => `${n} malam`,
    guests: "Tamu",
    guestsValue: (n) => `${n} orang`,
    day: "Tanggal",
    fromDay: "Dari",
    untilDay: "Sampai",
    days: "Hari",
    daysValue: (n) => `${n} hari`,
    divers: "Penyelam",
    diversValue: (n) => `${n} orang`,
    total: "Total",
    next: "Periksa pesanan",
    required: "Bagian ini belum diisi",
    failed: "Belum berhasil. Coba lagi, atau hubungi kami lewat WhatsApp.",
    hold:
      "Membayar mengirim uangnya sekaligus pesanannya. Kami baca hari itu juga dan konfirmasi lewat WhatsApp — kamar juga dijual di situs lain, jadi tanggalnya pasti setelah kami balas.",
    order: {
      title: "Pesananmu",
      intro: "Periksa dulu, baru bayar. Kalau ada yang keliru, kembali saja.",
      what: "Pesanan",
      who: "Atas nama",
      empty:
        "Belum ada yang dipilih. Pilih kamar atau paket selam, nanti muncul di sini.",
      back: "Kembali ke homestay",
      pay: "Bayar lewat Midtrans",
      payNote:
        "Kartu, transfer bank, QRIS, GoPay dan ShopeePay. Jendela pembayarannya milik Midtrans; nomor kartumu tidak pernah kami lihat.",
      paid: "Terima kasih",
      paidNote:
        "Pembayarannya sudah masuk dan keluarga pengelola sudah dikabari. Kami balas hari itu juga lewat WhatsApp, beserta kamarnya dan jam perahunya.",
      failed:
        "Pembayarannya belum berhasil. Tidak ada uang yang terpotong; coba lagi, atau hubungi kami lewat WhatsApp.",
      home: "Kembali ke homestay",
    },
  },
  about: {
    cta: "Kenali kami",
    back: "Kembali ke homestay",
    title: "Keluarganya, kamarnya,\ndan dive center-nya",
    lede:
      "Turtle Dive Homestay adalah rumah satu keluarga dan sepuluh bungalow yang mereka bangun di sebelahnya, di Pulau Kri, Selat Dampier. Halaman ini versi panjangnya: siapa yang mengelola, apa yang sebenarnya kamu dapat di satu bungalow, dan bagaimana dive center-nya sampai berdiri di ujung dermaga yang sama.",
    storyHeading: "Kamu menginap bersama siapa",
    story: [
      "Keluarga yang membangun homestay ini tinggal di sini juga, di rumah di ujung atas pasir. Mereka lahir di teluk ini, begitu juga orang tua mereka, dan karang di depan dermaga adalah karang tempat mereka berenang sejak kecil. Tidak ada yang sedang bertugas shift. Kalau kamu butuh sesuatu, kamu sedang meminta kepada orang yang rumahnya ini.",
      "Kamarnya kerja tradisional Papua, kayu dan daun, dibangun dengan tangan dan diperbaiki dengan cara yang sama kalau angin mencopot satu panel. Itu pilihan, bukan keterbatasan: kamar yang dibangun begini bisa diperbaiki dengan apa yang ada di pulau, dan itu penting kalau toko bangunan terdekat empat jam jauhnya.",
      "Yang tidak akan dilakukan keluarga ini adalah merapikan karangnya. Karangnya dibiarkan apa adanya, dan itu sebabnya snorkeling di sini dimulai dari anak tangga terakhir.",
    ],
    roomsHeading: "Bungalow-nya",
    roomsIntro: (total) =>
      `${total} bungalow, satu tipe saja, semuanya di sepanjang satu jalur papan, semuanya menghadap air yang sama. Bungalow mana yang kamu dapat diatur saat pemesanan; yang sedang diperbaiki tidak pernah muncul sebagai tersedia.`,
    roomsTotal: (total) => `Total ${total} bungalow`,
    serviceHeading: "Yang sudah termasuk",
    serviceIntro:
      "Tidak ada biaya kebersihan, biaya layanan, atau biaya resor. Harganya ya segitu.",
    services: [
      {
        title: "Tiga kali makan sehari",
        body: "Dimasak keluarganya dan dimakan di satu meja di pondok makan. Ikan pagi itu juga, nasi, sayur, buah. Kabari sebelum datang kalau ada alergi atau ada yang tidak kamu makan.",
      },
      {
        title: "Starlink",
        body: "Cukup cepat untuk panggilan video, dan sinyalnya sampai ke hampir semua kamar. Bilang saat memesan kalau koneksi yang stabil itu penting buatmu, nanti kami tempatkan di kamar yang sinyalnya paling kuat.",
      },
      {
        title: "Air tawar dan listrik",
        body: "Air tawar untuk mandi. Listrik cuma menyala malam hari — jamnya ada di halaman depan, di bagian harga — jadi di jam itulah kamera dan ponsel diisi.",
      },
      {
        title: "Perahunya",
        body: "Perahu kami menjemput di dermaga Waisai dan membawa kamu satu jam terakhirnya. Saat pulang, diantar balik untuk mengejar kapal yang kamu sebutkan.",
      },
      {
        title: "Snorkeling dari dermaga",
        body: "Masker dan fin ada di sini. Karang rumahnya mulai beberapa meter dari dermaga, tidak perlu memesan apa pun dan tidak perlu menunggu perahu.",
      },
      {
        title: "Cucian",
        body: "Tinggal minta. Besoknya sudah kembali. Tidak ada mesin cuci di pulau, jadi perhitungkan cuacanya.",
      },
    ],
    diveHeading: "Lalu dive center-nya",
    diveStory: [
      "Homestay-nya lebih dulu. Tamu terus-menerus minta diantar ke titik-titik yang mereka baca, dan untuk sementara itu berarti pinjam perahu dan mencari orang yang punya kompresor.",
      "Turtle Dive Center adalah jawabannya: perahu keluarga sendiri, tabung dan alat sendiri, dan pemandu yang sudah menyelami Selat Dampier sejak kecil. Cape Kri, Mike's Point, Sardine Reef, dan Manta Point semuanya dalam dua puluh sampai empat puluh lima menit dari dermaga, dan perahunya berangkat dua kali sehari dengan maksimal enam penyelam per pemandu.",
      "Kamu tidak harus menyelam untuk menginap di sini, dan banyak tamu yang sama sekali tidak menyentuh tabung. Tapi kalau kamu datang demi airnya, bagian homestay yang satu ini memang dibangun untukmu.",
    ],
    since: (year) => `Homestay sejak ${year}`,
    diveSince: (year, gap) =>
      `Dive center sejak ${year}, ${gap} tahun setelah homestay-nya`,
    diveSinceNoYear: "Dive center-nya berdiri belakangan setelah homestay",
    diveLink: "Lihat paket dan harganya",
    gallery: {
      stayHeading: "Tempatnya sendiri",
      stayIntro:
        "Foto yang diambil di sini, bukan hasil penataan untuk brosur. Klik salah satunya untuk melihat lebih besar.",
      diveHeading: "Di bawah perahu",
      diveIntro: "Alasan kenapa kebanyakan orang datang sejauh ini.",
      open: "lihat lebih besar",
      prev: "Foto sebelumnya",
      next: "Foto berikutnya",
      captions: {
        aerial:
          "Seluruh tempatnya dari atas. Dermaganya, pasirnya, dan karang yang mulai beberapa meter dari bibir pantai.",
        boardwalk:
          "Jalur papan yang membentang di depan semua kamar, dan air di ujungnya.",
        bungalowRow:
          "Bungalow-bungalownya, berpanggung di tepi atas pasir, teduh di bawah pepohonan.",
        bungalowFront:
          "Satu bungalow dilihat dari depan: teras lebar, hammock terbentang, laut di depannya.",
        lunch:
          "Makan siang di pondok makan, dengan hammock terpasang di belakang dan bungalow di kejauhan.",
        dusk: "Dermaga di sisa cahaya terakhir, memandang balik ke seberang teluk.",
        manta:
          "Manta di atas karang Selat Dampier, dua puluh sampai empat puluh lima menit dari dermaga.",
      },
    },
    whereHeading: "Lokasi kami",
    closeHeading: "Datang dan lihat sendiri",
    closeBody:
      "Tanya apa saja sebelum memesan. Kami balas hari itu juga, biasanya dalam beberapa jam, dan tidak ada uang muka untuk sekadar bertanya.",
    closeCta: "Kirim pesan ke kami",
  },
  faq: {
    eyebrow: "Yang sering ditanya",
    title: "Wajib kamu tahu!",
    items: [
      {
        q: "Apakah ada listrik dan internet?",
        a: "Listrik hanya menyala malam hari — jamnya ada di bagian harga di atas, dan itu waktunya mengisi daya semua alat. Selain sinyal telepon, ada Starlink yang cukup cepat untuk panggilan video, dan jangkauannya sampai hampir semua bungalow. Kalau koneksi penting untuk perjalananmu, beri tahu saat memesan dan kami tempatkan di bungalow dengan sinyal paling kuat.",
      },
      {
        q: "Makan bagaimana?",
        a: "Tiga kali makan sehari sudah termasuk: sarapan, makan siang, dan makan malam, pada jam yang tertulis di bagian harga di atas, dan dapur tidak melayani di luar jam itu. Masakan lokal, dimasak seperti keluarga ini memasak sehari-hari. Kabari sebelum datang kalau kamu vegetarian, punya pantangan, atau alergi.",
      },
      {
        q: "Perlu bisa berenang untuk snorkeling?",
        a: "Tidak harus mahir. Kami sediakan pelampung dan pemandu selalu ikut di air.",
      },
      {
        q: "Bisa bayar pakai kartu?",
        a: "Tidak ada mesin kartu di pulau. Kalau tombol pesan tadi membawamu ke halaman pembayaran, di situ bisa kartu, transfer bank, dan e-wallet yang biasa; kalau tidak, bayar lewat transfer sebelum datang atau tunai saat check-in — dan bawa uang tunai secukupnya dari Sorong atau Waisai.",
      },
      {
        q: "Anak-anak boleh ikut?",
        a: "Boleh. Satu bungalow muat dua orang, dan orang ketiga pakai extra bed — satu per bungalow, harganya menurut usia, angkanya ada di bagian harga di atas. Sebutkan usianya waktu menghubungi kami. Trip snorkeling aman untuk anak yang sudah nyaman di air.",
      },
    ],
  },
  footer: {
    contact: "Kontak",
    manager: "Masuk pengelola",
    colophon: `© ${PROPERTY.name}, ${PROPERTY.island}. Dikelola bersama Eddo Homestay di Yenbuba, Pulau Mansuar.`,
    tagline: (year) => (year ? `Raja Ampat · sejak ${year}` : "Raja Ampat"),
    social: "Ikuti kami",
    feedback: {
      heading: "Ceritakan pengalamanmu",
      intro:
        "Sampaikan apa yang kurang dan apa yang sudah baik. Setiap pesan dibaca langsung oleh keluarga yang mengelola homestay, dan akan segera kami tindak lanjuti.",
      message: "Pesanmu",
      messagePlaceholder: "Apa yang menurutmu perlu diperbaiki?",
      email: "Email, kalau mau dibalas",
      emailPlaceholder: "Email, isi kalau mau dibalas",
      submit: "Kirim",
      sending: "Mengirim…",
      sent: "Terima kasih. Pesanmu sudah kami terima, dan akan segera kami tindak lanjuti.",
      empty: "Tulis dulu pesannya, baru kirim.",
      failed: "Gagal terkirim. Coba lagi nanti.",
    },
  },
  activities: {
    stay: "Menginap",
    diving: "Diving",
    snorkeling: "Snorkeling",
    both: "Menginap + diving",
    motorbike: "Sewa motor",
    camera: "Sewa kamera",
    package: "Paket lengkap",
  },
  months: [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ],
  message: (v) =>
    [
      `Halo ${PROPERTY.name}, saya ingin bertanya soal ${v.activity.toLowerCase()}.`,
      "",
      v.name.trim() && `Nama: ${v.name.trim()}`,
      v.phone.trim() && `WhatsApp: ${v.phone.trim()}`,
      v.email.trim() && `Email: ${v.email.trim()}`,
      `Rencana: ${v.when}`,
      `Jumlah orang: ${v.people}`,
      v.withNights && `Lama menginap: ${v.nights} malam`,
      v.notes.trim() && `Catatan: ${v.notes.trim()}`,
      "",
      "Terima kasih.",
    ]
      .filter(Boolean)
      .join("\n"),
};

const FR: SiteCopy = {
  htmlLang: "fr",
  nav: {
    home: "Accueil",
    rooms: "Chambres",
    diving: "Plongée",
    season: "Saisons",
    journey: "Venir ici",
    faq: "Questions",
  },
  book: "Réserver",
  openMenu: "Ouvrir le menu",
  currencyLabel: "Afficher un prix approximatif en",
  langLabel: "Lire ce site en",
  currencyNote: "Les prix sont facturés en roupies. La seconde ligne est une conversion approximative, actualisée quelques fois par jour.",
  meta: {
    title: `${PROPERTY.name} · Homestay et centre de plongée à Raja Ampat`,
    description:
      "Un homestay familial et un centre de plongée sur Pulau Kri, Raja Ampat. Des bungalows sur pilotis au bord de l'eau, trois repas par jour, et de la plongée quotidienne dans le détroit de Dampier.",
  },
  maintenance: {
    eyebrow: "De retour bientôt",
    title: "Nous travaillons sur\ncette page",
    body: "Le site est en travaux et reviendra de lui-même. Rien n'a changé au homestay : les chambres sont là, le bateau sort, et nous répondons aux messages comme d'habitude.",
    contactLead: "Nous joindre en attendant",
    whatsapp: "Écrire sur WhatsApp",
    email: "Envoyer un e-mail",
  },
  hero: {
    sub: "Un homestay sur Pulau Kri, construit à la main en bois local, au bord d'un récif que nous laissons tel que nous l'avons trouvé. Tenu par la famille qui a toujours vécu dans cette baie, au rythme de la marée.",
  },
  value: {
    heading: "Un ponton, une famille,",
    headingBreak: "et le récif juste devant",
    eyebrow: "01 · Pourquoi ici",
    title: "Un accueil qui ressemble\nà une famille.",
    body: "Les hôtes sont reçus par la famille qui a bâti ce homestay et qui y vit encore. Les chambres sont un travail papou traditionnel, bois et chaume, simples par choix, et une connexion Starlink atteint presque chacune d'elles, assez rapide pour un appel vidéo. Chaque terrasse ouvre sur la même vue : le détroit de Dampier, les îles calcaires au-delà, et le récif juste en dessous.",
    cta: "Demander les disponibilités",
    ctaNote: "J'aimerais savoir quelles chambres sont libres.",
  },
  cards: [
    {
      title: "Le soir sur le ponton",
      sub: "Le coucher de soleil au bout de la passerelle",
      badge: "Ponton",
      alt: "Un hôte assis au bout du ponton au coucher du soleil",
    },
    {
      title: "Manger ensemble",
      sub: "Trois repas par jour, une seule table",
      badge: "Paillote",
      alt: "Deux hôtes qui mangent sous une paillote en bois",
    },
    {
      title: "Des chambres au bord de l'eau",
      sub: "Dix chambres le long d'un même ponton de bois",
      badge: "Pulau Kri",
      alt: "La passerelle devant une rangée de bungalows au toit de chaume",
    },
  ],
  rooms: {
    eyebrow: "Le bungalow et les tarifs",
    title: "Où vous dormez",
    intro:
      "Un seul type de bungalow, dix en tout, trois repas par jour compris. Le prix d'une nuit dépend de si vous y dormez seul ou à deux.",
    perNight: "par nuit",
    forOne: "une personne",
    forTwo: "deux personnes",
    roomsLabel: (n) => `${n} bungalows`,
    ask: "Poser une question sur le bungalow",
    askNote: (name) => `Je suis intéressé par le ${name}.`,
    otaNote:
      "Les bungalows sont aussi sur stayrajaampat.com et sur Booking.com. Si vous préférez réserver là-bas, faites-le. Ce qu'aucune plateforme ne peut vous vendre, c'est une place sur le bateau de plongée : cela s'organise ici.",
    types: {
      deluxe: {
        name: "Deluxe Bungalow",
        blurb:
          "Un homestay traditionnel, bâti avec le bois et les palmes qui poussent autour. Sa propre terrasse face à la mer, un transat dessus, et la salle de bain à l'intérieur plutôt que de l'autre côté du sable.",
        cap: "2 personnes maximum",
        features: [
          "Terrasse privée face à la mer",
          "Transat sur la terrasse",
          "Salle de bain à l'intérieur",
          "Trois repas par jour compris",
        ],
        alt: "Une rangée de bungalows en bois sur pilotis au bord du sable, à l'ombre des arbres, l'eau à quelques pas.",
      },
    },
    extra: {
      heading: "Ajouter une troisième personne",
      ages: {
        child: "De 3 à 9 ans",
        teen: "De 10 à 16 ans",
        adult: "17 ans et plus",
      },
      per: "par personne et par nuit",
      note: "Un lit d'appoint par bungalow. Dites-nous les âges quand vous écrivez et nous vous dirons ce qui rentre — un lit d'appoint s'arrange par message, il ne se réserve pas ici.",
    },
    rules: {
      heading: "Bon à savoir",
      checkIn: "Arrivée à partir de",
      checkOut: "Départ avant",
      power: "Électricité",
      meals: "Petit-déjeuner, déjeuner, dîner",
      diet: "Végétarien, régime particulier ou allergie : dites-le-nous avant d'arriver, pour que la cuisine soit au courant.",
      refund: "Passé le jour de l'arrivée, un séjour n'est pas remboursé.",
    },
  },
  dive: {
    badge: "Turtle Dive Center",
    title: "Plonger le matin,\nrentrer avant le déjeuner",
    body: "Nous plongeons dans le détroit de Dampier : Cape Kri, Mike's Point, Sardine Reef, Manta Point, tous à 20 à 45 minutes de bateau du ponton. Le bateau sort deux fois par jour, six plongeurs par guide au maximum.",
    details: "Détails",
    partner: "Partenaire de formation",
    orderNote: (name) => `Je suis intéressé par le forfait « ${name} ».`,
    footnote:
      "Plongeurs certifiés, merci d'apporter votre carte et votre carnet. Pour le cours Open Water, prévenez-nous au moins une semaine à l'avance afin que le matériel et l'emploi du temps de l'instructeur soient prêts.",
    askPrice: "Demander le prix",
    videoLabel: "Plonger avec le Turtle Dive Center",
    videoSoon: "Une vidéo des plongées arrive ici.",
    videoPlay: "Lire",
    list: {
      heading: "Tarifs plongée 2025",
      intro:
        "La liste entière, telle que le centre la tient. Une carte avec un bouton Réserver et payer se règle ici, tout de suite ; tout le reste s'organise par message, ou le soir, quand le programme du lendemain se décide.",
      groups: {
        fun: "Plongées loisir et sorties à la journée",
        night: "Plongées de nuit",
        learn: "Baptêmes et remises à niveau",
        extra: "Un guide, et un bloc",
        boat: "Le bateau pour une excursion",
      },
      groupNote: {
        fun: "Ce que le bateau fait de jour : deux blocs avant midi, une journée entière, ou une sortie vers Piaynemo, la station de nettoyage des mantas, Yangefo ou l'épave du P47.",
        night: "À la nuit tombée, à Yenbuba ou à Sawandarek, dès que vous êtes deux.",
        learn: "Jamais plongé, ou plus depuis quelques années.",
        extra: "Ni sortie ni formation : un guide rien que pour vous pour la journée, et un bloc pour le récif devant la maison.",
        boat: "Affrété au bateau et non par personne, et séparé des plongées ci-dessus.",
      },
      min: (n) => `${n} plongeurs minimum`,
      per: {
        person: "par personne",
        day: "par jour",
        tank: "par bloc",
        boat: "par bateau",
      },
      names: {
        piaynemo2: "Piaynemo · 2 plongées",
        manta2: "Station des mantas · 2 plongées",
        mantaPm: "Station des mantas · après-midi",
        yangefo2: "Yangefo · 2 plongées",
        p47: "Épave du P47 · 2 plongées",
        houseReef: "Récif maison",
        tank: "Location de bloc",
        boatPiaynemo: "Piaynemo",
        boatPiaynemoJoin: "Piaynemo, partagé",
        boatYangefo: "Yangefo",
        boatBatanta: "Cascade de Batanta",
      },
      rows: {
        one: "Une plongée loisir",
        fun2: "Deux plongées loisir, en une matinée",
        fun3: "Trois plongées dans la journée",
        piaynemo2: "Deux plongées loisir pendant l'excursion à Piaynemo, bateau non compris",
        manta2: "Deux plongées à la station de nettoyage des raies manta et à Arborek — Manta Ridge ou Manta Sandy",
        mantaPm: "Une plongée l'après-midi à la station de nettoyage des raies manta — Manta Ridge ou Manta Sandy",
        yangefo2: "Deux plongées à Yangefo — Citrus et Mayhem",
        p47: "Deux plongées sur l'épave du P47 au large de Batanta, et à Manta Way",
        nightYenbuba: "Plongée de nuit à Yenbuba ou sur l'île de Ransiwor",
        nightSawandarek: "Plongée de nuit à Sawandarek",
        houseReef: "Seul et sans guide — plongeurs expérimentés",
        refresh: "Remise à niveau",
        dsd: "Baptême de plongée, sans brevet",
        guide: "Un guide rien que pour vous",
        tank: "Pour les hôtes qui plongent sur notre récif maison",
      },
      notes: [
        "L'équipement et le bateau sont compris sur les sites locaux. Une sortie excursion ne l'est pas, et aucun tarif ne comprend d'ordinateur de plongée.",
        "Un site local éloigné peut entraîner un supplément carburant de Rp 300 000 à Rp 500 000 si vous êtes moins de trois plongeurs.",
        "Les plongeurs avec tout leur matériel paient Rp 100 000 de moins, sauf en excursion.",
        "Apportez votre masque si vous en avez un qui va à votre visage.",
        "Une assurance couvrant la plongée est recommandée.",
      ],
      boats: {
        boatPiaynemo:
          "5 plongeurs maximum — comprend l'entrée du point de vue et un panier-repas pour les hôtes de Turtle",
        boatPiaynemoJoin:
          "Avec des snorkeleurs, 6 à 7 personnes en tout dont cinq plongeurs — mêmes entrée et panier-repas",
        boatYangefo:
          "5 plongeurs maximum — comprend le passage de Kabuy Bay et un arrêt à la grotte aux chauves-souris",
        boatBatanta:
          "5 plongeurs maximum — comprend l'entrée de la cascade",
      },
      plan: "Où va le bateau demain se décide ensemble chaque soir après le dîner, vers 20 h.",
      reserve: "Pour réserver une plongée, écrivez ou appelez le bureau, ou passez au restaurant le soir vers 20 h.",
    },
    bar: {
      pack: "Forfait",
      when: "Quand",
      divers: "Plongeurs",
      diverCount: (n) => (n === "1" ? "1 plongeur" : `${n} plongeurs`),
      submit: "Vérifier les disponibilités",
      note: (pack, divers) =>
        `Je suis intéressé par le forfait « ${pack} », pour ${divers === "1" ? "un plongeur" : `${divers} plongeurs`}.`,
    },
    detail: {
      back: "Tous les forfaits de plongée",
      dayHeading: "Comment la sortie se découpe",
      daysHeading: "Les quatre jours",
      depthHeading: "Jusqu'à quelle profondeur",
      includedHeading: "Compris dans le prix",
      notIncludedHeading: "Non compris",
      bringHeading: "À apporter",
      forHeading: "Pour vous si",
      stages: {
        brief: "Briefing et vérification du matériel",
        boat: "Départ du bateau",
        dive: "Plongée",
        interval: "Intervalle de surface",
        lunch: "Déjeuner sur le bateau",
        back: "Retour du bateau",
        shallow: "Petits fonds devant le homestay",
        snorkel: "Dans l'eau",
        rest: "Repos et rinçage du matériel",
      },
      inWater: "Dans l'eau",
      onLand: "Sur le bateau ou à terre",
      surface: "Surface",
      hourShort: "h",
      minShort: "min",
      limitLabel: (m) => `limite ${m} m`,
      depthMarks: [
        { depth: 18, label: "18 m · Open Water" },
        { depth: 30, label: "30 m · Advanced" },
        { depth: 40, label: "40 m · limite loisir" },
      ],
      noDepth: "Celle-ci reste en surface. Pas de certification, aucune limite de profondeur à calculer, et vous pouvez vous arrêter et flotter quand vous voulez.",
      approxNote:
        "Les durées ci-dessus sont la forme habituelle de la sortie, pas un horaire. La marée, la météo et la distance du site les déplacent, et le guide dira au briefing à quoi ressemble la journée.",
      courseDays: [
        {
          title: "Jour 1",
          body: "Théorie et premiers exercices en eau peu profonde devant le homestay : masque, détendeur, flottabilité. Rien de profond, rien de pressé.",
        },
        {
          title: "Jour 2",
          body: "Le reste des exercices en milieu protégé, puis la première plongée en milieu naturel depuis le bateau.",
        },
        {
          title: "Jour 3",
          body: "Deux plongées de plus en milieu naturel, avec plus de plongée et moins d'exercices à mesure que les gestes viennent.",
        },
        {
          title: "Jour 4",
          body: "La dernière plongée, l'examen écrit et les papiers de certification. La carte suit par la poste ou dans l'application.",
        },
      ],
      cta: "Poser une question sur ce forfait",
      priceUnit: "par personne",
      packs: {
        fun2: {
          lede: "La matinée classique. Une sortie en bateau, deux plongées, retour au homestay pour le déjeuner. Les sites sont choisis le matin même selon la marée et le courant plutôt que réservés à l'avance, et c'est pourquoi le guide regarde votre carnet avant de décider où vous emmener.",
          forYou: [
            "Vous êtes certifié Open Water ou au-dessus",
            "Vous avez plongé dans les deux dernières années, ou acceptez de reprendre doucement",
            "Vous préférez garder l'après-midi libre",
          ],
          notIncluded: [
            "Le matériel au-delà du bloc et des plombs. L'équipement complet est une ligne à part, à Rp 350.000 la journée",
            "Le nitrox, et toute spécialité",
            "L'assurance",
          ],
          bring: [
            "Carte de certification et carnet de plongée",
            "Maillot, serviette et un chapeau pour le bateau",
            "Crème solaire sans danger pour le récif",
          ],
        },
        fun3: {
          lede: "La journée entière sur l'eau, trois sites au lieu de deux, avec le déjeuner pris sur le bateau entre la deuxième et la troisième. La plupart des hôtes qui restent plus de trois nuits la font au moins une fois, parce que la troisième plongée est en général celle qui va le plus loin.",
          forYou: [
            "Vous êtes certifié Open Water ou au-dessus et plongez à l'aise",
            "Vous voulez les sites plus loin dans le détroit, pas seulement les plus proches",
            "Une journée entière en bateau vous semble une bonne journée",
          ],
          notIncluded: [
            "Le matériel au-delà du bloc et des plombs. L'équipement complet est une ligne à part, à Rp 350.000 la journée",
            "Le nitrox, et toute spécialité",
            "L'assurance",
          ],
          bring: [
            "Carte de certification et carnet de plongée",
            "Maillot, serviette et un chapeau pour le bateau",
            "Crème solaire sans danger pour le récif, et une couche sèche pour le retour",
          ],
        },
        dsd: {
          lede: "Une première respiration sous l'eau, avec un instructeur à côté de vous tout du long. Cela commence debout dans les petits fonds devant le homestay, où vous pouvez sortir la tête quand vous voulez, et ne passe à une vraie plongée qu'une fois que cela paraît ordinaire. Ce n'est pas une certification et il n'y a pas d'examen.",
          forYou: [
            "Vous n'avez jamais plongé et voulez savoir si cela vous plaît",
            "Vous savez nager et êtes à l'aise le visage dans l'eau",
            "Vous voyagez avec des plongeurs et préférez ne pas passer la semaine à regarder depuis le bateau",
          ],
          notIncluded: [
            "Une certification. Si vous voulez la carte, c'est le cours Open Water",
            "L'assurance",
          ],
          bring: [
            "Maillot et serviette",
            "Rien d'autre. Tout l'équipement est compris",
          ],
        },
        ow: {
          lede: "La certification qui vous permet de plonger partout dans le monde jusqu'à dix-huit mètres, en quatre jours sans quitter l'île. La théorie l'après-midi au homestay, l'eau chaque matin. Le e-learning est envoyé avant votre arrivée : prévenez-nous une semaine à l'avance et vous aurez fait vos lectures dans l'avion.",
          forYou: [
            "Vous voulez le brevet, pas seulement un avant-goût",
            "Vous savez nager et restez au moins quatre journées pleines",
            "Vous préférez apprendre en eau chaude et calme que dans une carrière chez vous",
          ],
          notIncluded: [
            "L'assurance",
            "Les plongées loisir après le cours. Ce sont les lignes Fun Dive",
          ],
          bring: [
            "Maillot et serviette",
            "Une photo de vous pour la certification, ou un téléphone pour la prendre",
            "Vos lectures, faites. Le e-learning arrive par e-mail",
          ],
        },
        snorkel: {
          lede: "La même eau, vue d'en haut. Manta Point quand la saison et la marée s'y prêtent, Piaynemo pour le panorama, ou rien de plus loin que le jardin de corail devant le ponton si une courte journée vous va mieux. Pas de certification, pas de bloc, et les enfants viennent aussi.",
          forYou: [
            "Vous ne plongez pas, ou vous prenez un jour sans plongée",
            "Vous voyagez avec des enfants",
            "Vous voulez voir des raies manta sans passer un cours d'abord",
          ],
          notIncluded: [
            "Le droit d'entrée du belvédère de Piaynemo, si c'est la journée choisie",
            "La location de combinaison",
          ],
          bring: [
            "Maillot, serviette, chapeau",
            "Crème solaire sans danger pour le récif, ou un lycra, qui marche mieux",
          ],
        },
        guide: {
          lede: "Un guide qui plonge avec vous et personne d'autre, autant de jours que vous voulez. Les plongées elles-mêmes sont tarifées dans la liste plus bas ; cette ligne-ci, c'est le guide, à ajouter quand vous préférez ne pas suivre un groupe.",
          forYou: [
            "Vous plongez à deux et préférez éviter le groupe",
            "Vous faites des photos et voulez rester là où est le sujet",
            "Vous reprenez la plongée et aimeriez qu'on vous suive de près",
          ],
          notIncluded: [
            "Les plongées elles-mêmes, qui sont sur la liste des tarifs",
            "Le bateau pour une excursion, affrété au bateau",
            "Ordinateur, lampe et matériel photo",
          ],
          bring: [
            "Carte de certification et carnet de plongée",
            "Tout ce qui est à vous et avec quoi vous préférez plonger, surtout un masque à votre visage",
          ],
        },
      },
    },
    packages: {
      fun2: {
        name: "Fun Dive · 2 blocs",
        blurb:
          "Deux plongées en une sortie du matin, sur des sites autour de Mansuar et dans le détroit de Dampier.",
        duration: "~4 h",
        level: "Open Water et au-dessus",
        unit: "par personne",
        includes: ["Guide", "Bloc et plombs", "Bateau", "Eau et en-cas"],
      },
      fun3: {
        name: "Fun Dive · 3 blocs",
        blurb:
          "Une journée entière, trois sites différents. Celui que prennent la plupart des hôtes qui restent plus de trois nuits.",
        duration: "journée entière",
        level: "Open Water et au-dessus",
        unit: "par personne",
        includes: ["Guide", "Bloc et plombs", "Bateau", "Déjeuner sur le bateau"],
      },
      dsd: {
        name: "Discover Scuba",
        blurb:
          "Pas de certification ? On commence dans les petits fonds devant le homestay, puis une plongée peu profonde avec un instructeur.",
        duration: "~3 h",
        level: "aucune certification requise",
        unit: "par personne",
        includes: ["Instructeur", "Tout l'équipement", "12 mètres maximum"],
      },
      ow: {
        name: "Cours Open Water",
        blurb:
          "Certification complète en quatre jours. Théorie l'après-midi au homestay, pratique en eau calme chaque matin.",
        duration: "4 jours",
        level: "débutant",
        unit: "par personne",
        includes: ["Instructeur", "Supports et e-learning", "Équipement complet", "Certification"],
      },
      snorkel: {
        name: "Sortie snorkeling",
        blurb:
          "Manta Point, Piaynemo, ou le jardin de corail devant le ponton. Aucune plongée nécessaire.",
        duration: "~5 h",
        level: "tous les âges",
        unit: "par personne",
        includes: ["Guide", "Masque et palmes", "Bateau", "Eau et fruits"],
      },
      guide: {
        name: "Guide privé",
        blurb:
          "Un guide pour vous seul, la journée entière. Votre rythme, vos sites, et l'air de personne d'autre à attendre.",
        duration: "par jour",
        level: "Open Water et au-dessus",
        unit: "par jour",
        includes: ["Un guide rien que pour vous", "Des sites choisis avec vous", "Votre propre rythme"],
      },
    },
  },
  season: {
    eyebrow: "Quand venir",
    title: "La mer a ses saisons",
    intro:
      "Raja Ampat se visite toute l'année, mais l'eau n'est pas la même tous les mois. Voici ce que nous voyons depuis notre propre ponton.",
    bands: [
      {
        label: "Meilleure saison",
        months: "Octobre – février",
        note: "L'eau la plus calme et la meilleure visibilité. Les raies manta se montrent le plus souvent entre décembre et février. Les chambres se remplissent tôt, réservez bien à l'avance.",
      },
      {
        label: "Encore bien",
        months: "Mars – avril, août – septembre",
        note: "Météo variable, mais la plongée se fait presque tous les jours. Plus calme, et le ponton est plus souvent à vous.",
      },
      {
        label: "Saison creuse",
        months: "Mai – juillet",
        note: "Le vent de sud-est se lève, la houle grossit, et les sites les plus éloignés sont parfois annulés. Les mois les plus vides, et les bons si vous voulez l'île pour vous.",
      },
    ],
  },
  journey: {
    eyebrow: "Venir ici",
    title: "Quatre étapes depuis Jakarta",
    intro:
      "Un long trajet, mais un trajet simple. Dites-nous l'heure de votre ferry et le nôtre attendra à Waisai.",
    steps: [
      {
        title: "Vol jusqu'à Sorong",
        body: "Aéroport Domine Eduard Osok (SOQ). Vols quotidiens depuis Jakarta, Makassar et Manado.",
      },
      {
        title: "Ferry jusqu'à Waisai",
        body: "Ferry rapide depuis le port de Sorong, environ 2 heures. Deux départs par jour, le matin et à midi.",
      },
      {
        title: "Payer la taxe du parc",
        body: "La carte environnementale de Raja Ampat s'obtient à Waisai. Valable un an.",
      },
      {
        title: "Nous venons vous chercher",
        body: "Notre bateau vous attend au port de Waisai, environ une heure jusqu'à Pulau Kri. Envoyez-nous l'heure de votre ferry sur WhatsApp.",
      },
    ],
    map: {
      open: "Ouvrir la carte",
      title: "Où nous sommes",
      here: "Nous",
      sorong: "Sorong",
      waisai: "Waisai",
      sketchAlt:
        "Un croquis de l'itinéraire : Sorong sur la grande terre, un ferry vers le nord-est jusqu'à Waisai sur Waigeo, puis un bateau vers le sud-ouest jusqu'au homestay sur Pulau Kri.",
      copy: "Copier l'adresse",
      copied: "Copié",
      google: "Ouvrir dans Google Maps",
      osm: "Ouvrir dans OpenStreetMap",
      live: "Charger la carte interactive",
      note: "Le dessin est un croquis, là pour montrer les trois lieux les uns par rapport aux autres. Les deux liens, et la carte interactive, pointent sur les coordonnées exactes. La carte interactive n'est chargée que si vous la demandez : rien ici ne parle à un serveur de cartes tant que vous n'appuyez pas sur le bouton.",
    },
  },
  enquiry: {
    modalTitle: "Écrivez-nous",
    modalIntro:
      "Remplissez ce que vous voulez. Votre message arrive directement à la famille qui tient le homestay, et l'un de nous vous répondra. Rien ne se paie ici et il n'y a aucun compte à créer.",
    close: "Fermer",
    name: "Nom",
    namePlaceholder: "Votre nom",
    phone: "WhatsApp",
    phonePlaceholder: "+33 …",
    email: "E-mail",
    emailPlaceholder: "vous@exemple.com",
    contactNote: "Laissez-en au moins un, pour que nous puissions vous joindre.",
    what: "Vous cherchez",
    when: "Quand",
    people: "Personnes",
    nights: "Nuits",
    notes: "Remarques",
    notesPlaceholder:
      "Allergies, horaires de ferry, certification de plongée, tout ce que vous voulez.",
    submit: "Envoyer",
    sending: "Envoi…",
    sent: "Merci, votre message nous est bien parvenu. Nous répondons le jour même, en général en quelques heures.",
    needContact: "Laissez un numéro WhatsApp ou un e-mail, pour que nous puissions répondre.",
    failed: "L'envoi n'a pas abouti. Réessayez, ou écrivez-nous sur WhatsApp.",
  },
  booking: {
    cta: "Réserver et payer",
    title: "Réserver en direct",
    intro:
      "Les dates, qui vous êtes, et le total. Le paiement se fait à la page suivante, via Midtrans.",
    what: "Ce que vous réservez",
    close: "Fermer",
    checkIn: "Arrivée",
    checkOut: "Départ",
    nights: "Nuits",
    nightsValue: (n) => (n === 1 ? "1 nuit" : `${n} nuits`),
    guests: "Personnes",
    guestsValue: (n) => (n === 1 ? "1 personne" : `${n} personnes`),
    day: "Jour",
    fromDay: "Du",
    untilDay: "Au",
    days: "Jours",
    daysValue: (n) => (n === 1 ? "1 jour" : `${n} jours`),
    divers: "Plongeurs",
    diversValue: (n) => (n === 1 ? "1 plongeur" : `${n} plongeurs`),
    total: "Total",
    next: "Vérifier la commande",
    required: "Celui-ci est nécessaire",
    failed: "Cela n'a pas abouti. Réessayez, ou écrivez-nous sur WhatsApp.",
    hold:
      "Payer envoie l'argent et la réservation ensemble. Nous lisons chaque commande le jour même et confirmons sur WhatsApp — les chambres sont aussi vendues sur d'autres sites, donc les dates sont sûres une fois que nous avons répondu.",
    order: {
      title: "Votre commande",
      intro: "Relisez, puis payez. Ce qui ne va pas se corrige en revenant en arrière.",
      what: "Réservation",
      who: "Pour qui",
      empty:
        "Rien n'a encore été choisi. Choisissez une chambre ou un forfait de plongée et cela apparaîtra ici.",
      back: "Retour au homestay",
      pay: "Payer avec Midtrans",
      payNote:
        "Cartes, virement bancaire, QRIS, GoPay et ShopeePay. La fenêtre de paiement appartient à Midtrans ; nous ne voyons jamais votre carte.",
      paid: "Merci",
      paidNote:
        "Le paiement nous est parvenu et la famille a été prévenue. Nous répondons sur WhatsApp le jour même avec la chambre et l'heure du bateau.",
      failed:
        "Le paiement n'a pas abouti. Rien n'a été débité ; réessayez, ou écrivez-nous sur WhatsApp.",
      home: "Retour au homestay",
    },
  },
  about: {
    cta: "Mieux nous connaître",
    back: "Retour au homestay",
    title: "La famille, les chambres,\net le centre de plongée",
    lede:
      "Turtle Dive Homestay, c'est la maison d'une famille et les dix bungalows qu'elle a bâtis à côté, sur Pulau Kri, dans le détroit de Dampier. Cette page est la version longue : qui tient les lieux, ce qu'un bungalow offre vraiment, et comment le centre de plongée en est venu à s'installer au bout du même ponton.",
    storyHeading: "Chez qui vous logez",
    story: [
      "La famille qui a bâti ce homestay vit ici, dans la maison en haut du sable. Ses membres sont nés dans cette baie, leurs parents aussi, et le récif devant le ponton est celui au-dessus duquel ils ont appris à nager. Personne n'est de service. Si vous avez besoin de quelque chose, vous le demandez à la personne dont c'est la maison.",
      "Les chambres sont un travail papou traditionnel, bois et chaume, montées à la main et réparées de la même façon quand une tempête emporte un panneau. C'est un choix, pas un manque : une chambre bâtie ainsi se répare avec ce qu'il y a sur l'île, ce qui compte à quatre heures de la première quincaillerie.",
      "Ce que la famille ne fera pas, c'est ranger le récif. Il est laissé tel qu'il a été trouvé, et c'est pour cela que le snorkeling commence au bas des marches.",
    ],
    roomsHeading: "Les bungalows",
    roomsIntro: (total) =>
      `${total} bungalows, tous du même type, tous le long d'un même ponton de bois, tous face à la même eau. Lequel vous aurez se décide à la réservation ; un bungalow en réparation n'apparaît jamais comme disponible.`,
    roomsTotal: (total) => `${total} bungalows en tout`,
    serviceHeading: "Ce qui vient avec la chambre",
    serviceIntro:
      "Pas de frais de ménage, pas de frais de service, pas de frais de séjour. Le tarif est le tarif.",
    services: [
      {
        title: "Trois repas par jour",
        body: "Cuisinés par la famille et pris à une seule table sous la paillote. Du poisson pêché le matin, du riz, des légumes, des fruits. Dites-nous avant d'arriver si vous avez des allergies ou quelque chose que vous ne mangez pas.",
      },
      {
        title: "Starlink",
        body: "Assez rapide pour un appel vidéo, et cela atteint presque toutes les chambres. Signalez-le à la réservation si une connexion fiable compte, et nous vous mettrons là où le signal est le plus fort.",
      },
      {
        title: "Eau douce et électricité",
        body: "De l'eau douce pour se laver. Il n'y a de l'électricité que le soir — les horaires sont sur la page d'accueil, avec les tarifs — c'est donc à ce moment-là qu'on recharge appareil photo et téléphone.",
      },
      {
        title: "Le bateau",
        body: "Le nôtre vous attend au port de Waisai et fait la dernière heure. Au retour, il vous ramène pour le ferry que vous nous indiquez.",
      },
      {
        title: "Snorkeling depuis le ponton",
        body: "Masques et palmes sont là. Le récif maison commence à quelques mètres, et il n'y a rien à réserver ni de bateau à attendre.",
      },
      {
        title: "Faire laver son linge",
        body: "Demandez. Cela revient le lendemain. Il n'y a pas de machine sur l'île, alors comptez avec la météo.",
      },
    ],
    diveHeading: "Et puis le centre de plongée",
    diveStory: [
      "Le homestay est venu en premier. Les hôtes demandaient sans cesse à être emmenés sur les sites dont ils avaient lu le nom, et pendant un temps cela voulait dire emprunter un bateau et trouver quelqu'un avec un compresseur.",
      "Turtle Dive Center est la réponse à cela : le bateau de la famille, ses blocs et son matériel, et des guides qui plongent le détroit de Dampier depuis l'enfance. Cape Kri, Mike's Point, Sardine Reef et Manta Point sont tous entre vingt et quarante-cinq minutes du ponton, et le bateau sort deux fois par jour avec six plongeurs par guide au plus.",
      "Il n'est pas nécessaire de plonger pour loger ici, et beaucoup d'hôtes n'enfilent jamais de bloc. Mais si vous êtes venu pour l'eau, c'est la partie du homestay qui a été bâtie pour vous.",
    ],
    since: (year) => `Homestay depuis ${year}`,
    diveSince: (year, gap) =>
      `Centre de plongée depuis ${year}, ${gap === 1 ? "un an" : `${gap} ans`} après le homestay`,
    diveSinceNoYear: "Le centre de plongée est venu après le homestay",
    diveLink: "Voir les forfaits et les prix",
    gallery: {
      stayHeading: "Le lieu lui-même",
      stayIntro:
        "Des photographies prises ici, pas mises en scène pour une brochure. Appuyez sur l'une d'elles pour la voir en grand.",
      diveHeading: "Sous le bateau",
      diveIntro: "La raison pour laquelle la plupart des gens viennent si loin.",
      open: "voir en grand",
      prev: "Photographie précédente",
      next: "Photographie suivante",
      captions: {
        aerial:
          "L'ensemble vu d'en haut. Le ponton, le sable, et le récif qui commence à quelques mètres.",
        boardwalk:
          "La passerelle qui court devant chaque chambre, et l'eau au bout.",
        bungalowRow:
          "Les bungalows, sur pilotis en haut du sable sous les arbres.",
        bungalowFront:
          "Un bungalow vu de face : une large terrasse, un hamac en travers, et l'eau devant.",
        lunch:
          "Le déjeuner sous la paillote, les hamacs tendus derrière et les bungalows au-delà.",
        dusk: "Le ponton dans les dernières lueurs, en regardant vers la baie.",
        manta:
          "Une raie manta au-dessus du récif dans le détroit de Dampier, à vingt à quarante-cinq minutes du ponton.",
      },
    },
    whereHeading: "Où nous sommes",
    closeHeading: "Venez voir",
    closeBody:
      "Demandez-nous ce que vous voulez avant de réserver. Nous répondons le jour même, en général en quelques heures, et il n'y a aucun acompte à payer pour poser une question.",
    closeCta: "Écrivez-nous",
  },
  faq: {
    eyebrow: "Souvent demandé",
    title: "À savoir !",
    items: [
      {
        q: "Y a-t-il de l'électricité et internet ?",
        a: "Il n'y a de l'électricité que le soir — les horaires sont indiqués avec les tarifs plus haut, et c'est le moment où tout se recharge. À côté du réseau téléphonique il y a Starlink, assez rapide pour un appel vidéo, et cela atteint presque tous les bungalows. Si une connexion fiable compte pour votre séjour, dites-le à la réservation et nous vous mettrons dans l'un des bungalows où le signal est le plus fort.",
      },
      {
        q: "Et les repas ?",
        a: "Trois repas par jour sont compris : petit-déjeuner, déjeuner et dîner, aux heures indiquées avec les tarifs plus haut, et la cuisine ne sert pas en dehors. Cuisine locale, telle que la famille la fait. Dites-nous avant d'arriver si vous êtes végétarien, si vous suivez un régime particulier ou si vous avez une allergie.",
      },
      {
        q: "Faut-il bien nager pour faire du snorkeling ?",
        a: "Il n'est pas nécessaire d'être fort dans l'eau. Nous fournissons des flotteurs et un guide est toujours à l'eau avec vous.",
      },
      {
        q: "Puis-je payer par carte ?",
        a: "Il n'y a pas de terminal de paiement sur l'île. Si le bouton de réservation vous a mené à une page de paiement, celle-ci accepte les cartes, le virement et les portefeuilles électroniques habituels ; sinon, payez par virement avant d'arriver ou en espèces à l'arrivée — et prenez de toute façon assez d'espèces à Sorong ou Waisai.",
      },
      {
        q: "Les enfants sont-ils les bienvenus ?",
        a: "Oui. Un bungalow couche deux personnes, et une troisième dort sur un lit d'appoint — un par bungalow, au tarif selon l'âge, et les chiffres sont avec les tarifs plus haut. Dites-nous les âges quand vous écrivez. La sortie snorkeling convient aux enfants à l'aise dans l'eau.",
      },
    ],
  },
  footer: {
    contact: "Contact",
    manager: "Connexion gestion",
    colophon: `© ${PROPERTY.name}, ${PROPERTY.island}. Tenu avec Eddo Homestay à Yenbuba, Pulau Mansuar.`,
    tagline: (year) => (year ? `Raja Ampat · depuis ${year}` : "Raja Ampat"),
    social: "Nous suivre",
    feedback: {
      heading: "Dites-nous comment c'était",
      intro:
        "Dites-nous ce qui a manqué et ce qui a marché. Chaque message est lu par la famille qui tient le homestay, et nous y donnons suite sans tarder.",
      message: "Votre message",
      messagePlaceholder: "Qu'est-ce que vous changeriez ?",
      email: "E-mail, si vous souhaitez une réponse",
      emailPlaceholder: "E-mail, seulement si vous voulez une réponse",
      submit: "Envoyer",
      sending: "Envoi…",
      sent: "Merci. Votre message nous est parvenu, et nous y donnerons suite sans tarder.",
      empty: "Écrivez quelque chose d'abord, puis envoyez.",
      failed: "L'envoi n'a pas abouti. Réessayez plus tard.",
    },
  },
  activities: {
    stay: "Séjour",
    diving: "Plongée",
    snorkeling: "Snorkeling",
    both: "Séjour + plongée",
    motorbike: "Location de moto",
    camera: "Location d'appareil photo",
    package: "Forfait complet",
  },
  months: [
    "janvier",
    "février",
    "mars",
    "avril",
    "mai",
    "juin",
    "juillet",
    "août",
    "septembre",
    "octobre",
    "novembre",
    "décembre",
  ],
  message: (v) =>
    [
      `Bonjour ${PROPERTY.name}, je souhaite me renseigner sur : ${v.activity.toLowerCase()}.`,
      "",
      v.name.trim() && `Nom : ${v.name.trim()}`,
      v.phone.trim() && `WhatsApp : ${v.phone.trim()}`,
      v.email.trim() && `E-mail : ${v.email.trim()}`,
      `Dates : ${v.when}`,
      `Personnes : ${v.people}`,
      v.withNights && `Nuits : ${v.nights}`,
      v.notes.trim() && `Remarques : ${v.notes.trim()}`,
      "",
      "Merci.",
    ]
      .filter(Boolean)
      .join("\n"),
};

const DE: SiteCopy = {
  htmlLang: "de",
  nav: {
    home: "Start",
    rooms: "Zimmer",
    diving: "Tauchen",
    season: "Jahreszeit",
    journey: "Anreise",
    faq: "Fragen",
  },
  book: "Buchen",
  openMenu: "Menü öffnen",
  currencyLabel: "Ungefähren Preis anzeigen in",
  langLabel: "Diese Seite lesen auf",
  currencyNote: "Abgerechnet wird in Rupiah. Die zweite Zeile ist eine ungefähre Umrechnung, ein paar Mal am Tag aktualisiert.",
  meta: {
    title: `${PROPERTY.name} · Homestay und Tauchbasis in Raja Ampat`,
    description:
      "Ein Familien-Homestay und eine Tauchbasis auf Pulau Kri, Raja Ampat. Bungalows auf Stelzen am Wasser, drei Mahlzeiten am Tag und täglich Tauchgänge in der Dampier-Straße.",
  },
  maintenance: {
    eyebrow: "Gleich zurück",
    title: "Wir arbeiten gerade\nan dieser Seite",
    body: "An der Seite wird gearbeitet, sie kommt von selbst zurück. Am Homestay hat sich nichts geändert: Die Zimmer sind da, das Boot fährt raus, und wir beantworten Nachrichten wie immer.",
    contactLead: "So erreichen Sie uns in der Zwischenzeit",
    whatsapp: "Über WhatsApp schreiben",
    email: "E-Mail schreiben",
  },
  hero: {
    sub: "Ein Homestay auf Pulau Kri, von Hand aus einheimischem Holz gebaut, am Rand eines Riffs, das wir so lassen, wie wir es vorgefunden haben. Geführt von der Familie, die schon immer in dieser Bucht lebt, im Takt der Gezeiten.",
  },
  value: {
    heading: "Ein Steg, eine Familie,",
    headingBreak: "und das Riff direkt davor",
    eyebrow: "01 · Warum hier",
    title: "Gastfreundschaft, die sich\nwie Familie anfühlt.",
    body: "Um die Gäste kümmert sich die Familie, die dieses Homestay gebaut hat und immer noch hier wohnt. Die Zimmer sind traditionelle papuanische Arbeit aus Holz und Palmdach, bewusst einfach, und eine Starlink-Verbindung reicht in fast jedes davon, schnell genug für einen Videoanruf. Jede Terrasse öffnet sich auf dieselbe Sicht: die Dampier-Straße, die Karstinseln dahinter und das Riff direkt darunter.",
    cta: "Nach freien Zimmern fragen",
    ctaNote: "Ich würde gern wissen, welche Zimmer frei sind.",
  },
  cards: [
    {
      title: "Abend auf dem Steg",
      sub: "Sonnenuntergang vom Ende des Stegs",
      badge: "Steg",
      alt: "Ein Gast sitzt bei Sonnenuntergang am Ende des Stegs",
    },
    {
      title: "Gemeinsam essen",
      sub: "Drei Mahlzeiten am Tag, ein Tisch",
      badge: "Essenshütte",
      alt: "Zwei Gäste essen unter einer hölzernen Hütte mit Palmdach",
    },
    {
      title: "Zimmer am Wasser",
      sub: "Zehn Zimmer an einem Holzsteg",
      badge: "Pulau Kri",
      alt: "Der Holzsteg vor einer Reihe von Bungalows mit Palmdach",
    },
  ],
  rooms: {
    eyebrow: "Der Bungalow und die Preise",
    title: "Wo Sie schlafen",
    intro:
      "Ein Bungalowtyp, zehn davon, drei Mahlzeiten am Tag inklusive. Was eine Nacht kostet, hängt davon ab, ob einer oder zwei darin schlafen.",
    perNight: "pro Nacht",
    forOne: "eine Person",
    forTwo: "zwei Personen",
    roomsLabel: (n) => `${n} Bungalows`,
    ask: "Nach dem Bungalow fragen",
    askNote: (name) => `Ich interessiere mich für den ${name}.`,
    otaNote:
      "Die Bungalows stehen auch auf stayrajaampat.com und auf Booking.com. Wenn Sie lieber dort buchen, tun Sie das ruhig. Was Ihnen kein Portal verkaufen kann, ist ein Platz im Tauchboot — der wird hier arrangiert.",
    types: {
      deluxe: {
        name: "Deluxe Bungalow",
        blurb:
          "Traditionelle Homestay-Arbeit, gebaut aus dem Holz und dem Blattwerk, das ringsum wächst. Eigene Terrasse zum Meer, eine Sonnenliege darauf, und das Bad im Bungalow statt drüben über dem Sand.",
        cap: "Maximal 2 Personen",
        features: [
          "Eigene Terrasse zum Meer",
          "Sonnenliege auf der Terrasse",
          "Bad im Bungalow",
          "Drei Mahlzeiten am Tag inklusive",
        ],
        alt: "Eine Reihe Holzbungalows auf Stelzen am Rand des Sandes, im Schatten der Bäume, das Wasser ein paar Schritte entfernt.",
      },
    },
    extra: {
      heading: "Eine dritte Person",
      ages: {
        child: "3 bis 9 Jahre",
        teen: "10 bis 16 Jahre",
        adult: "Ab 17 Jahren",
      },
      per: "pro Person und Nacht",
      note: "Ein Zustellbett pro Bungalow. Schreiben Sie uns die Alter, dann sagen wir, was hineinpasst — ein Zustellbett wird per Nachricht vereinbart und nicht hier gebucht.",
    },
    rules: {
      heading: "Gut zu wissen",
      checkIn: "Anreise ab",
      checkOut: "Abreise bis",
      power: "Strom",
      meals: "Frühstück, Mittag, Abendessen",
      diet: "Vegetarisch, eine eingeschränkte Ernährung oder eine Allergie: sagen Sie es uns vor der Anreise, damit die Küche Bescheid weiß.",
      refund: "Nach dem Anreisetag wird ein Aufenthalt nicht erstattet.",
    },
  },
  dive: {
    badge: "Turtle Dive Center",
    title: "Morgens tauchen,\nvor dem Mittagessen zurück",
    body: "Wir tauchen in der Dampier-Straße: Cape Kri, Mike's Point, Sardine Reef, Manta Point, alle 20 bis 45 Bootsminuten vom Steg. Das Boot fährt zweimal am Tag, höchstens sechs Taucher pro Guide.",
    details: "Details",
    partner: "Ausbildungspartner",
    orderNote: (name) => `Ich interessiere mich für das Paket „${name}“.`,
    footnote:
      "Zertifizierte Taucher bringen bitte Brevet und Logbuch mit. Für den Open-Water-Kurs sagen Sie uns mindestens eine Woche vorher Bescheid, damit Material und Zeitplan des Instruktors stehen.",
    askPrice: "Nach dem Preis fragen",
    videoLabel: "Tauchen mit dem Turtle Dive Center",
    videoSoon: "Hier kommt ein Clip vom Tauchen hin.",
    videoPlay: "Abspielen",
    list: {
      heading: "Tauchpreise 2025",
      intro:
        "Die ganze Liste, so wie die Basis sie führt. Was einen Knopf „Buchen und bezahlen“ hat, können Sie hier gleich erledigen; alles andere wird per Nachricht vereinbart oder abends, wenn der Plan für morgen gemacht wird.",
      groups: {
        fun: "Tauchgänge und Tagesausfahrten",
        night: "Nachttauchgänge",
        learn: "Schnuppern und Auffrischen",
        extra: "Ein Guide, und eine Flasche",
        boat: "Das Boot für eine Ausfahrt",
      },
      groupNote: {
        fun: "Was das Boot bei Tage macht: zwei Flaschen vor dem Mittag, ein ganzer Tag, oder eine Fahrt nach Piaynemo, zur Manta-Putzerstation, nach Yangefo oder zum P47-Wrack.",
        night: "Nach Einbruch der Dunkelheit, bei Yenbuba oder Sawandarek, sobald Sie zu zweit sind.",
        learn: "Noch nie getaucht, oder seit ein paar Jahren nicht mehr.",
        extra: "Weder Ausfahrt noch Kurs: ein Guide nur für Sie, einen Tag lang, und eine Flasche für das Riff vor dem Haus.",
        boat: "Pro Boot gechartert, nicht pro Kopf, und getrennt von den Tauchgängen oben.",
      },
      min: (n) => `mindestens ${n} Taucher`,
      per: {
        person: "pro Person",
        day: "pro Tag",
        tank: "pro Flasche",
        boat: "pro Boot",
      },
      names: {
        piaynemo2: "Piaynemo · 2 Tauchgänge",
        manta2: "Manta-Putzerstation · 2 Tauchgänge",
        mantaPm: "Manta-Putzerstation · nachmittags",
        yangefo2: "Yangefo · 2 Tauchgänge",
        p47: "P47-Wrack · 2 Tauchgänge",
        houseReef: "Hausriff",
        tank: "Flaschenmiete",
        boatPiaynemo: "Piaynemo",
        boatPiaynemoJoin: "Piaynemo, geteilt",
        boatYangefo: "Yangefo",
        boatBatanta: "Batanta-Wasserfall",
      },
      rows: {
        one: "Ein Tauchgang",
        fun2: "Zwei Tauchgänge an einem Vormittag",
        fun3: "Drei Tauchgänge an einem Tag",
        piaynemo2: "Zwei Tauchgänge auf der Piaynemo-Ausfahrt, ohne Boot",
        manta2: "Zwei Tauchgänge an der Manta-Putzerstation und bei Arborek — Manta Ridge oder Manta Sandy",
        mantaPm: "Ein Nachmittagstauchgang an der Manta-Putzerstation — Manta Ridge oder Manta Sandy",
        yangefo2: "Zwei Tauchgänge bei Yangefo — Citrus und Mayhem",
        p47: "Zwei Tauchgänge am P47-Wrack vor Batanta und am Manta Way",
        nightYenbuba: "Nachttauchgang bei Yenbuba oder der Insel Ransiwor",
        nightSawandarek: "Nachttauchgang bei Sawandarek",
        houseReef: "Allein und ohne Guide — erfahrene Taucher",
        refresh: "Auffrischung der Fertigkeiten",
        dsd: "Schnuppertauchen, ohne Brevet",
        guide: "Ein Guide nur für Sie",
        tank: "Für Gäste, die an unserem Hausriff tauchen",
      },
      notes: [
        "Ausrüstung und Boot sind an den lokalen Plätzen inklusive. Eine Ausfahrt ist es nicht, und kein Preis enthält einen Tauchcomputer.",
        "Ein weiter entfernter lokaler Platz kann einen Treibstoffzuschlag von Rp 300.000 bis Rp 500.000 kosten, wenn weniger als drei Taucher mitfahren.",
        "Taucher mit eigener kompletter Ausrüstung zahlen Rp 100.000 weniger, außer auf einer Ausfahrt.",
        "Bringen Sie Ihre eigene Maske mit, wenn sie Ihnen passt.",
        "Eine Versicherung, die Gerätetauchen abdeckt, wird empfohlen.",
      ],
      boats: {
        boatPiaynemo:
          "Bis zu 5 Taucher — mit Eintritt zum Aussichtspunkt und Lunchpaket für Turtle-Gäste",
        boatPiaynemoJoin:
          "Mit Schnorchlern, 6 bis 7 Personen insgesamt und davon fünf Taucher — derselbe Eintritt, dasselbe Lunchpaket",
        boatYangefo:
          "Bis zu 5 Taucher — mit der Passage der Kabuy-Bucht und einem Halt an der Fledermaushöhle",
        boatBatanta:
          "Bis zu 5 Taucher — mit Eintritt zum Wasserfall",
      },
      plan: "Wohin das Boot morgen fährt, wird jeden Abend nach dem Essen gemeinsam entschieden, gegen 20:00.",
      reserve: "Für eine Tauchreservierung schreiben oder rufen Sie im Büro an, oder kommen Sie abends gegen 20:00 ins Restaurant.",
    },
    bar: {
      pack: "Paket",
      when: "Wann",
      divers: "Taucher",
      diverCount: (n) => (n === "1" ? "1 Taucher" : `${n} Taucher`),
      submit: "Verfügbarkeit prüfen",
      note: (pack, divers) =>
        `Ich interessiere mich für das Paket „${pack}“, für ${divers === "1" ? "einen Taucher" : `${divers} Taucher`}.`,
    },
    detail: {
      back: "Alle Tauchpakete",
      dayHeading: "Wie sich der Tag aufteilt",
      daysHeading: "Die vier Tage",
      depthHeading: "Wie tief es geht",
      includedHeading: "Im Preis enthalten",
      notIncludedHeading: "Nicht enthalten",
      bringHeading: "Mitbringen",
      forHeading: "Passt zu Ihnen, wenn",
      stages: {
        brief: "Briefing und Ausrüstungscheck",
        boat: "Ausfahrt",
        dive: "Tauchgang",
        interval: "Oberflächenpause",
        lunch: "Mittagessen an Bord",
        back: "Rückfahrt",
        shallow: "Flachwasser vor dem Homestay",
        snorkel: "Im Wasser",
        rest: "Pause und Ausrüstung spülen",
      },
      inWater: "Im Wasser",
      onLand: "An Bord oder an Land",
      surface: "Oberfläche",
      hourShort: "Std.",
      minShort: "Min.",
      limitLabel: (m) => `Grenze ${m} m`,
      depthMarks: [
        { depth: 18, label: "18 m · Open Water" },
        { depth: 30, label: "30 m · Advanced" },
        { depth: 40, label: "40 m · Sporttauchgrenze" },
      ],
      noDepth: "Dieser bleibt an der Oberfläche. Kein Brevet, keine Tiefengrenze im Kopf, und Sie können jederzeit anhalten und treiben.",
      approxNote:
        "Die Zeiten oben sind die übliche Form des Ausflugs, kein Fahrplan. Gezeiten, Wetter und die Entfernung des Platzes verschieben sie, und der Guide sagt beim Briefing, wie der Tag aussieht.",
      courseDays: [
        {
          title: "Tag 1",
          body: "Theorie und die ersten Übungen im flachen Wasser vor dem Homestay: Maske, Atemregler, Tarierung. Nichts Tiefes, nichts Hektisches.",
        },
        {
          title: "Tag 2",
          body: "Der Rest der Übungen im geschützten Wasser, dann der erste Freiwassertauchgang vom Boot.",
        },
        {
          title: "Tag 3",
          body: "Zwei weitere Freiwassertauchgänge, mit mehr Tauchen und weniger Üben, je sicherer die Handgriffe sitzen.",
        },
        {
          title: "Tag 4",
          body: "Der letzte Tauchgang, die schriftliche Prüfung und die Papiere. Die Karte kommt per Post oder in der App.",
        },
      ],
      cta: "Nach diesem Paket fragen",
      priceUnit: "pro Person",
      packs: {
        fun2: {
          lede: "Der übliche Vormittag. Eine Ausfahrt, zwei Tauchgänge, rechtzeitig zum Mittagessen zurück im Homestay. Die Plätze werden am Morgen nach Gezeiten und Strömung ausgesucht statt vorher gebucht — deshalb fragt der Guide nach Ihrem Logbuch, bevor er entscheidet, wohin es geht.",
          forYou: [
            "Sie sind Open Water oder höher brevetiert",
            "Sie sind in den letzten zwei Jahren getaucht, oder gehen den ersten Tauchgang gern ruhig an",
            "Sie möchten den Nachmittag frei behalten",
          ],
          notIncluded: [
            "Ausrüstung über Flasche und Blei hinaus. Die komplette Ausrüstung ist eine eigene Position zu Rp 350.000 am Tag",
            "Nitrox und jede Spezialausbildung",
            "Versicherung",
          ],
          bring: [
            "Brevet und Logbuch",
            "Badesachen, Handtuch und einen Hut fürs Boot",
            "Riffverträgliche Sonnencreme",
          ],
        },
        fun3: {
          lede: "Der ganze Tag auf dem Wasser, drei Plätze statt zwei, mit Mittagessen an Bord zwischen dem zweiten und dem dritten. Die meisten Gäste, die länger als drei Nächte bleiben, machen das mindestens einmal, denn der dritte Tauchgang führt meist am weitesten hinaus.",
          forYou: [
            "Sie sind Open Water oder höher brevetiert und tauchen entspannt",
            "Sie wollen die Plätze weiter draußen in der Meerenge, nicht nur die nahen",
            "Ein ganzer Tag auf einem Boot klingt nach einem guten Tag",
          ],
          notIncluded: [
            "Ausrüstung über Flasche und Blei hinaus. Die komplette Ausrüstung ist eine eigene Position zu Rp 350.000 am Tag",
            "Nitrox und jede Spezialausbildung",
            "Versicherung",
          ],
          bring: [
            "Brevet und Logbuch",
            "Badesachen, Handtuch und einen Hut fürs Boot",
            "Riffverträgliche Sonnencreme und etwas Trockenes für die Rückfahrt",
          ],
        },
        dsd: {
          lede: "Der erste Atemzug unter Wasser, mit einem Instruktor die ganze Zeit neben Ihnen. Es beginnt im Stehen im Flachwasser vor dem Homestay, wo Sie den Kopf jederzeit über Wasser nehmen können, und wird erst dann ein richtiger Tauchgang, wenn sich das normal anfühlt. Es ist kein Brevet und es gibt keine Prüfung.",
          forYou: [
            "Sie sind noch nie getaucht und wollen herausfinden, ob es Ihnen gefällt",
            "Sie können schwimmen und haben kein Problem damit, das Gesicht ins Wasser zu halten",
            "Sie reisen mit Tauchern und möchten die Woche nicht zuschauend auf dem Boot verbringen",
          ],
          notIncluded: [
            "Ein Brevet. Wenn Sie die Karte wollen, ist das der Open-Water-Kurs",
            "Versicherung",
          ],
          bring: [
            "Badesachen und Handtuch",
            "Sonst nichts. Die gesamte Ausrüstung ist dabei",
          ],
        },
        ow: {
          lede: "Das Brevet, mit dem Sie weltweit bis achtzehn Meter tauchen dürfen, in vier Tagen, ohne die Insel zu verlassen. Theorie nachmittags im Homestay, Wasser jeden Morgen. Das E-Learning wird vor der Anreise verschickt: Sagen Sie eine Woche vorher Bescheid, dann haben Sie den Lesestoff im Flugzeug erledigt.",
          forYou: [
            "Sie wollen den Schein, nicht nur einen Vorgeschmack",
            "Sie können schwimmen und bleiben mindestens vier volle Tage",
            "Sie lernen lieber in warmem, ruhigem Wasser als im Baggersee zu Hause",
          ],
          notIncluded: [
            "Versicherung",
            "Spaßtauchgänge nach dem Kurs. Das sind die Fun-Dive-Positionen",
          ],
          bring: [
            "Badesachen und Handtuch",
            "Ein Foto von sich für das Brevet, oder ein Telefon, um eines zu machen",
            "Ihren Lesestoff, erledigt. Das E-Learning kommt per E-Mail",
          ],
        },
        snorkel: {
          lede: "Dasselbe Wasser, von oben. Manta Point, wenn Saison und Gezeiten passen, Piaynemo wegen der Aussicht, oder nicht weiter als bis zum Korallengarten vor dem Steg, wenn Ihnen ein kurzer Tag lieber ist. Kein Brevet, keine Flasche, und Kinder kommen mit.",
          forYou: [
            "Sie tauchen nicht, oder legen einen tauchfreien Tag ein",
            "Sie reisen mit Kindern",
            "Sie wollen Mantas sehen, ohne vorher einen Kurs zu machen",
          ],
          notIncluded: [
            "Die Eintrittsgebühr für den Aussichtspunkt Piaynemo, falls das der gewählte Tag ist",
            "Leihen eines Neoprenanzugs",
          ],
          bring: [
            "Badesachen, Handtuch, Hut",
            "Riffverträgliche Sonnencreme, oder ein Lycrashirt, das besser wirkt",
          ],
        },
        guide: {
          lede: "Ein Guide, der mit Ihnen und sonst niemandem taucht, so viele Tage Sie möchten. Die Tauchgänge selbst stehen in der Preisliste weiter unten; diese Zeile ist der Guide, und sie ist das, was man dazunimmt, wenn man lieber keiner Gruppe folgt.",
          forYou: [
            "Sie tauchen zu zweit und möchten sich keiner Gruppe anschließen",
            "Sie fotografieren und wollen dort bleiben, wo das Motiv ist",
            "Sie kommen zum Tauchen zurück und hätten gern jemanden, der genau hinsieht",
          ],
          notIncluded: [
            "Die Tauchgänge selbst, die in der Preisliste stehen",
            "Das Boot zu einem Ausfahrtsziel, das pro Boot gechartert wird",
            "Computer, Lampe und Fotoausrüstung",
          ],
          bring: [
            "Brevet und Logbuch",
            "Alles Eigene, mit dem Sie lieber tauchen, vor allem eine Maske, die passt",
          ],
        },
      },
    },
    packages: {
      fun2: {
        name: "Fun Dive · 2 Flaschen",
        blurb:
          "Zwei Tauchgänge auf einer Vormittagsausfahrt, an Plätzen rund um Mansuar und in der Dampier-Straße.",
        duration: "~4 Std.",
        level: "Open Water und höher",
        unit: "pro Person",
        includes: ["Guide", "Flasche und Blei", "Boot", "Wasser und Snacks"],
      },
      fun3: {
        name: "Fun Dive · 3 Flaschen",
        blurb:
          "Ein ganzer Tag, drei verschiedene Plätze. Das Paket, das die meisten nehmen, die länger als drei Nächte bleiben.",
        duration: "ganzer Tag",
        level: "Open Water und höher",
        unit: "pro Person",
        includes: ["Guide", "Flasche und Blei", "Boot", "Mittagessen an Bord"],
      },
      dsd: {
        name: "Discover Scuba",
        blurb:
          "Kein Brevet? Erst im Flachwasser vor dem Homestay, dann ein flacher Tauchgang mit einem Instruktor.",
        duration: "~3 Std.",
        level: "kein Brevet nötig",
        unit: "pro Person",
        includes: ["Instruktor", "Komplette Ausrüstung", "Maximal 12 Meter"],
      },
      ow: {
        name: "Open-Water-Kurs",
        blurb:
          "Volles Brevet in vier Tagen. Theorie nachmittags im Homestay, Praxis jeden Morgen im ruhigen Wasser.",
        duration: "4 Tage",
        level: "Anfänger",
        unit: "pro Person",
        includes: ["Instruktor", "Material und E-Learning", "Komplette Ausrüstung", "Brevet"],
      },
      snorkel: {
        name: "Schnorchelausflug",
        blurb:
          "Manta Point, Piaynemo oder der Korallengarten vor dem Steg. Tauchen ist nicht nötig.",
        duration: "~5 Std.",
        level: "jedes Alter",
        unit: "pro Person",
        includes: ["Guide", "Maske und Flossen", "Boot", "Wasser und Obst"],
      },
      guide: {
        name: "Privater Guide",
        blurb:
          "Ein Guide nur für Sie, den ganzen Tag. Ihr Tempo, Ihre Plätze, und niemandes Luft, auf die Sie warten müssen.",
        duration: "pro Tag",
        level: "Open Water und höher",
        unit: "pro Tag",
        includes: ["Ein Guide nur für Sie", "Plätze, mit Ihnen ausgesucht", "Ihr eigenes Tempo"],
      },
    },
  },
  season: {
    eyebrow: "Wann kommen",
    title: "Das Meer hat seine Jahreszeiten",
    intro:
      "Raja Ampat lässt sich das ganze Jahr besuchen, aber das Wasser ist nicht in jedem Monat dasselbe. Das ist, was wir von unserem eigenen Steg aus sehen.",
    bands: [
      {
        label: "Beste Zeit",
        months: "Oktober – Februar",
        note: "Das ruhigste Wasser und die weiteste Sicht. Mantas zeigen sich am häufigsten zwischen Dezember und Februar. Die Zimmer füllen sich früh, buchen Sie rechtzeitig.",
      },
      {
        label: "Immer noch gut",
        months: "März – April, August – September",
        note: "Wechselhaftes Wetter, getaucht wird trotzdem fast jeden Tag. Ruhiger, und der Steg gehört öfter Ihnen.",
      },
      {
        label: "Ruhige Zeit",
        months: "Mai – Juli",
        note: "Der Südostwind steht, die Dünung ist größer, und die weiter entfernten Plätze fallen manchmal aus. Die leersten Monate — und die richtigen, wenn Sie die Insel für sich wollen.",
      },
    ],
  },
  journey: {
    eyebrow: "Anreise",
    title: "Vier Schritte ab Jakarta",
    intro:
      "Eine lange Reise, aber eine geradlinige. Sagen Sie uns Ihre Fährzeit, dann wartet unser Boot in Waisai.",
    steps: [
      {
        title: "Flug nach Sorong",
        body: "Flughafen Domine Eduard Osok (SOQ). Tägliche Flüge aus Jakarta, Makassar und Manado.",
      },
      {
        title: "Fähre nach Waisai",
        body: "Schnellfähre ab Hafen Sorong, etwa 2 Stunden. Zwei Abfahrten am Tag, morgens und mittags.",
      },
      {
        title: "Parkgebühr zahlen",
        body: "Die Umweltkarte für Raja Ampat wird in Waisai ausgestellt. Ein Jahr gültig.",
      },
      {
        title: "Wir holen Sie ab",
        body: "Unser Boot erwartet Sie im Hafen von Waisai, etwa eine Stunde bis Pulau Kri. Schicken Sie uns Ihre Fährzeit über WhatsApp.",
      },
    ],
    map: {
      open: "Karte öffnen",
      title: "Wo wir sind",
      here: "Wir",
      sorong: "Sorong",
      waisai: "Waisai",
      sketchAlt:
        "Eine Skizze der Route: Sorong auf dem Festland, mit der Fähre nach Nordosten nach Waisai auf Waigeo, dann mit dem Boot nach Südwesten zum Homestay auf Pulau Kri.",
      copy: "Adresse kopieren",
      copied: "Kopiert",
      google: "In Google Maps öffnen",
      osm: "In OpenStreetMap öffnen",
      live: "Interaktive Karte laden",
      note: "Die Zeichnung ist eine Skizze, sie zeigt nur, wie die drei Orte zueinander liegen. Beide Links und die interaktive Karte zeigen auf die genauen Koordinaten. Die interaktive Karte wird erst geladen, wenn Sie danach fragen — vorher spricht hier nichts mit einem Kartenserver.",
    },
  },
  enquiry: {
    modalTitle: "Schreiben Sie uns",
    modalIntro:
      "Füllen Sie so viel aus, wie Sie mögen. Ihre Nachricht geht direkt an die Familie, die das Homestay führt, und eine(r) von uns antwortet. Hier wird nichts bezahlt und kein Konto angelegt.",
    close: "Schließen",
    name: "Name",
    namePlaceholder: "Ihr Name",
    phone: "WhatsApp",
    phonePlaceholder: "+49 …",
    email: "E-Mail",
    emailPlaceholder: "sie@beispiel.de",
    contactNote: "Lassen Sie uns mindestens eines da, damit wir Sie erreichen.",
    what: "Sie suchen",
    when: "Wann",
    people: "Personen",
    nights: "Nächte",
    notes: "Anmerkungen",
    notesPlaceholder:
      "Allergien, Fährzeiten, Tauchbrevet, alles, was wichtig ist.",
    submit: "Senden",
    sending: "Wird gesendet…",
    sent: "Danke, Ihre Nachricht ist bei uns. Wir antworten noch am selben Tag, meist innerhalb weniger Stunden.",
    needContact: "Bitte hinterlassen Sie eine WhatsApp-Nummer oder eine E-Mail, damit wir antworten können.",
    failed: "Das hat nicht geklappt. Bitte noch einmal versuchen, oder schreiben Sie uns über WhatsApp.",
  },
  booking: {
    cta: "Buchen und bezahlen",
    title: "Direkt buchen",
    intro:
      "Die Tage, wer Sie sind, und was es macht. Bezahlt wird auf der nächsten Seite, über Midtrans.",
    what: "Was Sie buchen",
    close: "Schließen",
    checkIn: "Anreise",
    checkOut: "Abreise",
    nights: "Nächte",
    nightsValue: (n) => (n === 1 ? "1 Nacht" : `${n} Nächte`),
    guests: "Gäste",
    guestsValue: (n) => (n === 1 ? "1 Gast" : `${n} Gäste`),
    day: "Tag",
    fromDay: "Von",
    untilDay: "Bis",
    days: "Tage",
    daysValue: (n) => (n === 1 ? "1 Tag" : `${n} Tage`),
    divers: "Taucher",
    diversValue: (n) => (n === 1 ? "1 Taucher" : `${n} Taucher`),
    total: "Gesamt",
    next: "Bestellung prüfen",
    required: "Das hier wird gebraucht",
    failed: "Das hat nicht geklappt. Versuchen Sie es noch einmal, oder schreiben Sie uns über WhatsApp.",
    hold:
      "Bezahlen schickt das Geld und die Buchung zusammen. Wir lesen jede Bestellung am selben Tag und bestätigen über WhatsApp — die Zimmer werden auch auf anderen Seiten verkauft, sicher sind die Tage also, sobald wir geantwortet haben.",
    order: {
      title: "Ihre Bestellung",
      intro: "Schauen Sie sie durch, dann zahlen Sie. Was nicht stimmt, wird durch Zurückgehen geändert.",
      what: "Buchung",
      who: "Für wen",
      empty:
        "Es wurde noch nichts gewählt. Wählen Sie ein Zimmer oder ein Tauchpaket, dann erscheint es hier.",
      back: "Zurück zum Homestay",
      pay: "Mit Midtrans bezahlen",
      payNote:
        "Karten, Banküberweisung, QRIS, GoPay und ShopeePay. Das Zahlungsfenster gehört Midtrans; wir sehen Ihre Karte nie.",
      paid: "Danke",
      paidNote:
        "Die Zahlung ist bei uns angekommen und die Familie ist informiert. Wir melden uns noch am selben Tag über WhatsApp mit dem Zimmer und der Bootszeit.",
      failed:
        "Die Zahlung hat nicht geklappt. Es wurde nichts abgebucht; versuchen Sie es noch einmal, oder schreiben Sie uns über WhatsApp.",
      home: "Zurück zum Homestay",
    },
  },
  about: {
    cta: "Uns kennenlernen",
    back: "Zurück zum Homestay",
    title: "Die Familie, die Zimmer\nund die Tauchbasis",
    lede:
      "Turtle Dive Homestay ist das Haus einer Familie und die zehn Bungalows, die sie daneben gebaut hat, auf Pulau Kri in der Dampier-Straße. Diese Seite ist die lange Fassung: wer das hier führt, was ein Bungalow wirklich bietet, und wie die Tauchbasis ans Ende desselben Stegs kam.",
    storyHeading: "Bei wem Sie wohnen",
    story: [
      "Die Familie, die dieses Homestay gebaut hat, wohnt hier, im Haus oben am Sand. Sie ist in dieser Bucht geboren, ihre Eltern auch, und das Riff vor dem Steg ist das, über dem sie schwimmen gelernt hat. Niemand hat hier Schicht. Wenn Sie etwas brauchen, fragen Sie die Person, der das Haus gehört.",
      "Die Zimmer sind traditionelle papuanische Arbeit, Holz und Palmdach, von Hand gebaut und genauso repariert, wenn ein Sturm eine Platte mitnimmt. Das ist eine Entscheidung, kein Mangel: Ein so gebautes Zimmer lässt sich mit dem flicken, was es auf der Insel gibt — und das zählt vier Stunden vom nächsten Baumarkt entfernt.",
      "Was die Familie nicht tut, ist das Riff aufzuräumen. Es bleibt, wie es vorgefunden wurde, und deshalb fängt das Schnorcheln am Fuß der Treppe an.",
    ],
    roomsHeading: "Die Bungalows",
    roomsIntro: (total) =>
      `${total} Bungalows, alle vom selben Typ, alle an einem Holzsteg, alle zum selben Wasser hin. Welchen Sie bekommen, klärt sich bei der Buchung; einer in Reparatur erscheint nie als frei.`,
    roomsTotal: (total) => `${total} Bungalows insgesamt`,
    serviceHeading: "Was im Zimmerpreis steckt",
    serviceIntro:
      "Keine Reinigungsgebühr, keine Servicepauschale, keine Resortgebühr. Der Preis ist der Preis.",
    services: [
      {
        title: "Drei Mahlzeiten am Tag",
        body: "Von der Familie gekocht und an einem Tisch in der Essenshütte gegessen. Fisch von diesem Morgen, Reis, Gemüse, Obst. Sagen Sie uns vor der Anreise Bescheid, wenn Sie Allergien haben oder etwas nicht essen.",
      },
      {
        title: "Starlink",
        body: "Schnell genug für einen Videoanruf, und es reicht in fast jedes Zimmer. Sagen Sie bei der Buchung Bescheid, wenn eine verlässliche Verbindung zählt, dann legen wir Sie dorthin, wo das Signal am stärksten ist.",
      },
      {
        title: "Süßwasser und Strom",
        body: "Süßwasser zum Waschen. Strom gibt es nur abends — die Zeiten stehen auf der Startseite bei den Preisen —, dann werden Kamera und Telefon geladen.",
      },
      {
        title: "Das Boot",
        body: "Unseres erwartet Sie im Hafen von Waisai und bringt Sie die letzte Stunde. Zurück fährt es Sie zu der Fähre, die Sie uns nennen.",
      },
      {
        title: "Schnorcheln vom Steg",
        body: "Maske und Flossen sind da. Das Hausriff beginnt ein paar Meter draußen, und Sie müssen nichts buchen und auf kein Boot warten.",
      },
      {
        title: "Wäsche waschen lassen",
        body: "Fragen Sie. Am nächsten Tag ist sie zurück. Es gibt keine Maschine auf der Insel, rechnen Sie also mit dem Wetter.",
      },
    ],
    diveHeading: "Und dann die Tauchbasis",
    diveStory: [
      "Das Homestay war zuerst da. Gäste fragten immer wieder, ob man sie zu den Plätzen bringen könne, von denen sie gelesen hatten, und eine Weile hieß das: ein Boot leihen und jemanden mit einem Kompressor finden.",
      "Turtle Dive Center ist die Antwort darauf: das eigene Boot der Familie, ihre eigenen Flaschen und Ausrüstung, und Guides, die die Dampier-Straße seit ihrer Kindheit betauchen. Cape Kri, Mike's Point, Sardine Reef und Manta Point liegen alle zwanzig bis fünfundvierzig Minuten vom Steg, und das Boot fährt zweimal am Tag mit höchstens sechs Tauchern pro Guide.",
      "Sie müssen nicht tauchen, um hier zu wohnen, und viele Gäste ziehen nie eine Flasche an. Aber wenn Sie wegen des Wassers gekommen sind, ist das der Teil des Homestays, der für Sie gebaut wurde.",
    ],
    since: (year) => `Homestay seit ${year}`,
    diveSince: (year, gap) =>
      `Tauchbasis seit ${year}, ${gap === 1 ? "ein Jahr" : `${gap} Jahre`} nach dem Homestay`,
    diveSinceNoYear: "Die Tauchbasis kam später als das Homestay",
    diveLink: "Pakete und Preise ansehen",
    gallery: {
      stayHeading: "Der Ort selbst",
      stayIntro:
        "Hier aufgenommene Fotos, nicht für einen Prospekt gestellt. Tippen Sie eines an, um es größer zu sehen.",
      diveHeading: "Unter dem Boot",
      diveIntro: "Der Grund, warum die meisten so weit fahren.",
      open: "größer ansehen",
      prev: "Vorheriges Foto",
      next: "Nächstes Foto",
      captions: {
        aerial:
          "Das Ganze von oben. Der Steg, der Sand und das Riff, das ein paar Meter draußen beginnt.",
        boardwalk:
          "Der Holzsteg, der vor jedem Zimmer entlangläuft, und das Wasser an seinem Ende.",
        bungalowRow:
          "Die Bungalows, auf Stelzen oben am Sand unter den Bäumen.",
        bungalowFront:
          "Ein Bungalow von vorn: eine breite Terrasse, eine Hängematte quer darüber, und davor das Wasser.",
        lunch:
          "Mittagessen unter der Essenshütte, die Hängematten dahinter gespannt und die Bungalows weiter hinten.",
        dusk: "Der Steg im letzten Licht, mit Blick zurück über die Bucht.",
        manta:
          "Ein Manta über dem Riff in der Dampier-Straße, zwanzig bis fünfundvierzig Minuten vom Steg.",
      },
    },
    whereHeading: "Wo wir sind",
    closeHeading: "Kommen Sie vorbei",
    closeBody:
      "Fragen Sie uns alles, bevor Sie buchen. Wir antworten am selben Tag, meist innerhalb weniger Stunden, und für eine Frage ist keine Anzahlung fällig.",
    closeCta: "Schreiben Sie uns",
  },
  faq: {
    eyebrow: "Oft gefragt",
    title: "Gut zu wissen!",
    items: [
      {
        q: "Gibt es Strom und Internet?",
        a: "Strom gibt es nur abends — die Zeiten stehen oben bei den Preisen, und dann wird alles geladen. Neben dem Mobilfunknetz gibt es Starlink, schnell genug für einen Videoanruf, und es reicht in fast jeden Bungalow. Wenn eine verlässliche Verbindung für Ihren Aufenthalt zählt, sagen Sie es bei der Buchung, dann legen wir Sie in einen der Bungalows mit dem stärksten Signal.",
      },
      {
        q: "Wie ist das mit dem Essen?",
        a: "Drei Mahlzeiten am Tag sind enthalten: Frühstück, Mittag- und Abendessen zu den Zeiten, die oben bei den Preisen stehen; außerhalb davon kocht die Küche nicht. Einheimisches Essen, so wie die Familie es kocht. Sagen Sie uns vor der Anreise Bescheid, wenn Sie vegetarisch essen, eine eingeschränkte Ernährung haben oder allergisch sind.",
      },
      {
        q: "Muss ich gut schwimmen können, um zu schnorcheln?",
        a: "Sie müssen nicht stark im Wasser sein. Wir stellen Schwimmhilfen, und ein Guide ist immer mit Ihnen im Wasser.",
      },
      {
        q: "Kann ich mit Karte zahlen?",
        a: "Es gibt kein Kartengerät auf der Insel. Wenn der Buchungsknopf Sie auf eine Bezahlseite geführt hat, nimmt diese Karten, Überweisung und die üblichen E-Wallets; sonst zahlen Sie vor der Anreise per Überweisung oder bar bei der Ankunft — und nehmen Sie ohnehin genug Bargeld aus Sorong oder Waisai mit.",
      },
      {
        q: "Sind Kinder willkommen?",
        a: "Ja. Ein Bungalow schläft zwei, eine dritte Person schläft auf einem Zustellbett — eines pro Bungalow, der Preis richtet sich nach dem Alter, und die Zahlen stehen oben bei den Preisen. Schreiben Sie uns die Alter. Der Schnorchelausflug ist sicher für Kinder, die sich im Wasser wohlfühlen.",
      },
    ],
  },
  footer: {
    contact: "Kontakt",
    manager: "Anmeldung Verwaltung",
    colophon: `© ${PROPERTY.name}, ${PROPERTY.island}. Gemeinsam geführt mit Eddo Homestay in Yenbuba, Pulau Mansuar.`,
    tagline: (year) => (year ? `Raja Ampat · seit ${year}` : "Raja Ampat"),
    social: "Folgen Sie uns",
    feedback: {
      heading: "Sagen Sie uns, wie es war",
      intro:
        "Sagen Sie uns, was gefehlt hat und was gut war. Jede Nachricht liest die Familie, die das Homestay führt, und wir gehen ihr zügig nach.",
      message: "Ihre Nachricht",
      messagePlaceholder: "Was würden Sie ändern?",
      email: "E-Mail, falls Sie eine Antwort möchten",
      emailPlaceholder: "E-Mail, nur wenn Sie eine Antwort wollen",
      submit: "Senden",
      sending: "Wird gesendet…",
      sent: "Danke. Ihre Nachricht ist bei uns, und wir gehen ihr zügig nach.",
      empty: "Schreiben Sie erst etwas, dann senden.",
      failed: "Das hat nicht geklappt. Bitte später noch einmal versuchen.",
    },
  },
  activities: {
    stay: "Übernachten",
    diving: "Tauchen",
    snorkeling: "Schnorcheln",
    both: "Übernachten + tauchen",
    motorbike: "Motorrad mieten",
    camera: "Kamera mieten",
    package: "Komplettpaket",
  },
  months: [
    "Januar",
    "Februar",
    "März",
    "April",
    "Mai",
    "Juni",
    "Juli",
    "August",
    "September",
    "Oktober",
    "November",
    "Dezember",
  ],
  message: (v) =>
    [
      `Hallo ${PROPERTY.name}, ich möchte fragen wegen: ${v.activity.toLowerCase()}.`,
      "",
      v.name.trim() && `Name: ${v.name.trim()}`,
      v.phone.trim() && `WhatsApp: ${v.phone.trim()}`,
      v.email.trim() && `E-Mail: ${v.email.trim()}`,
      `Zeitraum: ${v.when}`,
      `Personen: ${v.people}`,
      v.withNights && `Nächte: ${v.nights}`,
      v.notes.trim() && `Anmerkungen: ${v.notes.trim()}`,
      "",
      "Vielen Dank.",
    ]
      .filter(Boolean)
      .join("\n"),
};

/**
 * Russian counts in three forms, and getting it wrong is the kind of mistake a
 * reader notices immediately: «2 ночей» is not a typo to them, it is somebody
 * who did not bother.
 *
 * One for 1, 21, 31 — but not 11. A few for 2–4, 22–24 — but not 12–14. Many
 * for everything else. The teens are the exception that a naive `n % 10` gets
 * wrong, which is why the hundreds are checked as well.
 */
const ruPlural = (n: number, one: string, few: string, many: string) => {
  const ten = n % 10;
  const hundred = n % 100;
  if (ten === 1 && hundred !== 11) return `${n} ${one}`;
  if (ten >= 2 && ten <= 4 && (hundred < 12 || hundred > 14)) return `${n} ${few}`;
  return `${n} ${many}`;
};

const RU: SiteCopy = {
  htmlLang: "ru",
  nav: {
    home: "Главная",
    rooms: "Номера",
    diving: "Дайвинг",
    season: "Сезоны",
    journey: "Как добраться",
    faq: "Вопросы",
  },
  book: "Забронировать",
  openMenu: "Открыть меню",
  currencyLabel: "Показать примерную цену в",
  langLabel: "Читать сайт на языке",
  currencyNote: "Оплата идёт в рупиях. Вторая строка — примерный пересчёт, он обновляется несколько раз в день.",
  meta: {
    title: `${PROPERTY.name} · Семейный хоумстей и дайв-центр в Раджа-Ампат`,
    description:
      "Семейный хоумстей и дайв-центр на острове Кри, Раджа-Ампат. Бунгало на сваях у самой воды, трёхразовое питание и ежедневные погружения в проливе Дампир.",
  },
  maintenance: {
    eyebrow: "Скоро вернёмся",
    title: "Мы работаем\nнад этой страницей",
    body: "На сайте идут работы, он вернётся сам. В хоумстее ничего не изменилось: номера на месте, лодка выходит, на сообщения мы отвечаем как обычно.",
    contactLead: "Пока напишите нам",
    whatsapp: "Написать в WhatsApp",
    email: "Отправить письмо",
  },
  hero: {
    sub: "Хоумстей на острове Кри, построенный вручную из местного дерева на краю рифа, который мы оставляем таким, каким нашли. Его держит семья, всегда жившая в этой бухте, в ритме прилива.",
  },
  value: {
    heading: "Один причал, одна семья,",
    headingBreak: "и риф прямо перед ним",
    eyebrow: "01 · Почему здесь",
    title: "Приём, похожий\nна семейный.",
    body: "Гостей принимает семья, которая построила этот хоумстей и до сих пор здесь живёт. Номера — традиционная папуасская работа, дерево и пальмовая крыша, намеренно простые, и Starlink добивает почти до каждого, хватает на видеозвонок. С каждой террасы один и тот же вид: пролив Дампир, карстовые острова за ним и риф прямо под ногами.",
    cta: "Спросить о свободных номерах",
    ctaNote: "Хочу узнать, какие номера свободны.",
  },
  cards: [
    {
      title: "Вечер на причале",
      sub: "Закат с конца мостков",
      badge: "Причал",
      alt: "Гость сидит на краю причала на закате",
    },
    {
      title: "Едим вместе",
      sub: "Три раза в день, за одним столом",
      badge: "Обеденная хижина",
      alt: "Двое гостей едят под деревянной хижиной с пальмовой крышей",
    },
    {
      title: "Номера у самой воды",
      sub: "Десять номеров вдоль одних мостков",
      badge: "Остров Кри",
      alt: "Деревянные мостки перед рядом бунгало с пальмовыми крышами",
    },
  ],
  rooms: {
    eyebrow: "Бунгало и цены",
    title: "Где вы будете спать",
    intro:
      "Один тип бунгало, их десять, трёхразовое питание включено. Цена за ночь зависит от того, один вы в нём или вдвоём.",
    perNight: "за ночь",
    forOne: "один человек",
    forTwo: "двое",
    roomsLabel: (n) => `${n} бунгало`,
    ask: "Спросить о бунгало",
    askNote: (name) => `Меня интересует «${name}».`,
    otaNote:
      "Бунгало есть и на stayrajaampat.com, и на Booking.com. Если вам удобнее бронировать там — пожалуйста. Чего ни одна площадка вам не продаст — это место на дайв-боте, оно собирается здесь.",
    types: {
      deluxe: {
        name: "Deluxe Bungalow",
        blurb:
          "Традиционный дом, срубленный из того дерева и листа, что растут вокруг. Своя терраса к морю, шезлонг на ней, а ванная внутри, а не через песок.",
        cap: "Не более 2 человек",
        features: [
          "Своя терраса с видом на море",
          "Шезлонг на террасе",
          "Ванная внутри бунгало",
          "Трёхразовое питание включено",
        ],
        alt: "Ряд деревянных бунгало на сваях у кромки песка, в тени деревьев, вода в нескольких шагах.",
      },
    },
    extra: {
      heading: "Если вас трое",
      ages: {
        child: "От 3 до 9 лет",
        teen: "От 10 до 16 лет",
        adult: "От 17 лет",
      },
      per: "с человека за ночь",
      note: "Одна дополнительная кровать на бунгало. Напишите нам возраст — скажем, что поместится; дополнительная кровать согласуется в переписке, а не бронируется здесь.",
    },
    rules: {
      heading: "Что стоит знать",
      checkIn: "Заезд с",
      checkOut: "Выезд до",
      power: "Электричество",
      meals: "Завтрак, обед, ужин",
      diet: "Вегетарианство, ограничения в еде или аллергия: скажите до приезда, чтобы на кухне знали.",
      refund: "После дня заезда проживание не возвращается.",
    },
  },
  dive: {
    badge: "Turtle Dive Center",
    title: "Погружение утром,\nвозвращение к обеду",
    body: "Мы ныряем в проливе Дампир: Cape Kri, Mike's Point, Sardine Reef, Manta Point — все в 20–45 минутах на лодке от причала. Лодка выходит дважды в день, не больше шести дайверов на гида.",
    details: "Подробнее",
    partner: "Партнёр по обучению",
    orderNote: (name) => `Меня интересует пакет «${name}».`,
    footnote:
      "Сертифицированных дайверов просим взять карточку и лог-бук. О курсе Open Water предупредите хотя бы за неделю, чтобы подготовить материалы и расписание инструктора.",
    askPrice: "Спросить цену",
    videoLabel: "Погружения с Turtle Dive Center",
    videoSoon: "Здесь появится видео с погружений.",
    videoPlay: "Смотреть",
    list: {
      heading: "Цены на дайвинг, 2025",
      intro:
        "Весь список, как его ведёт дайв-центр. Карточку с кнопкой «Забронировать и оплатить» можно закрыть прямо здесь; всё остальное согласуется в переписке или вечером, когда составляют план на завтра.",
      groups: {
        fun: "Погружения и дневные выходы",
        night: "Ночные погружения",
        learn: "Пробные погружения и освежение навыков",
        extra: "Гид и баллон",
        boat: "Лодка для выездного трипа",
      },
      groupNote: {
        fun: "Что лодка делает днём: два баллона до обеда, целый день или выход к Пиайнемо, станции очистки мант, Янгефо или затонувшему P47.",
        night: "После темноты, у Йенбубы или Савандарека, когда вас уже двое.",
        learn: "Ни разу не ныряли — или не ныряли несколько лет.",
        extra: "Ни выезд, ни курс: гид только для вас на день и баллон для рифа перед домом.",
        boat: "Фрахтуется целиком, а не по головам, и считается отдельно от погружений выше.",
      },
      min: (n) => `минимум ${ruPlural(n, "дайвер", "дайвера", "дайверов")}`,
      per: {
        person: "с человека",
        day: "за день",
        tank: "за баллон",
        boat: "за лодку",
      },
      names: {
        piaynemo2: "Пиайнемо · 2 погружения",
        manta2: "Станция мант · 2 погружения",
        mantaPm: "Станция мант · днём",
        yangefo2: "Янгефо · 2 погружения",
        p47: "Затонувший P47 · 2 погружения",
        houseReef: "Домашний риф",
        tank: "Аренда баллона",
        boatPiaynemo: "Пиайнемо",
        boatPiaynemoJoin: "Пиайнемо, общая",
        boatYangefo: "Янгефо",
        boatBatanta: "Водопад Батанта",
      },
      rows: {
        one: "Одно погружение",
        fun2: "Два погружения за одно утро",
        fun3: "Три погружения за день",
        piaynemo2: "Два погружения на выезде в Пиайнемо, без лодки",
        manta2: "Два погружения на станции очистки мант и у Арборека — Manta Ridge или Manta Sandy",
        mantaPm: "Одно дневное погружение на станции очистки мант — Manta Ridge или Manta Sandy",
        yangefo2: "Два погружения у Янгефо — Citrus и Mayhem",
        p47: "Два погружения на затонувшем P47 у Батанты и на Manta Way",
        nightYenbuba: "Ночное погружение у Йенбубы или острова Рансивор",
        nightSawandarek: "Ночное погружение у Савандарека",
        houseReef: "Самостоятельно и без гида — для опытных",
        refresh: "Освежить навыки",
        dsd: "Пробное погружение, без сертификата",
        guide: "Гид только для вас",
        tank: "Для гостей, которые ныряют на нашем домашнем рифе",
      },
      notes: [
        "На местных точках снаряжение и лодка включены. Выездной трип — нет, и ни в одну цену не входит дайв-компьютер.",
        "На дальней местной точке возможна доплата за топливо от Rp 300 000 до Rp 500 000, если дайверов меньше трёх.",
        "Дайверы со своим полным снаряжением платят на Rp 100 000 меньше — кроме выездных трипов.",
        "Возьмите свою маску, если у вас есть подходящая.",
        "Рекомендуется страховка, покрывающая погружения с аквалангом.",
      ],
      boats: {
        boatPiaynemo:
          "До 5 дайверов — включая вход на смотровую площадку и ланч-бокс для гостей Turtle",
        boatPiaynemoJoin:
          "Вместе со снорклерами, всего 6–7 человек и пятеро из них дайверы — тот же вход и ланч-бокс",
        boatYangefo:
          "До 5 дайверов — включая проход Кабуй-Бэй и остановку у пещеры с летучими мышами",
        boatBatanta:
          "До 5 дайверов — включая вход к водопаду",
      },
      plan: "Куда лодка пойдёт завтра, решают вместе каждый вечер после ужина, около 20:00.",
      reserve: "Чтобы записаться на погружение, напишите или позвоните в офис либо зайдите вечером в ресторан около 20:00.",
    },
    bar: {
      pack: "Пакет",
      when: "Когда",
      divers: "Дайверов",
      diverCount: (n) =>
        n.endsWith("+") ? `${n} дайверов` : ruPlural(Number(n), "дайвер", "дайвера", "дайверов"),
      submit: "Проверить наличие мест",
      note: (pack, divers) =>
        `Меня интересует пакет «${pack}», на ${divers === "1" ? "одного дайвера" : `${divers} дайверов`}.`,
    },
    detail: {
      back: "Все дайв-пакеты",
      dayHeading: "Как распределяется время",
      daysHeading: "Четыре дня",
      depthHeading: "На какую глубину",
      includedHeading: "Входит в цену",
      notIncludedHeading: "Не входит",
      bringHeading: "Взять с собой",
      forHeading: "Вам подойдёт, если",
      stages: {
        brief: "Брифинг и проверка снаряжения",
        boat: "Выход лодки",
        dive: "Погружение",
        interval: "Поверхностный интервал",
        lunch: "Обед на лодке",
        back: "Возвращение",
        shallow: "Мелководье перед хоумстеем",
        snorkel: "В воде",
        rest: "Отдых и промывка снаряжения",
      },
      inWater: "Под водой",
      onLand: "На лодке или на берегу",
      surface: "Поверхность",
      hourShort: "ч",
      minShort: "мин",
      limitLabel: (m) => `предел ${m} м`,
      depthMarks: [
        { depth: 18, label: "18 м · Open Water" },
        { depth: 30, label: "30 м · Advanced" },
        { depth: 40, label: "40 м · предел рекреационного дайвинга" },
      ],
      noDepth: "Это всё на поверхности. Никакого сертификата, никакого предела глубины — и можно остановиться и просто полежать на воде в любой момент.",
      approxNote:
        "Время выше — обычная форма выхода, а не расписание. Прилив, погода и расстояние до точки его сдвигают, и гид расскажет на брифинге, каким будет день.",
      courseDays: [
        {
          title: "День 1",
          body: "Теория и первые навыки на мелководье перед хоумстеем: маска, регулятор, плавучесть. Ничего глубокого и никакой спешки.",
        },
        {
          title: "День 2",
          body: "Остальные навыки на закрытой воде, затем первое погружение с лодки на открытой воде.",
        },
        {
          title: "День 3",
          body: "Ещё два погружения на открытой воде: чем увереннее навыки, тем больше собственно дайвинга и меньше упражнений.",
        },
        {
          title: "День 4",
          body: "Последнее погружение, письменный экзамен и оформление сертификата. Карточка придёт почтой или появится в приложении.",
        },
      ],
      cta: "Спросить об этом пакете",
      priceUnit: "с человека",
      packs: {
        fun2: {
          lede: "Обычное утро. Один выход, два погружения, к обеду вы снова в хоумстее. Точки выбираются утром по приливу и течению, а не бронируются заранее, — поэтому гид сначала смотрит ваш лог-бук и только потом решает, куда вас вести.",
          forYou: [
            "У вас есть Open Water или выше",
            "Вы ныряли в последние два года или готовы начать спокойно",
            "Вы хотите оставить вторую половину дня свободной",
          ],
          notIncluded: [
            "Снаряжение сверх баллона и грузов. Полный комплект — отдельная строка, Rp 350.000 в день",
            "Найтрокс и любые специальности",
            "Страховка",
          ],
          bring: [
            "Сертификационную карточку и лог-бук",
            "Купальник, полотенце и головной убор для лодки",
            "Солнцезащитный крем, безопасный для рифа",
          ],
        },
        fun3: {
          lede: "Целый день на воде, три точки вместо двух, с обедом на лодке между вторым и третьим погружением. Большинство гостей, которые остаются дольше трёх ночей, берут это хотя бы раз: третье погружение обычно самое дальнее.",
          forYou: [
            "У вас есть Open Water или выше и вы ныряете уверенно",
            "Вам нужны точки дальше по проливу, а не только ближние",
            "Целый день на лодке звучит как хороший день",
          ],
          notIncluded: [
            "Снаряжение сверх баллона и грузов. Полный комплект — отдельная строка, Rp 350.000 в день",
            "Найтрокс и любые специальности",
            "Страховка",
          ],
          bring: [
            "Сертификационную карточку и лог-бук",
            "Купальник, полотенце и головной убор для лодки",
            "Крем, безопасный для рифа, и что-нибудь сухое на обратную дорогу",
          ],
        },
        dsd: {
          lede: "Первый вдох под водой, всё время рядом с инструктором. Начинается стоя на мелководье перед хоумстеем, где голову можно поднять когда угодно, и переходит в настоящее погружение только тогда, когда это станет привычным. Это не сертификация, и экзамена нет.",
          forYou: [
            "Вы никогда не ныряли и хотите понять, нравится ли вам это",
            "Вы умеете плавать и спокойно опускаете лицо в воду",
            "Вы едете с дайверами и не хотите всю неделю смотреть на них с лодки",
          ],
          notIncluded: [
            "Сертификация. Если нужна карточка — это курс Open Water",
            "Страховка",
          ],
          bring: [
            "Купальник и полотенце",
            "Больше ничего. Всё снаряжение включено",
          ],
        },
        ow: {
          lede: "Сертификация, с которой можно нырять по всему миру до восемнадцати метров, за четыре дня и не покидая остров. Теория во второй половине дня в хоумстее, вода каждое утро. Электронный курс приходит до приезда: предупредите за неделю — и прочитаете его в самолёте.",
          forYou: [
            "Вам нужен сертификат, а не только проба",
            "Вы умеете плавать и остаётесь минимум на четыре полных дня",
            "Вам приятнее учиться в тёплой спокойной воде, чем в карьере дома",
          ],
          notIncluded: [
            "Страховка",
            "Погружения для удовольствия после курса. Это строки Fun Dive",
          ],
          bring: [
            "Купальник и полотенце",
            "Своё фото для сертификата или телефон, чтобы его сделать",
            "Прочитанный материал. Электронный курс приходит на почту",
          ],
        },
        snorkel: {
          lede: "Та же вода, только сверху. Manta Point, когда сходятся сезон и прилив, Piaynemo ради вида — или не дальше кораллового сада перед причалом, если вам ближе короткий день. Без сертификата, без баллона, и дети едут тоже.",
          forYou: [
            "Вы не ныряете или у вас выходной от дайвинга",
            "Вы путешествуете с детьми",
            "Вы хотите увидеть мант, не проходя сначала курс",
          ],
          notIncluded: [
            "Входной сбор на смотровую Piaynemo, если выбран этот день",
            "Аренда гидрокостюма",
          ],
          bring: [
            "Купальник, полотенце, головной убор",
            "Крем, безопасный для рифа, — или рашгард, он работает лучше",
          ],
        },
        guide: {
          lede: "Гид, который погружается с вами и больше ни с кем, сколько дней захотите. Сами погружения — в прайсе ниже; эта строка про гида, и её добавляют, когда не хочется идти за группой.",
          forYou: [
            "Вы ныряете вдвоём и не хотите присоединяться к группе",
            "Вы снимаете и хотите остаться там, где сюжет",
            "Вы возвращаетесь в дайвинг и хотите, чтобы за вами смотрели внимательно",
          ],
          notIncluded: [
            "Сами погружения — они в прайсе",
            "Лодка на выездную точку: она фрахтуется целиком",
            "Компьютер, фонарь и фототехника",
          ],
          bring: [
            "Сертификационную карточку и лог-бук",
            "Всё своё, в чём вам привычнее нырять, особенно маску по лицу",
          ],
        },
      },
    },
    packages: {
      fun2: {
        name: "Fun Dive · 2 баллона",
        blurb:
          "Два погружения за один утренний выход, на точках вокруг Мансуара и в проливе Дампир.",
        duration: "~4 ч",
        level: "Open Water и выше",
        unit: "с человека",
        includes: ["Гид", "Баллон и грузы", "Лодка", "Вода и перекус"],
      },
      fun3: {
        name: "Fun Dive · 3 баллона",
        blurb:
          "Целый день, три разные точки. То, что берёт большинство гостей, если остаётся дольше трёх ночей.",
        duration: "весь день",
        level: "Open Water и выше",
        unit: "с человека",
        includes: ["Гид", "Баллон и грузы", "Лодка", "Обед на лодке"],
      },
      dsd: {
        name: "Discover Scuba",
        blurb:
          "Нет сертификата? Начнём на мелководье перед хоумстеем, потом одно неглубокое погружение с инструктором.",
        duration: "~3 ч",
        level: "сертификат не нужен",
        unit: "с человека",
        includes: ["Инструктор", "Всё снаряжение", "Максимум 12 метров"],
      },
      ow: {
        name: "Курс Open Water",
        blurb:
          "Полная сертификация за четыре дня. Теория во второй половине дня в хоумстее, практика каждое утро в спокойной воде.",
        duration: "4 дня",
        level: "для начинающих",
        unit: "с человека",
        includes: ["Инструктор", "Материалы и онлайн-курс", "Полный комплект", "Сертификат"],
      },
      snorkel: {
        name: "Снорклинг-выход",
        blurb:
          "Manta Point, Piaynemo или коралловый сад перед причалом. Нырять не нужно.",
        duration: "~5 ч",
        level: "для любого возраста",
        unit: "с человека",
        includes: ["Гид", "Маска и ласты", "Лодка", "Вода и фрукты"],
      },
      guide: {
        name: "Персональный гид",
        blurb:
          "Гид, который весь день только с вами. Ваш темп, ваши точки и ничей чужой воздух, которого нужно ждать.",
        duration: "за день",
        level: "Open Water и выше",
        unit: "за день",
        includes: ["Гид только для вас", "Точки выбираем вместе с вами", "Ваш собственный темп"],
      },
    },
  },
  season: {
    eyebrow: "Когда приезжать",
    title: "У моря свои сезоны",
    intro:
      "В Раджа-Ампат можно приехать в любой месяц, но вода не одинакова круглый год. Вот что мы видим с собственного причала.",
    bands: [
      {
        label: "Лучший сезон",
        months: "Октябрь – февраль",
        note: "Самая спокойная вода и самая дальняя видимость. Манты чаще всего появляются с декабря по февраль. Номера разбирают заранее, так что бронируйте сильно загодя.",
      },
      {
        label: "Тоже хорошо",
        months: "Март – апрель, август – сентябрь",
        note: "Погода переменная, но ныряем почти каждый день. Тише, и причал чаще в вашем распоряжении.",
      },
      {
        label: "Тихий сезон",
        months: "Май – июль",
        note: "Поднимается юго-восточный ветер, зыбь крупнее, и дальние точки иногда отменяют. Самые пустые месяцы — и самые подходящие, если хочется остров для себя.",
      },
    ],
  },
  journey: {
    eyebrow: "Как добраться",
    title: "Четыре шага от Джакарты",
    intro:
      "Дорога длинная, но простая. Сообщите время своего парома, и наша лодка будет ждать в Вайсае.",
    steps: [
      {
        title: "Перелёт в Соронг",
        body: "Аэропорт Domine Eduard Osok (SOQ). Ежедневные рейсы из Джакарты, Макассара и Манадо.",
      },
      {
        title: "Паром до Вайсая",
        body: "Скоростной паром из порта Соронга, около 2 часов. Два отправления в день, утром и в полдень.",
      },
      {
        title: "Оплатить сбор парка",
        body: "Экологическая карта Раджа-Ампат оформляется в Вайсае. Действует один год.",
      },
      {
        title: "Мы вас встречаем",
        body: "Наша лодка ждёт в порту Вайсая, около часа до острова Кри. Пришлите время парома в WhatsApp.",
      },
    ],
    map: {
      open: "Открыть карту",
      title: "Где мы",
      here: "Мы",
      sorong: "Соронг",
      waisai: "Вайсай",
      sketchAlt:
        "Схема маршрута: Соронг на материке, паром на северо-восток до Вайсая на острове Вайгео, затем лодка на юго-запад до хоумстея на острове Кри.",
      copy: "Скопировать адрес",
      copied: "Скопировано",
      google: "Открыть в Google Maps",
      osm: "Открыть в OpenStreetMap",
      live: "Загрузить интерактивную карту",
      note: "Рисунок — это схема, она показывает лишь, как три места расположены друг относительно друга. Обе ссылки и интерактивная карта ведут на точные координаты. Интерактивная карта загружается только по вашей просьбе: пока вы не нажали кнопку, ничего здесь не обращается к картографическому серверу.",
    },
  },
  enquiry: {
    modalTitle: "Напишите нам",
    modalIntro:
      "Заполните столько, сколько хотите. Сообщение придёт прямо семье, которая держит хоумстей, и кто-то из нас ответит. Здесь ничего не оплачивается и не нужно заводить аккаунт.",
    close: "Закрыть",
    name: "Имя",
    namePlaceholder: "Ваше имя",
    phone: "WhatsApp",
    phonePlaceholder: "+7 …",
    email: "Эл. почта",
    emailPlaceholder: "vy@primer.com",
    contactNote: "Оставьте хотя бы одно, чтобы мы могли ответить.",
    what: "Что интересует",
    when: "Когда",
    people: "Человек",
    nights: "Ночей",
    notes: "Примечания",
    notesPlaceholder:
      "Аллергии, время парома, дайв-сертификат — что угодно.",
    submit: "Отправить",
    sending: "Отправляем…",
    sent: "Спасибо, сообщение у нас. Отвечаем в тот же день, обычно в течение нескольких часов.",
    needContact: "Оставьте номер WhatsApp или адрес почты, чтобы мы могли ответить.",
    failed: "Отправить не удалось. Попробуйте ещё раз или напишите нам в WhatsApp.",
  },
  booking: {
    cta: "Забронировать и оплатить",
    title: "Бронирование напрямую",
    intro:
      "Даты, кто вы, и сколько выходит. Оплата — на следующей странице, через Midtrans.",
    what: "Что вы бронируете",
    close: "Закрыть",
    checkIn: "Заезд",
    checkOut: "Выезд",
    nights: "Ночей",
    nightsValue: (n) => ruPlural(n, "ночь", "ночи", "ночей"),
    guests: "Гостей",
    guestsValue: (n) => ruPlural(n, "гость", "гостя", "гостей"),
    day: "Дата",
    fromDay: "С",
    untilDay: "По",
    days: "Дней",
    daysValue: (n) => ruPlural(n, "день", "дня", "дней"),
    divers: "Дайверов",
    diversValue: (n) => ruPlural(n, "дайвер", "дайвера", "дайверов"),
    total: "Итого",
    next: "Проверить заказ",
    required: "Это нужно заполнить",
    failed: "Не получилось. Попробуйте ещё раз или напишите нам в WhatsApp.",
    hold:
      "Оплата отправляет деньги и бронь вместе. Мы читаем каждый заказ в тот же день и подтверждаем в WhatsApp — номера продаются и на других сайтах, поэтому даты становятся точными после нашего ответа.",
    order: {
      title: "Ваш заказ",
      intro: "Посмотрите и оплатите. Всё, что не так, исправляется возвратом назад.",
      what: "Бронирование",
      who: "На кого",
      empty:
        "Пока ничего не выбрано. Выберите номер или дайв-пакет, и он появится здесь.",
      back: "Вернуться в хоумстей",
      pay: "Оплатить через Midtrans",
      payNote:
        "Карты, банковский перевод, QRIS, GoPay и ShopeePay. Окно оплаты принадлежит Midtrans; вашу карту мы не видим.",
      paid: "Спасибо",
      paidNote:
        "Оплата дошла, семья предупреждена. В тот же день напишем в WhatsApp, в каком вы номере и во сколько лодка.",
      failed:
        "Оплата не прошла. Деньги не списаны; попробуйте ещё раз или напишите нам в WhatsApp.",
      home: "Вернуться в хоумстей",
    },
  },
  about: {
    cta: "Узнать нас ближе",
    back: "Вернуться в хоумстей",
    title: "Семья, номера\nи дайв-центр",
    lede:
      "Turtle Dive Homestay — это дом одной семьи и десять бунгало, которые они построили рядом, на острове Кри в проливе Дампир. Эта страница — длинная версия: кто здесь хозяева, что на самом деле даёт бунгало и как дайв-центр оказался в конце того же причала.",
    storyHeading: "У кого вы остановитесь",
    story: [
      "Семья, построившая этот хоумстей, живёт здесь же, в доме выше по песку. Они родились в этой бухте, и их родители тоже, а риф перед причалом — тот самый, над которым они учились плавать. Здесь никто не на смене. Если вам что-то нужно, вы просите человека, для которого это дом.",
      "Номера — традиционная папуасская работа, дерево и пальмовая крыша, поставленные вручную и так же чинящиеся, когда шторм срывает панель. Это выбор, а не нехватка: такой номер чинится тем, что есть на острове, — а это важно в четырёх часах от ближайшего хозяйственного магазина.",
      "Чего семья делать не станет — так это «прибираться» на рифе. Он остаётся таким, каким его нашли, и поэтому снорклинг начинается прямо у нижней ступеньки.",
    ],
    roomsHeading: "Бунгало",
    roomsIntro: (total) =>
      `${total} бунгало, все одного типа, все вдоль одних мостков, все к одной и той же воде. Какое достанется вам, решается при бронировании; бунгало в ремонте никогда не показывается свободным.`,
    roomsTotal: (total) => `${total} бунгало всего`,
    serviceHeading: "Что входит в стоимость номера",
    serviceIntro:
      "Без платы за уборку, без сервисного сбора, без курортного сбора. Цена — это цена.",
    services: [
      {
        title: "Три раза в день",
        body: "Готовит семья, едим за одним столом в обеденной хижине. Рыба того же утра, рис, овощи, фрукты. Сообщите до приезда об аллергиях или о том, чего вы не едите.",
      },
      {
        title: "Starlink",
        body: "Хватает на видеозвонок, и добивает почти до каждого номера. Скажите при бронировании, если надёжная связь важна, и мы поселим вас туда, где сигнал сильнее всего.",
      },
      {
        title: "Пресная вода и электричество",
        body: "Пресная вода для мытья. Электричество есть только вечером — часы указаны на главной, рядом с ценами, — и заряжать камеру и телефон нужно в это время.",
      },
      {
        title: "Лодка",
        body: "Наша встречает вас в порту Вайсая и везёт последний час. Обратно она отвезёт вас к тому парому, который вы назовёте.",
      },
      {
        title: "Снорклинг прямо с причала",
        body: "Маски и ласты здесь. Домашний риф начинается в нескольких метрах, ничего бронировать и ждать лодку не нужно.",
      },
      {
        title: "Стирка",
        body: "Попросите. Вернём на следующий день. Машины на острове нет, так что закладывайте погоду.",
      },
    ],
    diveHeading: "А потом дайв-центр",
    diveStory: [
      "Сначала появился хоумстей. Гости всё время просили отвезти их на точки, о которых читали, и какое-то время это означало одолжить лодку и найти кого-нибудь с компрессором.",
      "Turtle Dive Center — ответ на это: собственная лодка семьи, свои баллоны и снаряжение и гиды, которые ныряют в проливе Дампир с детства. Cape Kri, Mike's Point, Sardine Reef и Manta Point — все в двадцати–сорока пяти минутах от причала, лодка выходит дважды в день, не больше шести дайверов на гида.",
      "Чтобы здесь жить, нырять необязательно, и многие гости ни разу не надевают баллон. Но если вы приехали ради воды — это та часть хоумстея, которая построена для вас.",
    ],
    since: (year) => `Хоумстей с ${year} года`,
    diveSince: (year, gap) =>
      `Дайв-центр с ${year} года, на ${ruPlural(gap, "год", "года", "лет")} позже хоумстея`,
    diveSinceNoYear: "Дайв-центр появился позже хоумстея",
    diveLink: "Посмотреть пакеты и цены",
    gallery: {
      stayHeading: "Само место",
      stayIntro:
        "Снимки сделаны здесь, а не поставлены для буклета. Нажмите на любой, чтобы посмотреть крупнее.",
      diveHeading: "Под лодкой",
      diveIntro: "То, ради чего большинство и едет так далеко.",
      open: "открыть крупнее",
      prev: "Предыдущий снимок",
      next: "Следующий снимок",
      captions: {
        aerial:
          "Всё место сверху. Причал, песок и риф, который начинается в нескольких метрах.",
        boardwalk:
          "Мостки, идущие перед каждым номером, и вода в их конце.",
        bungalowRow:
          "Бунгало на сваях в верхней части песка, под деревьями.",
        bungalowFront:
          "Бунгало спереди: широкая терраса, гамак поперёк и вода перед ним.",
        lunch:
          "Обед под обеденной хижиной, за ней натянуты гамаки, дальше бунгало.",
        dusk: "Причал в последнем свете, вид обратно через бухту.",
        manta:
          "Манта над рифом в проливе Дампир, в двадцати–сорока пяти минутах от причала.",
      },
    },
    whereHeading: "Где мы",
    closeHeading: "Приезжайте посмотреть",
    closeBody:
      "Спрашивайте о чём угодно до бронирования. Отвечаем в тот же день, обычно за несколько часов, и никакого задатка, чтобы задать вопрос, не нужно.",
    closeCta: "Напишите нам",
  },
  faq: {
    eyebrow: "Часто спрашивают",
    title: "Это стоит знать!",
    items: [
      {
        q: "Есть ли электричество и интернет?",
        a: "Электричество есть только вечером — часы указаны выше, рядом с ценами, и это время, когда всё заряжают. Кроме мобильной сети есть Starlink, его хватает на видеозвонок, и он добивает почти до каждого бунгало. Если надёжная связь важна для поездки, скажите при бронировании, и мы поселим вас в одно из бунгало с самым сильным сигналом.",
      },
      {
        q: "А как с едой?",
        a: "Три приёма пищи в день включены: завтрак, обед и ужин в часы, указанные выше рядом с ценами; вне этих часов кухня не готовит. Местная еда, приготовленная так, как её готовит сама семья. Скажите до приезда, если вы вегетарианец, если у вас ограничения в еде или аллергия.",
      },
      {
        q: "Нужно ли хорошо плавать для снорклинга?",
        a: "Быть сильным пловцом не нужно. Мы даём плавсредства, и гид всегда в воде рядом с вами.",
      },
      {
        q: "Можно оплатить картой?",
        a: "Терминала на острове нет. Если кнопка бронирования привела вас на страницу оплаты, там принимают карты, банковский перевод и обычные электронные кошельки; если нет — переведите до приезда или заплатите наличными при заселении. Наличные из Соронга или Вайсая возьмите в любом случае.",
      },
      {
        q: "Можно приехать с детьми?",
        a: "Да. В бунгало спят двое, третий — на дополнительной кровати: одна на бунгало, цена зависит от возраста, а цифры указаны выше рядом с ценами. Напишите нам возраст. Снорклинг-выход безопасен для детей, которым спокойно в воде.",
      },
    ],
  },
  footer: {
    contact: "Контакты",
    manager: "Вход для управляющих",
    colophon: `© ${PROPERTY.name}, ${PROPERTY.island}. Работаем вместе с Eddo Homestay в Йенбубе на острове Мансуар.`,
    tagline: (year) => (year ? `Раджа-Ампат · с ${year} года` : "Раджа-Ампат"),
    social: "Мы в соцсетях",
    feedback: {
      heading: "Расскажите, как всё прошло",
      intro:
        "Напишите, чего не хватило и что получилось. Каждое сообщение читает семья, которая держит хоумстей, и мы не затягиваем с ответом.",
      message: "Ваше сообщение",
      messagePlaceholder: "Что бы вы изменили?",
      email: "Почта, если хотите ответ",
      emailPlaceholder: "Почта, только если нужен ответ",
      submit: "Отправить",
      sending: "Отправляем…",
      sent: "Спасибо. Сообщение до нас дошло, и мы не затянем с ответом.",
      empty: "Сначала напишите что-нибудь, потом отправляйте.",
      failed: "Отправить не удалось. Попробуйте позже.",
    },
  },
  activities: {
    stay: "Проживание",
    diving: "Дайвинг",
    snorkeling: "Снорклинг",
    both: "Проживание + дайвинг",
    motorbike: "Аренда мотоцикла",
    camera: "Аренда камеры",
    package: "Полный пакет",
  },
  months: [
    "январь",
    "февраль",
    "март",
    "апрель",
    "май",
    "июнь",
    "июль",
    "август",
    "сентябрь",
    "октябрь",
    "ноябрь",
    "декабрь",
  ],
  message: (v) =>
    [
      `Здравствуйте, ${PROPERTY.name}! Хочу спросить про: ${v.activity.toLowerCase()}.`,
      "",
      v.name.trim() && `Имя: ${v.name.trim()}`,
      v.phone.trim() && `WhatsApp: ${v.phone.trim()}`,
      v.email.trim() && `Эл. почта: ${v.email.trim()}`,
      `Даты: ${v.when}`,
      `Человек: ${v.people}`,
      v.withNights && `Ночей: ${v.nights}`,
      v.notes.trim() && `Примечания: ${v.notes.trim()}`,
      "",
      "Спасибо.",
    ]
      .filter(Boolean)
      .join("\n"),
};

const JA: SiteCopy = {
  htmlLang: "ja",
  nav: {
    home: "ホーム",
    rooms: "客室",
    diving: "ダイビング",
    season: "シーズン",
    journey: "行き方",
    faq: "よくある質問",
  },
  book: "予約",
  openMenu: "メニューを開く",
  currencyLabel: "おおよその価格を表示する通貨",
  langLabel: "このサイトを読む言語",
  currencyNote: "お支払いはルピア建てです。2行目はおおよその換算で、1日に数回更新されます。",
  meta: {
    title: `${PROPERTY.name} · ラジャ・アンパットのホームステイ＆ダイブセンター`,
    description:
      "ラジャアンパット、クリ島にある家族経営のホームステイとダイブセンター。水辺に建つ高床式のバンガロー、1日3食、そしてダンピア海峡での毎日のダイビング。",
  },
  maintenance: {
    eyebrow: "まもなく戻ります",
    title: "このページは\nただいま作業中です",
    body: "サイトの手入れをしています。じきに元どおりになります。ホームステイは何も変わりません。客室はそのまま、ボートも出ていますし、メッセージにもいつもどおりお返事しています。",
    contactLead: "その間のご連絡先",
    whatsapp: "WhatsAppで送る",
    email: "メールを送る",
  },
  hero: {
    sub: "クリ島のホームステイ。地元の木材で手づくりし、見つけたままの姿で残しているリーフのきわに建っています。この湾にずっと暮らしてきた家族が、潮の速さにあわせて営んでいます。",
  },
  value: {
    heading: "桟橋がひとつ、家族がひとつ、",
    headingBreak: "そしてそのすぐ前にリーフ",
    eyebrow: "01 · ここを選ぶ理由",
    title: "家族のように\n迎えます。",
    body: "お迎えするのは、このホームステイを建て、今もここに暮らす家族です。客室は木と椰子葺きの伝統的なパプアの仕事で、あえて簡素に。Starlinkはほぼすべての客室に届き、ビデオ通話にも十分な速さです。どのテラスからも同じ景色が開けます。ダンピア海峡、その先のカルストの島々、そして足もとのリーフ。",
    cta: "空室を問い合わせる",
    ctaNote: "空いている客室を知りたいです。",
  },
  cards: [
    {
      title: "桟橋の夕暮れ",
      sub: "歩道の先から見る日没",
      badge: "桟橋",
      alt: "夕暮れの桟橋の先に座るお客さま",
    },
    {
      title: "みんなで食卓を囲む",
      sub: "1日3食、ひとつのテーブルで",
      badge: "食堂小屋",
      alt: "椰子葺きの木の小屋の下で食事をする2人のお客さま",
    },
    {
      title: "水辺の客室",
      sub: "ひとつの木道に沿って10室",
      badge: "クリ島",
      alt: "椰子葺きのバンガローが並ぶ前の木道",
    },
  ],
  rooms: {
    eyebrow: "バンガローと料金",
    title: "お泊まりいただく場所",
    intro:
      "バンガローは1種類、全10棟。1日3食込みです。1泊の料金は、おひとりで使うか、おふたりで使うかで変わります。",
    perNight: "1泊あたり",
    forOne: "1名",
    forTwo: "2名",
    roomsLabel: (n) => `${n}棟`,
    ask: "このバンガローについて聞く",
    askNote: (name) => `${name}に興味があります。`,
    otaNote:
      "バンガローは stayrajaampat.com と Booking.com にも出しています。そちらのほうが安心でしたら、どうぞご利用ください。どのサイトでも買えないのはダイビングボートの席で、それはここで手配します。",
    types: {
      deluxe: {
        name: "Deluxe Bungalow",
        blurb:
          "まわりに生えている木と葉で建てた、昔ながらのホームステイです。海に面した専用テラスにサンベッドがあり、バスルームは砂の向こうではなく棟の中にあります。",
        cap: "最大2名",
        features: [
          "海に面した専用テラス",
          "テラスのサンベッド",
          "棟内のバスルーム",
          "1日3食込み",
        ],
        alt: "砂のきわに高床で並ぶ木造のバンガロー。木陰にあり、水は数歩先。",
      },
    },
    extra: {
      heading: "3人目を追加する場合",
      ages: {
        child: "3〜9歳",
        teen: "10〜16歳",
        adult: "17歳以上",
      },
      per: "お1人1泊あたり",
      note: "エキストラベッドは1棟に1台まで。ご連絡の際に年齢をお知らせいただければ、入るかどうかお伝えします。エキストラベッドはメッセージでの手配となり、ここからは予約できません。",
    },
    rules: {
      heading: "知っておいていただきたいこと",
      checkIn: "チェックイン",
      checkOut: "チェックアウト",
      power: "電気",
      meals: "朝食・昼食・夕食",
      diet: "ベジタリアン、食事制限、アレルギーのある方は、到着前にお知らせください。厨房に伝えておきます。",
      refund: "チェックイン当日以降の返金はいたしません。",
    },
  },
  dive: {
    badge: "Turtle Dive Center",
    title: "朝に潜って、\n昼前には戻る",
    body: "潜るのはダンピア海峡です。Cape Kri、Mike's Point、Sardine Reef、Manta Point — どれも桟橋からボートで20〜45分。ボートは1日2便、ガイド1名につきダイバーは最大6名です。",
    details: "詳しく",
    partner: "指導団体パートナー",
    orderNote: (name) => `「${name}」のパッケージに興味があります。`,
    footnote:
      "認定ダイバーの方はCカードとログブックをお持ちください。オープンウォーターの講習は、教材とインストラクターの日程を整えるため、遅くとも1週間前にお知らせください。",
    askPrice: "料金を聞く",
    videoLabel: "Turtle Dive Center で潜る",
    videoSoon: "ここにダイビングの映像が入ります。",
    videoPlay: "再生",
    list: {
      heading: "2025年 ダイビング料金",
      intro:
        "ダイブセンターの料金表そのままです。「予約して支払う」ボタンのあるものは、このサイトでそのまま支払えます。それ以外はメッセージで、あるいは翌日の計画を決める夜の時間に手配します。",
      groups: {
        fun: "ファンダイブと日中の行程",
        night: "ナイトダイブ",
        learn: "体験とリフレッシュ",
        extra: "ガイドとタンク",
        boat: "遠征トリップのボート",
      },
      groupNote: {
        fun: "昼間にボートが向かう先です。午前に2本、まる一日、あるいはピアイネモ、マンタのクリーニングステーション、ヤンゲフォ、P47沈船への遠征。",
        night: "暗くなってから、イェンブバかサワンダレクで。2名そろえば出ます。",
        learn: "潜ったことがない方、しばらく潜っていない方へ。",
        extra: "遠征でも講習でもないもの。一日つきっきりの専属ガイドと、目の前のリーフで潜るためのタンク。",
        boat: "人数割りではなくボート1艇のチャーター料金で、上のダイビング料金とは別です。",
      },
      min: (n) => `最少${n}名から`,
      per: {
        person: "お1人あたり",
        day: "1日あたり",
        tank: "1本あたり",
        boat: "1艇あたり",
      },
      names: {
        piaynemo2: "ピアイネモ · 2本",
        manta2: "マンタのクリーニングステーション · 2本",
        mantaPm: "マンタのクリーニングステーション · 午後",
        yangefo2: "ヤンゲフォ · 2本",
        p47: "P47沈船 · 2本",
        houseReef: "ハウスリーフ",
        tank: "タンクレンタル",
        boatPiaynemo: "ピアイネモ",
        boatPiaynemoJoin: "ピアイネモ（相乗り）",
        boatYangefo: "ヤンゲフォ",
        boatBatanta: "バタンタの滝",
      },
      rows: {
        one: "ファンダイブ 1本",
        fun2: "午前にファンダイブ 2本",
        fun3: "1日で3本",
        piaynemo2: "ピアイネモ遠征でのファンダイブ 2本、ボート代別",
        manta2: "マンタのクリーニングステーションとアルボレックで2本 — Manta Ridge または Manta Sandy",
        mantaPm: "午後にマンタのクリーニングステーションで1本 — Manta Ridge または Manta Sandy",
        yangefo2: "ヤンゲフォで2本 — Citrus と Mayhem",
        p47: "バタンタ沖のP47沈船と Manta Way で2本",
        nightYenbuba: "イェンブバまたはランシウォール島でナイトダイブ",
        nightSawandarek: "サワンダレクでナイトダイブ",
        houseReef: "ガイドなしで自分たちだけで — 経験者向け",
        refresh: "スキルアップデート／リフレッシュ",
        dsd: "体験ダイビング、ライセンス不要",
        guide: "専属ガイド",
        tank: "当ホームステイのハウスリーフで潜るお客さま用",
      },
      notes: [
        "ローカルポイントは器材とボート込みです。遠征トリップは別で、どの料金にもダイブコンピューターは含みません。",
        "遠いローカルポイントでは、ダイバーが3名に満たない場合に燃料代 Rp 300,000〜Rp 500,000 がかかることがあります。",
        "器材一式をお持ちの方は Rp 100,000 引きです。遠征トリップを除きます。",
        "顔に合うマスクをお持ちでしたら、ぜひご持参ください。",
        "スキューバダイビングを補償する保険への加入をおすすめします。",
      ],
      boats: {
        boatPiaynemo:
          "ダイバー5名まで — 展望台の入場料と、当ホームステイのお客さま用ランチボックス込み",
        boatPiaynemoJoin:
          "シュノーケラーも一緒に計6〜7名、うちダイバー5名 — 入場料とランチボックスは同じ",
        boatYangefo:
          "ダイバー5名まで — カブイ湾の水路と、コウモリの洞窟への立ち寄り込み",
        boatBatanta:
          "ダイバー5名まで — 滝の入場料込み",
      },
      plan: "明日どこへ向かうかは、毎晩夕食のあと20時ごろに相談して決めます。",
      reserve: "ダイビングのご予約は、オフィスへメッセージかお電話を。夜20時ごろにレストランへお越しいただいてもかまいません。",
    },
    bar: {
      pack: "パッケージ",
      when: "時期",
      divers: "人数",
      diverCount: (n) => `${n}名`,
      submit: "空き状況を確認",
      note: (pack, divers) =>
        `「${pack}」のパッケージに、${divers}名で興味があります。`,
    },
    detail: {
      back: "すべてのダイビングパッケージ",
      dayHeading: "1回の行程の内訳",
      daysHeading: "4日間の流れ",
      depthHeading: "どのくらいの深さまで",
      includedHeading: "料金に含まれるもの",
      notIncludedHeading: "含まれないもの",
      bringHeading: "お持ちいただくもの",
      forHeading: "こんな方に",
      stages: {
        brief: "ブリーフィングと器材チェック",
        boat: "ボート出発",
        dive: "ダイビング",
        interval: "水面休息",
        lunch: "ボート上で昼食",
        back: "ボート帰港",
        shallow: "ホームステイ前の浅瀬",
        snorkel: "水中",
        rest: "休憩と器材の洗浄",
      },
      inWater: "水中",
      onLand: "ボート上または陸上",
      surface: "水面",
      hourShort: "時間",
      minShort: "分",
      limitLabel: (m) => `${m}m まで`,
      depthMarks: [
        { depth: 18, label: "18m · オープンウォーター" },
        { depth: 30, label: "30m · アドバンス" },
        { depth: 40, label: "40m · レクリエーションの限界" },
      ],
      noDepth: "これは水面だけです。認定も要らず、深度の心配もなく、いつでも止まって浮かんでいられます。",
      approxNote:
        "上の時間はいつもの行程のかたちで、時刻表ではありません。潮、天気、ポイントまでの距離で前後しますし、その日の見通しはブリーフィングでガイドがお伝えします。",
      courseDays: [
        {
          title: "1日目",
          body: "学科と、ホームステイ前の浅瀬での最初の練習。マスク、レギュレーター、中性浮力。深くも急ぎもしません。",
        },
        {
          title: "2日目",
          body: "限定水域の残りの課題、それからボートで最初の海洋実習。",
        },
        {
          title: "3日目",
          body: "海洋実習をもう2本。身についてくるにつれ、練習より潜る時間が増えていきます。",
        },
        {
          title: "4日目",
          body: "最後の1本、学科テスト、そして認定の手続き。Cカードは郵送かアプリで届きます。",
        },
      ],
      cta: "このパッケージについて聞く",
      priceUnit: "1名あたり",
      packs: {
        fun2: {
          lede: "いちばん一般的な午前の行程です。ボート1回、2ダイブ、昼食に間に合うようにホームステイへ戻ります。ポイントは事前予約ではなく当日の朝に潮と流れで決めます。だからガイドは、どこへ案内するか決める前にログブックを見せてくださいとお願いするのです。",
          forYou: [
            "オープンウォーター以上の認定をお持ちの方",
            "この2年以内に潜っている、または1本目をゆっくり始めてよい方",
            "午後は空けておきたい方",
          ],
          notIncluded: [
            "タンクとウェイト以外の器材。フルレンタルは別項目で1日Rp 350.000です",
            "ナイトロックス、および各種スペシャルティ",
            "保険",
          ],
          bring: [
            "Cカードとログブック",
            "水着、タオル、ボート用の帽子",
            "リーフにやさしい日焼け止め",
          ],
        },
        fun3: {
          lede: "まる1日を海の上で。ポイントは2か所ではなく3か所、2本目と3本目のあいだにボートで昼食をとります。3泊以上される方はたいてい一度は選びます。3本目がいちばん遠くまで行くことが多いからです。",
          forYou: [
            "オープンウォーター以上の認定があり、余裕をもって潜れる方",
            "近場だけでなく、海峡の奥のポイントまで行きたい方",
            "まる1日ボートで過ごすのがいい1日に思える方",
          ],
          notIncluded: [
            "タンクとウェイト以外の器材。フルレンタルは別項目で1日Rp 350.000です",
            "ナイトロックス、および各種スペシャルティ",
            "保険",
          ],
          bring: [
            "Cカードとログブック",
            "水着、タオル、ボート用の帽子",
            "リーフにやさしい日焼け止めと、帰りに羽織る乾いた一枚",
          ],
        },
        dsd: {
          lede: "水中での最初のひと呼吸を、ずっと横にインストラクターがついた状態で。まずはホームステイ前の浅瀬に立ったまま、いつでも顔を出せるところから始めて、それが当たり前になってから本当のダイビングに移ります。認定ではありませんし、試験もありません。",
          forYou: [
            "潜ったことがなく、自分に合うか試してみたい方",
            "泳げて、顔を水につけるのが平気な方",
            "ダイバーと一緒に旅していて、1週間ボートの上で見ているだけは避けたい方",
          ],
          notIncluded: [
            "認定。Cカードが必要ならオープンウォーター講習になります",
            "保険",
          ],
          bring: [
            "水着とタオル",
            "ほかには何も。器材はすべて込みです",
          ],
        },
        ow: {
          lede: "世界中で水深18mまで潜れるようになる認定を、島を離れずに4日間で。学科は午後にホームステイで、水は毎朝。eラーニングはご到着前にお送りしますので、1週間前にお知らせいただければ飛行機の中で読み終えられます。",
          forYou: [
            "体験だけでなく、資格そのものが欲しい方",
            "泳げて、まる4日以上滞在される方",
            "地元の採石場跡より、暖かく穏やかな海で習いたい方",
          ],
          notIncluded: [
            "保険",
            "講習後のファンダイブ。それはFun Diveの項目になります",
          ],
          bring: [
            "水着とタオル",
            "認定用の顔写真、または撮るためのスマートフォン",
            "読み終えた教材。eラーニングはメールで届きます",
          ],
        },
        snorkel: {
          lede: "同じ海を、上から。季節と潮が合えばManta Point、景色ならPiaynemo、短い1日がよければ桟橋前のサンゴの庭より先へは行きません。認定もタンクも要らず、お子さまもご一緒に。",
          forYou: [
            "潜らない方、またはダイビングを休む日にしたい方",
            "お子さま連れの方",
            "先に講習を受けずにマンタを見たい方",
          ],
          notIncluded: [
            "Piaynemo展望台の入場料（その日を選んだ場合）",
            "ウェットスーツのレンタル",
          ],
          bring: [
            "水着、タオル、帽子",
            "リーフにやさしい日焼け止め、またはラッシュガード（こちらのほうが確実です）",
          ],
        },
        guide: {
          lede: "あなたたちとだけ潜るガイドを、ご希望の日数ぶん。ダイビング自体の料金はこの下の料金表にあり、この行はガイドの料金です。グループに合わせたくないときに足していただくものです。",
          forYou: [
            "2名で潜っていて、グループには入りたくない方",
            "写真を撮っていて、被写体のいる場所に留まりたい方",
            "久しぶりのダイビングで、近くで見ていてほしい方",
          ],
          notIncluded: [
            "ダイビング自体の料金。料金表をご覧ください",
            "遠征ポイントへのボート。ボート単位のチャーターです",
            "ダイブコンピューター、ライト、撮影機材",
          ],
          bring: [
            "Cカードとログブック",
            "使い慣れたご自身の器材、とくに顔に合うマスク",
          ],
        },
      },
    },
    packages: {
      fun2: {
        name: "Fun Dive · 2ダイブ",
        blurb:
          "午前の1回の行程で2ダイブ。マンスアル島周辺とダンピア海峡のポイントで。",
        duration: "約4時間",
        level: "オープンウォーター以上",
        unit: "1名あたり",
        includes: ["ガイド", "タンクとウェイト", "ボート", "飲み物と軽食"],
      },
      fun3: {
        name: "Fun Dive · 3ダイブ",
        blurb:
          "まる1日、3か所の違うポイント。3泊以上の方がいちばんよく選びます。",
        duration: "終日",
        level: "オープンウォーター以上",
        unit: "1名あたり",
        includes: ["ガイド", "タンクとウェイト", "ボート", "ボートでの昼食"],
      },
      dsd: {
        name: "体験ダイビング",
        blurb:
          "認定はお持ちでない方へ。ホームステイ前の浅瀬から始めて、インストラクターと浅い1本を。",
        duration: "約3時間",
        level: "認定不要",
        unit: "1名あたり",
        includes: ["インストラクター", "器材一式", "最大12m"],
      },
      ow: {
        name: "オープンウォーター講習",
        blurb:
          "4日間で認定まで。学科は午後にホームステイで、実習は毎朝穏やかな海で。",
        duration: "4日間",
        level: "初めての方",
        unit: "1名あたり",
        includes: ["インストラクター", "教材とeラーニング", "器材一式", "認定証"],
      },
      snorkel: {
        name: "シュノーケリング",
        blurb:
          "Manta Point、Piaynemo、あるいは桟橋前のサンゴの庭へ。ダイビングは要りません。",
        duration: "約5時間",
        level: "年齢を問わず",
        unit: "1名あたり",
        includes: ["ガイド", "マスクとフィン", "ボート", "飲み物と果物"],
      },
      guide: {
        name: "専属ガイド",
        blurb:
          "その日は、あなたたちだけのガイドがつきます。ペースもポイントも自分たち次第で、ほかの人のエアを待つこともありません。",
        duration: "1日",
        level: "オープンウォーター以上",
        unit: "1日あたり",
        includes: ["あなたたちだけのガイド", "ポイントは相談して決定", "自分たちのペース"],
      },
    },
  },
  season: {
    eyebrow: "いつ来るか",
    title: "海には季節があります",
    intro:
      "ラジャ・アンパットは一年中訪れられますが、海はどの月も同じではありません。これは私たち自身の桟橋から見えていることです。",
    bands: [
      {
        label: "ベストシーズン",
        months: "10月 – 2月",
        note: "海がいちばん穏やかで、透明度も最良です。マンタは12月から2月にいちばんよく現れます。客室は早くから埋まりますので、余裕をもってご予約ください。",
      },
      {
        label: "まだ良い時期",
        months: "3月 – 4月、8月 – 9月",
        note: "天気は変わりやすいものの、ダイビングはほぼ毎日できます。人が少なく、桟橋が自分たちだけになる日も多くなります。",
      },
      {
        label: "静かな季節",
        months: "5月 – 7月",
        note: "南東の風が強まり、うねりも大きくなって、遠いポイントは中止になることがあります。いちばん人の少ない時期で、島を独り占めしたい方にはちょうどよい時期です。",
      },
    ],
  },
  journey: {
    eyebrow: "行き方",
    title: "ジャカルタから4ステップ",
    intro:
      "長い道のりですが、まっすぐな道のりです。フェリーの時間をお知らせいただければ、私たちのボートがワイサイでお待ちします。",
    steps: [
      {
        title: "ソロンへ飛ぶ",
        body: "ドミネ・エドゥアルド・オソック空港（SOQ）。ジャカルタ、マカッサル、マナドから毎日便があります。",
      },
      {
        title: "ワイサイへフェリー",
        body: "ソロン港から高速フェリーで約2時間。1日2便、朝と昼です。",
      },
      {
        title: "環境保全料を払う",
        body: "ラジャ・アンパットの環境サービスカードはワイサイで手配します。有効期間は1年です。",
      },
      {
        title: "お迎えにあがります",
        body: "私たちのボートがワイサイ港でお待ちし、クリ島まで約1時間です。フェリーの時間をWhatsAppでお送りください。",
      },
    ],
    map: {
      open: "地図を開く",
      title: "私たちの場所",
      here: "ここ",
      sorong: "ソロン",
      waisai: "ワイサイ",
      sketchAlt:
        "ルートの略図。本土のソロンから北東へフェリーでワイゲオ島のワイサイ、そこから南西へボートでクリ島のホームステイへ。",
      copy: "住所をコピー",
      copied: "コピーしました",
      google: "Google マップで開く",
      osm: "OpenStreetMapで開く",
      live: "地図を読み込む",
      note: "この絵は略図で、3つの場所の位置関係を示すためのものです。2つのリンクと読み込み式の地図は、いずれも正確な座標を指しています。地図はお求めになったときだけ読み込まれます。ボタンを押すまで、ここから地図サーバーに問い合わせは行きません。",
    },
  },
  enquiry: {
    modalTitle: "メッセージを送る",
    modalIntro:
      "書ける範囲でけっこうです。メッセージはホームステイを営む家族に直接届き、私たちの誰かがお返事します。ここでの支払いはありませんし、アカウントを作る必要もありません。",
    close: "閉じる",
    name: "お名前",
    namePlaceholder: "お名前",
    phone: "WhatsApp",
    phonePlaceholder: "+81 …",
    email: "メール",
    emailPlaceholder: "you@example.com",
    contactNote: "お返事できるよう、どちらか一方はご記入ください。",
    what: "ご希望",
    when: "時期",
    people: "人数",
    nights: "泊数",
    notes: "ご要望",
    notesPlaceholder:
      "食物アレルギー、フェリーの時間、ダイビングの認定など、何でもどうぞ。",
    submit: "送信",
    sending: "送信中…",
    sent: "ありがとうございます。メッセージは届きました。当日中、たいていは数時間でお返事します。",
    needContact: "お返事できるよう、WhatsAppの番号かメールアドレスをご記入ください。",
    failed: "送信できませんでした。もう一度お試しいただくか、WhatsAppでご連絡ください。",
  },
  booking: {
    cta: "予約して支払う",
    title: "直接予約する",
    intro:
      "日程、お名前、そして合計。お支払いは次のページで、Midtransを通して行います。",
    what: "ご予約の内容",
    close: "閉じる",
    checkIn: "チェックイン",
    checkOut: "チェックアウト",
    nights: "泊数",
    nightsValue: (n) => `${n}泊`,
    guests: "人数",
    guestsValue: (n) => `${n}名`,
    day: "日付",
    fromDay: "開始",
    untilDay: "終了",
    days: "日数",
    daysValue: (n) => `${n}日`,
    divers: "ダイバー",
    diversValue: (n) => `${n}名`,
    total: "合計",
    next: "内容を確認する",
    required: "ここが必要です",
    failed: "うまくいきませんでした。もう一度お試しいただくか、WhatsAppでご連絡ください。",
    hold:
      "お支払いは、お金とご予約を一緒に送ります。すべてのご注文を当日中に確認し、WhatsAppでご連絡します。客室は他のサイトでも販売しているため、日程が確定するのは私たちからのお返事のあとです。",
    order: {
      title: "ご注文内容",
      intro: "ご確認のうえ、お支払いください。違っていれば戻って直せます。",
      what: "ご予約",
      who: "お名前",
      empty:
        "まだ何も選ばれていません。客室かダイビングパッケージをお選びいただくと、ここに表示されます。",
      back: "ホームステイに戻る",
      pay: "Midtransで支払う",
      payNote:
        "カード、銀行振込、QRIS、GoPay、ShopeePayに対応。支払い画面はMidtransのもので、カード情報を私たちが見ることはありません。",
      paid: "ありがとうございます",
      paidNote:
        "お支払いは届き、家族にも伝わりました。当日中にWhatsAppで、客室とボートの時間をご連絡します。",
      failed:
        "お支払いが完了しませんでした。請求は発生していません。もう一度お試しいただくか、WhatsAppでご連絡ください。",
      home: "ホームステイに戻る",
    },
  },
  about: {
    cta: "私たちについて",
    back: "ホームステイに戻る",
    title: "家族と、客室と、\nダイブセンター",
    lede:
      "Turtle Dive Homestayは、ある家族の家と、そのとなりに建てた10棟です。場所はダンピア海峡のクリ島。このページはその長い版です。誰が営んでいるのか、バンガローが実際に何を与えてくれるのか、そしてダイブセンターがどうして同じ桟橋の先にあるのか。",
    storyHeading: "どんな家に泊まるのか",
    story: [
      "このホームステイを建てた家族は、砂浜の上手の家に暮らしています。彼らはこの湾で生まれ、その親たちもそうで、桟橋の前のリーフは彼らが泳ぎを覚えた場所です。誰もシフトで働いてはいません。何かご入用のときは、そこを家としている人に頼むことになります。",
      "客室は木と椰子葺きの伝統的なパプアの仕事で、手で建て、嵐が板を持っていけば同じやり方で直します。それは不足ではなく選択です。こうして建てた部屋は島にあるもので直せます。いちばん近い金物屋まで4時間の場所では、それが効いてきます。",
      "家族がしないのは、リーフを「片づける」ことです。見つけたままにしてあります。だからシュノーケリングは階段を降りたところから始まります。",
    ],
    roomsHeading: "バンガロー",
    roomsIntro: (total) =>
      `全${total}棟、すべて同じタイプです。すべてひとつの木道沿いにあり、すべて同じ海に面しています。どの棟になるかは予約時に決まります。修繕中の棟が空室として出ることはありません。`,
    roomsTotal: (total) => `全${total}棟`,
    serviceHeading: "客室料金に含まれるもの",
    serviceIntro:
      "清掃料なし、サービス料なし、リゾート料なし。表示の料金がそのまま料金です。",
    services: [
      {
        title: "1日3食",
        body: "家族が作り、食堂小屋のひとつのテーブルでいただきます。その朝の魚、ごはん、野菜、果物。アレルギーや召し上がらないものは、ご到着前にお知らせください。",
      },
      {
        title: "Starlink",
        body: "ビデオ通話に十分な速さで、ほぼすべての客室に届きます。安定した通信が大切でしたらご予約時にお知らせください。電波のいちばん強い部屋をご用意します。",
      },
      {
        title: "真水と電気",
        body: "体を洗う真水があります。電気は夜だけで、時間はトップページの料金のところに書いてあります。カメラと携帯の充電はその時間に。",
      },
      {
        title: "ボート",
        body: "私たちのボートがワイサイ港でお迎えし、最後の1時間をお運びします。お帰りは、ご指定のフェリーに合わせてお送りします。",
      },
      {
        title: "桟橋からのシュノーケリング",
        body: "マスクとフィンはこちらにあります。ハウスリーフは数メートル先から始まりますので、予約も、ボートを待つ必要もありません。",
      },
      {
        title: "洗濯",
        body: "お声がけください。翌日にお返しします。島に洗濯機はありませんので、天気の分も見込んでおいてください。",
      },
    ],
    diveHeading: "そしてダイブセンター",
    diveStory: [
      "先にあったのはホームステイでした。お客さまが読んできたポイントへ連れていってほしいと言い続け、しばらくはボートを借り、コンプレッサーを持つ人を探すという形でした。",
      "Turtle Dive Centerはその答えです。家族自身のボート、自前のタンクと器材、そして子どものころからダンピア海峡を潜ってきたガイドたち。Cape Kri、Mike's Point、Sardine Reef、Manta Pointはいずれも桟橋から20〜45分、ボートは1日2便、ガイド1名につきダイバーは最大6名です。",
      "ここに泊まるのに潜る必要はありませんし、タンクを一度も背負わないお客さまもたくさんいます。けれど海を目当てにいらしたなら、ここはあなたのために建てられた部分です。",
    ],
    since: (year) => `ホームステイは${year}年から`,
    diveSince: (year, gap) => `ダイブセンターは${year}年から、ホームステイの${gap}年後`,
    diveSinceNoYear: "ダイブセンターはホームステイより後にできました",
    diveLink: "パッケージと料金を見る",
    gallery: {
      stayHeading: "この場所そのもの",
      stayIntro:
        "ここで撮った写真で、パンフレット用に作ったものではありません。どれでも押すと大きく見られます。",
      diveHeading: "ボートの下では",
      diveIntro: "多くの方がここまで来る理由です。",
      open: "大きく見る",
      prev: "前の写真",
      next: "次の写真",
      captions: {
        aerial:
          "全体を上から。桟橋、砂浜、そして数メートル先から始まるリーフ。",
        boardwalk:
          "どの部屋の前も通る木道と、その先の海。",
        bungalowRow:
          "バンガロー。木々の下、砂浜の上手に高床で建っています。",
        bungalowFront:
          "正面から見たバンガロー。広いテラス、横切るハンモック、目の前は海。",
        lunch:
          "食堂小屋での昼食。奥にハンモックが張られ、その先にバンガローが並びます。",
        dusk: "最後の光のなかの桟橋。湾のほうを振り返って。",
        manta:
          "ダンピア海峡、リーフの上のマンタ。桟橋から20〜45分のところです。",
      },
    },
    whereHeading: "私たちの場所",
    closeHeading: "どうぞお越しください",
    closeBody:
      "ご予約の前に何でもお尋ねください。当日中、たいていは数時間でお返事します。質問をするのに手付金は要りません。",
    closeCta: "メッセージを送る",
  },
  faq: {
    eyebrow: "よくある質問",
    title: "知っておいてください！",
    items: [
      {
        q: "電気とインターネットはありますか？",
        a: "電気は夜だけです。時間は上の料金のところに書いてあります。充電はその時間にお願いします。携帯の電波に加えてStarlinkがあり、ビデオ通話に十分な速さで、ほぼすべての棟に届きます。滞在中に安定した通信が必要でしたらご予約時にお知らせください。電波のいちばん強い棟をご用意します。",
      },
      {
        q: "食事はどうなりますか？",
        a: "1日3食込みです。朝食・昼食・夕食の時間は上の料金のところに書いてあり、その時間以外にお出しすることはできません。地元の料理を、この家族がふだん作るとおりにお出しします。ベジタリアンの方、食事制限やアレルギーのある方は、到着前にお知らせください。",
      },
      {
        q: "シュノーケリングに泳力は必要ですか？",
        a: "泳ぎが得意である必要はありません。浮具をご用意しますし、ガイドが必ず一緒に水に入ります。",
      },
      {
        q: "カードで支払えますか？",
        a: "島にカード端末はありません。予約ボタンから決済ページに進めた場合は、カード・銀行振込・主要な電子マネーがお使いいただけます。そうでない場合は、ご到着前のお振込みか、チェックイン時の現金でお願いします。いずれにせよ、ソロンかワイサイで現金をご用意ください。",
      },
      {
        q: "子ども連れでも大丈夫ですか？",
        a: "はい。1棟に2名まで、3人目はエキストラベッドになります。1棟に1台まで、料金は年齢によって変わり、金額は上の料金のところに書いてあります。ご連絡の際に年齢をお知らせください。シュノーケリングは水に慣れたお子さまなら安全です。",
      },
    ],
  },
  footer: {
    contact: "連絡先",
    manager: "管理者ログイン",
    colophon: `© ${PROPERTY.name}、${PROPERTY.island}。マンスアル島イェンブバのEddo Homestayと共同で営んでいます。`,
    tagline: (year) => (year ? `ラジャ・アンパット · ${year}年創業` : "ラジャ・アンパット"),
    social: "フォローする",
    feedback: {
      heading: "感想をお聞かせください",
      intro:
        "足りなかったこと、よかったことをお聞かせください。すべてのメッセージはホームステイを営む家族が読み、すぐに手を打ちます。",
      message: "メッセージ",
      messagePlaceholder: "どこを変えたらよいでしょう？",
      email: "お返事が必要な場合はメールアドレス",
      emailPlaceholder: "お返事をご希望の場合のみ",
      submit: "送信",
      sending: "送信中…",
      sent: "ありがとうございます。メッセージは届きました。すぐに手を打ちます。",
      empty: "先に何かお書きいただいてから送信してください。",
      failed: "送信できませんでした。しばらくしてからもう一度お試しください。",
    },
  },
  activities: {
    stay: "宿泊",
    diving: "ダイビング",
    snorkeling: "シュノーケリング",
    both: "宿泊＋ダイビング",
    motorbike: "バイクのレンタル",
    camera: "カメラのレンタル",
    package: "フルパッケージ",
  },
  months: [
    "1月",
    "2月",
    "3月",
    "4月",
    "5月",
    "6月",
    "7月",
    "8月",
    "9月",
    "10月",
    "11月",
    "12月",
  ],
  message: (v) =>
    [
      `${PROPERTY.name}さん、こんにちは。${v.activity}について伺いたいです。`,
      "",
      v.name.trim() && `お名前: ${v.name.trim()}`,
      v.phone.trim() && `WhatsApp: ${v.phone.trim()}`,
      v.email.trim() && `メール: ${v.email.trim()}`,
      `時期: ${v.when}`,
      `人数: ${v.people}`,
      v.withNights && `泊数: ${v.nights}`,
      v.notes.trim() && `ご要望: ${v.notes.trim()}`,
      "",
      "よろしくお願いします。",
    ]
      .filter(Boolean)
      .join("\n"),
};

const ZH: SiteCopy = {
  htmlLang: "zh",
  nav: {
    home: "首页",
    rooms: "房间",
    diving: "潜水",
    season: "季节",
    journey: "怎么来",
    faq: "常见问题",
  },
  book: "预订",
  openMenu: "打开菜单",
  currencyLabel: "以此货币显示约合价格",
  langLabel: "以此语言阅读本站",
  currencyNote: "实际以印尼盾结算。第二行是约合金额，每天更新几次。",
  meta: {
    title: `${PROPERTY.name} · 四王群岛的家庭民宿与潜水中心`,
    description:
      "位于拉贾安帕特克里岛的家庭民宿与潜水中心。木屋就在水边，每天三餐，天天在丹皮尔海峡下水。",
  },
  maintenance: {
    eyebrow: "很快回来",
    title: "这个页面\n正在整理中",
    body: "网站在做一些调整，稍后会自行恢复。民宿这边一切照旧：房间都在，船照常出海，消息我们也照常回。",
    contactLead: "这段时间请这样联系我们",
    whatsapp: "用 WhatsApp 联系",
    email: "发邮件",
  },
  hero: {
    sub: "位于克里岛的家庭民宿，用当地木材一手一脚搭起来，就在一片我们保持原样的珊瑚礁边上。由世代住在这个海湾的家庭打理，跟着潮水的节奏过日子。",
  },
  value: {
    heading: "一座栈桥，一个家庭，",
    headingBreak: "珊瑚礁就在眼前",
    eyebrow: "01 · 为什么选这里",
    title: "像家人一样\n招待你。",
    body: "招待你的，是亲手盖起这间民宿、至今仍住在这里的一家人。房间是传统的巴布亚做法，木头加茅草顶，简单是有意为之；Starlink 几乎每间都能覆盖，视频通话也够用。每个露台看出去都是同一片景色：丹皮尔海峡、远处的喀斯特岛屿，还有脚下的珊瑚礁。",
    cta: "询问空房",
    ctaNote: "我想知道现在有哪些房间空着。",
  },
  cards: [
    {
      title: "栈桥上的傍晚",
      sub: "在栈道尽头看日落",
      badge: "栈桥",
      alt: "一位客人在日落时坐在栈桥尽头",
    },
    {
      title: "一起吃饭",
      sub: "每天三餐，同一张桌子",
      badge: "餐棚",
      alt: "两位客人在茅草顶的木棚下吃饭",
    },
    {
      title: "水边的房间",
      sub: "十间房沿着同一条木栈道",
      badge: "克里岛",
      alt: "一排茅草顶小屋前的木栈道",
    },
  ],
  rooms: {
    eyebrow: "木屋与价格",
    title: "你住的地方",
    intro:
      "只有一种木屋，一共十间，含一日三餐。一晚多少钱，看你是一个人住，还是两个人住。",
    perNight: "每晚",
    forOne: "1 人",
    forTwo: "2 人",
    roomsLabel: (n) => `${n} 间`,
    ask: "咨询这间木屋",
    askNote: (name) => `我对${name}有兴趣。`,
    otaNote:
      "这些木屋在 stayrajaampat.com 和 Booking.com 上也有。你要是更习惯在那边订，尽管去订。任何平台都卖不了的是潜水船上的位置，那得在这里安排。",
    types: {
      deluxe: {
        name: "Deluxe Bungalow",
        blurb:
          "传统民宿的做法，用周围长出来的木头和棕叶盖成。自带面海的露台，露台上有日光床，浴室在屋里，不用穿过沙滩。",
        cap: "最多 2 人",
        features: [
          "自带面海露台",
          "露台上的日光床",
          "屋内浴室",
          "含一日三餐",
        ],
        alt: "一排木质高脚屋立在沙滩边缘，树荫遮着，海水就在几步之外。",
      },
    },
    extra: {
      heading: "加第三个人",
      ages: {
        child: "3 至 9 岁",
        teen: "10 至 16 岁",
        adult: "17 岁及以上",
      },
      per: "每人每晚",
      note: "每间木屋最多加一张床。写信时告诉我们年龄，我们会说住不住得下——加床通过留言安排，不在这里下单。",
    },
    rules: {
      heading: "先说清楚几件事",
      checkIn: "入住时间",
      checkOut: "退房时间",
      power: "供电",
      meals: "早餐、午餐、晚餐",
      diet: "素食、忌口或过敏，请在抵达前告诉我们，好让厨房知道。",
      refund: "入住当天之后，住宿费不退。",
    },
  },
  dive: {
    badge: "Turtle Dive Center",
    title: "早上下水，\n午饭前回来",
    body: "我们潜的是丹皮尔海峡：Cape Kri、Mike's Point、Sardine Reef、Manta Point，从栈桥开船过去都在 20 到 45 分钟之内。船每天出两趟，每位导潜最多带六人。",
    details: "详情",
    partner: "培训合作机构",
    orderNote: (name) => `我对「${name}」这个套餐有兴趣。`,
    footnote:
      "持证潜水员请带上潜水证和潜水日志。Open Water 课程请至少提前一周告诉我们，好把教材和教练的时间安排出来。",
    askPrice: "问价格",
    videoLabel: "和 Turtle Dive Center 一起潜水",
    videoSoon: "这里会放一段潜水的短片。",
    videoPlay: "播放",
    list: {
      heading: "2025 年潜水价目表",
      intro:
        "潜水中心的整份价目表。带「预订并付款」按钮的，可以在这里直接付掉；其余的通过留言安排，或者晚上定明天计划的时候一起说。",
      groups: {
        fun: "Fun dive 与当天行程",
        night: "夜潜",
        learn: "体验与复习",
        extra: "导潜与气瓶",
        boat: "远征行程的船",
      },
      groupNote: {
        fun: "白天船去的地方：上午两支、一整天，或者远征皮阿内莫、蝠鲼清洁站、扬格福、P47 沉机。",
        night: "天黑以后，在延布巴或萨万达雷克，凑满两位就出船。",
        learn: "没潜过，或者好几年没下水了。",
        extra: "既不是行程也不是课程：整天只带你一组的导潜，还有在屋前礁下水用的气瓶。",
        boat: "按整艘船算，不按人头，和上面的潜水费用分开。",
      },
      min: (n) => `最少 ${n} 位潜水员`,
      per: {
        person: "每人",
        day: "每天",
        tank: "每支气瓶",
        boat: "每艘船",
      },
      names: {
        piaynemo2: "皮阿内莫 · 两支",
        manta2: "蝠鲼清洁站 · 两支",
        mantaPm: "蝠鲼清洁站 · 下午",
        yangefo2: "扬格福 · 两支",
        p47: "P47 沉机 · 两支",
        houseReef: "自家礁",
        tank: "租气瓶",
        boatPiaynemo: "皮阿内莫",
        boatPiaynemoJoin: "皮阿内莫，拼船",
        boatYangefo: "扬格福",
        boatBatanta: "巴坦塔瀑布",
      },
      rows: {
        one: "一支 fun dive",
        fun2: "一个上午两支 fun dive",
        fun3: "一天三支",
        piaynemo2: "皮阿内莫行程里的两支 fun dive，不含船费",
        manta2: "在蝠鲼清洁站和阿尔博雷克潜两支 — Manta Ridge 或 Manta Sandy",
        mantaPm: "下午在蝠鲼清洁站潜一支 — Manta Ridge 或 Manta Sandy",
        yangefo2: "在扬格福潜两支 — Citrus 和 Mayhem",
        p47: "在巴坦塔外海的 P47 沉机和 Manta Way 潜两支",
        nightYenbuba: "延布巴或兰西沃岛夜潜",
        nightSawandarek: "萨万达雷克夜潜",
        houseReef: "自己下水，不带导潜 — 有经验的潜水员",
        refresh: "技巧更新与复习",
        dsd: "体验潜水，无证也可以",
        guide: "只带你们一组的导潜",
        tank: "给在我们自家礁下水的客人",
      },
      notes: [
        "本地潜点含装备和船。远征行程不含，而且所有价格都不含潜水电脑。",
        "较远的本地潜点，人数不足三位时可能加收 Rp 300.000 到 Rp 500.000 的燃油费。",
        "自带全套装备的潜水员少付 Rp 100.000，远征行程除外。",
        "如果你有贴合自己脸型的面镜，请自己带来。",
        "建议购买能涵盖水肺潜水的保险。",
      ],
      boats: {
        boatPiaynemo:
          "最多 5 位潜水员 — 含观景台门票和给 Turtle 客人的餐盒",
        boatPiaynemoJoin:
          "和浮潜的人一起，总共 6 到 7 人、其中 5 位潜水员 — 门票和餐盒相同",
        boatYangefo:
          "最多 5 位潜水员 — 含卡布伊湾水道，以及在蝙蝠洞停留",
        boatBatanta:
          "最多 5 位潜水员 — 含瀑布门票",
      },
      plan: "明天船去哪儿，每天晚饭后 20:00 左右大家一起定。",
      reserve: "要订潜水，请给办公室发消息或打电话，也可以晚上 20:00 左右到餐厅来找我们。",
    },
    bar: {
      pack: "套餐",
      when: "时间",
      divers: "人数",
      diverCount: (n) => `${n} 人`,
      submit: "查看是否有位",
      note: (pack, divers) =>
        `我对「${pack}」这个套餐有兴趣，共 ${divers} 人。`,
    },
    detail: {
      back: "全部潜水套餐",
      dayHeading: "一趟行程怎么安排",
      daysHeading: "四天怎么过",
      depthHeading: "会下到多深",
      includedHeading: "价格包含",
      notIncludedHeading: "不包含",
      bringHeading: "请自备",
      forHeading: "适合你，如果",
      stages: {
        brief: "行前讲解与装备检查",
        boat: "开船出发",
        dive: "下潜",
        interval: "水面休息",
        lunch: "船上午餐",
        back: "返航",
        shallow: "民宿前的浅水区",
        snorkel: "在水里",
        rest: "休息与冲洗装备",
      },
      inWater: "在水下",
      onLand: "在船上或岸上",
      surface: "水面",
      hourShort: "小时",
      minShort: "分钟",
      limitLabel: (m) => `上限 ${m} 米`,
      depthMarks: [
        { depth: 18, label: "18 米 · Open Water" },
        { depth: 30, label: "30 米 · Advanced" },
        { depth: 40, label: "40 米 · 休闲潜水上限" },
      ],
      noDepth: "这一项全程在水面。不需要证照，也不用惦记深度限制，随时可以停下来浮着。",
      approxNote:
        "上面的时间是这趟行程通常的样子，不是时刻表。潮水、天气和潜点远近都会让它前后挪动，当天的安排导潜会在讲解时说明。",
      courseDays: [
        {
          title: "第 1 天",
          body: "理论课，以及在民宿前浅水区的第一批练习：面镜、调节器、中性浮力。不下深，也不赶。",
        },
        {
          title: "第 2 天",
          body: "把平静水域的其余项目做完，然后从船上完成第一次开放水域潜水。",
        },
        {
          title: "第 3 天",
          body: "再来两次开放水域潜水。动作越熟，练习越少，真正潜的时间越多。",
        },
        {
          title: "第 4 天",
          body: "最后一潜、笔试，以及发证手续。潜水证之后会寄到，或者在 App 里查看。",
        },
      ],
      cta: "咨询这个套餐",
      priceUnit: "每人",
      packs: {
        fun2: {
          lede: "最常见的一个上午。出一趟船，潜两支气瓶，赶在午饭前回到民宿。潜点是当天早上看潮水和流来定的，不提前预订——所以导潜会先看你的潜水日志，再决定带你去哪里。",
          forYou: [
            "你持有 Open Water 或以上证照",
            "你最近两年内潜过水，或者愿意第一潜慢慢来",
            "你想把下午空出来",
          ],
          notIncluded: [
            "气瓶和配重以外的装备。整套装备是单独一项，每天 Rp 350.000",
            "高氧，以及任何专长课程",
            "保险",
          ],
          bring: [
            "潜水证和潜水日志",
            "泳衣、毛巾，以及船上用的帽子",
            "对珊瑚礁无害的防晒霜",
          ],
        },
        fun3: {
          lede: "一整天在水上，三个潜点而不是两个，第二潜和第三潜之间在船上吃午饭。住超过三晚的客人大多会来一次，因为第三潜通常是走得最远的一潜。",
          forYou: [
            "你持有 Open Water 或以上证照，下水也自在",
            "你想去海峡更远处的潜点，不只是近处的",
            "在船上待一整天听起来像是美好的一天",
          ],
          notIncluded: [
            "气瓶和配重以外的装备。整套装备是单独一项，每天 Rp 350.000",
            "高氧，以及任何专长课程",
            "保险",
          ],
          bring: [
            "潜水证和潜水日志",
            "泳衣、毛巾，以及船上用的帽子",
            "对珊瑚礁无害的防晒霜，还有回程披的干衣服",
          ],
        },
        dsd: {
          lede: "水下的第一口呼吸，全程有教练在旁边。先在民宿前的浅水区站着开始，随时可以把头抬出水面；等这件事变得平常了，才换成真正的一潜。这不是发证课程，也没有考试。",
          forYou: [
            "你从没潜过水，想先看看自己喜不喜欢",
            "你会游泳，把脸埋进水里也不紧张",
            "你和潜水的朋友同行，不想整周都在船上看着",
          ],
          notIncluded: [
            "证照。想拿证的话，那是 Open Water 课程",
            "保险",
          ],
          bring: [
            "泳衣和毛巾",
            "其他都不用。所有装备都已包含",
          ],
        },
        ow: {
          lede: "拿到之后可以在世界各地潜到十八米的证照，四天完成，不用离开这座岛。下午在民宿上理论课，每天早上下水。电子教材在你到达前就会寄出，提前一周告诉我们，你可以在飞机上把该读的读完。",
          forYou: [
            "你要的是证照，不只是体验一下",
            "你会游泳，并且至少住满四天",
            "比起家附近的采石场，你更想在温暖平静的海里学",
          ],
          notIncluded: [
            "保险",
            "课程结束后的休闲潜水。那属于 Fun Dive 的项目",
          ],
          bring: [
            "泳衣和毛巾",
            "一张本人照片用于发证，或者用手机现拍",
            "读完的教材。电子课程会发到邮箱",
          ],
        },
        snorkel: {
          lede: "同一片海，从水面看。季节和潮水合适就去 Manta Point，想看风景就去 Piaynemo；要是短一点的行程更合适，就在栈桥前的珊瑚花园，不再往远处去。不用证照，不用气瓶，孩子也一起来。",
          forYou: [
            "你不潜水，或者今天想歇一歇不下潜",
            "你带着孩子一起旅行",
            "你想看蝠鲼，又不想先上一门课",
          ],
          notIncluded: [
            "Piaynemo 观景点的门票，如果那天去的是那里",
            "潜水衣租借",
          ],
          bring: [
            "泳衣、毛巾、帽子",
            "对珊瑚礁无害的防晒霜，或者一件水母衣，后者更管用",
          ],
        },
        guide: {
          lede: "一位只和你们下水的导潜，要几天都行。潜水本身的费用在这一段下面的价目表里；这一行是导潜的费用，不想跟着大队伍的时候加上它。",
          forYou: [
            "你们两个人潜，不想跟团",
            "你在拍照，想在有东西的地方多待一会儿",
            "你久没下水了，希望有人盯紧一点",
          ],
          notIncluded: [
            "潜水本身的费用，在价目表里",
            "去远征潜点的船，按整艘算",
            "潜水电脑、手电和摄影器材",
          ],
          bring: [
            "潜水证和潜水日志",
            "任何你自己用惯的东西，尤其是合脸的面镜",
          ],
        },
      },
    },
    packages: {
      fun2: {
        name: "Fun Dive · 2 支气瓶",
        blurb:
          "一趟上午的行程潜两支，潜点在曼苏尔岛周边和丹皮尔海峡。",
        duration: "约 4 小时",
        level: "Open Water 及以上",
        unit: "每人",
        includes: ["导潜", "气瓶与配重", "船", "饮用水与点心"],
      },
      fun3: {
        name: "Fun Dive · 3 支气瓶",
        blurb:
          "一整天，三个不同潜点。住超过三晚的客人多半会选这个。",
        duration: "全天",
        level: "Open Water 及以上",
        unit: "每人",
        includes: ["导潜", "气瓶与配重", "船", "船上午餐"],
      },
      dsd: {
        name: "体验潜水",
        blurb:
          "没有证照？先在民宿前的浅水区开始，再跟教练做一次浅潜。",
        duration: "约 3 小时",
        level: "无需证照",
        unit: "每人",
        includes: ["教练", "全套装备", "最深 12 米"],
      },
      ow: {
        name: "Open Water 课程",
        blurb:
          "四天完成的完整发证课程。下午在民宿上理论，每天早上在平静水域练习。",
        duration: "4 天",
        level: "零基础",
        unit: "每人",
        includes: ["教练", "教材与电子课程", "全套装备", "证照"],
      },
      snorkel: {
        name: "浮潜行程",
        blurb:
          "Manta Point、Piaynemo，或是栈桥前的珊瑚花园。不用会潜水。",
        duration: "约 5 小时",
        level: "不限年龄",
        unit: "每人",
        includes: ["导游", "面镜与脚蹼", "船", "饮用水与水果"],
      },
      guide: {
        name: "专属导潜",
        blurb:
          "一整天只带你们一组。节奏你定，潜点一起挑，不用等别人的气。",
        duration: "每天",
        level: "Open Water 及以上",
        unit: "每天",
        includes: ["只带你们的导潜", "潜点一起商量", "按你们的节奏"],
      },
    },
  },
  season: {
    eyebrow: "什么时候来",
    title: "海也有它的季节",
    intro:
      "四王群岛一年四季都能来，但每个月的海并不一样。以下是我们从自家栈桥上看到的。",
    bands: [
      {
        label: "最好的季节",
        months: "10 月 – 2 月",
        note: "海最平，能见度也最好。蝠鲼在 12 月到 2 月之间出现得最勤。房间很早就订满，请尽早安排。",
      },
      {
        label: "依然不错",
        months: "3 月 – 4 月、8 月 – 9 月",
        note: "天气时好时坏，但几乎每天都能下水。人更少，栈桥常常只有你们。",
      },
      {
        label: "淡季",
        months: "5 月 – 7 月",
        note: "东南风起来了，涌浪更大，远一点的潜点有时会取消。这是最空的几个月，也正适合想把岛留给自己的人。",
      },
    ],
  },
  journey: {
    eyebrow: "怎么来",
    title: "从雅加达出发，四步",
    intro:
      "路远，但不绕。把你的船班时间告诉我们，我们的船会在外赛等着。",
    steps: [
      {
        title: "飞索龙",
        body: "Domine Eduard Osok 机场（SOQ）。雅加达、望加锡和万鸦老每天都有航班。",
      },
      {
        title: "坐船到外赛",
        body: "从索龙港乘快船，约 2 小时。每天两班，早上和中午各一班。",
      },
      {
        title: "缴保育费",
        body: "四王群岛的环保卡在外赛办理，有效期一年。",
      },
      {
        title: "我们来接你",
        body: "我们的船在外赛港口等你，到克里岛约一小时。请把船班时间用 WhatsApp 发给我们。",
      },
    ],
    map: {
      open: "打开地图",
      title: "我们在哪里",
      here: "我们",
      sorong: "索龙",
      waisai: "外赛",
      sketchAlt:
        "路线示意图：大陆上的索龙，往东北坐船到威盖奥岛的外赛，再往西南坐船到克里岛上的民宿。",
      copy: "复制地址",
      copied: "已复制",
      google: "在 Google 地图打开",
      osm: "在 OpenStreetMap 打开",
      live: "加载可交互地图",
      note: "这张图只是示意，用来说明三个地点的相对位置。两个链接和可交互地图指向的都是精确坐标。可交互地图只有你要求时才加载——在你按下按钮之前，这里不会向任何地图服务器发出请求。",
    },
  },
  enquiry: {
    modalTitle: "给我们留言",
    modalIntro:
      "想填多少就填多少。留言会直接到打理这间民宿的家庭手上，我们当中会有人回复你。这里不付款，也不用注册账号。",
    close: "关闭",
    name: "称呼",
    namePlaceholder: "你的名字",
    phone: "WhatsApp",
    phonePlaceholder: "+86 …",
    email: "邮箱",
    emailPlaceholder: "you@example.com",
    contactNote: "至少留一样，我们才能回复你。",
    what: "想了解",
    when: "时间",
    people: "人数",
    nights: "住几晚",
    notes: "备注",
    notesPlaceholder:
      "食物过敏、船班时间、潜水证照，什么都可以写。",
    submit: "发送",
    sending: "发送中…",
    sent: "谢谢，留言已经收到。我们当天回复，一般几小时内。",
    needContact: "请留下 WhatsApp 号码或邮箱，我们好回复你。",
    failed: "没能发出去。请再试一次，或者用 WhatsApp 联系我们。",
  },
  booking: {
    cta: "预订并付款",
    title: "直接预订",
    intro:
      "日期、你的信息，以及总额。付款在下一页，通过 Midtrans 完成。",
    what: "你要订的是",
    close: "关闭",
    checkIn: "入住",
    checkOut: "退房",
    nights: "晚数",
    nightsValue: (n) => `${n} 晚`,
    guests: "人数",
    guestsValue: (n) => `${n} 人`,
    day: "日期",
    fromDay: "从",
    untilDay: "到",
    days: "天数",
    daysValue: (n) => `${n} 天`,
    divers: "潜水人数",
    diversValue: (n) => `${n} 人`,
    total: "合计",
    next: "核对订单",
    required: "这项需要填",
    failed: "没能完成。请再试一次，或者用 WhatsApp 联系我们。",
    hold:
      "付款会把钱和预订一起送来。我们当天就会看到每一笔订单，并用 WhatsApp 确认——房间在其他网站也在卖，所以日期要等我们回复之后才算定下来。",
    order: {
      title: "你的订单",
      intro: "核对一下再付款。有不对的地方，退回上一步改就好。",
      what: "预订内容",
      who: "订给谁",
      empty:
        "还没有选任何东西。挑一间房或一个潜水套餐，这里就会出现。",
      back: "回到民宿页面",
      pay: "用 Midtrans 付款",
      payNote:
        "支持银行卡、银行转账、QRIS、GoPay 和 ShopeePay。付款窗口是 Midtrans 自己的，我们看不到你的卡号。",
      paid: "谢谢",
      paidNote:
        "款项已经收到，家里也已经知道了。我们当天会用 WhatsApp 告诉你房间和船的时间。",
      failed:
        "付款没有完成，没有扣款。请再试一次，或者用 WhatsApp 联系我们。",
      home: "回到民宿页面",
    },
  },
  about: {
    cta: "了解我们",
    back: "回到民宿页面",
    title: "这家人、这些房间，\n还有潜水中心",
    lede:
      "Turtle Dive Homestay 就是一家人的房子，加上他们在旁边盖起来的十间木屋，位置在丹皮尔海峡的克里岛。这一页是详细版：谁在打理，一间木屋实际能给你什么，以及潜水中心怎么会落在同一座栈桥的尽头。",
    storyHeading: "你住在谁家",
    story: [
      "盖起这间民宿的一家人就住在这里，住在沙滩上方的那栋房子里。他们在这个海湾出生，父母也是；栈桥前的这片礁，就是他们学会游泳的地方。这里没有人在「值班」。你需要什么，问的就是把这里当家的人。",
      "房间是传统的巴布亚做法，木头和茅草顶，一手一脚搭起来；风暴掀掉一块板，也照原样修回去。这是选择，不是将就：这样盖的房子，用岛上有的东西就能修——在离最近的五金店四小时的地方，这一点很要紧。",
      "这家人不会做的一件事，是把珊瑚礁「收拾干净」。它保持着原来的样子，所以浮潜从台阶下面就开始了。",
    ],
    roomsHeading: "木屋",
    roomsIntro: (total) =>
      `${total} 间木屋，只有一种房型，全都沿着同一条木栈道，全都面向同一片海。具体住哪一间在预订时定下来；正在维修的那间绝不会出现在可订列表里。`,
    roomsTotal: (total) => `共 ${total} 间`,
    serviceHeading: "房价里包含什么",
    serviceIntro:
      "不收清洁费，不收服务费，不收度假村附加费。写多少就是多少。",
    services: [
      {
        title: "一日三餐",
        body: "由这家人做，在餐棚的同一张桌子上吃。当天早上的鱼、米饭、蔬菜、水果。有过敏或者不吃的东西，请在抵达前告诉我们。",
      },
      {
        title: "Starlink",
        body: "视频通话够用，而且几乎每间房都能覆盖。要是稳定的网络对你重要，预订时说一声，我们把你安排在信号最强的房间。",
      },
      {
        title: "淡水和电",
        body: "有淡水洗漱。只有晚上有电，时间写在首页的价格那一段，相机和手机趁那会儿充。",
      },
      {
        title: "船",
        body: "我们的船在外赛港口接你，走最后一小时。回程时，按你说的那班渡轮把你送回去。",
      },
      {
        title: "从栈桥下水浮潜",
        body: "面镜和脚蹼这里有。家门口的礁从几米外就开始，不用预约，也不用等船。",
      },
      {
        title: "洗衣服",
        body: "说一声就行，第二天还给你。岛上没有洗衣机，所以要把天气算进去。",
      },
    ],
    diveHeading: "然后才有了潜水中心",
    diveStory: [
      "先有的是民宿。客人不断问能不能带他们去那些在书上读到的潜点，有一阵子这意味着借一条船，再找一个有压缩机的人。",
      "Turtle Dive Center 就是对这件事的回答：这家人自己的船、自己的气瓶和装备，还有从小就在丹皮尔海峡下水的导潜。Cape Kri、Mike's Point、Sardine Reef 和 Manta Point 距栈桥都在二十到四十五分钟之间，船每天出两趟，每位导潜最多带六人。",
      "住在这里不一定要潜水，很多客人一次气瓶都没背过。但如果你是为这片海而来，这就是民宿里专为你而建的那一部分。",
    ],
    since: (year) => `民宿始于 ${year} 年`,
    diveSince: (year, gap) => `潜水中心始于 ${year} 年，比民宿晚 ${gap} 年`,
    diveSinceNoYear: "潜水中心比民宿来得晚",
    diveLink: "查看套餐与价格",
    gallery: {
      stayHeading: "这个地方本身",
      stayIntro:
        "都是在这里拍的照片，不是为宣传册摆出来的。点任意一张可以看大图。",
      diveHeading: "船底下",
      diveIntro: "多数人愿意跑这么远的理由。",
      open: "查看大图",
      prev: "上一张",
      next: "下一张",
      captions: {
        aerial:
          "从空中看整片地方。栈桥、沙滩，还有几米外就开始的珊瑚礁。",
        boardwalk:
          "从每间房前经过的木栈道，以及尽头的海。",
        bungalowRow:
          "木屋在树下、沙滩上方的高脚屋里。",
        bungalowFront:
          "正面看一间木屋：宽露台，横着一张吊床，前面就是海。",
        lunch:
          "餐棚下的午饭，后面挂着吊床，再往后是小屋。",
        dusk: "最后一点光里的栈桥，回头望向海湾。",
        manta:
          "丹皮尔海峡礁石上方的一只蝠鲼，离栈桥二十到四十五分钟。",
      },
    },
    whereHeading: "我们在哪里",
    closeHeading: "来看看吧",
    closeBody:
      "订之前有什么都可以问。我们当天回复，一般几小时内，问一个问题也不需要先付定金。",
    closeCta: "给我们留言",
  },
  faq: {
    eyebrow: "常被问到",
    title: "这些你得知道！",
    items: [
      {
        q: "有电和网络吗？",
        a: "只有晚上有电——时间写在上面的价格那一段，充电请趁那会儿。除了手机信号，还有 Starlink，视频通话够用，而且几乎每间木屋都能覆盖。要是稳定的网络对这趟行程重要，预订时说一声，我们把你安排在信号最强的那几间之一。",
      },
      {
        q: "吃饭怎么安排？",
        a: "一日三餐已经含在房价里：早餐、午餐、晚餐的时间写在上面的价格那一段，过了点厨房就不开火了。做的是本地菜，家里人平时怎么做就怎么做。素食、忌口或者过敏，请在抵达前告诉我们。",
      },
      {
        q: "浮潜需要很会游泳吗？",
        a: "不需要水性很好。我们提供浮具，而且导游全程和你一起在水里。",
      },
      {
        q: "可以刷卡吗？",
        a: "岛上没有刷卡机。如果预订按钮把你带到了付款页，那里可以用银行卡、转账和常见的电子钱包；如果没有，请在抵达前转账，或者入住时付现金——不管哪种，都请在索龙或外赛带足现金。",
      },
      {
        q: "可以带孩子吗？",
        a: "可以。一间木屋住两个人，第三个人加一张床：每间最多加一张，价钱按年龄算，数字写在上面的价格那一段。写信时告诉我们年龄。浮潜行程对在水里不怕的孩子来说是安全的。",
      },
    ],
  },
  footer: {
    contact: "联系",
    manager: "管理端登录",
    colophon: `© ${PROPERTY.name}，${PROPERTY.island}。与曼苏尔岛延布巴的 Eddo Homestay 一同经营。`,
    tagline: (year) => (year ? `四王群岛 · ${year} 年至今` : "四王群岛"),
    social: "关注我们",
    feedback: {
      heading: "告诉我们做得怎么样",
      intro:
        "哪里没做到，哪里做得好，都请告诉我们。每条留言都由打理民宿的家庭亲自读，我们会尽快跟进。",
      message: "你的留言",
      messagePlaceholder: "你会改哪里？",
      email: "邮箱，如果你想要回复",
      emailPlaceholder: "邮箱，只在你想要回复时填",
      submit: "发送",
      sending: "发送中…",
      sent: "谢谢。留言已经收到，我们会尽快跟进。",
      empty: "先写点什么，再发送。",
      failed: "没能发出去。请稍后再试。",
    },
  },
  activities: {
    stay: "住宿",
    diving: "潜水",
    snorkeling: "浮潜",
    both: "住宿 + 潜水",
    motorbike: "租摩托车",
    camera: "租相机",
    package: "全包套餐",
  },
  months: [
    "1月",
    "2月",
    "3月",
    "4月",
    "5月",
    "6月",
    "7月",
    "8月",
    "9月",
    "10月",
    "11月",
    "12月",
  ],
  message: (v) =>
    [
      `${PROPERTY.name} 你好，我想了解一下${v.activity}。`,
      "",
      v.name.trim() && `称呼：${v.name.trim()}`,
      v.phone.trim() && `WhatsApp：${v.phone.trim()}`,
      v.email.trim() && `邮箱：${v.email.trim()}`,
      `日期：${v.when}`,
      `人数：${v.people}`,
      v.withNights && `住几晚：${v.nights}`,
      v.notes.trim() && `备注：${v.notes.trim()}`,
      "",
      "谢谢。",
    ]
      .filter(Boolean)
      .join("\n"),
};

export const COPY: Record<Lang, SiteCopy> = {
  en: EN,
  id: ID,
  fr: FR,
  ja: JA,
  de: DE,
  ru: RU,
  zh: ZH,
};

/** A year of months from the anchor, named in the reader's language. */
export function monthOptions(from: Date, lang: Lang, count = 12): string[] {
  const names = COPY[lang].months;
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(from.getFullYear(), from.getMonth() + i, 1);
    return `${names[d.getMonth()]} ${d.getFullYear()}`;
  });
}

/** Whether a price-list key is also one of the six packages. */
export function isDiveKey(key: string): key is DiveKey {
  return (DIVE_KEYS as readonly string[]).includes(key);
}

/**
 * One row of the price list, ready to be drawn as a card.
 *
 * The section used to be two things: six cards with photographs and a table of
 * fifteen lines underneath. That meant a guest comparing the manta trip
 * against the three-dive day was comparing a table row against a card, and the
 * four keys the two shared had to be kept saying the same figure by hand. Now
 * there is one list, and a card is a row of it.
 */
export interface DiveCard {
  key: string;
  group: PriceGroup;
  name: string;
  blurb: string;
  /** A package's duration, or the smallest party a boat will go out with. */
  badge: string | null;
  /** What is included, as chips. Only the six packages have them written. */
  includes: string[];
  /** "per person", "per day", "per boat". */
  unit: string;
  /** "Open Water and up". Only the six packages have one. */
  level: string | null;
  /** Rupiah, or 0 where nobody has filled the figure in. */
  rupiah: number;
  /** The key `priceTurtle` takes money for, or null when it will not. */
  pack: DiveKey | null;
}

/**
 * Every card in the dive section, in the order the family prints its list.
 *
 * Joined here rather than in the component, because the join is the part that
 * can go quietly wrong: a package's own name and blurb where it has one, the
 * price list's short name and sentence where it does not, and the figure from
 * `content/site.json` for both. Doing it in one place is what stops a card and
 * a row quoting different prices for the same dive — they are the same dive.
 */
export function diveCards(t: SiteCopy): DiveCard[] {
  return PRICE_ROWS.map((row) => {
    const pack = isDiveKey(row.key) ? t.dive.packages[row.key] : null;
    const min = row.min ? t.dive.list.min(row.min) : null;
    /* A boat's words live with the boats, because they describe a charter
       rather than a dive: who fits on it and which fees the day covers. */
    const sentence =
      t.dive.list.boats[row.key] ?? t.dive.list.rows[row.key] ?? "";
    return {
      key: row.key,
      group: row.group,
      name: pack ? pack.name : (t.dive.list.names[row.key] ?? sentence),
      /* No short name means the sentence was the heading, and a card should
         not print it twice. */
      blurb: pack ? pack.blurb : t.dive.list.names[row.key] ? sentence : "",
      badge: pack ? pack.duration : min,
      includes: pack ? pack.includes : [],
      unit: pack ? pack.unit : t.dive.list.per[row.per],
      level: pack ? pack.level : null,
      rupiah: divePrice(row.key),
      pack: isDiveKey(row.key) ? row.key : null,
    };
  });
}
