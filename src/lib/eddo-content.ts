import type { Lang } from "@/lib/web-content";
import { seedRooms } from "@/lib/data";
import { SITE_CONFIG } from "@/lib/site-config";

/**
 * Everything the Eddo Homestay site says, in both languages.
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
  village: "Sawinggrai",
  island: "Pulau Gam",
  region: "Raja Ampat",
};

/** Same inbox and number as the family's other property, for now. */
export const WHATSAPP = SITE_CONFIG.contact.whatsapp;
export const EMAIL = SITE_CONFIG.contact.email;

export function waLink(message: string) {
  return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(message)}`;
}

export type EddoRoomKey = "bawah" | "atas";

export interface EddoRoom {
  key: EddoRoomKey;
  rate: number;
  /** Photo under `public/`; the drawn scene shows if the file is missing. */
  photo: string;
}

/**
 * Two rooms, priced from the same table the manager uses, so the site and the
 * calendar cannot disagree. Keyed by the room rather than by position, so a
 * photo cannot end up over the wrong room if the two are ever reordered.
 */
export function eddoRooms(): EddoRoom[] {
  const rooms = seedRooms().filter((r) => r.prop === "eddo");
  const rate = (name: string) =>
    rooms.find((r) => r.name === name)?.rate ?? 0;
  return [
    { key: "bawah", rate: rate("Eddo Bawah"), photo: "/eddo-bawah.jpg" },
    { key: "atas", rate: rate("Eddo Atas"), photo: "/eddo-atas.jpg" },
  ];
}

/**
 * The five things a visitor can ask Eddo for, in the order the card offers
 * them. One list, used twice: it is the row of tabs on the booking card and it
 * is the list in the enquiry dialog, so the two can never drift apart.
 *
 * Diving is on it although Eddo has no dive centre of its own. The family runs
 * one at Turtle, on the next island, and a guest asking here is asking the same
 * family. Hire is the other way round: Turtle's list does not carry it.
 */
export const EDDO_ACTIVITIES = ["stay", "diving", "motorbike", "camera", "package"] as const;
export type EddoActivity = (typeof EDDO_ACTIVITIES)[number];

export interface EddoCopy {
  htmlLang: string;
  meta: { title: string; description: string };
  nav: { home: string; rooms: string; around: string; why: string; faq: string };
  openMenu: string;
  currencyLabel: string;
  langLabel: string;
  hero: {
    eyebrow: string;
    title: string;
    /** The line set in the script face, under the title. */
    script: string;
    sub: string;
    cta: string;
    alt: string;
  };
  search: {
    tabs: Record<EddoActivity, string>;
    checkIn: string;
    checkOut: string;
    /** The same two fields when what is being asked for is not a room. */
    from: string;
    to: string;
    guests: string;
    guestsValue: (n: number) => string;
    go: string;
    /** What lands in the enquiry's notes when the bar is used. */
    note: (tab: string, from: string, to: string, guests: number) => string;
  };
  trust: { title: string; sub: string }[];
  rooms: {
    eyebrow: string;
    title: string;
    /** The tail of the title, set in the script face. */
    script: string;
    intro: string;
    perNight: string;
    sleeps: (n: number) => string;
    types: Record<
      EddoRoomKey,
      { name: string; sleeps: number; blurb: string; features: string[]; alt: string }
    >;
    cta: string;
    ctaNote: (room: string) => string;
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
  /** The enquiry dialog's activity labels, keyed like the shared modal expects. */
  activities: Record<EddoActivity, string>;
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
    title: `${EDDO.name} · Homestay in Sawinggrai, Raja Ampat`,
    description:
      "A two-room family homestay in Sawinggrai on Pulau Gam, Raja Ampat. Rooms by the water, three meals a day, snorkelling off the jetty, and birds of paradise at dawn.",
  },
  nav: { home: "Home", rooms: "Rooms", around: "Around us", why: "Why Eddo", faq: "Questions" },
  openMenu: "Open menu",
  currencyLabel: "Show an approximate price in",
  langLabel: "Language",
  hero: {
    eyebrow: "Sawinggrai · Pulau Gam · Raja Ampat",
    title: "A small homestay",
    script: "by the water",
    sub: "Two rooms on the shore of Sawinggrai, kept by the family who lives here. Three meals a day, a jetty to snorkel from, and the forest behind the village where the birds of paradise call at dawn.",
    cta: "See the rooms",
    alt: "The jetty at Sawinggrai with clear water over the reef",
  },
  search: {
    tabs: {
      stay: "Room",
      diving: "Diving",
      motorbike: "Motorbike",
      camera: "Camera",
      package: "Full package",
    },
    checkIn: "Check-in",
    checkOut: "Check-out",
    from: "From",
    to: "Until",
    guests: "Guests",
    guestsValue: (n) => (n === 1 ? "1 guest" : `${n} guests`),
    go: "Ask availability",
    note: (tab, from, to, guests) =>
      `${tab}${from ? `, arriving ${from}` : ""}${to ? `, leaving ${to}` : ""}, ${guests} ${guests === 1 ? "guest" : "guests"}.`,
  },
  trust: [
    { title: "Direct from the family", sub: "No agent, no booking fee. The price you see is the price." },
    { title: "Replies the same day", sub: "Usually within a few hours, on WhatsApp or email." },
    { title: "Three meals included", sub: "Cooked at the house, eaten together." },
    { title: "Two rooms only", sub: "Small on purpose. You will not share the jetty with a crowd." },
  ],
  rooms: {
    eyebrow: "Rooms & rates",
    title: "Two rooms,",
    script: "one shore",
    intro: "Per room, per night, with three meals. No cleaning fee, no service fee.",
    perNight: "per night",
    sleeps: (n) => `Sleeps ${n}`,
    types: {
      bawah: {
        name: "Eddo Bawah",
        sleeps: 2,
        blurb: "The lower room, a few steps from the water. A double bed, a deck facing the bay, and the sound of the tide under the floor.",
        features: ["Double bed", "Private deck", "Fan", "Shared bathroom", "Three meals a day", "Electricity in the evening"],
        alt: "The lower room at Eddo Homestay with its deck facing the water",
      },
      atas: {
        name: "Eddo Atas",
        sleeps: 4,
        blurb: "The upper room, with space for a family. Two beds, a wider deck, and the view over the roofs to the strait.",
        features: ["Two beds", "Wide deck", "Fan", "Shared bathroom", "Three meals a day", "Electricity in the evening"],
        alt: "The upper room at Eddo Homestay with a wide deck",
      },
    },
    cta: "Ask about this room",
    ctaNote: (room) => `I would like to ask about ${room}.`,
  },
  around: {
    eyebrow: "Around us",
    title: "Where a day can go",
    all: "Ask about a trip",
    places: [
      { name: "Sawinggrai jetty", where: "Right here", tag: "Snorkelling", time: "From the door", alt: "Fish under the jetty at Sawinggrai" },
      { name: "Birds of paradise", where: "Forest behind the village", tag: "Dawn walk", time: "Before sunrise", alt: "Forest path behind Sawinggrai at dawn" },
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
      { title: "The village is the point", sub: "Sawinggrai is a real village, not a resort. You eat what the village eats." },
      { title: "Easy to change", sub: "Arriving a day late or staying a day longer is a message, not a form." },
      { title: "Same family as Turtle Dive", sub: "Want to dive? Our sister homestay on Mansuar runs the dive centre." },
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
      { q: "How do we get to Sawinggrai?", a: "Fly to Sorong, take the ferry to Waisai on Waigeo, and we pick you up there by boat. Tell us your ferry time and we will be at the harbour." },
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
    tagline: "A family homestay in Sawinggrai, Pulau Gam.",
    sister: "Our sister homestay and dive centre on Pulau Mansuar:",
    sisterLink: "Turtle Dive Homestay",
    rights: "All rights reserved.",
  },
  maintenance: {
    title: "We are working on this page",
    body: "The site will be back on its own. Nothing about the homestay has changed, and we are answering messages as usual.",
    whatsapp: "Message on WhatsApp",
  },
  activities: {
    stay: "a room",
    diving: "diving",
    motorbike: "motorbike hire",
    camera: "camera hire",
    package: "the full package",
  },
  message: (v) =>
    [
      `Hello Eddo Homestay, I would like to ask about ${v.activity.toLowerCase()}.`,
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
    title: `${EDDO.name} · Homestay di Sawinggrai, Raja Ampat`,
    description:
      "Homestay keluarga dua kamar di Sawinggrai, Pulau Gam, Raja Ampat. Kamar di tepi air, tiga kali makan, snorkeling dari dermaga, dan burung cendrawasih saat fajar.",
  },
  nav: { home: "Beranda", rooms: "Kamar", around: "Sekitar kami", why: "Kenapa Eddo", faq: "Tanya" },
  openMenu: "Buka menu",
  currencyLabel: "Tampilkan perkiraan harga dalam",
  langLabel: "Bahasa",
  hero: {
    eyebrow: "Sawinggrai · Pulau Gam · Raja Ampat",
    title: "Homestay kecil",
    script: "di tepi air",
    sub: "Dua kamar di pesisir Sawinggrai, dijaga keluarga yang memang tinggal di sini. Tiga kali makan sehari, dermaga untuk snorkeling, dan hutan di belakang kampung tempat cendrawasih berbunyi saat fajar.",
    cta: "Lihat kamarnya",
    alt: "Dermaga Sawinggrai dengan air jernih di atas karang",
  },
  search: {
    tabs: {
      stay: "Kamar",
      diving: "Selam",
      motorbike: "Motor",
      camera: "Kamera",
      package: "Paket lengkap",
    },
    checkIn: "Check-in",
    checkOut: "Check-out",
    from: "Dari",
    to: "Sampai",
    guests: "Tamu",
    guestsValue: (n) => `${n} tamu`,
    go: "Tanya ketersediaan",
    note: (tab, from, to, guests) =>
      `${tab}${from ? `, datang ${from}` : ""}${to ? `, pulang ${to}` : ""}, ${guests} tamu.`,
  },
  trust: [
    { title: "Langsung dari keluarga", sub: "Tanpa agen, tanpa biaya pemesanan. Harga yang tertulis itu harganya." },
    { title: "Dibalas di hari yang sama", sub: "Biasanya dalam beberapa jam, lewat WhatsApp atau email." },
    { title: "Sudah termasuk tiga kali makan", sub: "Dimasak di rumah, dimakan bersama." },
    { title: "Cuma dua kamar", sub: "Sengaja kecil. Dermaganya tidak akan ramai." },
  ],
  rooms: {
    eyebrow: "Kamar & tarif",
    title: "Dua kamar,",
    script: "satu pesisir",
    intro: "Per kamar, per malam, sudah termasuk tiga kali makan. Tidak ada biaya kebersihan atau biaya layanan.",
    perNight: "per malam",
    sleeps: (n) => `Untuk ${n} orang`,
    types: {
      bawah: {
        name: "Eddo Bawah",
        sleeps: 2,
        blurb: "Kamar bawah, beberapa langkah dari air. Satu ranjang besar, teras menghadap teluk, dan suara pasang di bawah lantai.",
        features: ["Ranjang besar", "Teras sendiri", "Kipas angin", "Kamar mandi bersama", "Tiga kali makan", "Listrik malam hari"],
        alt: "Kamar bawah Eddo Homestay dengan teras menghadap air",
      },
      atas: {
        name: "Eddo Atas",
        sleeps: 4,
        blurb: "Kamar atas, cukup untuk keluarga. Dua ranjang, teras lebih lebar, dan pemandangan ke selat lewat atap-atap kampung.",
        features: ["Dua ranjang", "Teras lebar", "Kipas angin", "Kamar mandi bersama", "Tiga kali makan", "Listrik malam hari"],
        alt: "Kamar atas Eddo Homestay dengan teras lebar",
      },
    },
    cta: "Tanya kamar ini",
    ctaNote: (room) => `Saya mau tanya soal ${room}.`,
  },
  around: {
    eyebrow: "Sekitar kami",
    title: "Ke mana harinya bisa dibawa",
    all: "Tanya soal trip",
    places: [
      { name: "Dermaga Sawinggrai", where: "Di depan rumah", tag: "Snorkeling", time: "Dari pintu", alt: "Ikan di bawah dermaga Sawinggrai" },
      { name: "Burung cendrawasih", where: "Hutan belakang kampung", tag: "Jalan subuh", time: "Sebelum matahari terbit", alt: "Jalan setapak hutan di belakang Sawinggrai saat fajar" },
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
      { title: "Kampungnya yang jadi alasan", sub: "Sawinggrai kampung sungguhan, bukan resor. Kamu makan apa yang kampung makan." },
      { title: "Gampang diubah", sub: "Datang telat sehari atau tinggal sehari lebih lama cukup satu pesan, bukan formulir." },
      { title: "Sekeluarga dengan Turtle Dive", sub: "Mau menyelam? Homestay saudara kami di Mansuar yang menjalankan dive center-nya." },
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
      { q: "Bagaimana cara ke Sawinggrai?", a: "Terbang ke Sorong, naik kapal ke Waisai di Waigeo, lalu kami jemput di sana dengan perahu. Kabari jam kapalmu dan kami sudah di pelabuhan." },
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
    tagline: "Homestay keluarga di Sawinggrai, Pulau Gam.",
    sister: "Homestay saudara dan dive center kami di Pulau Mansuar:",
    sisterLink: "Turtle Dive Homestay",
    rights: "Hak cipta dilindungi.",
  },
  maintenance: {
    title: "Halaman ini sedang dikerjakan",
    body: "Situsnya akan kembali dengan sendirinya. Tidak ada yang berubah di homestay-nya, dan pesan tetap kami balas seperti biasa.",
    whatsapp: "Pesan lewat WhatsApp",
  },
  activities: {
    stay: "kamar",
    diving: "selam",
    motorbike: "sewa motor",
    camera: "sewa kamera",
    package: "paket lengkap",
  },
  message: (v) =>
    [
      `Halo Eddo Homestay, saya mau tanya soal ${v.activity.toLowerCase()}.`,
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

export const EDDO_COPY: Record<Lang, EddoCopy> = { en: EN, id: ID };
