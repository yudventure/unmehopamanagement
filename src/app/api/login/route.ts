import { NextResponse } from "next/server";

import { isSecureRequest } from "@/lib/request-url";
import { SESSION_COOKIE, terbitkan } from "@/lib/session";
import { cocokSandi, publik, rapikanEmail, semuaAkun } from "@/lib/server/akun";
import { alamatPeminta, catat } from "@/lib/server/batas";

/**
 * Masuk dan keluar dari dashboard.
 *
 *   POST  { email, password }   cocok, dan cookie sesi bertanda tangan kembali
 *   DELETE                      mengembalikan cookie
 *
 * Jawabannya sama untuk email yang tidak ada, sandi yang salah, dan akun yang
 * dinonaktifkan: tidak ada yang bisa dipelajari dari bedanya kecuali apakah
 * layak menebak lagi. Satu-satunya jawaban yang berbeda adalah 409 saat belum
 * ada akun sama sekali, supaya halaman menawarkan penyiapan.
 */
export const runtime = "nodejs";

export async function POST(req: Request) {
  const o = (await req.json().catch(() => ({}))) as { email?: unknown; password?: unknown };
  const email = rapikanEmail(o.email);
  const sandi = typeof o.password === "string" ? o.password : "";

  if (catat(`masuk:${alamatPeminta(req)}`, 15 * 60 * 1000) > 20) {
    return NextResponse.json({ error: "terlalu-banyak" }, { status: 429 });
  }

  const semua = await semuaAkun();
  if (semua.length === 0) return NextResponse.json({ error: "belum-ada-akun" }, { status: 409 });

  const akun = semua.find((a) => a.email === email);
  /* Selalu menghitung hash, ada atau tidak akunnya, supaya waktu jawab tidak
     membocorkan email mana yang terdaftar. */
  const cocok = await cocokSandi(sandi, akun?.sandi ?? "scrypt$00$00");
  if (!akun || !akun.aktif || !cocok) return NextResponse.json({ error: "no" }, { status: 401 });

  const { value, maxAge } = await terbitkan(akun);
  const res = NextResponse.json({ ok: true, akun: publik(akun) });
  res.cookies.set(SESSION_COOKIE, value, {
    httpOnly: true,
    sameSite: "lax",
    secure: isSecureRequest(req),
    path: "/",
    maxAge,
  });
  return res;
}

export async function DELETE(req: Request) {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: isSecureRequest(req),
    path: "/",
    maxAge: 0,
  });
  return res;
}
