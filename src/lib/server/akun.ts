import "server-only";
import { randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

import { rapikanPeran, type Peran } from "@/lib/peran";
import { bacaJson, ubahJson } from "./gudang";

const scrypt = promisify(scryptCb) as (pw: string, salt: Buffer, len: number) => Promise<Buffer>;

/**
 * Akun dashboard, satu per orang. Tidak ada sandi bawaan dan tidak ada akun
 * contoh: akun developer pertama dibuat lewat penyiapan (`/api/penyiapan`),
 * lalu ia menambah yang lain dari halaman Pengguna.
 *
 * `versi` naik tiap sandi diganti, jadi sesi lama di perangkat lain keluar.
 */
export interface Akun {
  email: string;
  nama: string;
  peran: Peran;
  /** "Semua properti" atau nama satu properti, sama dengan `User.scope`. */
  scope: string;
  aktif: boolean;
  sandi: string;
  versi: number;
  dibuat: string;
}
export type AkunPublik = Omit<Akun, "sandi" | "versi">;

const BERKAS = "akun.json";
const bawaan = { akun: [] as Akun[] };

export const SANDI_MIN = 10;
export const rapikanEmail = (e: unknown) =>
  typeof e === "string" ? e.trim().toLowerCase().slice(0, 120) : "";
export const emailSah = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

export async function hashSandi(sandi: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scrypt(sandi, salt, 64);
  return ["scrypt", salt.toString("hex"), hash.toString("hex")].join("$");
}

export async function cocokSandi(sandi: string, simpanan: string): Promise<boolean> {
  const [jenis, saltHex, hashHex] = simpanan.split("$");
  if (jenis !== "scrypt" || !saltHex || !hashHex) return false;
  const hash = await scrypt(sandi, Buffer.from(saltHex, "hex"), 64);
  const benar = Buffer.from(hashHex, "hex");
  return benar.length === hash.length && timingSafeEqual(benar, hash);
}

export async function semuaAkun(): Promise<Akun[]> {
  const o = await bacaJson(BERKAS, bawaan);
  return (Array.isArray(o.akun) ? o.akun : []).map((a) => ({
    ...a,
    peran: rapikanPeran(a.peran),
    scope: a.scope || "Semua properti",
    aktif: a.aktif !== false,
  }));
}

export async function cariAkun(email: string): Promise<Akun | null> {
  const e = rapikanEmail(email);
  return (await semuaAkun()).find((a) => a.email === e) ?? null;
}

export function ubahAkun(ubah: (daftar: Akun[]) => Akun[]): Promise<Akun[]> {
  return ubahJson(BERKAS, bawaan, (o) => ({ akun: ubah(Array.isArray(o.akun) ? o.akun : []) })).then((o) => o.akun);
}

export const publik = ({ sandi: _s, versi: _v, ...sisa }: Akun): AkunPublik => sisa;
