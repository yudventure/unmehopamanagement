import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";

import { aksesPenuh } from "@/lib/peran";
import { akunMasuk, galat, tidakAda } from "@/lib/server/akses";
import { catat } from "@/lib/server/batas";

/**
 * Menguji bahwa server key yang terpasang diterima Midtrans, tanpa menagih
 * apa pun: menanyakan status sebuah pesanan yang pasti tidak ada. Kunci yang
 * benar dijawab "tidak ditemukan", kunci yang salah dijawab "ditolak".
 *
 * Hanya developer dan pemilik. Dibatasi 6 kali per menit.
 * `MIDTRANS_API_URL` opsional, untuk uji dengan Midtrans tiruan.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const akun = await akunMasuk();
  if (!akun || !aksesPenuh(akun.peran)) return tidakAda();
  if (catat(`tes-midtrans:${akun.email}`, 60_000) > 6) return galat("Terlalu sering. Tunggu semenit.", 429);

  const kunci = (process.env.MIDTRANS_SERVER_KEY ?? "").trim();
  if (!kunci) return NextResponse.json({ hasil: "belum-ada-kunci", pesan: "Server key belum terisi di server." });

  const produksi = process.env.MIDTRANS_IS_PRODUCTION === "true";
  const host = process.env.MIDTRANS_API_URL ?? (produksi ? "https://api.midtrans.com" : "https://api.sandbox.midtrans.com");
  let res: Response;
  try {
    res = await fetch(`${host}/v2/TES-KONEKSI-${randomBytes(6).toString("hex")}/status`, {
      headers: { Accept: "application/json", Authorization: `Basic ${Buffer.from(`${kunci}:`).toString("base64")}` },
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    return NextResponse.json({ hasil: "tidak-terhubung", pesan: "Tidak bisa menghubungi Midtrans dari server. Coba lagi sebentar." });
  }
  const isi = (await res.json().catch(() => ({}))) as { status_code?: string };
  const kode = String(isi.status_code ?? res.status);

  if (kode === "401" || res.status === 401) {
    return NextResponse.json({ hasil: "ditolak", mode: produksi ? "produksi" : "sandbox", pesan: "Midtrans menolak server key ini. Periksa bahwa kuncinya cocok dengan mode (sandbox atau produksi) dan tidak terpotong saat disalin." });
  }
  if (kode === "404" || res.status === 404) {
    return NextResponse.json({ hasil: "diterima", mode: produksi ? "produksi" : "sandbox", pesan: "Midtrans menerima server key ini. Tidak ada pembayaran yang dibuat atau ditagih oleh tes ini." });
  }
  return NextResponse.json({ hasil: "tidak-jelas", pesan: `Midtrans menjawab ${kode}. Kuncinya belum bisa dipastikan.` });
}
