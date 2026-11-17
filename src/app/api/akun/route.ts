import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { aksesPenuh, rapikanPeran } from "@/lib/peran";
import { SESSION_COOKIE, valid } from "@/lib/session";
import {
  SANDI_MIN, emailSah, hashSandi, publik, rapikanEmail, semuaAkun, ubahAkun, type Akun,
} from "@/lib/server/akun";

/**
 * Kelola akun dashboard. Hanya developer dan pemilik; yang lain mendapat 404,
 * sama dengan rute lain yang tidak mengaku ada kepada yang tidak berhak.
 *
 *   GET                        daftar akun (tanpa sandi)
 *   POST  { nama, email, sandi, peran, scope }   tambah akun
 *   PATCH { email, aktif?, peran?, scope?, sandi? }   ubah akun
 *
 * Sandi baru menaikkan `versi`, jadi sesi lama akun itu langsung keluar.
 * Pemegang akses penuh terakhir tidak bisa dinonaktifkan atau diturunkan:
 * itu cara paling cepat mengunci diri sendiri dari dashboard.
 */
export const runtime = "nodejs";

async function pemanggil() {
  const jar = await cookies();
  const akun = await valid(jar.get(SESSION_COOKIE)?.value);
  return akun && aksesPenuh(akun.peran) ? akun : null;
}
const tolak = () => NextResponse.json({ error: "not-found" }, { status: 404 });
const galat = (g: string, status = 400) => NextResponse.json({ galat: g }, { status });
const scopeSah = (s: unknown) => (typeof s === "string" && s.trim() ? s.trim().slice(0, 60) : "Semua properti");

export async function GET() {
  if (!(await pemanggil())) return tolak();
  return NextResponse.json({ akun: (await semuaAkun()).map(publik) });
}

export async function POST(req: Request) {
  if (!(await pemanggil())) return tolak();
  const o = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const email = rapikanEmail(o.email);
  const nama = typeof o.nama === "string" ? o.nama.trim().slice(0, 60) : "";
  const sandi = typeof o.sandi === "string" ? o.sandi : "";
  if (!nama) return galat("Isi nama.");
  if (!emailSah(email)) return galat("Periksa alamat email.");
  if (sandi.length < SANDI_MIN) return galat(`Kata sandi paling sedikit ${SANDI_MIN} huruf.`);

  const baru: Akun = {
    email, nama, peran: rapikanPeran(o.peran), scope: scopeSah(o.scope), aktif: true,
    sandi: await hashSandi(sandi), versi: 1, dibuat: new Date().toISOString(),
  };
  let ada = false;
  await ubahAkun((daftar) => {
    if (daftar.some((a) => a.email === email)) {
      ada = true;
      return daftar;
    }
    return [...daftar, baru];
  });
  if (ada) return galat("Email itu sudah terdaftar.", 409);
  return NextResponse.json({ akun: publik(baru) });
}

export async function PATCH(req: Request) {
  const saya = await pemanggil();
  if (!saya) return tolak();
  const o = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const email = rapikanEmail(o.email);
  const sandiBaru = typeof o.sandi === "string" && o.sandi ? o.sandi : null;
  if (sandiBaru !== null && sandiBaru.length < SANDI_MIN) return galat(`Kata sandi paling sedikit ${SANDI_MIN} huruf.`);
  const hashBaru = sandiBaru ? await hashSandi(sandiBaru) : null;

  let hasil: Akun | null = null;
  let terkunci = false;
  await ubahAkun((daftar) => {
    const target = daftar.find((a) => a.email === email);
    if (!target) return daftar;
    const peran = o.peran === undefined ? target.peran : rapikanPeran(o.peran);
    const aktif = typeof o.aktif === "boolean" ? o.aktif : target.aktif;
    /* Setelah perubahan ini, harus masih ada satu pemegang akses penuh yang aktif. */
    const sisa = daftar.map((a) => (a.email === email ? { ...a, peran, aktif } : a));
    if (!sisa.some((a) => a.aktif && aksesPenuh(a.peran))) {
      terkunci = true;
      return daftar;
    }
    return daftar.map((a) => {
      if (a.email !== email) return a;
      hasil = {
        ...a, peran, aktif,
        scope: o.scope === undefined ? a.scope : scopeSah(o.scope),
        ...(hashBaru ? { sandi: hashBaru, versi: a.versi + 1 } : {}),
      };
      return hasil;
    });
  });
  if (terkunci) return galat("Harus tersisa satu developer atau pemilik yang aktif.", 409);
  if (!hasil) return galat("Akun tidak ditemukan.", 404);
  return NextResponse.json({ akun: publik(hasil) });
}
