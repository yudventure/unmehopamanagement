import { iso, parse } from "./format";
import { bookingTotal } from "./pricing";
import type { Booking, ChannelKey, PropertyKey, Room, User } from "./types";

export interface ChannelStyle {
  bg: string;
  fg: string;
  dot: string;
  /** Estimated OTA commission rate, entered by hand per platform (PRD F5.5). */
  com: number;
}

export const CH: Record<ChannelKey, ChannelStyle> = {
  "Booking.com": { bg: "#DCEAFE", fg: "#1D4ED8", dot: "#3B82F6", com: 0.18 },
  Traveloka: { bg: "#FCE1EC", fg: "#BE185D", dot: "#EC4899", com: 0.15 },
  Agoda: { bg: "#EAE3FD", fg: "#6D28D9", dot: "#8B5CF6", com: 0.17 },
  WhatsApp: { bg: "#D6F2E7", fg: "#0B5F52", dot: "#0E7C6B", com: 0 },
  Blokir: { bg: "#ECEFEE", fg: "#5C6E68", dot: "#9BABA5", com: 0 },
};

export const CHANNEL_KEYS = Object.keys(CH) as ChannelKey[];

/**
 * How a channel is named wherever it faces the user. WhatsApp reads as two
 * things because it is: the booking arrives over chat and the guest settles at
 * the property, which is also why its commission is zero. Walk-ins are
 * recorded here rather than as a channel of their own.
 */
export const CHANNEL_LABELS: Record<ChannelKey, string> = {
  "Booking.com": "Booking.com",
  Traveloka: "Traveloka",
  Agoda: "Agoda",
  WhatsApp: "WA / langsung",
  Blokir: "Blokir",
};

export const PROPERTIES: {
  key: PropertyKey;
  name: string;
  location: string;
}[] = [
  {
    key: "turtle",
    name: "Turtle Homestay",
    location: "Yenbuba, Pulau Mansuar",
  },
  { key: "eddo", name: "Eddo Homestay", location: "Yenbuba, Pulau Mansuar" },
];

/**
 * The month the seeded book is centred on, and the day the generator treats as
 * "now" when it decides which stays have already been and gone.
 *
 * The app itself does not use these to mean today. It reads the real clock and
 * only falls back to `SEED_TODAY` for the first paint, before the browser has
 * had a chance to say what day it is.
 */
export const SEED_MONTH = new Date(2026, 7, 1);
export const SEED_TODAY = "2026-08-16";

const NAMES = [
  "Ratna Wulandari",
  "Michael Brandt",
  "Siti Nurhaliza",
  "Tom Vermeer",
  "Andi Pratama",
  "Yuki Tanaka",
  "Dewi Anggraini",
  "Lars Nielsen",
  "Bagus Setiawan",
  "Clara Moreau",
  "Rizky Ramadhan",
  "Sofia Rossi",
  "Putri Maharani",
  "Daniel Kim",
  "Agus Salim",
  "Hanna Berg",
  "Nadia Safitri",
  "Paul Mercier",
  "Eko Wijaya",
  "Mei Lin",
  "Fajar Nugroho",
  "Anna Kowalski",
  "Intan Permata",
  "Jonas Weber",
];

const NOTES = [
  "Jemput di dermaga Waisai jam 10.00.",
  "Minta kamar dekat jetty, bawa alat snorkeling sendiri.",
  "Paket 3D2N termasuk trip Piaynemo.",
  "Alergi makanan laut, siapkan menu ayam.",
  "Datang dengan kapal sore, check-in terlambat.",
  "Rombongan diving, butuh tempat bilas alat.",
];

export function seedRooms(): Room[] {
  const rooms: Room[] = [];
  for (let i = 1; i <= 10; i++) {
    rooms.push({
      id: "T" + i,
      prop: "turtle",
      name: "Turtle " + String(i).padStart(2, "0"),
      cap: i <= 6 ? "2 dewasa" : "2 dewasa + 2 anak",
      rate: i <= 6 ? 450000 : 650000,
      // Turtle 07 sits out the month under renovation (PRD F1.5).
      active: i !== 7,
    });
  }
  /* Eddo is five of one thing, not two of two. Each unit is a house of its
     own, so they share a rate and a capacity and differ only by number; the
     site shows one card and says how many there are, and the calendar still
     has five rows to fill.

     The rate and the capacity carried over from the old "Eddo Bawah" and are
     the owner's to confirm. */
  for (let i = 1; i <= 5; i++) {
    rooms.push({
      id: "E" + i,
      prop: "eddo",
      name: "Rumah " + String(i).padStart(2, "0"),
      cap: "4 dewasa",
      rate: 400000,
      active: true,
    });
  }
  return rooms;
}

