import type { Screen } from "@/lib/types";

/**
 * Peran akun dashboard Unmehopa.
 *
 * Susunan perusahaannya: satu pemilik, satu general manager, manajer untuk
 * tiap unit (Turtle Dive Homestay, Eddo Homestay, Dive Center), HRD, keuangan,
 * dan public relation untuk media sosial. Developer memegang sistemnya.
 *
 * Manajer unit memakai peran yang sama, `manajer`, dan unitnya ditentukan oleh
 * `scope` akun (nama properti), yang sudah membatasi properti mana yang boleh
 * dilihat dan diubah.
 *
 * Peran yang tidak dikenal dianggap staf: gagal ke arah yang paling sempit.
 */
export type Peran =
  | "developer"
  | "pemilik"
  | "gm"
  | "manajer"
  | "hrd"
  | "keuangan"
  | "pr"
  | "staf";

export const PERAN: Peran[] = [
  "developer",
  "pemilik",
  "gm",
  "manajer",
  "hrd",
  "keuangan",
  "pr",
  "staf",
];

export const LABEL_PERAN: Record<Peran, string> = {
  developer: "Developer",
  pemilik: "Pemilik",
  gm: "General Manager",
  manajer: "Manajer unit",
  hrd: "HRD",
  keuangan: "Keuangan",
  pr: "Public Relation",
  staf: "Staf",
};

export const KET_PERAN: Record<Peran, string> = {
  developer: "Memegang sistem. Akses penuh, termasuk akun.",
  pemilik: "Akses penuh, termasuk akun.",
  gm: "Melihat semua unit dan angka rupiah. Tidak mengatur akun.",
  manajer: "Kalender dan kamar untuk unitnya saja. Tanpa angka rupiah.",
  hrd: "Melihat daftar pengguna dan perannya.",
  keuangan: "Laporan dan angka rupiah semua unit, serta kalender.",
  pr: "Mengelola isi website dan media sosial.",
  staf: "Kalender dan kamar di properti yang diizinkan. Tanpa angka rupiah.",
};

/* Akun yang dibuat sebelum peran ini dirinci memakai nama lama. */
const LAMA: Record<string, Peran> = { admin: "gm" };

export const rapikanPeran = (v: unknown): Peran => {
  if (typeof v === "string" && v in LAMA) return LAMA[v];
  return PERAN.includes(v as Peran) ? (v as Peran) : "staf";
};

/** Boleh menambah akun, mengubah peran, dan menonaktifkan orang lain. */
export const aksesPenuh = (p: Peran) => p === "developer" || p === "pemilik";

/** Melihat semua properti dan mengubah kamar. Manajer dibatasi ke unitnya. */
export const lihatSemua = (p: Peran) =>
  p === "developer" || p === "pemilik" || p === "gm";

/** Melihat angka rupiah. */
export const lihatUang = (p: Peran) =>
  p === "developer" || p === "pemilik" || p === "gm" || p === "keuangan";

/**
 * Layar yang boleh dibuka, dalam urutan menu. Disembunyikan di menu dan juga
 * tidak dirender, tetapi yang menjaga data tetap server: setiap rute API
 * memeriksa akunnya sendiri.
 */
export function layarUntuk(p: Peran): Screen[] {
  switch (p) {
    case "developer":
    case "pemilik":
      return ["ringkasan", "kalender", "laporan", "properti", "sinkron", "lama", "website", "pengguna"];
    case "gm":
      return ["ringkasan", "kalender", "laporan", "properti", "sinkron", "lama", "website", "pengguna"];
    case "manajer":
    case "staf":
      return ["ringkasan", "kalender", "properti"];
    case "keuangan":
      return ["ringkasan", "laporan", "kalender"];
    case "hrd":
      return ["ringkasan", "pengguna"];
    case "pr":
      return ["ringkasan", "website"];
  }
}
