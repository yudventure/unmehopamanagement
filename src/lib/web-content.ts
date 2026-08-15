import { MONTHS } from "./format";
import { seedRooms } from "./data";

/**
 * Everything the public site says, in one place — so the copy can be edited
 * without reading a component, and so nothing is stated in two places that
 * could drift apart.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * PLACEHOLDER — REPLACE BEFORE THIS SITE GOES ANYWHERE NEAR A GUEST
 *
 * The owner has not supplied these, so they are stand-ins with plausible
 * shapes, not facts:
 *
 *   · WHATSAPP        the number every booking button opens
 *   · EMAIL           the address in the footer
 *   · DIVE_PACKAGES   every price, duration and group size
 *   · OTA_LINKS       the listing URLs
 *
 * Room rates are NOT placeholders — they are read from `seedRooms()`, the
 * same source the booking manager prices new bookings from, so the site and
 * the manager cannot disagree about what a room costs.
 * ─────────────────────────────────────────────────────────────────────────
 */

/** PLACEHOLDER. Digits only, country code first, no +, no spaces. */
export const WHATSAPP = "6281200000000";
/** PLACEHOLDER. */
export const EMAIL = "halo@turtlehomestay.id";

/** The name on the badge, so the logo and the words never disagree. */
export const PROPERTY = {
  name: "Turtle Dive Homestay",
  tagline: "Raja Ampat · est. 2018",
  village: "Yenbuba",
  island: "Pulau Mansuar",
  region: "Raja Ampat, Papua Barat Daya",
};

