import "server-only";

import { bacaJson, ubahJson } from "./gudang";
import { bacaTabel, type Sel } from "./baca-tabel";

/**
 * Impor daftar pesanan dari ekspor Booking.com (Extranet, Pemesanan, unduh),
 * untuk satu sambungan.
 *
 * iCal Booking.com hanya membawa malam yang tertutup: tanpa nama tamu, harga,
 * atau jumlah kamar. Pesanan tiga kamar terbaca sebagai satu acara, jadi hanya
 * satu kamar yang terblokir. Ekspor pesanan membawa semuanya. Yang diimpor
 * menggantikan acara iCal dengan tanggal yang sama (lihat `bookingDariLuar`),
 * dan acara yang tidak punya pasangan di impor (pesanan yang masuk sesudah
 * ekspor) tetap terbaca seperti biasa.
 *
 * Disimpan di `impor-booking.json`, per sambungan, digabung menurut nomor
 * pemesanan: impor ulang memperbarui yang sudah ada dan menambah yang baru,
 * tidak menghapus pesanan lama yang tidak ada di ekspor yang lebih pendek.
 * Alamat dan surel tidak diambil.
 */
export interface PesananImpor {
  nomor: string;
  tamu: string;
  telepon: string;
  checkIn: string;
  checkOut: string;
  /** "ok" untuk pesanan yang berlaku; selain itu batal atau tidak datang. */
  status: string;
  kamar: number;
  orang: number | null;
  harga: number;
  komisiPersen: number | null;
  komisi: number;
  negara: string;
  dipesanPada: string;
  tipeUnit: string;
  catatan: string;
}

export interface Impor {
  tipeUnit: string;
  pada: string;
  oleh: string;
  pesanan: PesananImpor[];
}

const BERKAS = "impor-booking.json";

/** Judul kolom ekspor Booking.com, Indonesia dan Inggris. */
const KOLOM: Record<keyof Omit<PesananImpor, "status"> | "status", string[]> = {
  nomor: ["nomor pemesanan", "book number", "booking number", "reservation number"],
  tamu: ["nama tamu", "guest name(s)", "guest name", "guest names"],
  telepon: ["nomor telepon", "phone number", "phone"],
  checkIn: ["check-in", "check in", "arrival"],
  checkOut: ["check-out", "check out", "departure"],
  status: ["status"],
  kamar: ["kamar", "rooms", "units"],
  orang: ["orang", "persons", "people", "guests"],
  harga: ["harga", "price", "total price"],
  komisiPersen: ["komisi %", "commission %"],
  komisi: ["jumlah komisi", "commission amount"],
  negara: ["booker country", "negara pemesan"],
  dipesanPada: ["dipesan pada", "booked on", "booking date"],
  tipeUnit: ["tipe unit", "unit type", "room type"],
  catatan: ["catatan", "remarks", "notes"],
};

const TGL = /^\d{4}-\d{2}-\d{2}/;

/** Tanggal dari teks (YYYY-MM-DD, atau DD/MM/YYYY) atau angka tanggal Excel. */
function tanggal(v: Sel): string {
  if (typeof v === "number" && v > 20000 && v < 80000) return new Date(Date.UTC(1899, 11, 30) + Math.round(v) * 864e5).toISOString().slice(0, 10);
  const t = String(v).trim();
  if (TGL.test(t)) return t.slice(0, 10);
  const m = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})/.exec(t);
  return m ? `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}` : "";
}

/** "6400000 IDR", "IDR 6.400.000", 6400000 → 6400000. */
function rupiah(v: Sel): number {
  if (typeof v === "number") return Math.round(v);
  const t = String(v).replace(/[^\d.,]/g, "");
  if (!t) return 0;
  /* Pemisah ribuan titik atau koma tanpa desimal (IDR tidak berdesimal di ekspor ini). */
  const bersih = /[.,]\d{1,2}$/.test(t) && !/[.,]\d{3}[.,]/.test(t) ? t.replace(/[.,](\d{1,2})$/, "") : t;
  return Number(bersih.replace(/[.,]/g, "")) || 0;
}

const angka = (v: Sel) => {
  const n = typeof v === "number" ? v : Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : null;
};

