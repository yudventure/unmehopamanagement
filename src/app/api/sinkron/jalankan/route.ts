import { NextResponse } from "next/server";

import { akunMasuk, bolehLayar, tidakAda } from "@/lib/server/akses";
import { bacaSemua, daftarSambungan } from "@/lib/server/buku";

/** "Sinkronkan sekarang": membaca semua tautan saat itu juga, tidak menunggu 15 menit. */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const akun = await akunMasuk();
  if (!akun || !bolehLayar(akun, "sinkron")) return tidakAda();
  await bacaSemua(false);
  return NextResponse.json({ sambungan: await daftarSambungan() });
}
