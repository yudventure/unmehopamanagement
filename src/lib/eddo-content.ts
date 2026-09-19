import { seedRooms } from "@/lib/data";
import { SITE_CONFIG as SITE, siteConfig, type Localised, type ServiceProduct } from "@/lib/site-config";

/**
 * The languages this site is written in.
 *
 * Deliberately its own union rather than the `Lang` in `web-content.ts`, which
 * stays at English and Indonesian. That one is Turtle's, and Turtle's copy runs
 * to some sixteen hundred lines: widening it would demand five more
 * translations of a site nobody asked to translate, and a build that fails
 * until they exist. The two sites already keep their words apart, so they can
 * keep their language lists apart too.
 *
 * What that costs is a reader who picks French here and then follows the
 * footer link to Turtle, who lands on English. That is the honest outcome:
 * Turtle is not written in French, and pretending otherwise would mean shipping
 * a French page that is silently English.
 */
export type EddoLang = "en" | "id" | "fr" | "ja" | "de" | "ru" | "zh";

/**
 * The picker's list, in the order it is shown.
 *
 * Each language is named in itself, not in English. Somebody looking for their
 * own language scans for the shape of their own word, and "Japanese" is no help
 * to a reader who cannot read the rest of the page either.
 *
 * English first because it is the default and because it is what most guests
 * arriving at Raja Ampat from abroad share. Indonesian second as the language
 * of the country the homestay is in. The rest follow.
 */
export const EDDO_LANGS: { key: EddoLang; short: string; label: string }[] = [
  { key: "en", short: "EN", label: "English" },
  { key: "id", short: "ID", label: "Bahasa Indonesia" },
  { key: "fr", short: "FR", label: "Français" },
  { key: "ja", short: "JA", label: "日本語" },
  { key: "de", short: "DE", label: "Deutsch" },
  { key: "ru", short: "RU", label: "Русский" },
  { key: "zh", short: "ZH", label: "中文" },
];

export const EDDO_DEFAULT_LANG: EddoLang = "en";

export function isEddoLang(v: unknown): v is EddoLang {
  return typeof v === "string" && EDDO_LANGS.some((l) => l.key === v);
}

/**
 * Everything the Eddo Homestay site says, in every language it offers.
 *
 * Its own file rather than a branch inside `web-content.ts`: the two sites
 * share a family, a booking manager, and a colour kit, but not a voice or a
 * page. Eddo is a smaller place with a different reason to visit, and its copy
 * is shorter for it. Keeping the two apart means neither has to carry keys the
 * other never reads, and a missing translation here still fails the build.
 *
 * Proper nouns stay as they are in both languages.
 */
export const EDDO = {
  name: "Eddo Homestay",
  village: "Yenbuba",
  island: "Pulau Mansuar",
  region: "Raja Ampat",
};

/* Eddo's own number and address, which fall back to the shared ones while
   they are blank. Blank is the state today, and it is the reason a guest on
   eddohomestay.com is still shown an address at turtlehomestay.com: nobody
   has typed Eddo's in yet. Filling them in the CMS is the whole fix. */
const EDDO_SITE = siteConfig("eddo");
export const WHATSAPP = EDDO_SITE.contact.whatsapp;
export const EMAIL = EDDO_SITE.contact.email;

