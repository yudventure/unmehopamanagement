import { NextResponse } from "next/server";

import { aksesModul, aksesPenuh } from "@/lib/peran";
import { akunMasuk, galat, propertiBoleh, tidakAda } from "@/lib/server/akses";
import { unitSah } from "@/lib/server/modul";
import { semuaTtd, simpanTtd } from "@/lib/server/ttd";

/**
 * Tanda tangan dan stempel untuk sertifikat.
 *
 *   GET     gambar unit yang boleh dilihat akun ini (yang punya akses SDM)
 *   PUT     { unit, jenis: "ttd" | "stempel", gambar (data URL PNG), nama?, jabatan? }
 *   DELETE  { unit, jenis }
 *
 * Mengganti dan menghapus hanya developer, pemilik, dan general manager: tanda
 * tangan dan stempel adalah tanda pengesahan, jadi tidak bisa dipasang oleh
 * yang hanya memakainya.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BATAS = 700_000;
const bolehAtur = (p: Parameters<typeof aksesPenuh>[0]) => aksesPenuh(p) || p === "gm";

export async function GET() {
  const akun = await akunMasuk();
  if (!akun || !aksesModul(akun.peran, "sdm")) return tidakAda();
  const boleh = new Set<string>(propertiBoleh(akun));
  const semua = await semuaTtd();
  return NextResponse.json({
    unit: Object.fromEntries(Object.entries(semua).filter(([u]) => boleh.has(u))),
    bolehAtur: bolehAtur(akun.peran),
  });
}

export async function PUT(req: Request) {
  const akun = await akunMasuk();
  if (!akun || !bolehAtur(akun.peran)) return tidakAda();
  const o = (await req.json().catch(() => ({}))) as { unit?: unknown; jenis?: unknown; gambar?: unknown; nama?: unknown; jabatan?: unknown };
  if (!unitSah(o.unit) || !propertiBoleh(akun).includes(o.unit)) return galat("Unit tidak sah.");
  if (o.jenis !== "ttd" && o.jenis !== "stempel") return galat("Jenis tidak sah.");
  const gambar = typeof o.gambar === "string" ? o.gambar : "";
  if (!/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(gambar)) return galat("Gambar harus PNG.");
  if (gambar.length > BATAS) return galat("Gambar terlalu besar. Perkecil dulu.", 413);
  const nama = typeof o.nama === "string" ? o.nama.trim().slice(0, 80) : "";
  const jabatan = typeof o.jabatan === "string" ? o.jabatan.trim().slice(0, 80) : "";
  if (o.jenis === "ttd" && (!nama || !jabatan)) return galat("Isi nama dan jabatan pemilik tanda tangan.");
  await simpanTtd(o.unit, o.jenis, { gambar, oleh: akun.nama.slice(0, 80), pada: new Date().toISOString(), nama, jabatan });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const akun = await akunMasuk();
  if (!akun || !bolehAtur(akun.peran)) return tidakAda();
  const o = (await req.json().catch(() => ({}))) as { unit?: unknown; jenis?: unknown };
  if (!unitSah(o.unit) || !propertiBoleh(akun).includes(o.unit)) return galat("Unit tidak sah.");
  if (o.jenis !== "ttd" && o.jenis !== "stempel") return galat("Jenis tidak sah.");
  await simpanTtd(o.unit, o.jenis, null);
  return NextResponse.json({ ok: true });
}
