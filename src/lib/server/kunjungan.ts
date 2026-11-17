import "server-only";
import { createHash } from "node:crypto";

import { bacaJson, rahasiaSesi, ubahJson } from "./gudang";

/**
 * Penghitung kunjungan situs publik (Turtle dan Eddo), milik sendiri, tanpa
 * layanan luar.
 *
 * Menjaga privasi: tanpa cookie, alamat IP tidak disimpan. Pengunjung dikenali
 * dalam satu hari lewat sidik `sha256(rahasia|tanggal|ip|ua)` 16 huruf yang
 * tidak bisa dilacak ke hari lain. Do Not Track dan Global Privacy Control
 * dihormati, robot disaring, dan pengelola yang sedang masuk tidak dihitung
 * (dijaga di rute, bukan di sini).
 *
 * Negara: dari header yang diberikan server atau CDN bila ada. Kalau tidak,
 * diperkirakan dari bahasa peramban, dan itu perkiraan: pengunjung berbahasa
 * Inggris tanpa wilayah tidak diketahui negaranya dan dihitung terpisah.
 */

export type Situs = "turtle" | "eddo";
export const SITUS: Situs[] = ["turtle", "eddo"];

interface Hari {
  tampil: number;
  /** Sidik pengunjung hari itu. */
  unik: string[];
  /** Pengunjung unik per kode negara. */
  negara: Record<string, number>;
  /** Tampilan per halaman. */
  halaman: Record<string, number>;
}
interface Simpanan {
  hari: Record<string, Partial<Record<Situs, Hari>>>;
  /** Terakhir terlihat per sidik, untuk "aktif sekarang". */
  aktif: Record<string, { t: number; s: Situs }>;
}
const KOSONG: Simpanan = { hari: {}, aktif: {} };
const BERKAS = "kunjungan.json";
const SIMPAN_HARI = 400;
const AKTIF_MS = 5 * 60 * 1000;