export function waLink(message: string) {
  return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(message)}`;
}

/**
 * Eddo's rooms, read from the same table the manager's calendar uses so the
 * site and the calendar cannot disagree about the price.
 *
 * One type, five units. They differ by number and nothing else, so what the
 * page needs from the table is the rate and the count, not a row each.
 */
export function eddoRooms(): { rate: number; count: number } {
  const rooms = seedRooms().filter((r) => r.prop === "eddo" && r.active);
  return { rate: rooms[0]?.rate ?? 0, count: rooms.length };
}

/**
 * The five things a visitor can ask Eddo for, in the order the card offers
 * them. One list, used twice: it is the row of tabs on the booking card and it
 * is the list in the enquiry dialog, so the two can never drift apart.
 *
 * Diving is on it although Eddo has no dive centre of its own. The family runs
 * one at Turtle, a few doors along the same village, and a guest asking here is
 * asking the same family. Hire is the other way round: Turtle's list does not
 * carry it.
 */
/**
 * What the family arranges besides the house, in the order the section lists
 * them.
 *
 * Keys from the shared activity vocabulary rather than names of their own, so
 * a service in this list and the same service in the enquiry dialog are the
 * same thing rather than two things that agree today.
 */
export const SERVICE_KEYS = [
  "snorkeling",
  "diving",
  "excursion",
  "transfer",
  "camera",
  "motorbike",
  "car",
  "merch",
] as const;
export type ServiceKey = (typeof SERVICE_KEYS)[number];

/**
 * The only labels a spec line may carry, and the only units a price may be
 * per.
 *
 * Fixed lists rather than free text, because the values come from the owner in
 * one language and the labels have to come from the copy in seven. Left open,
 * a French reader would be shown "Mesin" beside "110cc" and the page would be
 * half translated in the one place a guest is comparing things.
 */
export const SPEC_KEYS = ["duration", "level", "engine", "power", "seats", "size", "includes", "notes"] as const;
export type SpecKey = (typeof SPEC_KEYS)[number];

export const PRICE_UNITS = ["day", "night", "person", "trip", "piece", "hour"] as const;
export type PriceUnit = (typeof PRICE_UNITS)[number];

export const isSpecKey = (v: string): v is SpecKey => (SPEC_KEYS as readonly string[]).includes(v);
export const isPriceUnit = (v: string): v is PriceUnit => (PRICE_UNITS as readonly string[]).includes(v);

/**
 * What the owner has listed under one service, or nothing.
 *
 * Nothing is a normal answer. The section was written to stand up without any
 * of this, and it still does: a service with no products shows what it is and
 * offers to answer, which is the whole page's manner anyway.
 */
export function serviceProducts(key: ServiceKey): ServiceProduct[] {
  return SITE.eddoServices?.[key] ?? [];
}

/**
 * A piece of owner text in the reader's language, or the nearest thing to it.
 *
 * English rather than the first key when the reader's own is missing. Falling
 * back to whatever came first in the file means a French reader could get
 * Indonesian or Japanese depending on how the owner happened to type the
 * object, which is not a fallback so much as a lottery.
 */
export function pickText(v: Localised, lang: EddoLang): string {
  if (typeof v === "string") return v;
  return v[lang] ?? v.en ?? Object.values(v)[0] ?? "";
}

/**
 * The services a guest can pay for up front rather than only ask about.
 *
 * A short list on purpose, and the short part is the boats. A shirt, a
 * motorbike, a car, a camera and a dive have a price that holds before anybody
 * looks at the sea; a boat's does not, and the section says so in writing.
 * Taking money for something whose cost we have just explained cannot be fixed
 * in advance would make that sentence a lie. That is why the snorkelling trip,
 * the whole-day excursion and the transfer are not on this list: all three are
 * a boat with fuel in it, whatever else they are called.
 *
 * Paying still needs a price on the product and a real one: see
 * `payableProduct` below, which refuses anything still marked as an example.
 */
export const PAYABLE_SERVICES = ["diving", "camera", "motorbike", "car", "merch"] as const;
export const isPayableService = (k: string): k is ServiceKey =>
  (PAYABLE_SERVICES as readonly string[]).includes(k);

/**
 * The product a payment may be priced from, or nothing.
 *
 * The one place that decides what an order costs, and it reads the file rather
 * than the request. A body that carries its own total is a body that can carry
 * Rp 1.
 *
 * It refuses an example outright. Every figure in the section is made up until
 * somebody replaces it, and a made-up number that can be charged is worse than
 * no number at all. Nothing on the page says so any more, which makes this the
 * only thing standing between an invented price and a real card payment: the
 * flagged card offers to be asked about, and a person answers with the figure
 * that holds. Delete `"example": true` and the same product becomes payable
 * with nothing else changed.
 */
export function payableProduct(service: string, id: string): ServiceProduct | null {
  if (!isPayableService(service)) return null;
  const found = serviceProducts(service).find((p) => p.id === id);
  if (!found || found.example) return null;
  if (typeof found.price !== "number" || found.price <= 0) return null;
  return found;
}

export const EDDO_ACTIVITIES = ["stay", ...SERVICE_KEYS] as const;
export type EddoActivity = (typeof EDDO_ACTIVITIES)[number];

/**
 * The enquiry dialog's list of things to ask about, built from the services
 * rather than written twice.
 *
 * It used to be its own block of words in every language, which meant ten
 * labels and nine section headings saying the same nine things: the first time
 * somebody renamed a service in the section, the dropdown would go on offering
 * the old name and nobody would notice until a guest asked for something that
 * is not on the page any more.
 */
export function eddoActivityLabels(t: EddoCopy): Record<EddoActivity, string> {
  const out = { stay: t.stayLabel } as Record<EddoActivity, string>;
  for (const k of SERVICE_KEYS) out[k] = t.services.items[k].title;
  return out;
}

/**
 * What a night buys, in the order it is listed beside the price.
 *
 * Keys rather than a plain list, because each line has a glyph of its own and
 * the two live in different files. Matched by position they would come apart
 * the first time a line was reordered, and a fan beside "no booking fee" is
 * the kind of wrong nobody reports.
 */
export const INCLUDED_KEYS = ["house", "meals", "deck", "fan", "internet", "nofee"] as const;
export type IncludedKey = (typeof INCLUDED_KEYS)[number];

export interface EddoCopy {
  htmlLang: string;
  meta: { title: string; description: string };
  nav: { home: string; rooms: string; around: string; services: string; why: string; faq: string };
  openMenu: string;
  currencyLabel: string;
  langLabel: string;
  hero: {
    title: string;
    /** The line set in the script face, under the title. */
    script: string;
    sub: string;
    cta: string;
    alt: string;
  };
  trust: { title: string; sub: string }[];
  rooms: {
    eyebrow: string;
    title: string;
    /** The tail of the title, set in the script face. */
    script: string;
    intro: string;
    /** "five houses", said once under the title. */
    count: (n: number) => string;
    perNight: string;
    sleeps: (n: number) => string;
    name: string;
    blurb: string;
    /** What a night buys, listed beside the price. */
    included: Record<IncludedKey, string>;
    /** Alt text for a room photograph, numbered as the reader sees them. */
    photoAlt: (n: number, of: number) => string;
    prev: string;
    next: string;
    /** The small form that turns a rate into an amount. */
    checkIn: string;
    nights: string;
    nightsValue: (n: number) => string;
    guests: string;
    guestsValue: (n: number) => string;
    yourName: string;
    contact: string;
    total: string;
    /** Sends the reader to Midtrans. */
    pay: string;
    /** Shown in place of the pay button when no payment keys are set. */
    cta: string;
    ctaNote: (room: string) => string;
    /** Said under the button when it charges, and when it asks. */
    payNote: string;
    askNote: string;
  };
  /**
   * When the water is worth the trip. The months are the ones the Turtle site
   * already publishes, because it is the same archipelago seen from a jetty an
   * island away, and two sites of one family disagreeing about the sea would
   * be worse than either of them being vague.
   */
  season: {
    title: string;
    note: string;
    bands: { label: string; months: string; note: string }[];
  };
  around: {
    eyebrow: string;
    title: string;
    all: string;
    /** Distance is a relative label, not minutes: nobody here has timed them. */
    places: { name: string; where: string; tag: string; time: string; alt: string }[];
    note: string;
  };
  why: {
    title: string;
    script: string;
    items: { title: string; sub: string }[];
    cta: { eyebrow: string; title: string; body: string; button: string; alt: string };
  };
  faq: { eyebrow: string; title: string; items: { q: string; a: string }[] };
  contact: {
    title: string;
    sub: string;
    whatsapp: string;
    email: string;
  };
  footer: {
    tagline: string;
    sister: string;
    sisterLink: string;
    rights: string;
  };
  maintenance: { title: string; body: string; whatsapp: string };
  /**
   * The month names the check-in list is built from, January first.
   *
   * Carried here rather than borrowed from `web-content.ts` for the same reason
   * as the dialog below: that file knows two languages and this site offers
   * seven, so a reader on the French page was being offered "October" in a list
   * of otherwise French words.
   */
  months: string[];
  /**
   * The enquiry dialog's own labels.
   *
   * The dialog is shared with Turtle and used to read Turtle's copy, which is
   * why every field on it appeared in English no matter what the page around it
   * was written in, for any language Turtle does not have. It asks for only
   * these two blocks now, so each site answers in its own languages.
   */
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
   * What the family arranges besides a bed, which is most of what a guest in
   * Raja Ampat actually has to organise: getting to the island, getting around
   * it, and getting on the water.
   *
   * No prices anywhere in here, and that is deliberate rather than an omission
   * waiting to be filled. A boat's cost depends on the fuel that week and the
   * tide that day, and a number printed on a page is a promise the family did
   * not make. The section says what each thing is and offers to answer.
   */
  services: {
    eyebrow: string;
    title: string;
    /** The tail of the title, set in the script face. */
    script: string;
    intro: string;
    /** The button under the open service, which opens the enquiry at it. */
    cta: string;
    /** Said once under the whole list, about prices and availability. */
    note: string;
    items: Record<ServiceKey, { title: string; body: string }>;
    /** The button on a product whose price the owner has published. */
    ask: string;
    /** And on one whose price nobody has filled in yet. */
    askPrice: string;
    /** Under a product with no photograph, so the drawn glyph is explained. */
    noPhoto: string;
    /** On a card that can be paid for outright, and the two fields it needs. */
    pay: string;
    when: string;
    qty: string;
    /** What a spec line is called, and what a price is per. */
    spec: Record<SpecKey, string>;
    per: Record<PriceUnit, string>;
  };
  /**
   * The one thing on the enquiry list that is not one of the services above.
   * The rest take their labels from `services.items`, so the dialog and the
   * section cannot drift apart.
   */
  stayLabel: string;
  message: (v: {
    activity: string;
    name: string;
    phone: string;
    email: string;
    when: string;
    people: string;
    nights: string;
    notes: string;
  }) => string;
}

const EN: EddoCopy = {
  htmlLang: "en",
  meta: {
    title: `${EDDO.name} · Homestay in Yenbuba, Raja Ampat`,
    description:
      "Five family houses on the shore at Yenbuba, Pulau Mansuar, Raja Ampat. A house to yourselves, three meals a day, and snorkelling straight off the jetty.",
  },
  nav: { home: "Home", rooms: "Rooms", around: "Around us", services: "What we arrange", why: "Why Eddo", faq: "Questions" },
  openMenu: "Open menu",
  currencyLabel: "Show an approximate price in",
  langLabel: "Language",
  hero: {
    title: "A quiet corner of Raja\u00A0Ampat",
    script: "yours alone",
    sub: "Five houses on the shore at Yenbuba, kept by the family who lives here. Three meals a day, a jetty to snorkel from, and a deck you share with nobody.",
    cta: "See the rooms",
    alt: "The shore at Yenbuba: palms, a wooden house, and a boat pulled up on the sand",
  },
  trust: [
    { title: "Easy payment", sub: "No agent, no booking fee. The price you see is the price." },
    { title: "Three meals a day included", sub: "Cooked at the house, eaten together." },
    { title: "Internet 24/7", sub: "On all day, every day of your stay." },
    { title: "Friendly service", sub: "Kept by the family who live here." },
  ],
  rooms: {
    eyebrow: "Rooms & rates",
    title: "Five houses,",
    script: "one shore",
    intro: "Per house, per night, with three meals. No cleaning fee, no service fee.",
    count: (n) => `${n} houses, all the same`,
    perNight: "per night",
    sleeps: (n) => `Sleeps ${n}`,
    name: "A house to yourselves",
    blurb: "Not a room in someone else's house. Five stand along the shore, each one yours for the nights you are here, with a deck facing the water and the family a short walk away.",
    included: {
      house: "The whole house to yourselves",
      meals: "Three meals a day, cooked here",
      deck: "A deck facing the water",
      fan: "Fan in every room",
      internet: "Internet 24/7",
      nofee: "No agent and no booking fee",
    },
    photoAlt: (n, of) => `Eddo Homestay, photograph ${n} of ${of}`,
    prev: "Previous photo",
    next: "Next photo",
    checkIn: "Check-in",
    nights: "Nights",
    nightsValue: (n) => (n === 1 ? "1 night" : `${n} nights`),
    guests: "Guests",
    guestsValue: (n) => (n === 1 ? "1 guest" : `${n} guests`),
    yourName: "Your name",
    contact: "WhatsApp or email",
    total: "Total",
    pay: "Book and pay",
    cta: "Ask about a house",
    ctaNote: (room) => `I would like to ask about ${room}.`,
    payNote: "Payment goes through Midtrans. We check the dates against the calendar and message you the same day.",
    askNote: "Your message reaches the family directly, on WhatsApp or email.",
  },
  season: {
    title: "The best months to come",
    note: "Raja Ampat is open all year. This is what the water does, seen from our own jetty.",
    bands: [
      { label: "Best", months: "October – February", note: "Calmest water, clearest visibility. Rooms fill early." },
      { label: "Still good", months: "March – April, August – September", note: "Mixed weather, but most days are fine on the water." },
      { label: "Quiet", months: "May – July", note: "Southeast wind, bigger swell. The emptiest months of the year." },
    ],
  },
  around: {
    eyebrow: "Around us",
    title: "Where a day can go",
    all: "Ask about a trip",
    places: [
      { name: "Yenbuba jetty", where: "Right here", tag: "Snorkelling", time: "From the door", alt: "Fish under the jetty at Yenbuba" },
      { name: "Birds of paradise", where: "Sawinggrai, on Gam", tag: "Dawn trip", time: "By boat, before sunrise", alt: "Forest path behind Sawinggrai at dawn" },
      { name: "Arborek", where: "Neighbouring island", tag: "Village & jetty", time: "By boat", alt: "The jetty at Arborek village" },
      { name: "Piaynemo", where: "Karst islands", tag: "Viewpoint", time: "Half a day by boat", alt: "The karst islands of Piaynemo from the viewpoint" },
    ],
    note: "Boat trips are arranged at the house and shared between guests when it works out. Times and prices depend on the tide and the fuel, so ask when you book.",
  },
  why: {
    title: "Why stay at",
    script: "Eddo?",
    items: [
      { title: "You stay with the family", sub: "The people cooking and paddling out with you are the people whose house this is." },
      { title: "The village is the point", sub: "Yenbuba is a real village, not a resort. You eat what the village eats." },
      { title: "Easy to change", sub: "Arriving a day late or staying a day longer is a message, not a form." },
      { title: "Same family as Turtle Dive", sub: "Want to dive? Our sister homestay runs the dive centre, in this same village." },
    ],
    cta: {
      eyebrow: "Let's go",
      title: "Your next few quiet days",
      body: "Tell us when and how many, and we will tell you what is free.",
      button: "Plan your stay",
      alt: "A guest reading on the deck at Eddo Homestay",
    },
  },
  faq: {
    eyebrow: "Questions",
    title: "Things people ask before they come",
    items: [
      { q: "How do we get to Yenbuba?", a: "Fly to Sorong, take the ferry to Waisai on Waigeo, and we pick you up there by boat. Tell us your ferry time and we will be at the harbour." },
      { q: "Is there electricity and signal?", a: "Electricity runs in the evening. Phone signal reaches the village, and there is Wi-Fi at the house when the connection holds." },
      { q: "Can we snorkel from the homestay?", a: "Yes, straight off the jetty. Fins and masks are at the house; bring your own if you prefer a good fit." },
      { q: "Do you take card?", a: "Cash in rupiah, or a bank transfer before you arrive. There is no card machine in the village." },
    ],
  },
  contact: {
    title: "Ask us anything before you book",
    sub: "We answer the same day, usually within a few hours.",
    whatsapp: "Message on WhatsApp",
    email: "Send an email",
  },
  footer: {
    tagline: "A family homestay in Yenbuba, Pulau Mansuar.",
    sister: "Our sister homestay and dive centre, in this same village:",
    sisterLink: "Turtle Dive Homestay",
    rights: "All rights reserved.",
  },
  maintenance: {
    title: "We are working on this page",
    body: "The site will be back on its own. Nothing about the homestay has changed, and we are answering messages as usual.",
    whatsapp: "Message on WhatsApp",
  },
  months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
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
    notesPlaceholder: "Food allergies, ferry times, dive certification, anything at all.",
    submit: "Send",
    sending: "Sending…",
    sent: "Thank you, your message is with us. We answer the same day, usually within a few hours.",
    needContact: "Please leave a WhatsApp number or an email, so we can answer.",
    failed: "That did not go through. Please try again, or message us on WhatsApp.",
  },
  services: {
    eyebrow: "What else we arrange",
    title: "Getting here, getting around,",
    script: "getting on the water",
    intro: "Most of what a stay in Raja Ampat takes is not the bed. It is the boat, the ride from the ferry, and somebody who knows where the fish are. The family arranges all of it, and you ask for it the same way you ask for a house.",
    cta: "Ask about this",
    note: "The prices shown are the ones that hold. Where there is none, it is because there is none to fix: a boat costs what the fuel costs that week and a crossing takes what the tide allows that day, so we quote when you ask rather than print a number we would have to take back. Asking here is asking whether it is free, not booking it.",
    items: {
      snorkeling: { title: "Snorkelling trip", body: "Out past the jetty by boat, to the reefs a swim will not reach. How far you get depends on the tide that morning, so tell us what you would like to see and we will say what works." },
      diving: { title: "Diving trip", body: "Run by Turtle Dive, our sister homestay in this same village. Certified dives or your first time in the water, arranged from here without you having to book twice." },
      excursion: { title: "Whole day excursion, diving or snorkelling", body: "A day on the water rather than a morning: several places in one trip, with the boat and the crew for the whole of it. Tell us which of the two you want and how many of you there are." },
      transfer: { title: "Boat transfer between islands", body: "Between the islands, and to and from the ferry at Waisai. This is how you get here in the first place, and how you reach the places a shared boat trip does not cover." },
      camera: { title: "Rent a camera", body: "For guests who did not bring one. Ask what is in the house when you book and we will tell you what is free for your dates." },
      motorbike: { title: "Rent a motorbike in Waisai", body: "Waisai is where the ferry lands and where the roads are. Tell us the day you arrive and we will arrange one, so you are not looking for a bike at the harbour." },
      car: { title: "Rent a car in Waisai", body: "For a group, for luggage, or for a day of driving around Waigeo. Same as the bike: tell us when, and we arrange it." },
      merch: { title: "Eddo's merch", body: "Shirts with the homestay's own mark on them. Ask which sizes are in the house and we will put one aside for you." },
    },
    ask: "Ask if it is free",
    askPrice: "Ask the price",
    noPhoto: "Photograph still to come",
    pay: "Book and pay",
    when: "Which day",
    qty: "How many",
    spec: { duration: "Takes", level: "Level", engine: "Engine", power: "Engine size", seats: "Seats", size: "Sizes", includes: "Includes", notes: "Note" },
    per: { day: "per day", night: "per night", person: "per person", trip: "per trip", piece: "each", hour: "per hour" },
  },
  stayLabel: "A house",
  message: (v) =>
    [
      `Hello Eddo Homestay, I would like to ask about: ${v.activity}`,
      v.when ? `When: ${v.when}` : "",
      v.people ? `People: ${v.people}` : "",
      v.nights ? `Nights: ${v.nights}` : "",
      v.name ? `Name: ${v.name}` : "",
      v.phone ? `WhatsApp: ${v.phone}` : "",
      v.email ? `Email: ${v.email}` : "",
      v.notes ? `Notes: ${v.notes}` : "",
    ]
      .filter(Boolean)
      .join("\n"),
};

const ID: EddoCopy = {
  htmlLang: "id",
  meta: {
    title: `${EDDO.name} · Homestay di Yenbuba, Raja Ampat`,
    description:
      "Lima rumah keluarga di tepi air Yenbuba, Pulau Mansuar, Raja Ampat. Satu rumah dipakai sendiri, tiga kali makan, dan snorkeling langsung dari dermaga.",
  },
  nav: { home: "Beranda", rooms: "Kamar", around: "Sekitar kami", services: "Layanan", why: "Kenapa Eddo", faq: "Tanya" },
  openMenu: "Buka menu",
  currencyLabel: "Tampilkan perkiraan harga dalam",
  langLabel: "Bahasa",
  hero: {
    title: "Sudut tenang Raja\u00A0Ampat",
    script: "cuma untukmu",
    sub: "Lima rumah di tepi air Yenbuba, dijaga keluarga yang memang tinggal di sini. Tiga kali makan sehari, dermaga untuk snorkeling, dan teras yang tidak dibagi dengan siapa-siapa.",
    cta: "Lihat kamarnya",
    alt: "Pantai Yenbuba: pohon kelapa, rumah kayu, dan perahu di atas pasir",
  },
  trust: [
    { title: "Kemudahan pembayaran", sub: "Tanpa agen, tanpa biaya pemesanan. Harga yang tertulis itu harganya." },
    { title: "Sudah termasuk makan 3x sehari", sub: "Dimasak di rumah, dimakan bersama." },
    { title: "Internet 24/7", sub: "Bisa dipakai kapan saja selama menginap." },
    { title: "Pelayanan ramah", sub: "Dijaga keluarga yang tinggal di rumah ini." },
  ],
  rooms: {
    eyebrow: "Kamar & tarif",
    title: "Lima rumah,",
    script: "satu pantai",
    intro: "Per rumah, per malam, sudah dengan tiga kali makan. Tanpa biaya kebersihan, tanpa biaya layanan.",
    count: (n) => `${n} rumah, semuanya sama`,
    perNight: "per malam",
    sleeps: (n) => `Muat ${n} orang`,
    name: "Satu rumah dipakai sendiri",
    blurb: "Bukan satu kamar di rumah orang lain. Ada lima berjajar di tepi pantai, satu untukmu selama menginap, dengan teras menghadap air dan rumah keluarganya tidak jauh dari situ.",
    included: {
      house: "Satu rumah dipakai sendiri",
      meals: "Makan 3x sehari, dimasak di rumah",
      deck: "Teras menghadap air",
      fan: "Kipas angin di tiap kamar",
      internet: "Internet 24/7",
      nofee: "Tanpa agen dan tanpa biaya pemesanan",
    },
    photoAlt: (n, of) => `Eddo Homestay, foto ke-${n} dari ${of}`,
    prev: "Foto sebelumnya",
    next: "Foto berikutnya",
    checkIn: "Check-in",
    nights: "Malam",
    nightsValue: (n) => `${n} malam`,
    guests: "Tamu",
    guestsValue: (n) => `${n} tamu`,
    yourName: "Nama",
    contact: "WhatsApp atau email",
    total: "Total",
    pay: "Pesan dan bayar",
    cta: "Tanya soal rumahnya",
    ctaNote: (room) => `Saya mau tanya soal ${room}.`,
    payNote: "Pembayaran lewat Midtrans. Tanggalnya kami cek di kalender lalu kami kabari di hari yang sama.",
    askNote: "Pesanmu langsung sampai ke keluarganya, lewat WhatsApp atau email.",
  },
  season: {
    title: "Bulan terbaik untuk datang",
    note: "Raja Ampat buka sepanjang tahun. Ini yang dilakukan airnya, dilihat dari dermaga kami sendiri.",
    bands: [
      { label: "Terbaik", months: "Oktober – Februari", note: "Air paling tenang, jarak pandang paling jauh. Kamar cepat penuh." },
      { label: "Masih bagus", months: "Maret – April, Agustus – September", note: "Cuaca campur, tapi sebagian besar hari aman di laut." },
      { label: "Sepi", months: "Mei – Juli", note: "Angin tenggara, ombak lebih besar. Bulan paling sepi sepanjang tahun." },
    ],
  },
  around: {
    eyebrow: "Sekitar kami",
    title: "Ke mana harinya bisa dibawa",
    all: "Tanya soal trip",
    places: [
      { name: "Dermaga Yenbuba", where: "Di depan rumah", tag: "Snorkeling", time: "Dari pintu", alt: "Ikan di bawah dermaga Yenbuba" },
      { name: "Burung cendrawasih", where: "Sawinggrai, di Gam", tag: "Trip subuh", time: "Naik perahu, sebelum terbit", alt: "Jalan setapak hutan di belakang Sawinggrai saat fajar" },
      { name: "Arborek", where: "Pulau tetangga", tag: "Kampung & dermaga", time: "Naik perahu", alt: "Dermaga kampung Arborek" },
      { name: "Piaynemo", where: "Gugusan karst", tag: "Puncak pandang", time: "Setengah hari naik perahu", alt: "Gugusan karst Piaynemo dari puncak pandang" },
    ],
    note: "Trip perahu diatur dari rumah dan dibagi antar tamu kalau jadwalnya cocok. Waktu dan harganya tergantung pasang dan bahan bakar, jadi tanyakan saat memesan.",
  },
  why: {
    title: "Kenapa menginap di",
    script: "Eddo?",
    items: [
      { title: "Tinggal bersama keluarganya", sub: "Yang memasak dan mendayung bersamamu adalah orang yang rumahnya ini." },
      { title: "Kampungnya yang jadi alasan", sub: "Yenbuba kampung sungguhan, bukan resor. Kamu makan apa yang kampung makan." },
      { title: "Gampang diubah", sub: "Datang telat sehari atau tinggal sehari lebih lama cukup satu pesan, bukan formulir." },
      { title: "Sekeluarga dengan Turtle Dive", sub: "Mau menyelam? Homestay saudara kami yang menjalankan dive center-nya, di kampung yang sama." },
    ],
    cta: {
      eyebrow: "Ayo",
      title: "Beberapa hari tenangmu berikutnya",
      body: "Bilang kapan dan berapa orang, kami kabari kamar mana yang kosong.",
      button: "Rencanakan menginap",
      alt: "Tamu membaca di teras Eddo Homestay",
    },
  },
  faq: {
    eyebrow: "Tanya",
    title: "Yang sering ditanyakan sebelum datang",
    items: [
      { q: "Bagaimana cara ke Yenbuba?", a: "Terbang ke Sorong, naik kapal ke Waisai di Waigeo, lalu kami jemput di sana dengan perahu. Kabari jam kapalmu dan kami sudah di pelabuhan." },
      { q: "Ada listrik dan sinyal?", a: "Listrik menyala malam hari. Sinyal telepon sampai ke kampung, dan ada Wi-Fi di rumah selama koneksinya bertahan." },
      { q: "Bisa snorkeling dari homestay?", a: "Bisa, langsung dari dermaga. Fin dan masker ada di rumah; bawa sendiri kalau mau yang pas di wajah." },
      { q: "Terima kartu?", a: "Tunai dalam rupiah, atau transfer bank sebelum datang. Tidak ada mesin kartu di kampung." },
    ],
  },
  contact: {
    title: "Tanya apa saja sebelum memesan",
    sub: "Kami balas hari itu juga, biasanya dalam beberapa jam.",
    whatsapp: "Pesan lewat WhatsApp",
    email: "Kirim email",
  },
  footer: {
    tagline: "Homestay keluarga di Yenbuba, Pulau Mansuar.",
    sister: "Homestay saudara dan dive center kami, di kampung yang sama:",
    sisterLink: "Turtle Dive Homestay",
    rights: "Hak cipta dilindungi.",
  },
  maintenance: {
    title: "Halaman ini sedang dikerjakan",
    body: "Situsnya akan kembali dengan sendirinya. Tidak ada yang berubah di homestay-nya, dan pesan tetap kami balas seperti biasa.",
    whatsapp: "Pesan lewat WhatsApp",
  },
  months: ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"],
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
    notesPlaceholder: "Alergi makanan, jadwal kapal, sertifikat selam, apa saja.",
    submit: "Kirim",
    sending: "Mengirim…",
    sent: "Terima kasih, pesanmu sudah kami terima. Kami balas hari itu juga, biasanya dalam beberapa jam.",
    needContact: "Isi nomor WhatsApp atau email dulu, supaya kami bisa membalas.",
    failed: "Pesannya gagal terkirim. Coba lagi, atau hubungi kami lewat WhatsApp.",
  },
  services: {
    eyebrow: "Yang juga kami urus",
    title: "Sampai ke sini, keliling,",
    script: "dan turun ke air",
    intro: "Sebagian besar urusan menginap di Raja Ampat bukan soal kasurnya. Yang repot itu perahunya, jemputan dari kapal, dan orang yang tahu ikannya ada di mana. Semua itu kami yang urus, dan cara mintanya sama seperti minta rumah.",
    cta: "Tanya soal ini",
    note: "Harga yang tercantum adalah harga yang berlaku. Yang tidak tercantum memang belum bisa dipatok: ongkos perahu ikut harga bahan bakar minggu itu dan lama menyeberang ikut pasang hari itu, jadi kami sebutkan saat kamu tanya daripada menulis angka yang nanti harus kami tarik lagi. Menekan tombolnya berarti menanyakan ketersediaan, bukan memesan.",
    items: {
      snorkeling: { title: "Trip snorkeling", body: "Naik perahu melewati dermaga, ke karang yang tidak terjangkau kalau berenang saja. Sampai mana bisanya tergantung pasang pagi itu, jadi bilang saja mau lihat apa, nanti kami sebutkan mana yang masuk akal." },
      diving: { title: "Trip diving", body: "Dijalankan Turtle Dive, homestay saudara kami di kampung yang sama. Selam bersertifikat, atau pertama kali turun ke air, diatur dari sini tanpa kamu perlu memesan dua kali." },
      excursion: { title: "Trip sehari penuh, diving atau snorkeling", body: "Sehari di laut, bukan cuma sepagi: beberapa tempat dalam satu trip, dengan perahu dan awaknya untuk seharian. Bilang mau yang mana dari dua itu dan berapa orang." },
      transfer: { title: "Antar-jemput perahu antar pulau", body: "Antar pulau, dan dari atau ke kapal di Waisai. Ini juga cara kamu sampai ke sini pertama kali, dan cara mencapai tempat yang tidak masuk trip perahu bersama." },
      camera: { title: "Sewa kamera", body: "Untuk tamu yang tidak membawa. Tanya apa yang ada di rumah saat memesan, nanti kami kabari mana yang kosong di tanggalmu." },
      motorbike: { title: "Sewa motor di Waisai", body: "Waisai itu tempat kapal merapat dan tempat jalannya ada. Kabari tanggal kedatanganmu, kami yang aturkan, supaya kamu tidak mencari-cari motor di pelabuhan." },
      car: { title: "Sewa mobil di Waisai", body: "Untuk rombongan, untuk barang bawaan, atau untuk sehari berkeliling Waigeo. Sama seperti motor: kabari kapan, kami aturkan." },
      merch: { title: "Merch Eddo", body: "Kaos dengan lambang homestay-nya sendiri. Tanya ukuran apa saja yang ada di rumah, nanti kami sisihkan satu untukmu." },
    },
    ask: "Tanya ketersediaan",
    askPrice: "Tanya harga",
    noPhoto: "Fotonya menyusul",
    pay: "Pesan dan bayar",
    when: "Hari apa",
    qty: "Berapa",
    spec: { duration: "Lama", level: "Level", engine: "Mesin", power: "Tenaga mesin", seats: "Muat", size: "Ukuran", includes: "Termasuk", notes: "Catatan" },
    per: { day: "per hari", night: "per malam", person: "per orang", trip: "per trip", piece: "per potong", hour: "per jam" },
  },
  stayLabel: "rumah",
  message: (v) =>
    [
      `Halo Eddo Homestay, saya mau tanya soal: ${v.activity}`,
      v.when ? `Kapan: ${v.when}` : "",
      v.people ? `Jumlah orang: ${v.people}` : "",
      v.nights ? `Lama menginap: ${v.nights} malam` : "",
      v.name ? `Nama: ${v.name}` : "",
      v.phone ? `WhatsApp: ${v.phone}` : "",
      v.email ? `Email: ${v.email}` : "",
      v.notes ? `Catatan: ${v.notes}` : "",
    ]
      .filter(Boolean)
      .join("\n"),
};

/*
 * The five languages below were written here, not checked by anyone who speaks
 * them as a first language. They are careful and they are not native. For a
 * page that takes money from strangers that distinction is worth writing down
 * rather than leaving for a guest to notice, so: if a guest ever remarks that a
 * line reads oddly, believe them over this file.
 *
 * Proper nouns are left exactly as they are, in Latin script, in all of them.
 * Yenbuba, Pulau Mansuar, Arborek, Piaynemo, Sawinggrai, Sorong, Waisai and
 * Waigeo are what a guest will read on a ferry ticket and say to a boatman, and
 * a translated place name is a place they cannot ask for.
 *
 * So are the facts: five houses, three meals, October to February for the
 * calmest water, electricity in the evening, no card machine in the village.
 * Those came from the owner and a translation is not the place to round them.
 */

const FR: EddoCopy = {
  htmlLang: "fr",
  meta: {
    title: `${EDDO.name} · Homestay à Yenbuba, Raja Ampat`,
    description:
      "Cinq maisons familiales au bord de l'eau à Yenbuba, Pulau Mansuar, Raja Ampat. Une maison rien que pour vous, trois repas par jour et du snorkeling depuis le ponton.",
  },
  nav: { home: "Accueil", rooms: "Maisons", around: "Autour de nous", services: "Nos services", why: "Pourquoi Eddo", faq: "Questions" },
  openMenu: "Ouvrir le menu",
  currencyLabel: "Afficher un prix approximatif en",
  langLabel: "Langue",
  hero: {
    title: "Un coin tranquille de Raja Ampat",
    script: "rien qu'à vous",
    sub: "Cinq maisons au bord de l'eau à Yenbuba, tenues par la famille qui y vit. Trois repas par jour, un ponton pour le snorkeling et une terrasse que vous ne partagez avec personne.",
    cta: "Voir les maisons",
    alt: "Le rivage de Yenbuba : des palmiers, une maison en bois et un bateau tiré sur le sable",
  },
  trust: [
    { title: "Paiement simple", sub: "Sans agence, sans frais de réservation. Le prix affiché est le prix." },
    { title: "Trois repas par jour inclus", sub: "Cuisinés à la maison, partagés ensemble." },
    { title: "Internet 24h/24", sub: "Disponible tous les jours de votre séjour." },
    { title: "Accueil chaleureux", sub: "Tenu par la famille qui vit ici." },
  ],
  rooms: {
    eyebrow: "Maisons & tarifs",
    title: "Cinq maisons,",
    script: "un rivage",
    intro: "Par maison, par nuit, avec trois repas. Sans frais de ménage, sans frais de service.",
    count: (n) => `${n} maisons, toutes pareilles`,
    perNight: "par nuit",
    sleeps: (n) => `Jusqu'à ${n} personnes`,
    name: "Une maison rien que pour vous",
    blurb: "Pas une chambre chez quelqu'un d'autre. Cinq maisons s'alignent le long du rivage, et l'une est à vous pour la durée de votre séjour, avec une terrasse face à l'eau et la famille à quelques pas.",
    included: {
      house: "La maison entière rien que pour vous",
      meals: "Trois repas par jour, cuisinés ici",
      deck: "Une terrasse face à l'eau",
      fan: "Ventilateur dans chaque chambre",
      internet: "Internet 24h/24",
      nofee: "Sans agence et sans frais de réservation",
    },
    photoAlt: (n, of) => `Eddo Homestay, photo ${n} sur ${of}`,
    prev: "Photo précédente",
    next: "Photo suivante",
    checkIn: "Arrivée",
    nights: "Nuits",
    nightsValue: (n) => (n === 1 ? "1 nuit" : `${n} nuits`),
    guests: "Personnes",
    guestsValue: (n) => (n === 1 ? "1 personne" : `${n} personnes`),
    yourName: "Votre nom",
    contact: "WhatsApp ou e-mail",
    total: "Total",
    pay: "Réserver et payer",
    cta: "Demander une maison",
    ctaNote: (room) => `Je voudrais des renseignements sur : ${room}.`,
    payNote: "Le paiement passe par Midtrans. Nous vérifions les dates sur le calendrier et nous vous répondons le jour même.",
    askNote: "Votre message arrive directement à la famille, sur WhatsApp ou par e-mail.",
  },
  season: {
    title: "Les meilleurs mois pour venir",
    note: "Raja Ampat est ouvert toute l'année. Voici ce que fait la mer, vue depuis notre propre ponton.",
    bands: [
      { label: "Le mieux", months: "Octobre – février", note: "Mer la plus calme, visibilité la plus claire. Les maisons se remplissent tôt." },
      { label: "Encore bien", months: "Mars – avril, août – septembre", note: "Temps variable, mais la plupart des jours sont bons sur l'eau." },
      { label: "Calme", months: "Mai – juillet", note: "Vent de sud-est, houle plus forte. Les mois les plus vides de l'année." },
    ],
  },
  around: {
    eyebrow: "Autour de nous",
    title: "Où une journée peut mener",
    all: "Demander une sortie",
    places: [
      { name: "Ponton de Yenbuba", where: "Juste devant", tag: "Snorkeling", time: "Dès la porte", alt: "Poissons sous le ponton de Yenbuba" },
      { name: "Oiseaux de paradis", where: "Sawinggrai, sur Gam", tag: "Sortie à l'aube", time: "En bateau, avant le lever du soleil", alt: "Sentier forestier derrière Sawinggrai à l'aube" },
      { name: "Arborek", where: "Île voisine", tag: "Village & ponton", time: "En bateau", alt: "Le ponton du village d'Arborek" },
      { name: "Piaynemo", where: "Îles karstiques", tag: "Point de vue", time: "Une demi-journée en bateau", alt: "Les îles karstiques de Piaynemo vues du belvédère" },
    ],
    note: "Les sorties en bateau s'organisent à la maison et se partagent entre hôtes quand cela tombe bien. Les horaires et les prix dépendent de la marée et du carburant, alors demandez au moment de réserver.",
  },
  why: {
    title: "Pourquoi séjourner chez",
    script: "Eddo ?",
    items: [
      { title: "Vous logez chez la famille", sub: "Ceux qui cuisinent et qui partent en mer avec vous sont ceux dont c'est la maison." },
      { title: "Le village est la raison de venir", sub: "Yenbuba est un vrai village, pas un complexe hôtelier. Vous mangez ce que mange le village." },
      { title: "Facile à changer", sub: "Arriver un jour plus tard ou rester un jour de plus, c'est un message, pas un formulaire." },
      { title: "La même famille que Turtle Dive", sub: "Envie de plonger ? Notre homestay jumeau tient le centre de plongée, dans ce même village." },
    ],
    cta: {
      eyebrow: "On y va",
      title: "Vos prochains jours au calme",
      body: "Dites-nous quand et combien vous êtes, nous vous dirons ce qui est libre.",
      button: "Préparer votre séjour",
      alt: "Un hôte qui lit sur la terrasse d'Eddo Homestay",
    },
  },
  faq: {
    eyebrow: "Questions",
    title: "Ce que l'on nous demande avant de venir",
    items: [
      { q: "Comment rejoindre Yenbuba ?", a: "Prenez l'avion jusqu'à Sorong, le ferry jusqu'à Waisai sur Waigeo, et nous venons vous chercher là-bas en bateau. Dites-nous l'heure de votre ferry et nous serons au port." },
      { q: "Y a-t-il de l'électricité et du réseau ?", a: "L'électricité fonctionne le soir. Le réseau téléphonique atteint le village, et il y a du Wi-Fi à la maison quand la connexion tient." },
      { q: "Peut-on faire du snorkeling depuis le homestay ?", a: "Oui, directement depuis le ponton. Palmes et masques sont à la maison ; apportez les vôtres si vous préférez qu'ils soient bien à votre taille." },
      { q: "Acceptez-vous la carte ?", a: "Espèces en roupies, ou virement bancaire avant votre arrivée. Il n'y a pas de terminal de carte dans le village." },
    ],
  },
  contact: {
    title: "Posez-nous vos questions avant de réserver",
    sub: "Nous répondons le jour même, généralement en quelques heures.",
    whatsapp: "Écrire sur WhatsApp",
    email: "Envoyer un e-mail",
  },
  footer: {
    tagline: "Un homestay familial à Yenbuba, Pulau Mansuar.",
    sister: "Notre homestay jumeau et centre de plongée, dans ce même village :",
    sisterLink: "Turtle Dive Homestay",
    rights: "Tous droits réservés.",
  },
  maintenance: {
    title: "Cette page est en travaux",
    body: "Le site reviendra de lui-même. Rien n'a changé au homestay, et nous répondons aux messages comme d'habitude.",
    whatsapp: "Écrire sur WhatsApp",
  },
  months: ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"],
  enquiry: {
    modalTitle: "Envoyez-nous un message",
    modalIntro:
      "Remplissez ce que vous voulez. Votre message part directement à la famille qui tient le homestay, et l'un de nous vous répondra. Rien n'est payé ici et il n'y a aucun compte à créer.",
    close: "Fermer",
    name: "Nom",
    namePlaceholder: "Votre nom",
    phone: "WhatsApp",
    phonePlaceholder: "+33 …",
    email: "E-mail",
    emailPlaceholder: "vous@exemple.com",
    contactNote: "Laissez-nous au moins l'un des deux, pour que nous puissions vous joindre.",
    what: "Vous cherchez",
    when: "Quand",
    people: "Personnes",
    nights: "Nuits",
    notes: "Remarques",
    notesPlaceholder: "Allergies alimentaires, horaires de ferry, niveau de plongée, tout ce que vous voulez.",
    submit: "Envoyer",
    sending: "Envoi…",
    sent: "Merci, nous avons bien votre message. Nous répondons le jour même, généralement en quelques heures.",
    needContact: "Laissez-nous un numéro WhatsApp ou un e-mail, pour que nous puissions répondre.",
    failed: "L'envoi n'a pas abouti. Réessayez, ou écrivez-nous sur WhatsApp.",
  },
  services: {
    eyebrow: "Ce que nous organisons aussi",
    title: "Venir, se déplacer,",
    script: "prendre la mer",
    intro: "L'essentiel d'un séjour à Raja Ampat n'est pas le lit. C'est le bateau, le trajet depuis le ferry, et quelqu'un qui sait où sont les poissons. La famille organise tout cela, et cela se demande comme on demande une maison.",
    cta: "Se renseigner",
    note: "Les prix affichés sont ceux qui tiennent. Là où il n'y en a pas, c'est qu'il n'y en a pas à fixer : un bateau coûte ce que coûte le carburant cette semaine-là, et une traversée prend ce que la marée permet ce jour-là, alors nous chiffrons quand vous demandez. Le bouton sert à savoir si c'est libre, pas à réserver.",
    items: {
      snorkeling: { title: "Sortie snorkeling", body: "En bateau au-delà du ponton, vers les récifs qu'on n'atteint pas à la nage. Jusqu'où vous allez dépend de la marée ce matin-là, alors dites-nous ce que vous voulez voir et nous vous dirons ce qui est raisonnable." },
      diving: { title: "Sortie plongée", body: "Tenues par Turtle Dive, notre homestay jumeau dans ce même village. Plongées avec brevet ou première fois dans l'eau, organisées d'ici sans que vous ayez à réserver deux fois." },
      excursion: { title: "Journée entière, plongée ou snorkeling", body: "Une journée sur l'eau plutôt qu'une matinée : plusieurs endroits en une seule sortie, avec le bateau et l'équipage pour la journée. Dites-nous laquelle des deux et combien vous êtes." },
      transfer: { title: "Transfert en bateau entre les îles", body: "Entre les îles, et depuis ou vers le ferry à Waisai. C'est ainsi que vous arrivez ici, et ainsi que vous atteignez les endroits qu'une sortie partagée ne couvre pas." },
      camera: { title: "Louer un appareil photo", body: "Pour les hôtes qui n'en ont pas apporté. Demandez ce qu'il y a à la maison au moment de réserver et nous vous dirons ce qui est libre à vos dates." },
      motorbike: { title: "Louer une moto à Waisai", body: "Waisai, c'est là qu'accoste le ferry et là que sont les routes. Dites-nous le jour de votre arrivée et nous nous en occupons, pour que vous ne cherchiez pas une moto sur le port." },
      car: { title: "Louer une voiture à Waisai", body: "Pour un groupe, pour les bagages, ou pour une journée à sillonner Waigeo. Comme pour la moto : dites-nous quand, et nous organisons." },
      merch: { title: "La boutique d'Eddo", body: "Des t-shirts portant la marque du homestay. Demandez quelles tailles sont à la maison et nous vous en mettrons un de côté." },
    },
    ask: "Demander s'il est libre",
    askPrice: "Demander le prix",
    noPhoto: "Photo à venir",
    pay: "Réserver et payer",
    when: "Quel jour",
    qty: "Combien",
    spec: { duration: "Durée", level: "Niveau", engine: "Moteur", power: "Cylindrée", seats: "Places", size: "Tailles", includes: "Comprend", notes: "Remarque" },
    per: { day: "par jour", night: "par nuit", person: "par personne", trip: "par sortie", piece: "pièce", hour: "par heure" },
  },
  stayLabel: "une maison",
  message: (v) =>
    [
      `Bonjour Eddo Homestay, je voudrais des renseignements sur : ${v.activity}`,
      v.when ? `Quand : ${v.when}` : "",
      v.people ? `Personnes : ${v.people}` : "",
      v.nights ? `Nuits : ${v.nights}` : "",
      v.name ? `Nom : ${v.name}` : "",
      v.phone ? `WhatsApp : ${v.phone}` : "",
      v.email ? `E-mail : ${v.email}` : "",
      v.notes ? `Remarques : ${v.notes}` : "",
    ]
      .filter(Boolean)
      .join("\n"),
};

