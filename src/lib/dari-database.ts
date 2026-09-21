import { iso } from "./format";
import type { Booking, ChannelKey, BookingStatus, PropertyKey, Room } from "./types";

/**
 * Menerjemahkan jawaban `/api/calendar` menjadi bentuk yang dipakai layar.
 *
 * ## Kenapa ada lapisan ini
 *
 * Database mengikuti handoff teknis; layar tumbuh dari prototipe. Keduanya
 * benar untuk keperluannya masing-masing dan tidak sama. Menaruh penerjemahnya
 * di satu berkas membuat tiap ketidaksamaan itu punya satu tempat untuk
 * dijelaskan — dan membuat yang hilang di perjalanan bisa dihitung, bukan
 * ditemukan nanti sebagai angka yang salah di layar.
 *
 * ## Yang tidak sama, dan keputusannya
 *
 * **`WALK_IN`.** Database punya salurannya sendiri; layar tidak. Itu bukan
 * kelalaian: `CHANNEL_LABELS` menamai WhatsApp sebagai "WA / langsung" dan
 * menyebutkan tamu yang datang langsung dicatat di sana. Jadi pemetaannya
 * mengikuti keputusan yang sudah diambil, bukan membuat yang baru.
 *
 * **`BLOCKED`.** Di database ini status; di layar ia saluran bernama "Blokir".
 * Pembalikannya persis yang ditulis `prisma/seed.ts` ke arah sebaliknya, jadi
 * keduanya tetap cocok bolak-balik.
 *
 * **`CONFLICT`.** Layar tidak mengenalnya sebagai status karena ia tidak
 * menyimpan bentrok — ia menurunkannya, dengan `findConflicts` mencari malam
 * yang terjual dua kali. Baris CONFLICT adalah booking yang memang memegang
 * malam yang sudah dipegang yang lain, jadi diserahkan sebagai Confirmed ia
 * akan ditemukan mesin yang sama dan muncul di banner serta modal bentrok yang
 * sudah ada. Menerjemahkannya jadi sesuatu yang lain justru menyembunyikannya.
 *
 * **`NO_SHOW`.** Tidak ada padanannya, dan tiga status terdekat semuanya
 * berbohong: Cancelled bilang ada yang membatalkan, Confirmed bilang tamunya
 * ada, Checked-out bilang ia sempat menginap. Jadi `BookingStatus` yang
 * ditambah satu.
 *
 * **`pax`.** Boleh kosong di database, dan sering kosong: feed iCal OTA jarang
 * membawa jumlah tamu. Null diteruskan apa adanya sampai ke layar, yang
 * menulisnya "belum dicatat". Diisi angka di sini, booking impor akan mengaku
 * tahu sesuatu yang tidak pernah dikirim kepadanya.
 */

/** Kamar seperti yang dikirim `/api/calendar`. */
export interface ApiRoom {
  id: string;
  propertyId: string;
  name: string;
  capAdult: number;
  capChild: number;
  baseRate: number;
  isActive: boolean;
  sortOrder: number;
}

/** Booking seperti yang dikirim `/api/calendar`. */
export interface ApiBooking {
  id: string;
  code: string;
  roomId: string;
  guest: string | null;
  phone: string | null;
  pax: number | null;
  checkIn: string;
  checkOut: string;
  channel: string;
  status: string;
  source: string;
  totalAmount: number | null;
  notes: string | null;
  conflictGroup: string | null;
  /** Timestamp ISO utuh. Dipotong jadi tanggal di sini, bukan di server. */
  createdAt: string;
  /** Null berarti belum ada pembayaran tercatat, bukan nol. */
  paid: number | null;
}

export interface ApiKalender {
  configured: boolean;
  from?: string;
  to?: string;
  rooms?: ApiRoom[];
  bookings?: ApiBooking[];
}

const SALURAN: Record<string, ChannelKey> = {
  BOOKING_COM: "Booking.com",
  TRAVELOKA: "Traveloka",
  AGODA: "Agoda",
  WHATSAPP: "WhatsApp",
  /* Bukan saluran tersendiri di layar, sesuai keterangan di CHANNEL_LABELS. */
  WALK_IN: "WhatsApp",
  BLOCK: "Blokir",
};

