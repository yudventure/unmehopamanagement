/**
 * Tiga unit yang dikelola, dan yang ketiga bukan homestay.
 *
 * Dive centre-nya milik Turtle — Eddo tidak punya sendiri, dan situsnya
 * menyebut itu. Ia berdiri sebagai unit tersendiri di sini karena yang
 * dijadwalkannya bukan kamar melainkan sesi: Diving, Snorkeling, SSI Dive
 * Course, Excursion Trip, Transport. Tanpa barisnya sendiri di penyaring,
 * jadwal itu hanya bisa dilihat bercampur dengan booking kamar.
 */
export type PropertyKey = "turtle" | "eddo" | "divecenter";

export type ChannelKey =
  | "Booking.com"
  | "Traveloka"
  | "Agoda"
  | "WhatsApp"
  | "Blokir"
  /**
   * Booking yang dibaca dari sistem staf Turtle yang lama.
   *
   * Saluran sendiri, bukan ditebak jadi salah satu di atas. `adminList` tidak
   * mengirim dari mana tamunya datang, dan menaruhnya di "WA / langsung"
   * karena kebanyakan begitu berarti laporan per saluran memuat angka yang
   * tidak pernah dicatat siapa pun. Komisinya nol, karena nol adalah yang
   * diketahui — bukan karena dipastikan tidak ada.
   */
  | "Sistem lama"
  /**
   * Situs pemesanan atau agen perjalanan mana pun yang tersambung lewat iCal
   * dan tidak punya saluran sendiri di atas (Airbnb, Tiket.com, Expedia,
   * agen lokal, dan seterusnya). Namanya yang sebenarnya ada di
   * `Booking.sumberNama`.
   */
  | "OTA lain";

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
  | "ringkasan"
  | "kalender"
  | "laporan"
  | "properti"
  | "sinkron"
  /** Read-only view onto the client's old Turtle staff system. Owner only. */
  | "lama"
  | "website"
  | "statistik"
  /** Akuntansi per unit: pemasukan, pengeluaran, aset. */
  | "keuangan"
  /** Pegawai per unit: absensi, gaji, asuransi kesehatan, inventaris. */
  | "sdm"
  /** Stok gudang per unit: barang pelayanan dan operasional. */
  | "gudang"
  | "pengaturan"
  | "pengguna";

/**
 * Satu sambungan kalender iCal antara sebuah kamar dan satu situs luar. Situs
 * apa pun: Booking.com, Airbnb, Agoda, Tiket.com, agen perjalanan, atau
 * Google Calendar. `url` kosong berarti sambungan hanya mengirim (agen yang
 * membaca tautan ekspor kita tapi tidak punya tautan untuk dibaca).
 */
export interface Sambungan {
  id: string;
  roomId: string;
  /** Nama situs seperti diketik pemilik. Tidak dibatasi daftar. */
  nama: string;
  url: string;
  /** Rahasia di tautan ekspor `/api/ical/<token>.ics`. */
  token: string;
  dibuat: string;
  dicoba?: string;
  berhasil?: string;
  galat?: string;
  /** Jumlah acara pada bacaan terakhir yang berhasil. */
  jumlah?: number;
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
  /**
   * Harganya tidak diketahui, bukan nol.
   *
   * Dipasang pada booking yang dibaca dari sistem lama: `adminList` tidak
   * mengirim harga. `total` tetap 0 supaya tipenya sederhana, tapi penanda ini
   * yang menentukan — hitungan pendapatan, komisi, dan piutang melewatinya,
   * dan layar mengatakan berapa malam yang belum berharga alih-alih
   * menampilkan Rp 0 seolah itu harganya.
   */
  tanpaHarga?: boolean;
  /** Nama situs atau agen asal booking dari sinkron iCal, apa adanya. */
  sumberNama?: string;
  /** Set only when the booking is actually changed in-session. */
  updatedAt?: string;
  updatedBy?: string;
}

import type { Peran } from "@/lib/peran";

export interface User {
  id: string;
  peran: Peran;
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
  peran: Peran;
  scope: string;
  /** Kata sandi awal; orangnya menggantinya lewat developer atau pemilik. */
  sandi: string;
}
