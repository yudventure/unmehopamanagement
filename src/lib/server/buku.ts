import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

import { seedRooms } from "@/lib/data";
import { bacaIcal, buatIcal, rangkai } from "@/lib/ical.mjs";
import type { Booking, ChannelKey, Room, Sambungan } from "@/lib/types";
import { bacaJson, ubahJson } from "./gudang";

/**
 * Buku di server: kamar, pesanan yang dicatat di dashboard, dan sambungan
 * kalender ke situs luar. Berkas JSON di folder data (lihat `gudang.ts`),
 * dipakai selama database belum tersambung.
 *
 * Tiga berkas, supaya satu yang rusak tidak membawa yang lain:
 *   kamar.json       daftar kamar. Tidak ada berarti bawaan dari `data.ts`.
 *   pesanan.json     pesanan yang dicatat di dashboard.
 *   sambungan.json   sambungan iCal, dan malam yang terbaca dari tiap situs.
 */

const BERKAS_KAMAR = "kamar.json";
const BERKAS_PESANAN = "pesanan.json";
const BERKAS_SAMBUNGAN = "sambungan.json";

// ---------------------------------------------------------------- kamar

export async function ambilKamar(): Promise<Room[]> {
  const o = await bacaJson<{ kamar?: Room[] }>(BERKAS_KAMAR, {});
  return Array.isArray(o.kamar) ? o.kamar : seedRooms();
}

export async function simpanKamar(daftar: Room[]): Promise<void> {
  await ubahJson<{ kamar?: Room[] }>(BERKAS_KAMAR, {}, () => ({ kamar: daftar }));
}

// -------------------------------------------------------------- pesanan

export async function ambilPesanan(): Promise<Booking[]> {
  const o = await bacaJson<{ pesanan?: Booking[] }>(BERKAS_PESANAN, {});
  return Array.isArray(o.pesanan) ? o.pesanan : [];
}

export async function tambahPesanan(b: Booking): Promise<boolean> {
  let ada = false;
  await ubahJson<{ pesanan?: Booking[] }>(BERKAS_PESANAN, {}, (o) => {
    const daftar = Array.isArray(o.pesanan) ? o.pesanan : [];
    if (daftar.some((x) => x.id === b.id)) {
      ada = true;
      return { pesanan: daftar };
    }
    return { pesanan: [...daftar, b] };
  });
  return !ada;
}

export async function ubahPesanan(id: string, patch: Partial<Booking>): Promise<Booking | null> {
  let hasil: Booking | null = null;
  await ubahJson<{ pesanan?: Booking[] }>(BERKAS_PESANAN, {}, (o) => {
    const daftar = Array.isArray(o.pesanan) ? o.pesanan : [];
    return {
      pesanan: daftar.map((b) => {
        if (b.id !== id) return b;
        hasil = { ...b, ...patch, id: b.id, roomId: patch.roomId ?? b.roomId };
        return hasil;
      }),
    };
  });
  return hasil;
}

// ------------------------------------------------------------ sambungan

interface Acara {
  uid: string;
  mulai: string;
  selesai: string;
  ringkas: string;
}
interface Simpanan {
  sambungan: Sambungan[];
  /** Malam yang terbaca dari tiap sambungan, diganti seluruhnya tiap bacaan yang berhasil. */
  luar: Record<string, Acara[]>;
}
const KOSONG: Simpanan = { sambungan: [], luar: {} };

const buka = () => bacaJson<Simpanan>(BERKAS_SAMBUNGAN, KOSONG);
const ubahSimpanan = (f: (s: Simpanan) => Simpanan) =>
  ubahJson<Simpanan>(BERKAS_SAMBUNGAN, KOSONG, (s) =>
    f({ sambungan: Array.isArray(s.sambungan) ? s.sambungan : [], luar: s.luar ?? {} }),
  );

export async function daftarSambungan(): Promise<Sambungan[]> {
  const s = await buka();
  return Array.isArray(s.sambungan) ? s.sambungan : [];
}

