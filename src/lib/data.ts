import { iso } from "./format";
import type {
  Booking,
  ChannelKey,
  PaymentStatus,
  PropertyKey,
  Room,
  User,
} from "./types";

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

export const PROPERTIES: { key: PropertyKey; name: string; location: string }[] =
  [
    { key: "turtle", name: "Turtle Homestay", location: "Yenbuba, Pulau Mansuar" },
    { key: "eddo", name: "Eddo Homestay", location: "Sawinggrai, Pulau Gam" },
  ];

/** The month the seeded demo data lives in. */
export const DEMO_MONTH = new Date(2026, 7, 1);
export const DEMO_TODAY = "2026-08-16";

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
  rooms.push({
    id: "E1",
    prop: "eddo",
    name: "Eddo Bawah",
    cap: "2 dewasa",
    rate: 400000,
    active: true,
  });
  rooms.push({
    id: "E2",
    prop: "eddo",
    name: "Eddo Atas",
    cap: "4 dewasa",
    rate: 700000,
    active: true,
  });
  return rooms;
}

/**
 * Deterministic demo bookings for August 2026. The LCG is seeded so every
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
      const total = r.rate * nights * (ch === "WhatsApp" ? 1 : 1.12);
      const paidRoll = rnd();
      const pay: PaymentStatus =
        ch === "WhatsApp"
          ? paidRoll < 0.4
            ? "DP masuk"
            : paidRoll < 0.85
              ? "Lunas"
              : "Belum bayar"
          : "Dibayar via OTA";
      const paid =
        pay === "Lunas" || pay === "Dibayar via OTA"
          ? total
          : pay === "DP masuk"
            ? Math.round((total * 0.3) / 50000) * 50000
            : 0;

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
        paid,
        pay,
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
    paid: 1512000,
    pay: "Dibayar via OTA",
    status: "Confirmed",
    notes:
      "Masuk dari feed iCal Agoda, bentrok dengan booking Booking.com di kamar yang sama.",
    src: "iCal",
    conflict: true,
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
    paid: 1512000,
    pay: "Dibayar via OTA",
    status: "Confirmed",
    notes: "Konflik dengan BK9001. Tawarkan pindah ke Turtle 05.",
    src: "iCal",
    conflict: true,
  });

  return bookings;
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