const JA: EddoCopy = {
  htmlLang: "ja",
  meta: {
    title: `${EDDO.name} · Yenbuba, Raja Ampat のホームステイ`,
    description:
      "Raja Ampat、Pulau Mansuar の Yenbuba 海辺に建つ家族経営の 5 棟。1 棟まるごと貸切、1 日 3 食付き、桟橋からそのままシュノーケリング。",
  },
  nav: { home: "ホーム", rooms: "お部屋", around: "まわりのこと", services: "手配できること", why: "Eddo を選ぶ理由", faq: "よくある質問" },
  openMenu: "メニューを開く",
  currencyLabel: "おおよその価格を表示する通貨",
  langLabel: "言語",
  hero: {
    title: "Raja Ampat の静かな入り江",
    script: "貸切で",
    sub: "Yenbuba の海辺に 5 棟、そこに暮らす家族が守っています。1 日 3 食、シュノーケリングできる桟橋、そして誰とも分け合わないテラス。",
    cta: "お部屋を見る",
    alt: "Yenbuba の海辺。ヤシの木、木造の家、砂に引き上げられた舟",
  },
  trust: [
    { title: "支払いがかんたん", sub: "仲介なし、予約手数料なし。表示された価格がそのまま価格です。" },
    { title: "1 日 3 食付き", sub: "この家で作り、みんなで食べます。" },
    { title: "インターネット 24 時間", sub: "滞在中はいつでも使えます。" },
    { title: "心のこもったもてなし", sub: "ここに暮らす家族が迎えます。" },
  ],
  rooms: {
    eyebrow: "お部屋と料金",
    title: "5 棟の家、",
    script: "ひとつの浜",
    intro: "1 棟あたり 1 泊、3 食付き。清掃費もサービス料もかかりません。",
    count: (n) => `${n} 棟、どれも同じつくりです`,
    perNight: "1 泊あたり",
    sleeps: (n) => `${n} 名まで`,
    name: "1 棟まるごと貸切",
    blurb: "誰かの家の一室ではありません。浜沿いに 5 棟が並び、滞在中はそのうちの 1 棟があなたのものになります。海に面したテラスがあり、家族の家は歩いてすぐです。",
    included: {
      house: "1 棟まるごと貸切",
      meals: "1 日 3 食、ここで手作り",
      deck: "海に面したテラス",
      fan: "各部屋に扇風機",
      internet: "インターネット 24 時間",
      nofee: "仲介なし、予約手数料なし",
    },
    photoAlt: (n, of) => `Eddo Homestay、写真 ${of} 枚中 ${n} 枚目`,
    prev: "前の写真",
    next: "次の写真",
    checkIn: "チェックイン",
    nights: "泊数",
    nightsValue: (n) => `${n} 泊`,
    guests: "人数",
    guestsValue: (n) => `${n} 名`,
    yourName: "お名前",
    contact: "WhatsApp またはメール",
    total: "合計",
    pay: "予約して支払う",
    cta: "空きを問い合わせる",
    ctaNote: (room) => `${room} について伺いたいです。`,
    payNote: "お支払いは Midtrans を通します。カレンダーで日程を確認し、その日のうちにご連絡します。",
    askNote: "メッセージは WhatsApp かメールで、family に直接届きます。",
  },
  season: {
    title: "来るのに良い時期",
    note: "Raja Ampat は一年中開いています。これは私たちの桟橋から見た海の様子です。",
    bands: [
      { label: "最適", months: "10月 – 2月", note: "海がいちばん穏やかで、透明度も最高。お部屋は早く埋まります。" },
      { label: "まずまず", months: "3月 – 4月、8月 – 9月", note: "天気は変わりやすいものの、海に出られる日がほとんどです。" },
      { label: "静か", months: "5月 – 7月", note: "南東の風が吹き、うねりが大きくなります。一年でいちばん人の少ない時期です。" },
    ],
  },
  around: {
    eyebrow: "まわりのこと",
    title: "一日をどこまで運べるか",
    all: "ボートの相談をする",
    places: [
      { name: "Yenbuba の桟橋", where: "すぐ目の前", tag: "シュノーケリング", time: "玄関から", alt: "Yenbuba の桟橋の下を泳ぐ魚" },
      { name: "極楽鳥", where: "Gam 島の Sawinggrai", tag: "夜明けの舟", time: "日の出前、舟で", alt: "夜明けの Sawinggrai 裏手の森の小道" },
      { name: "Arborek", where: "となりの島", tag: "村と桟橋", time: "舟で", alt: "Arborek 村の桟橋" },
      { name: "Piaynemo", where: "カルストの島々", tag: "展望台", time: "舟で半日", alt: "展望台から見た Piaynemo のカルストの島々" },
    ],
    note: "ボートはこの家で手配し、都合が合えばほかのお客さまと分け合います。時間も料金も潮と燃料しだいなので、ご予約のときにお尋ねください。",
  },
  why: {
    title: "なぜ",
    script: "Eddo に泊まるのか",
    items: [
      { title: "家族と一緒に過ごします", sub: "料理を作り、一緒に漕ぎ出す人が、この家の持ち主です。" },
      { title: "村そのものが目的です", sub: "Yenbuba はリゾートではなく、本物の村です。村が食べるものを、あなたも食べます。" },
      { title: "変更がかんたん", sub: "到着が一日遅れても、一日延ばしても、必要なのは一通のメッセージで、書類ではありません。" },
      { title: "Turtle Dive と同じ家族", sub: "ダイビングをご希望ですか。同じ村で、姉妹のホームステイがダイブセンターを営んでいます。" },
    ],
    cta: {
      eyebrow: "さあ",
      title: "次の静かな数日を",
      body: "いつ、何名かをお知らせください。空いているお部屋をお伝えします。",
      button: "滞在を相談する",
      alt: "Eddo Homestay のテラスで本を読むお客さま",
    },
  },
  faq: {
    eyebrow: "よくある質問",
    title: "来る前によく聞かれること",
    items: [
      { q: "Yenbuba へはどう行きますか。", a: "Sorong まで飛行機、そこから Waigeo 島の Waisai までフェリー、あとは私たちが舟でお迎えに上がります。フェリーの時間をお知らせいただければ港でお待ちしています。" },
      { q: "電気と電波はありますか。", a: "電気は夜のあいだ通ります。携帯の電波は村まで届いていて、回線が保っていれば家で Wi-Fi も使えます。" },
      { q: "ホームステイからシュノーケリングできますか。", a: "できます、桟橋からそのまま。フィンとマスクは家にありますが、顔に合うものをお使いになりたければご持参ください。" },
      { q: "カードは使えますか。", a: "ルピアの現金か、到着前の銀行振込でお願いします。村にカードの機械はありません。" },
    ],
  },
  contact: {
    title: "予約の前に何でもお尋ねください",
    sub: "その日のうちに、たいていは数時間以内にお返事します。",
    whatsapp: "WhatsApp で送る",
    email: "メールを送る",
  },
  footer: {
    tagline: "Yenbuba、Pulau Mansuar の家族経営のホームステイ。",
    sister: "同じ村にある姉妹のホームステイとダイブセンター:",
    sisterLink: "Turtle Dive Homestay",
    rights: "無断転載を禁じます。",
  },
  maintenance: {
    title: "このページは作業中です",
    body: "サイトはひとりでに戻ります。ホームステイのほうは何も変わっておらず、メッセージにはいつもどおりお返事しています。",
    whatsapp: "WhatsApp で送る",
  },
  months: ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"],
  enquiry: {
    modalTitle: "メッセージを送る",
    modalIntro:
      "書ける範囲でかまいません。メッセージはホームステイを営む家族に直接届き、私たちの誰かがお返事します。ここで支払いは発生せず、アカウントを作る必要もありません。",
    close: "閉じる",
    name: "お名前",
    namePlaceholder: "お名前",
    phone: "WhatsApp",
    phonePlaceholder: "+81 …",
    email: "メール",
    emailPlaceholder: "you@example.com",
    contactNote: "どちらか一方はご記入ください。お返事の宛先になります。",
    what: "ご希望",
    when: "時期",
    people: "人数",
    nights: "泊数",
    notes: "ご要望",
    notesPlaceholder: "食物アレルギー、フェリーの時間、ダイビングの資格など、何でも。",
    submit: "送信",
    sending: "送信中…",
    sent: "ありがとうございます、メッセージを受け取りました。その日のうちに、たいていは数時間以内にお返事します。",
    needContact: "お返事できるよう、WhatsApp の番号かメールをご記入ください。",
    failed: "送信できませんでした。もう一度お試しいただくか、WhatsApp からご連絡ください。",
  },
  services: {
    eyebrow: "宿泊のほかに手配できること",
    title: "たどり着く、動きまわる、",
    script: "海に出る",
    intro: "Raja Ampat の滞在で手のかかるところは、寝る場所ではありません。舟、フェリーからの足、そして魚がどこにいるかを知っている人です。そのすべてを家族が手配します。頼み方は、お部屋を頼むときと同じです。",
    cta: "これについて聞く",
    note: "表示している料金はそのまま通る料金です。書いていないものは、決めようがないからです。舟代はその週の燃料しだい、渡る時間はその日の潮しだいなので、あとで取り消す数字を並べるよりお尋ねいただいたときにお見積りします。ボタンは空きを尋ねるためのもので、予約ではありません。",
    items: {
      snorkeling: { title: "シュノーケリングの舟", body: "桟橋の先まで舟で出て、泳いでは届かない珊瑚まで。どこまで行けるかはその朝の潮しだいなので、見たいものをお聞かせください。無理のない範囲をお伝えします。" },
      diving: { title: "ダイビングの舟", body: "同じ村にある姉妹のホームステイ、Turtle Dive が担当します。ライセンスをお持ちの方も、はじめて水に入る方も、二重に予約する必要なくここから手配します。" },
      excursion: { title: "一日がかりの舟、ダイビングかシュノーケリング", body: "半日ではなく一日を海で。一度の舟で何か所かをまわり、舟と船頭はその日ずっとご一緒します。どちらになさるかと、何名さまかをお聞かせください。" },
      transfer: { title: "島から島への船の送迎", body: "島のあいだと、Waisai のフェリー乗り場との行き来。そもそもここへ着くための足であり、乗合の舟では行かない場所へ届く足でもあります。" },
      camera: { title: "カメラを借りる", body: "持ってこられなかったお客さまへ。ご予約のときに家にあるものをお尋ねください。ご滞在の日程で空いているものをお伝えします。" },
      motorbike: { title: "Waisai でバイクを借りる", body: "Waisai はフェリーが着く町で、道があるのもここです。到着日をお知らせいただければ手配しますので、港でバイクを探し回らずにすみます。" },
      car: { title: "Waisai で車を借りる", body: "人数が多いとき、荷物が多いとき、あるいは一日 Waigeo を走ってみたいときに。バイクと同じで、いつかをお知らせいただければ手配します。" },
      merch: { title: "Eddo のグッズ", body: "ホームステイの印が入った T シャツです。どのサイズが家にあるかお尋ねください。お取り置きします。" },
    },
    ask: "空きを聞く",
    askPrice: "料金を聞く",
    noPhoto: "写真は準備中です",
    pay: "予約して支払う",
    when: "いつ",
    qty: "いくつ",
    spec: { duration: "所要", level: "レベル", engine: "エンジン", power: "排気量", seats: "定員", size: "サイズ", includes: "含まれるもの", notes: "備考" },
    per: { day: "1 日あたり", night: "1 泊あたり", person: "1 名あたり", trip: "1 回あたり", piece: "1 点あたり", hour: "1 時間あたり" },
  },
  stayLabel: "宿泊",
  message: (v) =>
    [
      `Eddo Homestay さま、下記について伺いたいです。
${v.activity}`,
      v.when ? `時期: ${v.when}` : "",
      v.people ? `人数: ${v.people}` : "",
      v.nights ? `泊数: ${v.nights}` : "",
      v.name ? `お名前: ${v.name}` : "",
      v.phone ? `WhatsApp: ${v.phone}` : "",
      v.email ? `メール: ${v.email}` : "",
      v.notes ? `ご要望: ${v.notes}` : "",
    ]
      .filter(Boolean)
      .join("\n"),
};

