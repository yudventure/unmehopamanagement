import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

import { isSecureRequest } from "@/lib/request-url";
import { SESSION_COOKIE, terbitkan } from "@/lib/session";
import {
  SANDI_MIN, emailSah, hashSandi, publik, rapikanEmail, semuaAkun, ubahAkun, type Akun,
} from "@/lib/server/akun";
import { alamatPeminta, catat } from "@/lib/server/batas";

/**
 * Penyiapan akun developer pertama (pola Fantasea, `api/penyiapan`).
 *
 * Hanya bisa sekali: selama belum ada akun satu pun. Dan hanya dengan kunci
 * penyiapan, supaya orang yang kebetulan membuka alamatnya lebih dulu tidak
 * bisa memiliki dashboard. Kuncinya `PENYIAPAN_KUNCI`; kalau itu kosong,
 * `DASHBOARD_PASSWORD` yang lama dipakai sebagai kunci, jadi pemilik yang
 * sudah mengisinya di hPanel tidak perlu menyiapkan apa pun. Keduanya kosong
 * di produksi berarti penyiapan ditolak: kunci yang tidak diisi tidak boleh
 * berarti pintu yang tidak dikunci.
 */
export const runtime = "nodejs";

const hash = (s: string) => createHash("sha256").update(s).digest();
const sama = (a: string, b: string) => timingSafeEqual(hash(a), hash(b));
const kunciPenyiapan = () =>
  (process.env.PENYIAPAN_KUNCI || process.env.DASHBOARD_PASSWORD || "").trim();
const tanpaKunciBoleh = () => process.env.NODE_ENV !== "production";

export async function GET() {
  return NextResponse.json({
    perlu: (await semuaAkun()).length === 0,
    kunciAda: Boolean(kunciPenyiapan()) || tanpaKunciBoleh(),
  });
}

export async function POST(req: Request) {
  if (catat(`penyiapan:${alamatPeminta(req)}`, 15 * 60 * 1000) > 5) {
    return NextResponse.json({ galat: "Terlalu banyak percobaan. Tunggu 15 menit." }, { status: 429 });
  }
  if ((await semuaAkun()).length > 0) {
    return NextResponse.json({ galat: "Akun sudah ada. Silakan masuk." }, { status: 409 });
  }

  const o = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const kunci = kunciPenyiapan();
  if (kunci) {
    if (typeof o.kunci !== "string" || !sama(o.kunci.trim(), kunci)) {
      return NextResponse.json({ galat: "Kunci penyiapan keliru." }, { status: 401 });
    }
  } else if (!tanpaKunciBoleh()) {
    return NextResponse.json(
      { galat: "Isi PENYIAPAN_KUNCI di panel hosting, lalu mulai ulang aplikasi." },
      { status: 403 },
    );
  }

  const email = rapikanEmail(o.email);
  const nama = typeof o.nama === "string" ? o.nama.trim().slice(0, 60) : "";
  const sandi = typeof o.sandi === "string" ? o.sandi : "";
  if (!nama) return NextResponse.json({ galat: "Isi nama." }, { status: 400 });
  if (!emailSah(email)) return NextResponse.json({ galat: "Periksa alamat email." }, { status: 400 });
  if (sandi.length < SANDI_MIN) {
    return NextResponse.json({ galat: `Kata sandi paling sedikit ${SANDI_MIN} huruf.` }, { status: 400 });
  }

  const akun: Akun = {
    email, nama, peran: "developer", scope: "Semua properti", aktif: true,
    sandi: await hashSandi(sandi), versi: 1, dibuat: new Date().toISOString(),
  };
  let dibuat = false;
  await ubahAkun((daftar) => {
    if (daftar.length > 0) return daftar;
    dibuat = true;
    return [akun];
  });
  if (!dibuat) return NextResponse.json({ galat: "Akun sudah ada. Silakan masuk." }, { status: 409 });

  const { value, maxAge } = await terbitkan(akun);
  const res = NextResponse.json({ ok: true, akun: publik(akun) });
  res.cookies.set(SESSION_COOKIE, value, {
    httpOnly: true, sameSite: "lax", secure: isSecureRequest(req), path: "/", maxAge,
  });
  return res;
}