/** Tanggal di zona situs (Papua), bukan zona server. */
export function tanggalWit(d = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jayapura", year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}
const geser = (t: string, n: number) => new Date(Date.parse(`${t}T00:00:00Z`) + n * 864e5).toISOString().slice(0, 10);

const ROBOT = /bot\b|crawl|spider|slurp|headless|lighthouse|pingdom|facebookexternalhit|preview|curl\/|wget|python-requests|httpclient|axios|go-http|java\/|monitor|uptime|check_http/i;
export const robot = (ua: string) => !ua || ROBOT.test(ua);

const BAHASA: Record<string, string> = { id: "ID", ja: "JP", fr: "FR", de: "DE", ru: "RU", zh: "CN", nl: "NL", es: "ES", it: "IT", ko: "KR", pt: "PT" };

/** Kode negara dua huruf, atau "" bila tidak diketahui. */
export function negaraDari(h: { negaraHeader: string; bahasa: string }): string {
  const kode = h.negaraHeader.trim().toUpperCase();
  if (/^[A-Z]{2}$/.test(kode) && kode !== "XX" && kode !== "T1") return kode;
  for (const bagian of h.bahasa.split(",")) {
    const tag = bagian.split(";")[0].trim();
    const wilayah = /^[a-z]{2,3}-([A-Za-z]{2})$/.exec(tag);
    if (wilayah) return wilayah[1].toUpperCase();
  }
  const dasar = h.bahasa.split(",")[0]?.split(";")[0].trim().toLowerCase().split("-")[0] ?? "";
  return BAHASA[dasar] ?? "";
}

export async function catatKunjungan(o: { situs: Situs; jalur: string; ip: string; ua: string; negara: string }) {
  const tgl = tanggalWit();
  const sidik = createHash("sha256").update(`${await rahasiaSesi()}|${tgl}|${o.ip}|${o.ua}`).digest("hex").slice(0, 16);
  const sekarang = Date.now();
  await ubahJson<Simpanan>(BERKAS, KOSONG, (s) => {
    const hari = { ...(s.hari ?? {}) };
    const sehari = { ...(hari[tgl] ?? {}) };
    const h: Hari = { tampil: 0, unik: [], negara: {}, halaman: {}, ...(sehari[o.situs] ?? {}) };
    h.tampil += 1;
    h.halaman = { ...h.halaman, [o.jalur]: (h.halaman[o.jalur] ?? 0) + 1 };
    if (!h.unik.includes(sidik)) {
      h.unik = [...h.unik, sidik];
      const k = o.negara || "??";
      h.negara = { ...h.negara, [k]: (h.negara[k] ?? 0) + 1 };
    }
    sehari[o.situs] = h;
    hari[tgl] = sehari;
    /* Membuang yang lebih tua dari 400 hari dan yang aktif sudah lama. */
    const batas = geser(tgl, -SIMPAN_HARI);
    for (const k of Object.keys(hari)) if (k < batas) delete hari[k];
    const aktif: Simpanan["aktif"] = {};
    for (const [k, v] of Object.entries(s.aktif ?? {})) if (sekarang - v.t < 15 * 60 * 1000) aktif[k] = v;
    aktif[`${o.situs}:${sidik}`] = { t: sekarang, s: o.situs };
    return { hari, aktif };
  });
}

export interface Statistik {
  situs: Situs[];
  diperbarui: string;
  aktif: number;
  hariIni: { unik: number; tampil: number };
  tujuhHari: { unik: number; tampil: number };
  tigaPuluhHari: { unik: number; tampil: number };
  /** Pengunjung unik per hari, terlama dulu. */
  seri: { tanggal: string; unik: number; tampil: number }[];
  /** Rincian satu hari. */
  detail: { tanggal: string; unik: number; tampil: number; negara: [string, number][]; halaman: [string, number][] };
  /** 30 hari terakhir. */
  negara30: { kode: string; n: number }[];
  /** Pengunjung 30 hari yang negaranya tidak diketahui. */
  tanpaNegara: number;
  mulai: string | null;
}

const jumlah = (a: Record<string, number>[]) => {
  const o: Record<string, number> = {};
  for (const x of a) for (const [k, v] of Object.entries(x)) o[k] = (o[k] ?? 0) + v;
  return o;
};

export async function bacaStatistik(situs: Situs[], rentang: 7 | 30, hariDipilih?: string): Promise<Statistik> {
  const s = await bacaJson<Simpanan>(BERKAS, KOSONG);
  const hariIni = tanggalWit();
  const ambil = (t: string): Hari[] => situs.map((x) => s.hari?.[t]?.[x]).filter((h): h is Hari => Boolean(h));
  const ringkas = (dari: number, sampai: number) => {
    let unik = 0, tampil = 0;
    for (let i = dari; i <= sampai; i++) for (const h of ambil(geser(hariIni, -i))) { unik += h.unik.length; tampil += h.tampil; }
    return { unik, tampil };
  };
  const seri = Array.from({ length: rentang }, (_, i) => {
    const t = geser(hariIni, -(rentang - 1 - i));
    const hs = ambil(t);
    return { tanggal: t, unik: hs.reduce((n, h) => n + h.unik.length, 0), tampil: hs.reduce((n, h) => n + h.tampil, 0) };
  });
  const tgl = hariDipilih && /^\d{4}-\d{2}-\d{2}$/.test(hariDipilih) ? hariDipilih : hariIni;
  const hd = ambil(tgl);
  const urut = (o: Record<string, number>, n: number): [string, number][] => Object.entries(o).sort((a, b) => b[1] - a[1]).slice(0, n);
  const negaraHari = jumlah(hd.map((h) => h.negara));
  delete negaraHari["??"];
  const n30: Record<string, number>[] = [];
  for (let i = 0; i < 30; i++) for (const h of ambil(geser(hariIni, -i))) n30.push(h.negara);
  const semuaNegara = jumlah(n30);
  const tanpaNegara = semuaNegara["??"] ?? 0;
  delete semuaNegara["??"];
  const aktif = new Set(
    Object.entries(s.aktif ?? {}).filter(([, v]) => Date.now() - v.t < AKTIF_MS && situs.includes(v.s)).map(([k]) => k),
  ).size;
  const hariAda = Object.keys(s.hari ?? {}).filter((t) => situs.some((x) => s.hari[t]?.[x])).sort();
  return {
    situs,
    diperbarui: new Date().toISOString(),
    aktif,
    hariIni: ringkas(0, 0),
    tujuhHari: ringkas(0, 6),
    tigaPuluhHari: ringkas(0, 29),
    seri,
    detail: {
      tanggal: tgl,
      unik: hd.reduce((n, h) => n + h.unik.length, 0),
      tampil: hd.reduce((n, h) => n + h.tampil, 0),
      negara: urut(negaraHari, 3),
      halaman: urut(jumlah(hd.map((h) => h.halaman)), 3),
    },
    negara30: urut(semuaNegara, 40).map(([kode, n]) => ({ kode, n })),
    tanpaNegara,
    mulai: hariAda[0] ?? null,
  };
}