const DE: EddoCopy = {
  htmlLang: "de",
  meta: {
    title: `${EDDO.name} · Homestay in Yenbuba, Raja Ampat`,
    description:
      "Fünf Familienhäuser am Ufer von Yenbuba, Pulau Mansuar, Raja Ampat. Ein Haus für euch allein, drei Mahlzeiten am Tag und Schnorcheln direkt vom Steg.",
  },
  nav: { home: "Start", rooms: "Häuser", around: "Um uns herum", services: "Was wir organisieren", why: "Warum Eddo", faq: "Fragen" },
  openMenu: "Menü öffnen",
  currencyLabel: "Ungefähren Preis anzeigen in",
  langLabel: "Sprache",
  hero: {
    title: "Ein stiller Winkel von Raja Ampat",
    script: "ganz für euch",
    sub: "Fünf Häuser am Ufer von Yenbuba, geführt von der Familie, die hier lebt. Drei Mahlzeiten am Tag, ein Steg zum Schnorcheln und eine Terrasse, die ihr mit niemandem teilt.",
    cta: "Häuser ansehen",
    alt: "Das Ufer von Yenbuba: Palmen, ein Holzhaus und ein auf den Sand gezogenes Boot",
  },
  trust: [
    { title: "Einfach bezahlen", sub: "Keine Agentur, keine Buchungsgebühr. Der Preis, den ihr seht, ist der Preis." },
    { title: "Drei Mahlzeiten am Tag inklusive", sub: "Im Haus gekocht, gemeinsam gegessen." },
    { title: "Internet rund um die Uhr", sub: "Jeden Tag eures Aufenthalts verfügbar." },
    { title: "Herzlich empfangen", sub: "Geführt von der Familie, die hier lebt." },
  ],
  rooms: {
    eyebrow: "Häuser & Preise",
    title: "Fünf Häuser,",
    script: "ein Ufer",
    intro: "Pro Haus, pro Nacht, mit drei Mahlzeiten. Keine Reinigungsgebühr, keine Servicegebühr.",
    count: (n) => `${n} Häuser, alle gleich`,
    perNight: "pro Nacht",
    sleeps: (n) => `Platz für ${n}`,
    name: "Ein Haus für euch allein",
    blurb: "Kein Zimmer im Haus von jemand anderem. Fünf stehen am Ufer nebeneinander, und eines gehört euch für die Nächte, die ihr bleibt, mit einer Terrasse zum Wasser und der Familie ein paar Schritte entfernt.",
    included: {
      house: "Das ganze Haus für euch allein",
      meals: "Drei Mahlzeiten am Tag, hier gekocht",
      deck: "Eine Terrasse zum Wasser",
      fan: "Ventilator in jedem Zimmer",
      internet: "Internet rund um die Uhr",
      nofee: "Keine Agentur und keine Buchungsgebühr",
    },
    photoAlt: (n, of) => `Eddo Homestay, Foto ${n} von ${of}`,
    prev: "Vorheriges Foto",
    next: "Nächstes Foto",
    checkIn: "Anreise",
    nights: "Nächte",
    nightsValue: (n) => (n === 1 ? "1 Nacht" : `${n} Nächte`),
    guests: "Gäste",
    guestsValue: (n) => (n === 1 ? "1 Gast" : `${n} Gäste`),
    yourName: "Euer Name",
    contact: "WhatsApp oder E-Mail",
    total: "Gesamt",
    pay: "Buchen und bezahlen",
    cta: "Nach einem Haus fragen",
    ctaNote: (room) => `Ich möchte gern nach ${room} fragen.`,
    payNote: "Die Zahlung läuft über Midtrans. Wir prüfen die Daten im Kalender und melden uns noch am selben Tag.",
    askNote: "Eure Nachricht erreicht die Familie direkt, über WhatsApp oder E-Mail.",
  },
  season: {
    title: "Die besten Monate für einen Besuch",
    note: "Raja Ampat ist das ganze Jahr über offen. So verhält sich das Wasser, von unserem eigenen Steg aus gesehen.",
    bands: [
      { label: "Am besten", months: "Oktober – Februar", note: "Ruhigstes Wasser, klarste Sicht. Die Häuser sind früh belegt." },
      { label: "Immer noch gut", months: "März – April, August – September", note: "Wechselhaftes Wetter, aber die meisten Tage sind gut auf dem Wasser." },
      { label: "Ruhig", months: "Mai – Juli", note: "Südostwind, höhere Dünung. Die leersten Monate des Jahres." },
    ],
  },
  around: {
    eyebrow: "Um uns herum",
    title: "Wohin ein Tag führen kann",
    all: "Nach einer Bootsfahrt fragen",
    places: [
      { name: "Steg von Yenbuba", where: "Direkt hier", tag: "Schnorcheln", time: "Von der Tür aus", alt: "Fische unter dem Steg von Yenbuba" },
      { name: "Paradiesvögel", where: "Sawinggrai, auf Gam", tag: "Fahrt im Morgengrauen", time: "Mit dem Boot, vor Sonnenaufgang", alt: "Waldpfad hinter Sawinggrai im Morgengrauen" },
      { name: "Arborek", where: "Nachbarinsel", tag: "Dorf & Steg", time: "Mit dem Boot", alt: "Der Steg des Dorfes Arborek" },
      { name: "Piaynemo", where: "Karstinseln", tag: "Aussichtspunkt", time: "Ein halber Tag mit dem Boot", alt: "Die Karstinseln von Piaynemo vom Aussichtspunkt aus" },
    ],
    note: "Bootsfahrten werden im Haus organisiert und unter den Gästen geteilt, wenn es sich ergibt. Zeiten und Preise hängen von Gezeiten und Treibstoff ab, fragt also bei der Buchung nach.",
  },
  why: {
    title: "Warum bei",
    script: "Eddo bleiben?",
    items: [
      { title: "Ihr wohnt bei der Familie", sub: "Die Menschen, die kochen und mit euch hinausfahren, sind die, denen dieses Haus gehört." },
      { title: "Das Dorf ist der Grund", sub: "Yenbuba ist ein echtes Dorf, kein Resort. Ihr esst, was das Dorf isst." },
      { title: "Leicht zu ändern", sub: "Einen Tag später ankommen oder einen Tag länger bleiben ist eine Nachricht, kein Formular." },
      { title: "Dieselbe Familie wie Turtle Dive", sub: "Lust zu tauchen? Unser Schwester-Homestay führt die Tauchbasis, im selben Dorf." },
    ],
    cta: {
      eyebrow: "Los geht's",
      title: "Eure nächsten stillen Tage",
      body: "Sagt uns wann und wie viele, und wir sagen euch, was frei ist.",
      button: "Aufenthalt planen",
      alt: "Ein Gast liest auf der Terrasse des Eddo Homestay",
    },
  },
  faq: {
    eyebrow: "Fragen",
    title: "Was Gäste vor der Anreise fragen",
    items: [
      { q: "Wie kommen wir nach Yenbuba?", a: "Fliegt nach Sorong, nehmt die Fähre nach Waisai auf Waigeo, und wir holen euch dort mit dem Boot ab. Sagt uns eure Fährzeit, dann sind wir am Hafen." },
      { q: "Gibt es Strom und Empfang?", a: "Strom läuft am Abend. Das Mobilfunknetz reicht bis ins Dorf, und im Haus gibt es WLAN, solange die Verbindung hält." },
      { q: "Können wir vom Homestay aus schnorcheln?", a: "Ja, direkt vom Steg. Flossen und Masken liegen im Haus; bringt eure eigenen mit, wenn ihr eine gute Passform bevorzugt." },
      { q: "Nehmt ihr Karte?", a: "Bargeld in Rupiah oder eine Überweisung vor der Anreise. Im Dorf gibt es kein Kartenlesegerät." },
    ],
  },
  contact: {
    title: "Fragt uns alles, bevor ihr bucht",
    sub: "Wir antworten noch am selben Tag, meist innerhalb weniger Stunden.",
    whatsapp: "Über WhatsApp schreiben",
    email: "E-Mail senden",
  },
  footer: {
    tagline: "Ein Familien-Homestay in Yenbuba, Pulau Mansuar.",
    sister: "Unser Schwester-Homestay und unsere Tauchbasis, im selben Dorf:",
    sisterLink: "Turtle Dive Homestay",
    rights: "Alle Rechte vorbehalten.",
  },
  maintenance: {
    title: "Wir arbeiten an dieser Seite",
    body: "Die Seite kommt von allein zurück. Am Homestay hat sich nichts geändert, und wir beantworten Nachrichten wie gewohnt.",
    whatsapp: "Über WhatsApp schreiben",
  },
  months: ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"],
  enquiry: {
    modalTitle: "Schreibt uns eine Nachricht",
    modalIntro:
      "Füllt aus, so viel ihr mögt. Eure Nachricht geht direkt an die Familie, die das Homestay führt, und eine oder einer von uns schreibt zurück. Hier wird nichts bezahlt und es muss kein Konto angelegt werden.",
    close: "Schließen",
    name: "Name",
    namePlaceholder: "Euer Name",
    phone: "WhatsApp",
    phonePlaceholder: "+49 …",
    email: "E-Mail",
    emailPlaceholder: "du@beispiel.de",
    contactNote: "Lasst uns wenigstens eines von beiden da, damit wir euch erreichen können.",
    what: "Gesucht wird",
    when: "Wann",
    people: "Personen",
    nights: "Nächte",
    notes: "Anmerkungen",
    notesPlaceholder: "Lebensmittelallergien, Fährzeiten, Tauchbrevet, einfach alles.",
    submit: "Senden",
    sending: "Wird gesendet…",
    sent: "Danke, eure Nachricht ist bei uns. Wir antworten noch am selben Tag, meist innerhalb weniger Stunden.",
    needContact: "Bitte hinterlasst eine WhatsApp-Nummer oder eine E-Mail, damit wir antworten können.",
    failed: "Das ist nicht durchgegangen. Versucht es bitte noch einmal, oder schreibt uns über WhatsApp.",
  },
  services: {
    eyebrow: "Was wir sonst noch organisieren",
    title: "Herkommen, herumkommen,",
    script: "aufs Wasser kommen",
    intro: "Das meiste an einem Aufenthalt in Raja Ampat ist nicht das Bett. Es ist das Boot, die Fahrt von der Fähre und jemand, der weiß, wo die Fische sind. Das alles organisiert die Familie, und man fragt danach wie nach einem Haus.",
    cta: "Danach fragen",
    note: "Die angegebenen Preise sind die, die gelten. Wo keiner steht, gibt es keinen festzulegen: ein Boot kostet, was der Treibstoff in jener Woche kostet, und eine Überfahrt dauert, was die Gezeiten an jenem Tag zulassen. Wir nennen den Preis, wenn ihr fragt. Der Knopf fragt nach, ob es frei ist, und bucht nicht.",
    items: {
      snorkeling: { title: "Schnorcheltour", body: "Mit dem Boot über den Steg hinaus, zu den Riffen, die man schwimmend nicht erreicht. Wie weit ihr kommt, entscheidet die Tide an jenem Morgen, also sagt uns, was ihr sehen wollt, und wir sagen, was sinnvoll ist." },
      diving: { title: "Tauchtour", body: "Geführt von Turtle Dive, unserem Schwester-Homestay im selben Dorf. Tauchgänge mit Brevet oder das erste Mal im Wasser, von hier aus organisiert, ohne dass ihr zweimal buchen müsst." },
      excursion: { title: "Ganzer Tag, tauchen oder schnorcheln", body: "Ein Tag auf dem Wasser statt eines Vormittags: mehrere Stellen in einer Fahrt, mit dem Boot und der Crew für den ganzen Tag. Sagt uns, welches von beiden, und wie viele ihr seid." },
      transfer: { title: "Bootstransfer zwischen den Inseln", body: "Zwischen den Inseln und von oder zur Fähre in Waisai. So kommt ihr überhaupt erst her, und so erreicht ihr die Orte, die eine geteilte Bootsfahrt nicht abdeckt." },
      camera: { title: "Eine Kamera mieten", body: "Für Gäste, die keine mitgebracht haben. Fragt bei der Buchung, was im Haus ist, dann sagen wir euch, was an euren Tagen frei ist." },
      motorbike: { title: "Ein Motorrad mieten in Waisai", body: "In Waisai legt die Fähre an, und dort sind die Straßen. Sagt uns euren Ankunftstag, dann organisieren wir eines, und ihr sucht nicht am Hafen nach einem Motorrad." },
      car: { title: "Ein Auto mieten in Waisai", body: "Für eine Gruppe, für Gepäck, oder für einen Tag Fahren über Waigeo. Wie beim Motorrad: sagt uns wann, wir kümmern uns." },
      merch: { title: "Eddos Merch", body: "Shirts mit dem eigenen Zeichen des Homestay. Fragt, welche Größen im Haus sind, und wir legen euch eines zurück." },
    },
    ask: "Nach Verfügbarkeit fragen",
    askPrice: "Nach dem Preis fragen",
    noPhoto: "Foto folgt noch",
    pay: "Buchen und bezahlen",
    when: "An welchem Tag",
    qty: "Wie viele",
    spec: { duration: "Dauer", level: "Stufe", engine: "Motor", power: "Hubraum", seats: "Plätze", size: "Größen", includes: "Enthält", notes: "Hinweis" },
    per: { day: "pro Tag", night: "pro Nacht", person: "pro Person", trip: "pro Fahrt", piece: "pro Stück", hour: "pro Stunde" },
  },
  stayLabel: "ein Haus",
  message: (v) =>
    [
      `Hallo Eddo Homestay, ich möchte gern fragen nach: ${v.activity}`,
      v.when ? `Wann: ${v.when}` : "",
      v.people ? `Personen: ${v.people}` : "",
      v.nights ? `Nächte: ${v.nights}` : "",
      v.name ? `Name: ${v.name}` : "",
      v.phone ? `WhatsApp: ${v.phone}` : "",
      v.email ? `E-Mail: ${v.email}` : "",
      v.notes ? `Anmerkungen: ${v.notes}` : "",
    ]
      .filter(Boolean)
      .join("\n"),
};

