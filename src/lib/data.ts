import type { ChannelKey, PropertyKey, Room } from "./types";

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
  "Sistem lama": { bg: "#EDEFF3", fg: "#3F4756", dot: "#7C8797", com: 0 },
  /* Komisi situs yang tidak dikenal tidak diketahui, bukan nol. Nol di sini
     hanya supaya hitungan tidak menebak; ubah saat tarif situsnya diketahui. */
  "OTA lain": { bg: "#E3EEF7", fg: "#1F4E79", dot: "#4A90C2", com: 0 },
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
  "Sistem lama": "Sistem lama",
  "OTA lain": "OTA lain",
};

export const PROPERTIES: {
  key: PropertyKey;
  name: string;
  location: string;
  /**
   * Menjual malam menginap. Dive centre tidak: yang dijadwalkannya sesi, dan
   * penandanya ada di sini supaya tiap layar yang memang soal kamar — form
   * booking, kartu properti, tabel sinkron — bisa melewatinya lewat satu
   * bidang, bukan lewat daftar pengecualian yang tercecer.
   */
  kamar: boolean;
}[] = [
  {
    key: "turtle",
    name: "Turtle Homestay",
    location: "Mansuar Kecil (Pulau Kri)",
    kamar: true,
  },
  {
    key: "eddo",
    name: "Eddo Homestay",
    location: "Yenbuba, Pulau Mansuar",
    kamar: true,
  },
  {
    /* Alamatnya sama dengan Turtle karena memang berjalan dari sana. Bukan
       tebakan: situs Eddo menulis bahwa homestay saudaranya yang menjalankan
       dive centre-nya, di kampung yang sama. */
    key: "divecenter",
    name: "Dive Center",
    location: "Mansuar Kecil (Pulau Kri)",
    kamar: false,
  },
];

/** Properti yang benar-benar punya kamar. Dipakai layar yang soal kamar. */
export const PROPERTIES_BERKAMAR = PROPERTIES.filter((p) => p.kamar);

export const TURTLE_RATES = {
  /** Per night, one person in the bungalow. */
  one: 850_000,
  /** Per night, two people. */
  two: 1_550_000,
  /** Per extra person, per night, by age on the day of arrival. */
  extraBed: { child: 200_000, teen: 400_000, adult: 600_000 },
} as const;

export function seedRooms(): Room[] {
  const rooms: Room[] = [];
  /* Ten bungalows of one kind. The family's price list offers one type,
     the Deluxe Bungalow, so the table is ten of it rather than two kinds
     invented to fill a grid; the calendar still has ten rows to fill.

     The rate here is the two-person one, because that is what a bungalow is
     usually sold as and the manager prices a booking from this column. The
     single rate lives beside it in `TURTLE_RATES` and the website reads it
     there. */
  for (let i = 1; i <= 10; i++) {
    rooms.push({
      id: "T" + i,
      prop: "turtle",
      name: "Turtle " + String(i).padStart(2, "0"),
      cap: "2 dewasa",
      rate: TURTLE_RATES.two,
      // Turtle 07 sits out the month under renovation (PRD F1.5).
      active: i !== 7,
    });
  }
  /* Eddo is five of one thing, not two of two. Each unit is a house of its
     own, so they share a rate and a capacity and differ only by number; the
     site shows one card and says how many there are, and the calendar still
     has five rows to fill.

     The rate is the owner's own figure, given on 17 September 2026. The
     capacity still carried over from the old "Eddo Bawah" and is the one
     number here nobody has confirmed. */
  for (let i = 1; i <= 5; i++) {
    rooms.push({
      id: "E" + i,
      prop: "eddo",
      name: "Rumah " + String(i).padStart(2, "0"),
      cap: "4 dewasa",
      rate: 1_350_000,
      active: true,
    });
  }
  return rooms;
}
