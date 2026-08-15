import { seedRooms } from "./data";
import { SITE_CONFIG } from "./site-config";

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
export const WHATSAPP = SITE_CONFIG.contact.whatsapp;
export const EMAIL = SITE_CONFIG.contact.email;

/** Proper nouns, which stay as they are in either language. */
export const PROPERTY = {
  name: "Turtle Dive Homestay",
  village: "Yenbuba",
  island: "Pulau Mansuar",
};

export function waLink(message: string) {
  return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(message)}`;
}

/**
 * Rupiah either way — the currency does not change with the reader — but the
 * grouping does: 450.000 to an Indonesian eye, 450,000 to everyone else.
 */
export function money(n: number, lang: Lang) {
  return "Rp " + Math.round(n).toLocaleString(lang === "id" ? "id-ID" : "en-US");
}

export type RoomKey = "standard" | "family";

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

export const ACTIVITY_KEYS = [
  "stay",
  "diving",
  "snorkeling",
  "both",
] as const;
export type ActivityKey = (typeof ACTIVITY_KEYS)[number];

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
}

interface DiveCopy {
  name: string;
  blurb: string;
  duration: string;
  level: string;
  unit: string;
  includes: string[];
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
  meta: { title: string; description: string };
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
    order: string;
    orderNote: (name: string) => string;
    footnote: string;
    packages: Record<DiveKey, DiveCopy>;
  };
  season: { eyebrow: string; title: string; intro: string; bands: BandCopy[] };
  journey: { eyebrow: string; title: string; intro: string; steps: { title: string; body: string }[] };
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
  faq: { eyebrow: string; title: string; items: { q: string; a: string }[] };
  footer: { contact: string; pages: string; manager: string; colophon: string; tagline: string };
  activities: Record<ActivityKey, string>;
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
  meta: {
    title: `${PROPERTY.name} · Homestay & Dive Center in Raja Ampat`,
    description:
      "A family homestay and dive centre in Yenbuba, Pulau Mansuar. Rooms over the water, three meals a day, and daily diving in the Dampier Strait.",
  },
  hero: {
    sub: "A homestay in Yenbuba, on Pulau Mansuar, built by hand from local timber and standing over a reef we leave the way we found it. Kept by the family who has always lived in this bay, at the pace the tide sets.",
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
      title: "Rooms over the water",
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
          "A timber room over the water with a small deck facing the strait. Wake up, open the door, and the reef is right there.",
        cap: "2 adults",
        features: [
          "Double bed with mosquito net",
          "Shared bathroom, fresh water",
          "Private deck facing the sea",
          "Three meals a day included",
        ],
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
      },
    },
  },
  dive: {
    badge: "Turtle Dive Center",
    title: "Dive in the morning,\nback before lunch",
    body: "We dive the Dampier Strait: Cape Kri, Mike's Point, Sardine Reef, Manta Point, all of them 20 to 45 minutes by boat from the jetty. The boat goes out twice a day, six divers per guide at most.",
    order: "Book",
    orderNote: (name) => `I am interested in the "${name}" package.`,
    footnote:
      "Certified divers, please bring your card and logbook. For the Open Water course, let us know at least a week ahead so the materials and the instructor's schedule can be arranged.",
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
  faq: {
    eyebrow: "Asked often",
    title: "Before you ask",
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
    pages: "Pages",
    manager: "Manager sign-in",
    colophon: `© ${PROPERTY.name}, ${PROPERTY.village}. Run together with Eddo Homestay in Sawinggrai, Pulau Gam.`,
    tagline: "Raja Ampat · est. 2018",
  },
  activities: {
    stay: "Staying",
    diving: "Diving",
    snorkeling: "Snorkelling",
    both: "Staying + diving",
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
  meta: {
    title: `${PROPERTY.name} · Homestay & Dive Center di Raja Ampat`,
    description:
      "Homestay keluarga dan dive center di Yenbuba, Pulau Mansuar. Kamar di atas air, tiga kali makan, dan penyelaman harian di Selat Dampier.",
  },
  hero: {
    sub: "Homestay di Yenbuba, Pulau Mansuar, dibangun dengan tangan dari kayu setempat dan berdiri di atas karang yang kami jaga apa adanya. Dirawat keluarga yang memang lahir dan besar di teluk ini, dengan irama yang diatur pasang surut.",
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
      title: "Kamar di atas air",
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
          "Kamar kayu di atas air dengan teras kecil menghadap selat. Bangun pagi, buka pintu, langsung lihat karang.",
        cap: "2 dewasa",
        features: [
          "Kasur double + kelambu",
          "Kamar mandi bersama, air tawar",
          "Teras pribadi menghadap laut",
          "Termasuk 3x makan sehari",
        ],
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
      },
    },
  },
  dive: {
    badge: "Turtle Dive Center",
    title: "Selam pagi,\npulang sebelum makan siang",
    body: "Kami menyelam di Selat Dampier: Cape Kri, Mike's Point, Sardine Reef, Manta Point, semuanya dalam 20 sampai 45 menit perahu dari dermaga. Perahu berangkat dua kali sehari, maksimal enam penyelam per guide.",
    order: "Pesan",
    orderNote: (name) => `Saya tertarik paket "${name}".`,
    footnote:
      "Penyelam bersertifikat harap membawa kartu dan buku log. Untuk kursus Open Water, kabari minimal satu minggu sebelumnya supaya materi dan jadwal instruktur bisa disiapkan.",
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
  faq: {
    eyebrow: "Yang sering ditanya",
    title: "Sebelum kamu tanya",
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
    pages: "Halaman",
    manager: "Masuk pengelola",
    colophon: `© ${PROPERTY.name}, ${PROPERTY.village}. Dikelola bersama Eddo Homestay di Sawinggrai, Pulau Gam.`,
    tagline: "Raja Ampat · est. 2018",
  },
  activities: {
    stay: "Menginap",
    diving: "Diving",
    snorkeling: "Snorkeling",
    both: "Menginap + diving",
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