/** Opens WhatsApp with the message already typed. */
export function waLink(message: string) {
  return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(message)}`;
}

// ------------------------------------------------------------------- rooms

export interface RoomType {
  key: string;
  name: string;
  blurb: string;
  cap: string;
  rate: number;
  count: number;
  features: string[];
}

/**
 * Two room types, priced from the room table the manager uses. Individual
 * rooms are deliberately not listed: which of the ten a guest gets is an
 * operational decision, and a room out for renovation should never show up
 * here as something to book.
 */
export function roomTypes(): RoomType[] {
  const rooms = seedRooms().filter((r) => r.prop === "turtle");
  const standard = rooms.filter((r) => r.cap === "2 dewasa");
  const family = rooms.filter((r) => r.cap !== "2 dewasa");

  return [
    {
      key: "standard",
      name: "Kamar Standar",
      blurb:
        "Kamar kayu di atas air dengan teras kecil menghadap selat. Bangun pagi, buka pintu, langsung lihat karang.",
      cap: standard[0]?.cap ?? "2 dewasa",
      rate: Math.min(...standard.map((r) => r.rate)),
      count: standard.length,
      features: [
        "Kasur double + kelambu",
        "Kamar mandi bersama, air tawar",
        "Teras pribadi menghadap laut",
        "Termasuk 3x makan sehari",
      ],
    },
    {
      key: "family",
      name: "Kamar Keluarga",
      blurb:
        "Lebih luas, muat dua dewasa dan dua anak. Cocok untuk keluarga atau dua pasang yang bepergian bersama.",
      cap: family[0]?.cap ?? "2 dewasa + 2 anak",
      rate: Math.min(...family.map((r) => r.rate)),
      count: family.length,
      features: [
        "Satu kasur double + dua single",
        "Kamar mandi dalam",
        "Teras luas, hammock",
        "Termasuk 3x makan sehari",
      ],
    },
  ];
}

// ------------------------------------------------------------------ diving

export interface DivePackage {
  key: string;
  name: string;
  blurb: string;
  /** PLACEHOLDER price, rupiah per person. */
  price: number;
  unit: string;
  duration: string;
  level: string;
  includes: string[];
  /** Drawn as the accented card. */
  featured?: boolean;
}

/** PLACEHOLDER — every figure below needs the owner's real numbers. */
export const DIVE_PACKAGES: DivePackage[] = [
  {
    key: "fun2",
    name: "Fun Dive · 2 tank",
    blurb:
      "Dua penyelaman dalam satu perjalanan pagi, di titik sekitar Mansuar dan Selat Dampier.",
    price: 1400000,
    unit: "per orang",
    duration: "±4 jam",
    level: "Open Water ke atas",
    includes: ["Guide", "Tabung & timbang", "Perahu", "Air & snack"],
  },
  {
    key: "fun3",
    name: "Fun Dive · 3 tank",
    blurb:
      "Seharian penuh, tiga titik berbeda. Pilihan paling sering diambil tamu yang menginap lebih dari tiga malam.",
    price: 1850000,
    unit: "per orang",
    duration: "seharian",
    level: "Open Water ke atas",
    includes: ["Guide", "Tabung & timbang", "Perahu", "Makan siang di perahu"],
    featured: true,
  },
  {
    key: "dsd",
    name: "Discover Scuba",
    blurb:
      "Belum punya sertifikat? Mulai dari kolam dangkal di depan homestay, lalu satu penyelaman dangkal bersama instruktur.",
    price: 1600000,
    unit: "per orang",
    duration: "±3 jam",
    level: "tanpa sertifikat",
    includes: ["Instruktur", "Seluruh alat", "Maksimal 12 meter"],
  },
  {
    key: "ow",
    name: "Kursus Open Water",
    blurb:
      "Sertifikasi penuh, empat hari. Teori dikerjakan sore hari di homestay, praktik pagi di perairan tenang.",
    price: 7500000,
    unit: "per orang",
    duration: "4 hari",
    level: "pemula",
    includes: ["Instruktur", "Materi & e-learning", "Alat lengkap", "Sertifikat"],
  },
  {
    key: "snorkel",
    name: "Trip Snorkeling",
    blurb:
      "Manta Point, Piaynemo, atau taman karang di depan dermaga. Tidak perlu bisa menyelam.",
    price: 750000,
    unit: "per orang",
    duration: "±5 jam",
    level: "semua umur",
    includes: ["Pemandu", "Masker & fin", "Perahu", "Air & buah"],
  },
  {
    key: "sewa",
    name: "Sewa Alat Lengkap",
    blurb:
      "Untuk penyelam yang datang dengan sertifikat dan rencana sendiri. Tabung isi ulang dihitung terpisah.",
    price: 350000,
    unit: "per hari",
    duration: "per hari",
    level: "Open Water ke atas",
    includes: ["BCD & regulator", "Wetsuit", "Masker & fin"],
  },
];

// ------------------------------------------------------------------ season

export interface SeasonBand {
  label: string;
  months: string;
  note: string;
  tone: "peak" | "good" | "quiet";
}

/**
 * The same seasonal shape the manager's occupancy chart is built on, written
 * out as advice. If one changes, change both.
 */
export const SEASON_BANDS: SeasonBand[] = [
  {
    label: "Musim terbaik",
    months: "Oktober – Februari",
    note: "Air paling tenang dan jarak pandang paling jauh. Manta paling sering muncul Desember–Februari. Kamar cepat penuh, pesan dari jauh hari.",
    tone: "peak",
  },
  {
    label: "Masih bagus",
    months: "Maret – April, Agustus – September",
    note: "Cuaca campur tapi menyelam tetap jalan hampir setiap hari. Lebih longgar, lebih tenang di dermaga.",
    tone: "good",
  },
  {
    label: "Musim sepi",
    months: "Mei – Juli",
    note: "Angin tenggara, ombak lebih besar, beberapa titik jauh kadang dibatalkan. Paling sepi — cocok kalau mau pulau untuk diri sendiri.",
    tone: "quiet",
  },
];

// ------------------------------------------------------------- getting here

export const JOURNEY = [
  {
    step: "01",
    title: "Terbang ke Sorong",
    body: "Bandara Domine Eduard Osok (SOQ). Ada penerbangan harian dari Jakarta, Makassar, dan Manado.",
  },
  {
    step: "02",
    title: "Kapal ke Waisai",
    body: "Kapal cepat dari Pelabuhan Sorong, ±2 jam. Berangkat dua kali sehari — pagi dan siang.",
  },
  {
    step: "03",
    title: "Bayar retribusi",
    body: "Kartu Jasa Lingkungan Raja Ampat diurus di Waisai. Berlaku satu tahun.",
  },
  {
    step: "04",
    title: "Kami jemput",
    body: "Perahu kami menjemput di dermaga Waisai, ±1 jam ke Yenbuba. Kabari jadwal kapalmu lewat WhatsApp.",
  },
];

// ---------------------------------------------------------------- questions

export const FAQ = [
  {
    q: "Apakah ada listrik dan sinyal?",
    a: "Listrik menyala dari sore sampai pagi. Sinyal telepon ada dan cukup untuk WhatsApp, tapi jangan berharap bisa streaming — bawa buku.",
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
];

// --------------------------------------------------------------- the picker

export const ACTIVITIES = [
  { key: "menginap", label: "Menginap" },
  { key: "diving", label: "Diving" },
  { key: "snorkeling", label: "Snorkeling" },
  { key: "keduanya", label: "Menginap + Diving" },
] as const;

export type ActivityKey = (typeof ACTIVITIES)[number]["key"];

/** Nice month names for the "kapan" select — a year ahead from the anchor. */
export function monthOptions(from: Date, count = 12): string[] {
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(from.getFullYear(), from.getMonth() + i, 1);
    return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  });
}