const RU: EddoCopy = {
  htmlLang: "ru",
  meta: {
    title: `${EDDO.name} · Гостевой дом в Yenbuba, Raja Ampat`,
    description:
      "Пять семейных домов на берегу в Yenbuba, Pulau Mansuar, Raja Ampat. Отдельный дом только для вас, трёхразовое питание и снорклинг прямо с причала.",
  },
  nav: { home: "Главная", rooms: "Дома", around: "Вокруг нас", services: "Что мы устраиваем", why: "Почему Eddo", faq: "Вопросы" },
  openMenu: "Открыть меню",
  currencyLabel: "Показать примерную цену в",
  langLabel: "Язык",
  hero: {
    title: "Тихий уголок Raja Ampat",
    script: "только ваш",
    sub: "Пять домов на берегу в Yenbuba, которые держит живущая здесь семья. Трёхразовое питание, причал для снорклинга и терраса, которую вы ни с кем не делите.",
    cta: "Посмотреть дома",
    alt: "Берег Yenbuba: пальмы, деревянный дом и вытащенная на песок лодка",
  },
  trust: [
    { title: "Простая оплата", sub: "Без посредников и сборов за бронирование. Цена, которую вы видите, и есть цена." },
    { title: "Трёхразовое питание включено", sub: "Готовим в доме, едим вместе." },
    { title: "Интернет круглосуточно", sub: "Доступен каждый день вашего пребывания." },
    { title: "Тёплый приём", sub: "Дом держит живущая здесь семья." },
  ],
  rooms: {
    eyebrow: "Дома и цены",
    title: "Пять домов,",
    script: "один берег",
    intro: "За дом, за ночь, с трёхразовым питанием. Без платы за уборку и без сервисного сбора.",
    count: (n) => `${n} домов, все одинаковые`,
    perNight: "за ночь",
    sleeps: (n) => `До ${n} человек`,
    name: "Отдельный дом только для вас",
    blurb: "Не комната в чужом доме. Пять домов стоят вдоль берега, и один из них ваш на все ночи, что вы здесь, с террасой к воде и семьёй в нескольких шагах.",
    included: {
      house: "Весь дом только для вас",
      meals: "Трёхразовое питание, готовим здесь",
      deck: "Терраса с видом на воду",
      fan: "Вентилятор в каждой комнате",
      internet: "Интернет круглосуточно",
      nofee: "Без посредников и без сбора за бронирование",
    },
    photoAlt: (n, of) => `Eddo Homestay, фотография ${n} из ${of}`,
    prev: "Предыдущее фото",
    next: "Следующее фото",
    checkIn: "Заезд",
    nights: "Ночей",
    nightsValue: (n) => `${n} ноч${n === 1 ? "ь" : n < 5 ? "и" : "ей"}`,
    guests: "Гостей",
    guestsValue: (n) => `${n} гост${n === 1 ? "ь" : n < 5 ? "я" : "ей"}`,
    yourName: "Ваше имя",
    contact: "WhatsApp или почта",
    total: "Итого",
    pay: "Забронировать и оплатить",
    cta: "Спросить про дом",
    ctaNote: (room) => `Хочу спросить про: ${room}.`,
    payNote: "Оплата проходит через Midtrans. Мы сверим даты по календарю и напишем вам в тот же день.",
    askNote: "Ваше сообщение попадает напрямую к семье, в WhatsApp или на почту.",
  },
  season: {
    title: "Лучшие месяцы для приезда",
    note: "Raja Ampat открыт круглый год. Вот что делает вода, если смотреть с нашего собственного причала.",
    bands: [
      { label: "Лучше всего", months: "Октябрь – февраль", note: "Самая спокойная вода и самая чистая видимость. Дома разбирают заранее." },
      { label: "Тоже хорошо", months: "Март – апрель, август – сентябрь", note: "Погода переменчивая, но в большинство дней на воде хорошо." },
      { label: "Тихо", months: "Май – июль", note: "Юго-восточный ветер, волна крупнее. Самые безлюдные месяцы в году." },
    ],
  },
  around: {
    eyebrow: "Вокруг нас",
    title: "Куда может увести день",
    all: "Спросить про поездку",
    places: [
      { name: "Причал Yenbuba", where: "Прямо здесь", tag: "Снорклинг", time: "От порога", alt: "Рыбы под причалом в Yenbuba" },
      { name: "Райские птицы", where: "Sawinggrai, на острове Gam", tag: "Поездка на рассвете", time: "На лодке, до восхода", alt: "Лесная тропа за Sawinggrai на рассвете" },
      { name: "Arborek", where: "Соседний остров", tag: "Деревня и причал", time: "На лодке", alt: "Причал деревни Arborek" },
      { name: "Piaynemo", where: "Карстовые острова", tag: "Смотровая площадка", time: "Полдня на лодке", alt: "Карстовые острова Piaynemo со смотровой площадки" },
    ],
    note: "Поездки на лодке организуются прямо в доме и делятся между гостями, когда так выходит. Время и цена зависят от прилива и топлива, поэтому спрашивайте при бронировании.",
  },
  why: {
    title: "Почему стоит остановиться в",
    script: "Eddo?",
    items: [
      { title: "Вы живёте вместе с семьёй", sub: "Те, кто готовит и выходит с вами в море, — это те, чей это дом." },
      { title: "Смысл поездки — сама деревня", sub: "Yenbuba настоящая деревня, а не курорт. Вы едите то же, что ест деревня." },
      { title: "Легко поменять", sub: "Приехать на день позже или остаться на день дольше — это сообщение, а не анкета." },
      { title: "Та же семья, что и Turtle Dive", sub: "Хотите понырять? Наш соседний гостевой дом держит дайв-центр, в этой же деревне." },
    ],
    cta: {
      eyebrow: "Поехали",
      title: "Ваши следующие тихие дни",
      body: "Напишите, когда и сколько вас, а мы скажем, что свободно.",
      button: "Спланировать поездку",
      alt: "Гость читает на террасе Eddo Homestay",
    },
  },
  faq: {
    eyebrow: "Вопросы",
    title: "О чём спрашивают перед приездом",
    items: [
      { q: "Как добраться до Yenbuba?", a: "Самолётом до Sorong, паромом до Waisai на острове Waigeo, а оттуда мы забираем вас на лодке. Напишите время парома, и мы будем в порту." },
      { q: "Есть ли электричество и связь?", a: "Электричество работает по вечерам. Мобильная связь до деревни доходит, а в доме есть Wi-Fi, пока держится соединение." },
      { q: "Можно ли снорклить прямо от дома?", a: "Да, прямо с причала. Ласты и маски есть в доме; берите свои, если хотите, чтобы сидело по размеру." },
      { q: "Принимаете карту?", a: "Наличные в рупиях или банковский перевод до приезда. Терминала для карт в деревне нет." },
    ],
  },
  contact: {
    title: "Спрашивайте о чём угодно до бронирования",
    sub: "Отвечаем в тот же день, обычно за несколько часов.",
    whatsapp: "Написать в WhatsApp",
    email: "Отправить письмо",
  },
  footer: {
    tagline: "Семейный гостевой дом в Yenbuba, Pulau Mansuar.",
    sister: "Наш соседний гостевой дом и дайв-центр, в этой же деревне:",
    sisterLink: "Turtle Dive Homestay",
    rights: "Все права защищены.",
  },
  maintenance: {
    title: "Мы работаем над этой страницей",
    body: "Сайт вернётся сам. В самом гостевом доме ничего не изменилось, и на сообщения мы отвечаем как обычно.",
    whatsapp: "Написать в WhatsApp",
  },
  months: ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"],
  enquiry: {
    modalTitle: "Напишите нам",
    modalIntro:
      "Заполняйте столько, сколько захотите. Сообщение уходит напрямую семье, которая держит гостевой дом, и кто-нибудь из нас ответит. Здесь ничего не оплачивается и не нужно заводить аккаунт.",
    close: "Закрыть",
    name: "Имя",
    namePlaceholder: "Ваше имя",
    phone: "WhatsApp",
    phonePlaceholder: "+7 …",
    email: "Почта",
    emailPlaceholder: "vy@primer.ru",
    contactNote: "Оставьте хотя бы одно, чтобы мы могли ответить.",
    what: "Что интересует",
    when: "Когда",
    people: "Человек",
    nights: "Ночей",
    notes: "Примечания",
    notesPlaceholder: "Аллергия на еду, время парома, дайверский сертификат, что угодно.",
    submit: "Отправить",
    sending: "Отправляем…",
    sent: "Спасибо, сообщение у нас. Отвечаем в тот же день, обычно за несколько часов.",
    needContact: "Оставьте, пожалуйста, номер WhatsApp или почту, чтобы мы могли ответить.",
    failed: "Отправить не удалось. Попробуйте ещё раз или напишите нам в WhatsApp.",
  },
  services: {
    eyebrow: "Что мы ещё устраиваем",
    title: "Добраться, передвигаться,",
    script: "выйти на воду",
    intro: "Основное в поездке на Raja Ampat — не кровать. Это лодка, дорога от парома и человек, который знает, где рыба. Всё это устраивает семья, и просить об этом можно так же, как просить дом.",
    cta: "Спросить об этом",
    note: "Указанные цены — те, что держатся. Где цены нет, её и нельзя закрепить: лодка стоит столько, сколько на той неделе стоит топливо, а переход занимает столько, сколько позволит прилив в тот день. Мы называем цену, когда вы спрашиваете. Кнопка спрашивает о наличии, а не бронирует.",
    items: {
      snorkeling: { title: "Выход на снорклинг", body: "На лодке дальше причала, к рифам, до которых вплавь не добраться. Насколько далеко, решает прилив тем утром, так что напишите, что хотите увидеть, и мы скажем, что разумно." },
      diving: { title: "Выход на дайвинг", body: "Их ведёт Turtle Dive, наш соседний гостевой дом в этой же деревне. Погружения по сертификату или первый раз в воде, устраиваются отсюда, и бронировать дважды не нужно." },
      excursion: { title: "Целый день, дайвинг или снорклинг", body: "День на воде, а не утро: несколько мест за один выход, с лодкой и командой на весь день. Напишите, что из двух и сколько вас." },
      transfer: { title: "Переезд на лодке между островами", body: "Между островами и до парома в Waisai или от него. Именно так вы сюда и попадаете, и так добираетесь туда, куда общая лодка не идёт." },
      camera: { title: "Взять камеру", body: "Для гостей, которые не взяли свою. Спросите при бронировании, что есть в доме, и мы скажем, что свободно на ваши даты." },
      motorbike: { title: "Взять мотоцикл в Waisai", body: "Waisai — это там, где причаливает паром и где есть дороги. Напишите день приезда, и мы всё устроим, чтобы вам не искать мотоцикл в порту." },
      car: { title: "Взять машину в Waisai", body: "Для компании, для багажа или на день езды по Waigeo. Как и с мотоциклом: напишите когда, а мы устроим." },
      merch: { title: "Мерч Eddo", body: "Футболки со знаком самого гостевого дома. Спросите, какие размеры есть в доме, и мы отложим вам одну." },
    },
    ask: "Спросить о наличии",
    askPrice: "Спросить цену",
    noPhoto: "Фотография будет позже",
    pay: "Забронировать и оплатить",
    when: "В какой день",
    qty: "Сколько",
    spec: { duration: "Занимает", level: "Уровень", engine: "Двигатель", power: "Объём", seats: "Мест", size: "Размеры", includes: "Входит", notes: "Примечание" },
    per: { day: "за день", night: "за ночь", person: "с человека", trip: "за поездку", piece: "за штуку", hour: "за час" },
  },
  stayLabel: "Дом",
  message: (v) =>
    [
      `Здравствуйте, Eddo Homestay, хочу спросить про: ${v.activity}`,
      v.when ? `Когда: ${v.when}` : "",
      v.people ? `Человек: ${v.people}` : "",
      v.nights ? `Ночей: ${v.nights}` : "",
      v.name ? `Имя: ${v.name}` : "",
      v.phone ? `WhatsApp: ${v.phone}` : "",
      v.email ? `Почта: ${v.email}` : "",
      v.notes ? `Примечания: ${v.notes}` : "",
    ]
      .filter(Boolean)
      .join("\n"),
};