const acak = (n: number) => randomBytes(n).toString("hex");

export async function tambahSambungan(o: { roomId: string; nama: string; url: string }): Promise<Sambungan> {
  const baru: Sambungan = {
    id: `SB${acak(5)}`,
    roomId: o.roomId,
    nama: o.nama,
    url: o.url,
    token: acak(16),
    dibuat: new Date().toISOString(),
  };
  await ubahSimpanan((s) => ({ ...s, sambungan: [...s.sambungan, baru] }));
  return baru;
}

export async function hapusSambungan(id: string): Promise<boolean> {
  let ada = false;
  await ubahSimpanan((s) => {
    ada = s.sambungan.some((x) => x.id === id);
    const luar = { ...s.luar };
    delete luar[id];
    return { sambungan: s.sambungan.filter((x) => x.id !== id), luar };
  });
  return ada;
}

export async function ubahSambungan(
  id: string,
  patch: { nama?: string; url?: string; tokenBaru?: boolean },
): Promise<Sambungan | null> {
  let hasil: Sambungan | null = null;
  await ubahSimpanan((s) => ({
    ...s,
    sambungan: s.sambungan.map((x) => {
      if (x.id !== id) return x;
      hasil = {
        ...x,
        ...(patch.nama !== undefined ? { nama: patch.nama } : {}),
        ...(patch.url !== undefined ? { url: patch.url, galat: undefined } : {}),
        ...(patch.tokenBaru ? { token: acak(16) } : {}),
      };
      return hasil;
    }),
  }));
  return hasil;
}

// ----------------------------------------------------------- membaca luar

/** Alamat yang tidak boleh didatangi server: mesinnya sendiri dan jaringan di sekitarnya. */
export function alamatDalam(host: string): boolean {
  const h = host.toLowerCase().replace(/^\[|\]$/g, "");
  return (
    h === "localhost" || h.endsWith(".local") || h.endsWith(".internal") ||
    (!h.includes(".") && !h.includes(":")) ||
    /^(127|10|0)\./.test(h) || /^192\.168\./.test(h) || /^169\.254\./.test(h) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(h) || /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./.test(h) ||
    h === "::1" || h === "::" || /^f[cd][0-9a-f]{2}:/.test(h) || /^fe80:/.test(h) ||
    /^::ffff:/.test(h)
  );
}

const izinkanLokal = () => process.env.SINKRON_IZINKAN_LOKAL === "1";

/** `webcal://` jadi `https://`; selain http dan https ditolak, juga alamat jaringan dalam. Null kalau tidak sah. */
export function rapikanUrl(mentah: string): string | null {
  const t = mentah.trim().replace(/^webcal:\/\//i, "https://");
  let u: URL;
  try {
    u = new URL(t);
  } catch {
    return null;
  }
  if (u.protocol !== "https:" && u.protocol !== "http:") return null;
  if (u.username || u.password) return null;
  if (!izinkanLokal() && alamatDalam(u.hostname)) return null;
  return u.toString();
}

/** Nama yang diterjemahkan DNS juga diperiksa, supaya nama biasa tidak bisa menunjuk ke jaringan dalam. */
async function amankanHost(host: string) {
  if (izinkanLokal()) return;
  if (isIP(host)) return;
  const semua = await lookup(host, { all: true });
  if (semua.some((a) => alamatDalam(a.address))) throw new Error("alamat-dalam");
}

const BATAS_BYTE = 5 * 1024 * 1024;

async function ambilTeks(url: string): Promise<string> {
  let sekarang = url;
  for (let lompat = 0; lompat < 4; lompat++) {
    const u = new URL(sekarang);
    if (!izinkanLokal() && alamatDalam(u.hostname)) throw new Error("alamat-dalam");
    await amankanHost(u.hostname);
    const r = await fetch(sekarang, {
      redirect: "manual",
      signal: AbortSignal.timeout(20_000),
      headers: { accept: "text/calendar, text/plain;q=0.8, */*;q=0.5", "user-agent": "UnmehopaKalender/1.0" },
    });
    if (r.status >= 300 && r.status < 400) {
      const ke = r.headers.get("location");
      if (!ke) throw new Error("http-3xx");
      sekarang = new URL(ke, sekarang).toString();
      continue;
    }
    if (!r.ok) throw new Error(`http-${r.status}`);
    const isi = r.body ? await bacaTerbatas(r.body) : "";
    return isi;
  }
  throw new Error("terlalu-banyak-pengalihan");
}

async function bacaTerbatas(tubuh: ReadableStream<Uint8Array>): Promise<string> {
  const pembaca = tubuh.getReader();
  const bagian: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await pembaca.read();
    if (done) break;
    total += value.byteLength;
    if (total > BATAS_BYTE) {
      await pembaca.cancel();
      throw new Error("terlalu-besar");
    }
    bagian.push(value);
  }
  return Buffer.concat(bagian).toString("utf8");
}

