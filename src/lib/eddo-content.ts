import type { Lang } from "@/lib/web-content";
import { seedRooms } from "@/lib/data";
import { siteConfig } from "@/lib/site-config";

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
export const EDDO_ACTIVITIES = ["stay", "diving", "motorbike", "camera", "package"] as const;
export type EddoActivity = (typeof EDDO_ACTIVITIES)[number];

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
  nav: { home: string; rooms: string; around: string; why: string; faq: string };
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
    title: `${EDDO.name} · Homestay in Yenbuba, Raja Ampat`,
    description:
      "Five family houses on the shore at Yenbuba, Pulau Mansuar, Raja Ampat. A house to yourselves, three meals a day, and snorkelling straight off the jetty.",
  },
  nav: { home: "Home", rooms: "Rooms", around: "Around us", why: "Why Eddo", faq: "Questions" },
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
    title: `${EDDO.name} · Homestay di Yenbuba, Raja Ampat`,
    description:
      "Lima rumah keluarga di tepi air Yenbuba, Pulau Mansuar, Raja Ampat. Satu rumah dipakai sendiri, tiga kali makan, dan snorkeling langsung dari dermaga.",
  },
  nav: { home: "Beranda", rooms: "Kamar", around: "Sekitar kami", why: "Kenapa Eddo", faq: "Tanya" },
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
