import { NextResponse } from "next/server";

import { aksesPenuh, lihatSemua } from "@/lib/peran";
import { akunMasuk, galat, tidakAda } from "@/lib/server/akses";
import { catat } from "@/lib/server/batas";
import { catatGalat } from "@/lib/server/galat";
import { hapusKunciAnthropic, infoKunciAnthropic, kunciAnthropic, simpanKunciAnthropic } from "@/lib/server/kunci";

/**
 * Kunci API pembaca screenshot, untuk layar Pengaturan.
 *
 *   GET     keadaan: ada atau tidak, dari mana, empat huruf terakhir
 *           (developer, pemilik, dan GM; GM hanya melihat)
 *   PUT     { kunci }  simpan          (developer dan pemilik)
 *   DELETE  hapus yang dari dashboard  (developer dan pemilik)
 *   POST    tes kunci ke layanan       (developer dan pemilik)
 *
 * Kuncinya tidak pernah dikirim balik. `ANTHROPIC_API_URL` opsional, untuk uji.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const akun = await akunMasuk();
  if (!akun || !lihatSemua(akun.peran)) return tidakAda();
  return NextResponse.json({ ...(await infoKunciAnthropic()), bolehUbah: aksesPenuh(akun.peran) });
}

export async function PUT(req: Request) {
  const akun = await akunMasuk();
  if (!akun || !aksesPenuh(akun.peran)) return tidakAda();
  const o = (await req.json().catch(() => ({}))) as { kunci?: unknown };
  const kunci = typeof o.kunci === "string" ? o.kunci.trim() : "";
  if (!kunci) return galat("Kunci kosong.");
  if (kunci.length < 20 || kunci.length > 300 || /\s/.test(kunci)) return galat("Kunci tidak sah: terpotong atau berisi spasi. Salin ulang seluruhnya.");
  if (!kunci.startsWith("sk-ant-")) return galat("Kunci Anthropic berawalan sk-ant-. Periksa bahwa yang disalin kunci yang benar.");
  await simpanKunciAnthropic(kunci, akun.nama);
  return NextResponse.json({ ...(await infoKunciAnthropic()), bolehUbah: true });
}

export async function DELETE() {
  const akun = await akunMasuk();
  if (!akun || !aksesPenuh(akun.peran)) return tidakAda();
  await hapusKunciAnthropic();
  return NextResponse.json({ ...(await infoKunciAnthropic()), bolehUbah: true });
}

/** Menanyakan daftar model: gratis, tidak membaca gambar, hanya memastikan kunci diterima. */
export async function POST() {
  const akun = await akunMasuk();
  if (!akun || !aksesPenuh(akun.peran)) return tidakAda();
  if (catat(`tes-pembaca:${akun.email}`, 60_000) > 6) return galat("Terlalu sering. Tunggu semenit.", 429);
  const { kunci } = await kunciAnthropic();
  if (!kunci) return NextResponse.json({ hasil: "belum-ada-kunci", pesan: "Kunci belum diisi." });
  let res: Response;
  try {
    res = await fetch(`${process.env.ANTHROPIC_API_URL ?? "https://api.anthropic.com"}/v1/models?limit=1`, {
      headers: { "x-api-key": kunci, "anthropic-version": "2023-06-01" },
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    return NextResponse.json({ hasil: "tidak-terhubung", pesan: "Tidak bisa menghubungi layanan dari server. Coba lagi sebentar." });
  }
  if (res.ok) return NextResponse.json({ hasil: "diterima", pesan: "Kunci diterima. Pembaca screenshot siap dipakai. Tes ini tidak membaca gambar dan tidak dikenai biaya." });
  if (res.status === 401 || res.status === 403) {
    await catatGalat("Pembaca screenshot", "Kunci API pembaca screenshot ditolak. Ganti kuncinya di Pengaturan.");
    return NextResponse.json({ hasil: "ditolak", pesan: "Kunci ditolak. Periksa bahwa kuncinya aktif dan tersalin utuh." });
  }
  return NextResponse.json({ hasil: "tidak-jelas", pesan: `Layanan menjawab ${res.status}. Kuncinya belum bisa dipastikan.` });
}