/** Pesan galat untuk pemilik, bukan kode. */
function pesanGalat(e: unknown): string {
  const m = e instanceof Error ? e.message : "";
  if (m === "bukan-ical") return "Isinya bukan kalender iCal. Periksa tautannya, biasanya berakhiran .ics.";
  if (m === "alamat-dalam") return "Alamat itu mengarah ke jaringan dalam dan ditolak.";
  if (m === "terlalu-besar") return "Kalender terlalu besar untuk dibaca.";
  if (m === "terlalu-banyak-pengalihan") return "Tautan dialihkan terlalu sering.";
  if (m === "http-404" || m === "http-410") return "Tautan tidak ditemukan di situs itu. Mungkin sudah diganti.";
  if (m === "http-401" || m === "http-403") return "Situs itu menolak tautannya. Mungkin perlu dibuat ulang.";
  if (/^http-/.test(m)) return `Situs itu menjawab ${m.slice(5)}.`;
  if (e instanceof Error && (e.name === "TimeoutError" || e.name === "AbortError")) return "Situs itu tidak menjawab dalam 20 detik.";
  return "Tidak bisa menghubungi situs itu.";
}

export async function bacaSambungan(id: string): Promise<Sambungan | null> {
  const s = (await buka()).sambungan?.find((x) => x.id === id);
  if (!s) return null;
  const sekarang = new Date().toISOString();
  if (!s.url) return s;
  let acara: Acara[] | null = null;
  let galat: string | undefined;
  try {
    acara = bacaIcal(await ambilTeks(s.url));
  } catch (e) {
    galat = pesanGalat(e);
  }
  let hasil: Sambungan | null = null;
  await ubahSimpanan((st) => ({
    sambungan: st.sambungan.map((x) => {
      if (x.id !== id) return x;
      /* Bacaan yang gagal tidak menghapus malam dari bacaan terakhir yang
         berhasil: situs yang sedang mati tidak boleh membuka kamar yang
         sebenarnya terisi. */
      hasil = acara
        ? { ...x, dicoba: sekarang, berhasil: sekarang, galat: undefined, jumlah: acara.length }
        : { ...x, dicoba: sekarang, galat };
      return hasil;
    }),
    luar: acara ? { ...st.luar, [id]: acara } : st.luar,
  }));
  return hasil;
}

const USANG_MS = 15 * 60 * 1000;
let sedangMembaca = false;

/** Membaca semua tautan (atau hanya yang bacaannya sudah lebih tua dari 15 menit). Satu putaran sekali jalan. */
export async function bacaSemua(hanyaUsang: boolean): Promise<void> {
  if (sedangMembaca) return;
  sedangMembaca = true;
  try {
    const sekarang = Date.now();
    const daftar = (await daftarSambungan()).filter((s) => s.url);
    const target = hanyaUsang
      ? daftar.filter((s) => !s.dicoba || sekarang - Date.parse(s.dicoba) > USANG_MS)
      : daftar;
    for (let i = 0; i < target.length; i += 4) {
      await Promise.all(target.slice(i, i + 4).map((s) => bacaSambungan(s.id)));
    }
  } finally {
    sedangMembaca = false;
  }
}

