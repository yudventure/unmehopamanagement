export type PropertyKey = "turtle" | "eddo";

export type ChannelKey =
  | "Booking.com"
  | "Traveloka"
  | "Agoda"
  | "WhatsApp"
  | "Blokir";

/**
 * "Tidak datang" ada di sini karena database bisa memuatnya (`NO_SHOW` di
 * handoff teknis bagian 3.4) dan tiga status terdekat semuanya menyatakan
 * sesuatu yang lain: Cancelled bilang ada yang membatalkan, Confirmed bilang
 * tamunya ada, Checked-out bilang ia sempat menginap.
 */
export type BookingStatus =
  | "Tentative"
  | "Confirmed"
  | "Checked-in"
  | "Checked-out"
  | "Cancelled"
  | "Tidak datang";

export type BookingSource = "manual" | "iCal";

export type Role = "owner" | "staf";

export type Screen =
  | "kalender"
  | "laporan"
  | "properti"
  | "sinkron"
  | "website"
  | "pengguna";

/** An OTA calendar pulled into a room. One room may carry several. */
export interface IcalFeed {
  id: string;
  roomId: string;
  channel: ChannelKey;
  url: string;
  /** When the owner added it. Sync state stays empty until a backend runs. */
  addedAt: string;
}

/** The secret in a room's outgoing feed URL, resettable. */
export interface ExportToken {
  roomId: string;
  token: string;
  createdAt: string;
}

export interface Room {
  id: string;
  prop: PropertyKey;
  name: string;
  cap: string;
  /** Base rate per night, in rupiah. */
  rate: number;
  active: boolean;
}

export interface Booking {
  /** Kunci baris. Dari database ini cuid; pada data contoh sama dengan `code`. */
  id: string;
  /** Kode yang diucapkan ke tamu lewat telepon, dan yang muncul di layar. */
  code: string;
  roomId: string;
  guest: string;
  phone: string;
  /**
   * Jumlah tamu. Null berarti belum diketahui — feed iCal OTA sering tidak
   * membawanya, dan angka bawaan akan membuat booking impor mengaku tahu
   * sesuatu yang tidak pernah dikirim kepadanya.
   */
  pax: number | null;
  channel: ChannelKey;
  /** Plain date, YYYY-MM-DD. */
  checkIn: string;
  /** Plain date, YYYY-MM-DD. Exclusive — the guest leaves this morning. */
  checkOut: string;
  total: number;
  status: BookingStatus;
  notes: string;
  src: BookingSource;
  /**
   * Kapan booking ini masuk ke buku, `YYYY-MM-DD`. Dipakai "booking baru
   * minggu ini" di PRD F6.1. Undefined berarti tidak tercatat — booking lama
   * yang dipindahkan dari catatan sebelum sistem ini ada tidak punya tanggal
   * masuk, dan menebaknya berarti mengarang.
   */
  createdAt?: string;
  /**
   * Berapa yang sudah benar-benar dibayar dan tercatat, dari tabel `payments`.
   * Undefined berarti belum ada pembayaran yang dicatat untuk booking ini —
   * bukan berarti nol. Bedanya penting: piutang yang dihitung dari "belum
   * tercatat" sama dengan seluruh pendapatan, dan angka itu akan salah besar.
   */
  paid?: number;
  /** Set only when the booking is actually changed in-session. */
  updatedAt?: string;
  updatedBy?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: "Owner" | "Staf";
  scope: string;
  active: boolean;
}

export interface BookingForm {
  property: PropertyKey;
  room: string;
  checkIn: string;
  checkOut: string;
  guest: string;
  phone: string;
  pax: number | string;
  channel: ChannelKey;
  notes: string;
}

export interface InviteForm {
  name: string;
  email: string;
  role: "Owner" | "Staf";
  scope: string;
}