/**
 * Deterministic seed bookings for August 2026. The LCG is seeded so every
 * reload — and every developer's machine — produces the same calendar.
 */
export function seedBookings(rooms: Room[]): Booking[] {
  let seed = 7;
  const rnd = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };

  const chans: ChannelKey[] = [
    "Booking.com",
    "Traveloka",
    "Agoda",
    "WhatsApp",
    "WhatsApp",
    "Booking.com",
  ];
  const bookings: Booking[] = [];
  let n = 0;

  rooms.forEach((r) => {
    let day = 1 + Math.floor(rnd() * 4);
    while (day < 30) {
      if (!r.active) break;
      const nights = 2 + Math.floor(rnd() * 4);
      const ch = chans[Math.floor(rnd() * chans.length)];
      const inD = new Date(2026, 7, day);
      const outD = new Date(2026, 7, day + nights);
      const total = bookingTotal(r.rate, nights, ch);
      /* Burnt roll. It used to decide a payment status, which the app no
         longer tracks — a booking only reaches the calendar once it is paid.
         The call stays because dropping it would shift every draw after it and
         re-roll all 61 bookings, breaking the field-for-field match with the
         prototype's generator. */
      rnd();

      bookings.push({
        id: "BK" + String(++n).padStart(4, "0"),
        roomId: r.id,
        guest: NAMES[Math.floor(rnd() * NAMES.length)],
        phone: "0812" + Math.floor(1000000 + rnd() * 8999999),
        pax: 2 + Math.floor(rnd() * 3),
        channel: ch,
        checkIn: iso(inD),
        checkOut: iso(outD),
        total,
        status:
          day < 13
            ? "Checked-out"
            : day <= 15
              ? "Checked-in"
              : rnd() < 0.15
                ? "Tentative"
                : "Confirmed",
        notes: NOTES[Math.floor(rnd() * NOTES.length)],
        src: ch === "WhatsApp" ? "manual" : "iCal",
      });
      day += nights + 1 + Math.floor(rnd() * 3);
    }
  });

  // One deliberate iCal overlap on Turtle 03 so the conflict banner (F2.4)
  // has something real to point at.
  bookings.push({
    id: "BK9001",
    roomId: "T3",
    guest: "Grace Adeyemi",
    phone: "081277341200",
    pax: 2,
    channel: "Agoda",
    checkIn: "2026-08-19",
    checkOut: "2026-08-22",
    total: 1512000,
    status: "Confirmed",
    notes:
      "Masuk dari feed iCal Agoda, bentrok dengan booking Booking.com di kamar yang sama.",
    src: "iCal",
  });
  bookings.push({
    id: "BK9002",
    roomId: "T3",
    guest: "Henrik Olsen",
    phone: "081399820011",
    pax: 2,
    channel: "Booking.com",
    checkIn: "2026-08-20",
    checkOut: "2026-08-23",
    total: 1512000,
    status: "Confirmed",
    notes: "Konflik dengan BK9001. Tawarkan pindah ke Turtle 05.",
    src: "iCal",
  });

  return bookings;
}

/**
 * Share of nights sold in a month that has already run its course, by calendar
 * month (0 = Januari). Raja Ampat sells on calm water: October–February is the
 * peak, May–June the floor when the southeast monsoon runs, and July–August
 * lifts again on the European holiday. August lands at 0.62 because that is
 * what the seeded month actually measures.
 */
const SEASON = [
  0.78, 0.72, 0.66, 0.6, 0.44, 0.34, 0.48, 0.62, 0.52, 0.74, 0.8, 0.86,
];

/**
 * How much of a month still ahead of `SEED_TODAY` is already on the books, by
 * months of lead time. A December that looked full back in August would be a
 * fiction — and the gap between what the season usually delivers and what is
 * sold so far is the whole point of looking at the trend.
 */
const PICKUP = [1, 0.8, 0.56, 0.38, 0.24];

/** First and last day the surrounding book covers. */
const LEDGER_FROM = new Date(2025, 8, 1);
const LEDGER_TO = new Date(2026, 11, 31);

const shift = (d: Date, days: number) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate() + days);

/** Season × pickup — the occupancy this month is generated towards. */
function monthTarget(d: Date): number {
  const ahead = (d.getFullYear() - 2026) * 12 + (d.getMonth() - 7);
  const pickup = ahead <= 0 ? 1 : (PICKUP[ahead] ?? 0.15);
  return SEASON[d.getMonth()] * pickup;
}