const ZH: EddoCopy = {
  htmlLang: "zh-Hans",
  meta: {
    title: `${EDDO.name} · Yenbuba, Raja Ampat 的民宿`,
    description:
      "Raja Ampat, Pulau Mansuar 的 Yenbuba 海边五栋家庭民宿。整栋独享，一日三餐，从自家栈桥下水浮潜。",
  },
  nav: { home: "首页", rooms: "房子", around: "周边", services: "我们能安排的", why: "为什么选 Eddo", faq: "常见问题" },
  openMenu: "打开菜单",
  currencyLabel: "以此货币显示大致价格",
  langLabel: "语言",
  hero: {
    title: "Raja Ampat 的安静一角",
    script: "整栋独享",
    sub: "Yenbuba 海边的五栋房子，由住在这里的一家人打理。一日三餐、可以下水浮潜的栈桥，还有一个不与人共用的露台。",
    cta: "看看房子",
    alt: "Yenbuba 的海边：椰子树、木屋，以及拖上沙滩的小船",
  },
  trust: [
    { title: "付款省心", sub: "没有中介，没有预订费。看到的价格就是价格。" },
    { title: "含一日三餐", sub: "在屋里做，大家一起吃。" },
    { title: "全天候上网", sub: "入住期间随时都能用。" },
    { title: "待客亲切", sub: "由住在这里的一家人照料。" },
  ],
  rooms: {
    eyebrow: "房子与价格",
    title: "五栋房子，",
    script: "同一片海",
    intro: "按栋按晚计价，含三餐。不收清洁费，不收服务费。",
    count: (n) => `${n} 栋，格局都一样`,
    perNight: "每晚",
    sleeps: (n) => `可住 ${n} 人`,
    name: "整栋独享",
    blurb: "不是别人家里的一间房。五栋沿着海边排开，住多少晚，其中一栋就归你多少晚，露台正对海面，主人家就在几步之外。",
    included: {
      house: "整栋独享",
      meals: "一日三餐，就在这里做",
      deck: "正对海面的露台",
      fan: "每间房都有风扇",
      internet: "全天候上网",
      nofee: "没有中介，没有预订费",
    },
    photoAlt: (n, of) => `Eddo Homestay，第 ${n} 张，共 ${of} 张`,
    prev: "上一张",
    next: "下一张",
    checkIn: "入住日期",
    nights: "晚数",
    nightsValue: (n) => `${n} 晚`,
    guests: "人数",
    guestsValue: (n) => `${n} 人`,
    yourName: "称呼",
    contact: "WhatsApp 或邮箱",
    total: "合计",
    pay: "预订并付款",
    cta: "问问房子",
    ctaNote: (room) => `我想问一下：${room}。`,
    payNote: "付款通过 Midtrans 完成。我们会对照日历确认日期，当天就回复你。",
    askNote: "消息直接送到主人家，通过 WhatsApp 或邮箱。",
  },
  season: {
    title: "什么时候来最好",
    note: "Raja Ampat 全年开放。以下是从我们自家栈桥看到的海况。",
    bands: [
      { label: "最佳", months: "10月 – 2月", note: "海面最平静，能见度最好。房子很早就订满。" },
      { label: "仍然不错", months: "3月 – 4月、8月 – 9月", note: "天气时好时坏，但大多数日子出海都没问题。" },
      { label: "清静", months: "5月 – 7月", note: "刮东南风，浪更大。一年里人最少的几个月。" },
    ],
  },
  around: {
    eyebrow: "周边",
    title: "一天可以走多远",
    all: "问问出海",
    places: [
      { name: "Yenbuba 栈桥", where: "就在门口", tag: "浮潜", time: "出门就是", alt: "Yenbuba 栈桥下的鱼群" },
      { name: "极乐鸟", where: "Gam 岛的 Sawinggrai", tag: "清晨出海", time: "坐船，日出前", alt: "天刚亮时 Sawinggrai 后面的林间小路" },
      { name: "Arborek", where: "邻岛", tag: "村子与栈桥", time: "坐船", alt: "Arborek 村的栈桥" },
      { name: "Piaynemo", where: "喀斯特群岛", tag: "观景台", time: "坐船半天", alt: "从观景台看 Piaynemo 的喀斯特群岛" },
    ],
    note: "出海由我们在屋里安排，时间凑得上就几位客人一起分摊。时间和价格要看潮水和油钱，所以订房时问一声。",
  },
  why: {
    title: "为什么住",
    script: "Eddo？",
    items: [
      { title: "你是住进这家人家里", sub: "给你做饭、带你出海的，就是这栋房子的主人。" },
      { title: "村子本身就是理由", sub: "Yenbuba 是真正的村子，不是度假村。村里吃什么，你就吃什么。" },
      { title: "改期很容易", sub: "晚到一天，或者多住一天，一条消息就行，不用填表。" },
      { title: "和 Turtle Dive 是一家人", sub: "想潜水？同一个村子里，我们的姊妹民宿开着潜水中心。" },
    ],
    cta: {
      eyebrow: "出发吧",
      title: "接下来几天的清静",
      body: "告诉我们时间和人数，我们告诉你哪几栋还空着。",
      button: "安排行程",
      alt: "客人在 Eddo Homestay 的露台上看书",
    },
  },
  faq: {
    eyebrow: "常见问题",
    title: "来之前大家都会问的",
    items: [
      { q: "怎么去 Yenbuba？", a: "先飞到 Sorong，再坐渡轮到 Waigeo 岛的 Waisai，我们在那里开船接你。把渡轮时间告诉我们，我们会在码头等。" },
      { q: "有电和信号吗？", a: "晚上供电。手机信号能覆盖到村里，只要线路稳定，屋里也有 Wi-Fi。" },
      { q: "可以直接从民宿下水浮潜吗？", a: "可以，从栈桥下去就是。屋里有蛙鞋和面镜；想要更贴合的话，建议自己带。" },
      { q: "可以刷卡吗？", a: "现金付印尼盾，或者到达前银行转账。村里没有刷卡机。" },
    ],
  },
  contact: {
    title: "订之前有什么都可以问",
    sub: "当天回复，通常几个小时之内。",
    whatsapp: "用 WhatsApp 联系",
    email: "发邮件",
  },
  footer: {
    tagline: "Yenbuba, Pulau Mansuar 的家庭民宿。",
    sister: "我们在同一个村子里的姊妹民宿和潜水中心：",
    sisterLink: "Turtle Dive Homestay",
    rights: "版权所有。",
  },
  maintenance: {
    title: "这个页面正在维护",
    body: "网站会自己恢复。民宿这边一切照旧，消息我们照常回复。",
    whatsapp: "用 WhatsApp 联系",
  },
  months: ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"],
  enquiry: {
    modalTitle: "给我们留言",
    modalIntro:
      "想填多少填多少。消息会直接送到经营这家民宿的一家人手里，我们中会有人回复你。这里不收钱，也不用注册账号。",
    close: "关闭",
    name: "称呼",
    namePlaceholder: "你的称呼",
    phone: "WhatsApp",
    phonePlaceholder: "+86 …",
    email: "邮箱",
    emailPlaceholder: "you@example.com",
    contactNote: "至少留一个，我们才能回复你。",
    what: "想了解",
    when: "时间",
    people: "人数",
    nights: "晚数",
    notes: "备注",
    notesPlaceholder: "食物过敏、渡轮时间、潜水证，什么都可以写。",
    submit: "发送",
    sending: "发送中…",
    sent: "谢谢，消息已经收到。我们当天回复，通常几个小时之内。",
    needContact: "请留下 WhatsApp 号码或邮箱，我们才能回复。",
    failed: "没能发送出去。请再试一次，或者用 WhatsApp 联系我们。",
  },
  services: {
    eyebrow: "住宿之外我们也安排",
    title: "过来、走动、",
    script: "下海",
    intro: "在 Raja Ampat 待几天，麻烦的不是床，是船、是从渡轮过来的那段路，还有一个知道鱼在哪里的人。这些都由这家人安排，开口的方式和订房子一样。",
    cta: "问问这个",
    note: "写出来的价格就是作数的价格。没写的是因为定不下来：船钱看那一周的油价，过海要多久看那天的潮水，所以你来问我们再报，而不是先写一个之后得收回的数字。按钮是问有没有空，不是下单。",
    items: {
      snorkeling: { title: "浮潜出海", body: "坐船出到栈桥以外，去游泳到不了的珊瑚。能走多远看那天早上的潮水，所以把想看的说出来，我们告诉你哪些是合理的。" },
      diving: { title: "潜水出海", body: "由同村的姊妹民宿 Turtle Dive 负责。有证的潜水，或者第一次下水，都从这里安排，不用订两次。" },
      excursion: { title: "整天出海，潜水或浮潜", body: "在海上待一整天，而不是一个上午：一趟船跑好几个地方，船和船家整天都陪着。告诉我们两样选哪样，以及你们几个人。" },
      transfer: { title: "岛与岛之间的船接送", body: "岛与岛之间，以及往返 Waisai 的渡轮码头。你最初就是这样到这里的，也是这样去到拼船不走的地方。" },
      camera: { title: "租相机", body: "给没带相机的客人。订房时问一下屋里有什么，我们告诉你你那几天哪些是空的。" },
      motorbike: { title: "在 Waisai 租摩托车", body: "Waisai 是渡轮靠岸的地方，也是有路的地方。把到达日期告诉我们，我们来安排，你不用在码头到处找车。" },
      car: { title: "在 Waisai 租汽车", body: "人多、行李多，或者想花一天绕 Waigeo 开一圈。跟摩托车一样：告诉我们时间，我们来安排。" },
      merch: { title: "Eddo 周边", body: "印着民宿自己标记的 T 恤。问问屋里还有哪些尺码，我们给你留一件。" },
    },
    ask: "问问有没有空",
    askPrice: "问价格",
    noPhoto: "照片稍后补上",
    pay: "预订并付款",
    when: "哪一天",
    qty: "几个",
    spec: { duration: "时长", level: "等级", engine: "发动机", power: "排量", seats: "座位", size: "尺码", includes: "包含", notes: "备注" },
    per: { day: "每天", night: "每晚", person: "每人", trip: "每趟", piece: "每件", hour: "每小时" },
  },
  stayLabel: "房子",
  message: (v) =>
    [
      `你好 Eddo Homestay，我想问一下：${v.activity}`,
      v.when ? `时间：${v.when}` : "",
      v.people ? `人数：${v.people}` : "",
      v.nights ? `晚数：${v.nights}` : "",
      v.name ? `称呼：${v.name}` : "",
      v.phone ? `WhatsApp：${v.phone}` : "",
      v.email ? `邮箱：${v.email}` : "",
      v.notes ? `备注：${v.notes}` : "",
    ]
      .filter(Boolean)
      .join("\n"),
};

export const EDDO_COPY: Record<EddoLang, EddoCopy> = {
  en: EN,
  id: ID,
  fr: FR,
  ja: JA,
  de: DE,
  ru: RU,
  zh: ZH,
};

/**
 * The check-in month list, in the reader's language.
 *
 * Its own function rather than the shared `monthOptions`, which reaches into
 * `web-content.ts` and therefore knows two languages. It also has to place the
 * year, and where the year goes is not the same everywhere: Japanese and
 * Chinese write it first and read "2026年3月" as one word, where "3月 2026"
 * reads like a translation nobody finished.
 */
export function eddoMonthOptions(from: Date, lang: EddoLang, count = 12): string[] {
  const names = EDDO_COPY[lang].months;
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(from.getFullYear(), from.getMonth() + i, 1);
    const name = names[d.getMonth()];
    return lang === "ja" || lang === "zh"
      ? `${d.getFullYear()}年${name}`
      : `${name} ${d.getFullYear()}`;
  });
}