const STATUS: Record<string, BookingStatus> = {
  TENTATIVE: "Tentative",
  CONFIRMED: "Confirmed",
  CHECKED_IN: "Checked-in",
  CHECKED_OUT: "Checked-out",
  CANCELLED: "Cancelled",
  NO_SHOW: "Tidak datang",
  /* Diserahkan sebagai Confirmed supaya `findConflicts` menemukannya. */
  CONFLICT: "Confirmed",
  /* Di layar sebuah blokir adalah saluran, bukan status. Ditangani di bawah. */
  BLOCKED: "Confirmed",
};

/**
 * Dua angka kapasitas jadi satu kalimat.
 *
 * Kebalikan persis dari `kapasitas()` di `prisma/seed.ts`, yang mengurai
 * kalimat yang sama menjadi dua angka. Keduanya harus tetap sepasang: yang
 * satu menulis ke database, yang satu membacanya kembali.
 */
export function kapasitasKalimat(capAdult: number, capChild: number): string {
  const dewasa = `${capAdult} dewasa`;
  return capChild > 0 ? `${dewasa} + ${capChild} anak` : dewasa;
}

/** Properti yang dikenal layar. Selain ini barisnya dilewati, bukan ditebak. */
function propertiDikenal(id: string): id is PropertyKey {
  return id === "turtle" || id === "eddo" || id === "divecenter";
}

export function kamarDariApi(rows: ApiRoom[]): Room[] {
  const out: Room[] = [];
  for (const r of rows) {
    /* Properti yang tidak dikenal layar dilewati, tidak dipaksa jadi salah
       satu dari dua yang ada. Sebuah kamar yang muncul di bawah homestay yang
       salah lebih buruk daripada kamar yang belum muncul. */
    if (!propertiDikenal(r.propertyId)) continue;
    out.push({
      id: r.id,
      prop: r.propertyId,
      name: r.name,
      cap: kapasitasKalimat(r.capAdult, r.capChild),
      rate: r.baseRate,
      active: r.isActive,
    });
  }
  return out;
}

export function bookingDariApi(rows: ApiBooking[]): Booking[] {
  const out: Booking[] = [];
  for (const b of rows) {
    const saluran = SALURAN[b.channel];
    const status = STATUS[b.status];
    /* Enum yang belum dikenal berarti database lebih baru daripada layar ini.
       Dilewati, karena menggambar baris dengan saluran atau status yang
       ditebak berarti kalender yang meyakinkan dan salah. Yang terlewat
       terhitung di `terlewat` supaya layarnya bisa mengatakannya. */
    if (!saluran || !status) continue;

    out.push({
      id: b.id,
      code: b.code,
      roomId: b.roomId,
      guest: b.guest ?? "",
      phone: b.phone ?? "",
      pax: b.pax,
      /* Blokir menang atas saluran apa pun yang tercatat: yang penting bagi
         kalender adalah kamarnya terkunci dan tidak ada tamu di baliknya. */
      channel: b.status === "BLOCKED" ? "Blokir" : saluran,
      checkIn: b.checkIn,
      checkOut: b.checkOut,
      total: b.totalAmount ?? 0,
      /* Nominal yang tidak pernah dicatat, bukan menginap yang gratis.
         Penandanya sama dengan yang dipakai jalur sistem lama, dan alasannya
         sama: tanpa itu `total: 0` ikut terjumlah sebagai pendapatan nol
         rupiah, yang di layar terbaca persis seperti kamar yang terjual
         seharga nol. Piutangnya pun jadi salah — booking yang tagihannya
         belum diketahui akan terhitung lunas. */
      tanpaHarga: b.totalAmount === null,
      status,
      notes: b.notes ?? "",
      src: b.source === "ICAL" ? "iCal" : "manual",
      /* Tanggal kalender menurut jam pembacanya, lewat `iso()` yang sama yang
         dipakai layar ini menghitung "hari ini". Keduanya harus satu dasar:
         beda dasar berarti booking yang baru masuk terhitung besok. */
      createdAt: iso(new Date(b.createdAt)),
      /* Null diterjemahkan jadi undefined, bukan 0: keduanya berarti "belum
         ada yang dicatat", dan 0 berarti "sudah dihitung, hasilnya nol". */
      paid: b.paid ?? undefined,
    });
  }
  return out;
}

/** Berapa baris yang tidak bisa diterjemahkan, supaya bisa dikatakan. */
export function terlewat(rows: ApiBooking[]): number {
  return rows.filter((b) => !SALURAN[b.channel] || !STATUS[b.status]).length;
}