/**
 * The months around the seeded one — September 2025 through December 2026,
 * August 2026 excepted.
 *
 * `seedBookings` fills a single month, which is enough for a calendar but not
 * for the question the report asks: when is the season busy and when is it
 * quiet. A year either side gives that answer a shape to read.
 *
 * Runs on its own LCG. Sharing the seeded generator's stream would re-roll all
 * 61 August bookings and break the field-for-field match with the prototype.
 *
 * It is also handed those bookings so it can step over the nights they already
 * hold. Skipping "August" by the calendar is not enough — a seeded stay that
 * starts on the 29th runs into September, and a ledger booking landing on the
 * 1st would invent a double booking the conflict banner would then report as
 * real.
 */
export function seedLedger(rooms: Room[], seeded: Booking[]): Booking[] {
  let seed = 21;
  const rnd = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };

  const chans: ChannelKey[] = [
    "Booking.com",
    "Traveloka",
    "Agoda",
    "WhatsApp",
    "WhatsApp",
    "Booking.com",
  ];
  const SEEDED_FROM = "2026-08-01";
  const SEEDED_TO = "2026-09-01";

  /** Nights the seeded month already holds, per room. */
  const held = new Map<string, Booking[]>();
  seeded.forEach((b) => {
    const list = held.get(b.roomId);
    if (list) list.push(b);
    else held.set(b.roomId, [b]);
  });

  const out: Booking[] = [];
  let n = 0;

  rooms.forEach((r) => {
    if (!r.active) return;
    const taken = held.get(r.id) ?? [];
    let cursor = new Date(LEDGER_FROM);

    while (cursor <= LEDGER_TO) {
      const target = monthTarget(cursor);
      const nights = 2 + Math.floor(rnd() * 4);
      const checkIn = iso(cursor);
      const outD = shift(cursor, nights);
      const checkOut = iso(outD);

      /* Two things are stepped over, and a candidate that hits either is
         dropped whole rather than trimmed to fit — a stay cut short to fill a
         gap reads as a booking someone made, and it never was one. Both jumps
         land the cursor strictly forward, so neither can stall.

         A seeded stay on this room, which may run past 31 August and would
         otherwise be double-booked on 1 September: */
      const clash = taken.find(
        (t) => t.checkIn < checkOut && t.checkOut > checkIn,
      );
      if (clash) {
        cursor = parse(clash.checkOut);
        continue;
      }
      /* …and August itself, whole. The month's figures — 212 malam, 62%,
         Rp 118.670.000 — are the verified match against the prototype's
         generator, and a July stay spilling over the 1st would move them. */
      if (checkOut > SEEDED_FROM && checkIn < SEEDED_TO) {
        cursor = parse(SEEDED_TO);
        continue;
      }

      const ch = chans[Math.floor(rnd() * chans.length)];
      const settled = checkOut <= SEED_TODAY;
      out.push({
        id: "BH" + String(++n).padStart(4, "0"),
        roomId: r.id,
        guest: NAMES[Math.floor(rnd() * NAMES.length)],
        phone: "0812" + Math.floor(1000000 + rnd() * 8999999),
        pax: 2 + Math.floor(rnd() * 3),
        channel: ch,
        checkIn,
        checkOut,
        total: bookingTotal(r.rate, nights, ch),
        status: settled
          ? "Checked-out"
          : rnd() < 0.12
            ? "Tentative"
            : "Confirmed",
        notes: NOTES[Math.floor(rnd() * NOTES.length)],
        src: ch === "WhatsApp" ? "manual" : "iCal",
      });

      /* Gap chosen so nights / (nights + gap) lands near the month's target.
         Zero is allowed — a homestay can turn a room over the same morning. */
      const base = (nights * (1 - target)) / Math.max(0.05, target);
      cursor = shift(outD, Math.max(0, Math.round(base * (0.5 + rnd()))));
    }
  });

  return out;
}

export const seedUsers: User[] = [
  {
    id: "U1",
    name: "Yud",
    email: "yud@rumahpapua.id",
    role: "Owner",
    scope: "Semua properti",
    active: true,
  },
  {
    id: "U2",
    name: "Marthen Sauyai",
    email: "marthen@rumahpapua.id",
    role: "Staf",
    scope: "Turtle Homestay",
    active: true,
  },
  {
    id: "U3",
    name: "Selfina Mayor",
    email: "selfina@rumahpapua.id",
    role: "Staf",
    scope: "Eddo Homestay",
    active: true,
  },
  {
    id: "U4",
    name: "Yosia Umpes",
    email: "yosia@rumahpapua.id",
    role: "Staf",
    scope: "Turtle Homestay",
    active: false,
  },
];

export const OWNER_EMAIL = "yud@rumahpapua.id";
export const STAFF_EMAIL = "marthen@rumahpapua.id";