const teks = (v: Sel, n: number) => (typeof v === "number" ? (Number.isInteger(v) ? String(v) : String(v)) : String(v ?? "")).trim().slice(0, n);

/** Membaca berkas ekspor menjadi pesanan. Melempar galat yang bisa dibaca orang. */
export function bacaEksporBooking(buf: Buffer): PesananImpor[] {
  const tabel = bacaTabel(buf);
  const iJudul = tabel.findIndex((b) => {
    const l = b.map((x) => String(x).trim().toLowerCase());
    return KOLOM.checkIn.some((k) => l.includes(k)) && KOLOM.nomor.some((k) => l.includes(k));
  });
  if (iJudul < 0) throw new Error("Kolom Nomor pemesanan dan Check-in tidak ditemukan. Pastikan ini berkas Pemesanan yang diunduh dari Extranet Booking.com.");
  const judul = tabel[iJudul].map((x) => String(x).trim().toLowerCase());
  const kol = Object.fromEntries(Object.entries(KOLOM).map(([k, nama]) => [k, judul.findIndex((j) => nama.includes(j))])) as Record<keyof typeof KOLOM, number>;
  const ambil = (b: Sel[], k: keyof typeof KOLOM): Sel => (kol[k] >= 0 ? (b[kol[k]] ?? "") : "");

  const hasil: PesananImpor[] = [];
  for (const b of tabel.slice(iJudul + 1)) {
    const nomor = teks(ambil(b, "nomor"), 30);
    const checkIn = tanggal(ambil(b, "checkIn"));
    const checkOut = tanggal(ambil(b, "checkOut"));
    if (!nomor || !checkIn || !checkOut || checkOut <= checkIn) continue;
    const kamar = Math.max(1, Math.min(30, Math.round(angka(ambil(b, "kamar")) ?? 1)));
    const orang = angka(ambil(b, "orang"));
    hasil.push({
      nomor,
      tamu: teks(ambil(b, "tamu"), 80),
      telepon: teks(ambil(b, "telepon"), 30),
      checkIn,
      checkOut,
      status: teks(ambil(b, "status"), 30).toLowerCase() || "ok",
      kamar,
      orang: orang !== null && orang > 0 && orang < 200 ? Math.round(orang) : null,
      harga: rupiah(ambil(b, "harga")),
      komisiPersen: angka(ambil(b, "komisiPersen")),
      komisi: rupiah(ambil(b, "komisi")),
      negara: teks(ambil(b, "negara"), 4).toUpperCase(),
      dipesanPada: teks(ambil(b, "dipesanPada"), 19),
      tipeUnit: teks(ambil(b, "tipeUnit"), 60),
      catatan: teks(ambil(b, "catatan"), 300),
    });
  }
  if (!hasil.length) throw new Error("Tidak ada baris pesanan yang bisa dibaca di berkas itu.");
  return hasil;
}

export const berlaku = (p: PesananImpor) => p.status === "ok" || p.status === "confirmed" || p.status === "berlaku";

export async function semuaImpor(): Promise<Record<string, Impor>> {
  const o = await bacaJson<Record<string, Impor>>(BERKAS, {});
  return o && typeof o === "object" ? o : {};
}

/** Menggabungkan menurut nomor pemesanan ke impor sambungan itu. */
export async function simpanImpor(sambunganId: string, tipeUnit: string, baru: PesananImpor[], oleh: string): Promise<Impor> {
  let hasil!: Impor;
  await ubahJson<Record<string, Impor>>(BERKAS, {}, (l) => {
    const lama = l[sambunganId];
    const peta = new Map((lama?.tipeUnit === tipeUnit ? lama.pesanan : []).map((p) => [p.nomor, p]));
    for (const p of baru) peta.set(p.nomor, p);
    hasil = { tipeUnit, pada: new Date().toISOString(), oleh: oleh.slice(0, 80), pesanan: [...peta.values()].sort((a, b) => a.checkIn.localeCompare(b.checkIn)) };
    return { ...l, [sambunganId]: hasil };
  });
  return hasil;
}

export async function hapusImpor(sambunganId: string): Promise<void> {
  await ubahJson<Record<string, Impor>>(BERKAS, {}, (l) => {
    const baru = { ...l };
    delete baru[sambunganId];
    return baru;
  });
}
