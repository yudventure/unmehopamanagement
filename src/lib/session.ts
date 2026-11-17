import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

import { cariAkun, type Akun } from "@/lib/server/akun";
import { rahasiaSesi } from "@/lib/server/gudang";

/**
 * Siapa yang boleh masuk ke dashboard.
 *
 * Satu akun per orang (email + kata sandi, di `lib/server/akun.ts`). Cookie
 * sesi memuat email, versi sandi, dan batas waktu, ditandatangani dengan
 * rahasia dari `SESSION_SECRET` atau, kalau kosong, dari berkas di folder data
 * yang dibuat sekali. Jadi sesi selamat dari restart.
 *
 * Cookie hanya bukti bahwa kita yang menerbitkannya. Tiap pemeriksaan membuka
 * akunnya lagi: akun yang dinonaktifkan, dihapus, atau berganti sandi langsung
 * tidak lagi masuk, tanpa menunggu cookie-nya kedaluwarsa.
 */

export const SESSION_COOKIE = "unmehopa_session";

/** Delapan jam: satu hari kerja, dan cukup pendek supaya laptop pinjaman lupa. */
const TTL_SECONDS = 60 * 60 * 8;

async function tandai(isi: string) {
  return createHmac("sha256", await rahasiaSesi()).update(isi).digest("hex");
}

/** Konstan waktu, juga ketika panjangnya beda. */
export function samaString(a: string, b: string) {
  const kiri = Buffer.from(a);
  const kanan = Buffer.from(b);
  if (kiri.length !== kanan.length) {
    timingSafeEqual(kiri, kiri);
    return false;
  }
  return timingSafeEqual(kiri, kanan);
}

export async function terbitkan(akun: Pick<Akun, "email" | "versi">) {
  const habis = Math.floor(Date.now() / 1000) + TTL_SECONDS;
  const isi = Buffer.from(JSON.stringify({ e: akun.email, v: akun.versi, x: habis })).toString("base64url");
  return { value: `${isi}.${await tandai(isi)}`, maxAge: TTL_SECONDS };
}

/** Akun pemilik cookie itu, atau null kalau cookie palsu, habis, atau akunnya sudah tidak sah. */
export async function valid(cookie: string | undefined): Promise<Akun | null> {
  if (!cookie) return null;
  const [isi, tanda] = cookie.split(".");
  if (!isi || !tanda) return null;
  /* Tanda tangan dulu, baru isinya dibaca: cookie tak bertanda tidak boleh
     menentukan seberapa banyak kerja yang dilakukan. */
  if (!samaString(tanda, await tandai(isi))) return null;
  let o: { e?: unknown; v?: unknown; x?: unknown };
  try {
    o = JSON.parse(Buffer.from(isi, "base64url").toString("utf8"));
  } catch {
    return null;
  }
  if (typeof o.e !== "string" || typeof o.x !== "number") return null;
  if (o.x <= Math.floor(Date.now() / 1000)) return null;
  const akun = await cariAkun(o.e);
  if (!akun || !akun.aktif || akun.versi !== o.v) return null;
  return akun;
}
