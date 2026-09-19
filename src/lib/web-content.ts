import { seedRooms } from "./data";
import { MAX_SPAN } from "./days";
import { SITE_CONFIG, siteConfig } from "./site-config";

/**
 * Everything the public site says, in both languages, in one place — so copy
 * can be edited without reading a component, and so nothing is stated twice
 * in a way that could drift apart.
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

export type Lang = "en" | "id";

/** English first: most guests reaching this page are not Indonesian. */
export const LANGS: { key: Lang; short: string; label: string }[] = [
  { key: "en", short: "EN", label: "English" },
  { key: "id", short: "ID", label: "Bahasa Indonesia" },
];

export const DEFAULT_LANG: Lang = "en";

// ------------------------------------------------------------------- facts

/** Edited in the CMS tab, stored in `content/site.json`. */
const TURTLE = siteConfig("turtle");
export const WHATSAPP = TURTLE.contact.whatsapp;
export const EMAIL = TURTLE.contact.email;

/** Proper nouns, which stay as they are in either language. */
export const PROPERTY = {
  name: "Turtle Dive Homestay",
  village: "Yenbuba",
  island: "Pulau Mansuar",
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
  area: "Pulau Mansuar Kecil (Kri)",
  admin: "Meos Mansar, Raja Ampat Regency, West Papua",
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
 * Takes a language tag rather than this file's own two-value `Lang`. It used to
 * be the union, mapped to one of two locales, which meant every reader who was
 * neither English nor Indonesian silently got English grouping. That was true
 * of nobody while there were two languages and is true of five of seven now
 * that Eddo has more. A tag is also what the browser wants anyway, so the map
 * in the middle was doing nothing but narrowing.
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
 * The two room types, as a list as well as a union, because a room key that
 * arrives in a request body has to be checked against something at runtime and
 * a type is gone by then.
 */
export const ROOM_KEYS = ["standard", "family"] as const;
export type RoomKey = (typeof ROOM_KEYS)[number];

export interface RoomFacts {
  key: RoomKey;
  rate: number;
  count: number;
}

/**
 * Two room types, priced from the room table the manager uses. Individual
 * rooms are deliberately not listed: which of the ten a guest gets is an
 * operational decision, and a room out for renovation must never appear here
 * as something to book.
 */
export function roomFacts(): RoomFacts[] {
  const rooms = seedRooms().filter((r) => r.prop === "turtle");
  const standard = rooms.filter((r) => r.cap === "2 dewasa");
  const family = rooms.filter((r) => r.cap !== "2 dewasa");
  return [
    {
      key: "standard",
      rate: Math.min(...standard.map((r) => r.rate)),
      count: standard.length,
    },
    {
      key: "family",
      rate: Math.min(...family.map((r) => r.rate)),
      count: family.length,
    },
  ];
}

export const DIVE_KEYS = [
  "fun2",
  "fun3",
  "dsd",
  "ow",
  "snorkel",
  "gear",
] as const;
export type DiveKey = (typeof DIVE_KEYS)[number];

/** Edited in the CMS tab, stored in `content/site.json`. */
export const DIVE_PRICE = SITE_CONFIG.divePrices as Record<DiveKey, number>;

/** Drawn as the accented card. */
export const DIVE_FEATURED: DiveKey = "fun3";

/**
 * What each package's price is multiplied by.
 *
 * A fact, not a word: five of the six are charged per person and the gear is
 * charged per day, and that is true whichever language the page is being read
 * in. The copy says "per person" and "per hari" beside the figure, which is
 * the same fact written for a reader; this is the one the arithmetic uses.
 *
 * Keeping them apart matters because the words are translated and the rule is
 * not. Deciding how to multiply by looking at whether the unit string reads
 * "per day" would work in English and quietly charge a day's gear hire per
 * person to everyone reading Indonesian.
 */
export const DIVE_PER: Record<DiveKey, "person" | "day"> = {
  fun2: "person",
  fun3: "person",
  dsd: "person",
  ow: "person",
  snorkel: "person",
  gear: "day",
};

/**
 * How many people a room type sleeps.
 *
 * The same numbers as the `cap` line in the room table and the `cap` line in
 * the copy, written once more here because this is the one of the three that
 * is arithmetic: it is the top of the guest picker. Reading it out of either
 * of the others would mean parsing "2 dewasa + 2 anak" for its digits, which
 * is a sentence, not a number, and is one rewording away from letting six
 * people book a room that sleeps four.
 */
export const ROOM_SLEEPS: Record<RoomKey, number> = { standard: 2, family: 4 };

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
  /** Nights, divers, or days of gear hire. */
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
}): TurtleSale | null {
  const count = Math.floor(v.count);
  if (!Number.isFinite(count) || count < 1) return null;

  if (v.kind === "room") {
    const key = ROOM_KEYS.find((k) => k === v.room);
    if (!key) return null;
    if (count > MAX_SPAN) return null;
    const rate = roomFacts().find((r) => r.key === key)?.rate ?? 0;
    if (rate <= 0) return null;
    return {
      name: EN.rooms.types[key].name,
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
    roomsLabel: (n: number) => string;
    ask: string;
    askNote: (name: string) => string;
    otaNote: string;
    types: Record<RoomKey, RoomCopy>;
  };
  dive: {
    badge: string;
    title: string;
    body: string;
    /** The card's link through to the package's own page. */
    details: string;
    /** Sits over the SSI mark. Names the relationship, nothing more. */
    partner: string;
    orderNote: (name: string) => string;
    footnote: string;
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
  currencyNote: "Prices are charged in rupiah. The second line is an approximate conversion, refreshed a few times a day.",
  meta: {
    title: `${PROPERTY.name} · Homestay & Dive Center in Raja Ampat`,
    description:
      "A family homestay and dive centre in Yenbuba, Pulau Mansuar. Rooms on stilts at the water's edge, three meals a day, and daily diving in the Dampier Strait.",
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
    sub: "A homestay in Yenbuba, on Pulau Mansuar, built by hand from local timber and standing at the edge of a reef we leave the way we found it. Kept by the family who has always lived in this bay, at the pace the tide sets.",
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
      badge: "Yenbuba",
      alt: "The boardwalk in front of a row of thatched bungalows",
    },
  ],
  rooms: {
    eyebrow: "Rooms & rates",
    title: "Pick Your Room",
    intro:
      "Per room, per night, three meals included. We charge no cleaning fee and no service fee.",
    perNight: "per night",
    roomsLabel: (n) => `${n} rooms`,
    ask: "Ask about this room",
    askNote: (name) => `I am interested in the ${name}.`,
    otaNote:
      "The rooms are also listed on Booking.com, Agoda and Traveloka. If you would rather book there, please do. The price is the same; booking with us directly only skips the platform's commission. What no OTA can sell you is a dive package, and those are arranged here.",
    types: {
      standard: {
        name: "Standard Room",
        blurb:
          "A timber room on stilts at the top of the sand, with a small deck facing the strait. Open the door in the morning and the water is a few steps away.",
        cap: "2 adults",
        features: [
          "Double bed with mosquito net",
          "Shared bathroom, fresh water",
          "Private deck facing the sea",
          "Three meals a day included",
        ],
        alt: "A row of timber rooms standing on stilts at the edge of the sand, shaded by trees, the water a few steps away.",
      },
      family: {
        name: "Family Room",
        blurb:
          "Larger, sleeping two adults and two children. Right for a family, or for two couples travelling together.",
        cap: "2 adults + 2 children",
        features: [
          "One double bed and two singles",
          "Private bathroom",
          "Wide deck, hammock",
          "Three meals a day included",
        ],
        alt: "The family room seen head on: a wide deck under a thatched roof, with a hammock slung across it, a table and chairs, and trees on both sides.",
      },
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
        gear: {
          lede: "Kit for the day, for divers arriving with their own certification and their own plan. Everything is checked and rinsed between uses. Tank refills are charged separately, per fill, and a guide is not included in this line.",
          forYou: [
            "You are certified and diving with us on a Fun Dive without your own kit",
            "You have brought some of your own and need the rest",
          ],
          notIncluded: [
            "Tank refills, charged per fill",
            "A guide or a boat. Those come with a Fun Dive",
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
      gear: {
        name: "Full Equipment Rental",
        blurb:
          "For divers arriving with a certificate and a plan of their own. Tank refills are charged separately.",
        duration: "per day",
        level: "Open Water and up",
        unit: "per day",
        includes: ["BCD & regulator", "Wetsuit", "Mask & fins"],
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
        body: "Our boat meets you at Waisai harbour, about an hour to Yenbuba. Send us your ferry time on WhatsApp.",
      },
    ],
    map: {
      open: "Open the map",
      title: "Where we are",
      here: "Us",
      sorong: "Sorong",
      waisai: "Waisai",
      sketchAlt:
        "A sketch map of the route: Sorong on the mainland, a ferry north-east to Waisai on Waigeo, then a boat south-west to the homestay on Pulau Mansuar.",
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
      "Turtle Dive Homestay is one family's house and the ten rooms they built beside it, on the north shore of Pulau Mansuar. This page is the long version: who runs it, what each room actually gives you, and how the dive centre came to sit at the end of the same jetty.",
    storyHeading: "Who you are staying with",
    story: [
      "The family who built this homestay live here, in the house at the top of the sand. They were born in this bay and so were their parents, and the reef in front of the jetty is the one they grew up swimming over. Nobody is on shift. If you need something, you are asking the person whose home it is.",
      "The rooms are traditional Papuan work, timber and thatch, put up by hand and repaired the same way when a storm takes a panel. That is a choice rather than a shortage: a room built like this can be mended with what is on the island, which matters four hours from the nearest hardware shop.",
      "What the family will not do is tidy the reef. It is left the way it was found, which is why the snorkelling starts at the bottom of the steps.",
    ],
    roomsHeading: "The rooms",
    roomsIntro: (total) =>
      `${total} rooms in two types, all of them along one boardwalk, all of them facing the same water. Which one you get is worked out when you book; a room out for repair never appears as available.`,
    roomsTotal: (total) => `${total} rooms in total`,
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
        body: "Fresh water for washing. Power runs from evening until morning, which is enough to charge a camera and a phone overnight.",
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
        standardRow:
          "The standard rooms, on stilts at the top of the sand under the trees.",
        familyFront:
          "The family room, seen head on: a wide deck, a hammock across it, and room for four.",
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
        a: "Power runs from evening until morning. Alongside the phone signal there is Starlink, fast enough for a video call, and it reaches almost every room. If a reliable connection matters to your stay, say so when you book and we will put you in one of the rooms where the signal is strongest.",
      },
      {
        q: "What about food?",
        a: "Three meals a day are included in the room rate. Fresh fish most days. Tell us when you book if you have allergies or anything you do not eat.",
      },
      {
        q: "Do I need to swim well to snorkel?",
        a: "You do not need to be strong in the water. We provide floats and a guide is always in the water with you.",
      },
      {
        q: "Can I pay by card?",
        a: "There is no card machine on the island. Pay by transfer before you arrive, or in cash at check-in. Bring enough cash from Sorong or Waisai.",
      },
      {
        q: "Are children welcome?",
        a: "Yes. The Family Room sleeps two children, and the snorkelling trip is safe for children who are comfortable in the water.",
      },
    ],
  },
  footer: {
    contact: "Contact",
    manager: "Manager sign-in",
    colophon: `© ${PROPERTY.name}, ${PROPERTY.village}. Run together with Eddo Homestay in Sawinggrai, Pulau Gam.`,
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
  currencyNote: "Harga ditagih dalam rupiah. Baris keduanya perkiraan konversi, diperbarui beberapa kali sehari.",
  meta: {
    title: `${PROPERTY.name} · Homestay & Dive Center di Raja Ampat`,
    description:
      "Homestay keluarga dan dive center di Yenbuba, Pulau Mansuar. Kamar berpanggung di tepi air, tiga kali makan, dan penyelaman harian di Selat Dampier.",
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
    sub: "Homestay di Yenbuba, Pulau Mansuar, dibangun dengan tangan dari kayu setempat dan berdiri di tepi karang yang kami jaga apa adanya. Dirawat keluarga yang memang lahir dan besar di teluk ini, dengan irama yang diatur pasang surut.",
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
      badge: "Yenbuba",
      alt: "Jalur papan di depan deretan bungalow beratap rumbia",
    },
  ],
  rooms: {
    eyebrow: "Kamar & harga",
    title: "Pilih Kamarmu",
    intro:
      "Harga per kamar per malam, sudah termasuk tiga kali makan. Kami tidak memungut biaya kebersihan atau biaya layanan.",
    perNight: "per malam",
    roomsLabel: (n) => `${n} kamar`,
    ask: "Tanya kamar ini",
    askNote: (name) => `Saya tertarik ${name}.`,
    otaNote:
      "Kamar juga terdaftar di Booking.com, Agoda dan Traveloka. Kalau kamu lebih nyaman pesan lewat sana, silakan. Harganya sama; lewat kami saja yang tanpa komisi platform. Yang belum bisa dipesan di OTA mana pun adalah paket menyelam, dan itu diatur langsung di sini.",
    types: {
      standard: {
        name: "Kamar Standar",
        blurb:
          "Kamar kayu berpanggung di tepi pasir, dengan teras kecil menghadap selat. Buka pintu pagi hari, air cuma beberapa langkah dari teras.",
        cap: "2 dewasa",
        features: [
          "Kasur double + kelambu",
          "Kamar mandi bersama, air tawar",
          "Teras pribadi menghadap laut",
          "Termasuk 3x makan sehari",
        ],
        alt: "Deretan kamar kayu berpanggung di tepi pasir, teduh di bawah pepohonan, air hanya beberapa langkah dari teras.",
      },
      family: {
        name: "Kamar Keluarga",
        blurb:
          "Lebih luas, muat dua dewasa dan dua anak. Cocok untuk keluarga atau dua pasang yang bepergian bersama.",
        cap: "2 dewasa + 2 anak",
        features: [
          "Satu kasur double + dua single",
          "Kamar mandi dalam",
          "Teras luas, hammock",
          "Termasuk 3x makan sehari",
        ],
        alt: "Kamar keluarga dilihat dari depan: teras lebar beratap daun, hammock terbentang, meja dan kursi, pepohonan di kedua sisi.",
      },
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
        gear: {
          lede: "Peralatan untuk satu hari, untuk penyelam yang datang dengan sertifikat dan rencananya sendiri. Semuanya dicek dan dibilas setiap selesai dipakai. Isi ulang tabung dihitung terpisah per tabung, dan pemandu tidak termasuk di baris ini.",
          forYou: [
            "Kamu bersertifikat dan ikut Fun Dive bersama kami tanpa membawa alat sendiri",
            "Kamu membawa sebagian alat sendiri dan butuh sisanya",
          ],
          notIncluded: [
            "Isi ulang tabung, dihitung per tabung",
            "Pemandu dan perahu. Keduanya ikut di paket Fun Dive",
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
      gear: {
        name: "Sewa Alat Lengkap",
        blurb:
          "Untuk penyelam yang datang dengan sertifikat dan rencana sendiri. Tabung isi ulang dihitung terpisah.",
        duration: "per hari",
        level: "Open Water ke atas",
        unit: "per hari",
        includes: ["BCD & regulator", "Wetsuit", "Masker & fin"],
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
        body: "Perahu kami menjemput di dermaga Waisai, ±1 jam ke Yenbuba. Kabari jadwal kapalmu lewat WhatsApp.",
      },
    ],
    map: {
      open: "Buka peta",
      title: "Lokasi kami",
      here: "Kami",
      sorong: "Sorong",
      waisai: "Waisai",
      sketchAlt:
        "Peta sketsa rutenya: Sorong di daratan, kapal ke timur laut menuju Waisai di Waigeo, lalu perahu ke barat daya menuju homestay di Pulau Mansuar.",
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
      "Turtle Dive Homestay adalah rumah satu keluarga dan sepuluh kamar yang mereka bangun di sebelahnya, di pesisir utara Pulau Mansuar. Halaman ini versi panjangnya: siapa yang mengelola, apa yang sebenarnya kamu dapat di tiap kamar, dan bagaimana dive center-nya sampai berdiri di ujung dermaga yang sama.",
    storyHeading: "Kamu menginap bersama siapa",
    story: [
      "Keluarga yang membangun homestay ini tinggal di sini juga, di rumah di ujung atas pasir. Mereka lahir di teluk ini, begitu juga orang tua mereka, dan karang di depan dermaga adalah karang tempat mereka berenang sejak kecil. Tidak ada yang sedang bertugas shift. Kalau kamu butuh sesuatu, kamu sedang meminta kepada orang yang rumahnya ini.",
      "Kamarnya kerja tradisional Papua, kayu dan daun, dibangun dengan tangan dan diperbaiki dengan cara yang sama kalau angin mencopot satu panel. Itu pilihan, bukan keterbatasan: kamar yang dibangun begini bisa diperbaiki dengan apa yang ada di pulau, dan itu penting kalau toko bangunan terdekat empat jam jauhnya.",
      "Yang tidak akan dilakukan keluarga ini adalah merapikan karangnya. Karangnya dibiarkan apa adanya, dan itu sebabnya snorkeling di sini dimulai dari anak tangga terakhir.",
    ],
    roomsHeading: "Kamarnya",
    roomsIntro: (total) =>
      `${total} kamar dalam dua tipe, semuanya di sepanjang satu jalur papan, semuanya menghadap air yang sama. Kamar mana yang kamu dapat diatur saat pemesanan; kamar yang sedang diperbaiki tidak pernah muncul sebagai tersedia.`,
    roomsTotal: (total) => `Total ${total} kamar`,
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
        body: "Air tawar untuk mandi. Listrik menyala dari sore sampai pagi, cukup untuk mengisi kamera dan ponsel semalaman.",
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
        standardRow:
          "Kamar-kamar standar, berpanggung di tepi atas pasir, teduh di bawah pepohonan.",
        familyFront:
          "Kamar keluarga dilihat dari depan: teras lebar, hammock terbentang, muat berempat.",
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
        a: "Listrik menyala dari sore sampai pagi. Selain sinyal telepon, ada Starlink yang cukup cepat untuk panggilan video, dan jangkauannya sampai hampir semua kamar. Kalau koneksi penting untuk perjalananmu, beri tahu saat memesan dan kami tempatkan di kamar dengan sinyal paling kuat.",
      },
      {
        q: "Makan bagaimana?",
        a: "Tiga kali makan sehari sudah termasuk harga kamar. Ikan segar hampir tiap hari. Kalau ada alergi atau pantangan, beri tahu saat pesan.",
      },
      {
        q: "Perlu bisa berenang untuk snorkeling?",
        a: "Tidak harus mahir. Kami sediakan pelampung dan pemandu selalu ikut di air.",
      },
      {
        q: "Bisa bayar pakai kartu?",
        a: "Tidak ada mesin kartu di pulau. Pembayaran lewat transfer sebelum datang, atau tunai saat check-in. Bawa uang tunai secukupnya dari Sorong atau Waisai.",
      },
      {
        q: "Anak-anak boleh ikut?",
        a: "Boleh. Kamar Keluarga muat dua anak, dan trip snorkeling aman untuk anak yang sudah nyaman di air.",
      },
    ],
  },
  footer: {
    contact: "Kontak",
    manager: "Masuk pengelola",
    colophon: `© ${PROPERTY.name}, ${PROPERTY.village}. Dikelola bersama Eddo Homestay di Sawinggrai, Pulau Gam.`,
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

export const COPY: Record<Lang, SiteCopy> = { en: EN, id: ID };

/** A year of months from the anchor, named in the reader's language. */
export function monthOptions(from: Date, lang: Lang, count = 12): string[] {
  const names = COPY[lang].months;
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(from.getFullYear(), from.getMonth() + i, 1);
    return `${names[d.getMonth()]} ${d.getFullYear()}`;
  });
}