// ---------------------------------------------------------- jadi booking

function saluranDari(nama: string): ChannelKey {
  if (/booking\.?com/i.test(nama)) return "Booking.com";
  if (/traveloka/i.test(nama)) return "Traveloka";
  if (/agoda/i.test(nama)) return "Agoda";
  return "OTA lain";
}

const UMUM = /^(reserved|not available|unavailable|closed|blocked|busy|tidak tersedia|booked)\b/i;

/** Malam yang terbaca dari situs luar, dalam bentuk booking supaya kalender dan bentrok memperlakukannya sama. */
export async function bookingDariLuar(): Promise<Booking[]> {
  const s = await buka();
  const keluar: Booking[] = [];
  for (const sb of s.sambungan ?? []) {
    for (const a of s.luar?.[sb.id] ?? []) {
      const kunci = createHash("sha1").update(`${sb.id}|${a.uid}|${a.mulai}`).digest("hex").slice(0, 10);
      keluar.push({
        id: `ical-${sb.id}-${kunci}`,
        code: `IC-${kunci.slice(0, 5).toUpperCase()}`,
        roomId: sb.roomId,
        guest: a.ringkas && !UMUM.test(a.ringkas) ? a.ringkas : sb.nama,
        phone: "",
        pax: null,
        channel: saluranDari(sb.nama),
        checkIn: a.mulai,
        checkOut: a.selesai,
        total: 0,
        tanpaHarga: true,
        status: "Confirmed",
        notes: `Terbaca dari ${sb.nama} lewat iCal. Harga dan jumlah tamu tidak dikirim situs itu.`,
        src: "iCal",
        sumberNama: sb.nama,
      });
    }
  }
  return keluar;
}

// ----------------------------------------------------------------- ekspor

const tambahHari = (t: string, n: number) =>
  new Date(Date.parse(`${t}T00:00:00Z`) + n * 864e5).toISOString().slice(0, 10);

function malamDari(mulai: string, selesai: string): string[] {
  const out: string[] = [];
  for (let d = mulai, i = 0; d < selesai && i < 800; d = tambahHari(d, 1), i++) out.push(d);
  return out;
}

/**
 * Kalender ekspor satu sambungan, `/api/ical/<token>.ics`. Malam yang terisi
 * oleh pesanan di dashboard dan malam dari sambungan LAIN di kamar yang sama,
 * tapi tidak malam dari sambungan itu sendiri: kalau dikirim balik, blokir
 * yang dibaca dari sebuah situs akan kembali ke situs itu dan tidak pernah
 * terbuka lagi walau tamunya batal. Tanpa nama tamu, kode, atau kontak.
 * Null kalau tokennya tidak dikenal.
 */
export async function feedSambungan(token: string): Promise<string | null> {
  const s = await buka();
  const sb = (s.sambungan ?? []).find((x) => x.token === token);
  if (!sb) return null;
  const malam: string[] = [];
  for (const p of await ambilPesanan()) {
    if (p.roomId !== sb.roomId) continue;
    if (p.status === "Cancelled" || p.status === "Tidak datang") continue;
    malam.push(...malamDari(p.checkIn, p.checkOut));
  }
  for (const lain of s.sambungan ?? []) {
    if (lain.id === sb.id || lain.roomId !== sb.roomId) continue;
    for (const a of s.luar?.[lain.id] ?? []) malam.push(...malamDari(a.mulai, a.selesai));
  }
  const kamar = (await ambilKamar()).find((r) => r.id === sb.roomId);
  const acara = rangkai(malam).map((r) => ({
    uid: `${sb.id}-${r.mulai}@unmehopa`,
    mulai: r.mulai,
    selesai: r.selesai,
    ringkas: "Tidak tersedia",
  }));
  return buatIcal({ nama: `${kamar?.name ?? "Kamar"} Unmehopa`, prodid: "-//Unmehopa Management//Kalender//ID", acara });
}
