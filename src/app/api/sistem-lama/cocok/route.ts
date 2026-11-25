import { NextResponse } from "next/server";

import { akunMasuk, bolehLayar, galat, propertiBoleh, tidakAda } from "@/lib/server/akses";
import { catat } from "@/lib/server/batas";
import { cocokkanDenganLama } from "@/lib/server/cocok-lama";
import { bacaPengaturan } from "@/lib/server/pengaturan";
import { sistemLamaSiap } from "@/lib/sistem-lama";

/**
 * Mencocokkan pesanan Booking.com yang diimpor dengan sistem lama, dan
 * jadwal dive center dari sistem lama. Hanya akun yang memegang Turtle dan
 * punya layar Sistem lama. Hanya membaca.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const akun = await akunMasuk();
  if (!akun || !propertiBoleh(akun).includes("turtle") || !bolehLayar(akun, "lama")) return tidakAda();
  if (catat(`cocok-lama:${akun.email}`, 60_000) > 6) return galat("Terlalu sering. Tunggu semenit.", 429);
  const atur = await bacaPengaturan();
  if (!atur.sistemLamaAktif && !atur.jadwalLamaAktif) return galat("Sistem lama sedang dimatikan dari Pengaturan. Nyalakan sakelar \"Jadwal dive center dari sistem lama\" untuk mencocokkan.", 409);
  if (!sistemLamaSiap()) return galat("Alamat dan kata sandi sistem lama belum diisi di server.", 409);
  const q = new URL(req.url).searchParams.get("hariIni") ?? "";
  const hariIni = /^\d{4}-\d{2}-\d{2}$/.test(q) ? q : new Date().toISOString().slice(0, 10);
  const hasil = await cocokkanDenganLama(hariIni);
  if ("galat" in hasil) return galat(hasil.galat, 409);
  return NextResponse.json(hasil);
}
