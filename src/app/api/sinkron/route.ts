import { NextResponse } from "next/server";

import { akunMasuk, bolehLayar, galat, tidakAda } from "@/lib/server/akses";
import {
  ambilKamar, bacaSambungan, daftarSambungan, hapusSambungan, rapikanUrl, tambahSambungan, ubahSambungan,
} from "@/lib/server/buku";

/**
 * Sambungan kalender iCal ke situs luar. Situs apa pun, tidak dibatasi
 * daftar: Booking.com, Airbnb, Agoda, Tiket.com, agen perjalanan, atau
 * kalender lain yang bisa memberi tautan iCal. Namanya diketik pemilik.
 *
 *   GET                              daftar sambungan
 *   POST   { roomId, nama, url? }    tambah, langsung dibaca kalau ada url
 *   PATCH  { id, nama?, url?, tokenBaru? }   ubah, atau buat tautan ekspor baru
 *   DELETE { id }                    hapus
 *
 * Hanya akun yang punya layar Sinkronisasi.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const teks = (v: unknown, n: number) => (typeof v === "string" ? v.trim().slice(0, n) : "");

export async function GET() {
  const akun = await akunMasuk();
  if (!akun || !bolehLayar(akun, "sinkron")) return tidakAda();
  return NextResponse.json({ sambungan: await daftarSambungan() });
}

export async function POST(req: Request) {
  const akun = await akunMasuk();
  if (!akun || !bolehLayar(akun, "sinkron")) return tidakAda();
  const o = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const roomId = teks(o.roomId, 20);
  const nama = teks(o.nama, 60);
  const mentah = teks(o.url, 2000);
  if (!(await ambilKamar()).some((r) => r.id === roomId)) return galat("Pilih kamar yang ada.");
  if (!nama) return galat("Isi nama situsnya, misalnya Booking.com atau nama agen.");
  let url = "";
  if (mentah) {
    const rapi = rapikanUrl(mentah);
    if (!rapi) return galat("Tautan harus berawalan https:// (atau webcal://) dan bukan alamat jaringan dalam.");
    url = rapi;
  }
  const baru = await tambahSambungan({ roomId, nama, url });
  const dibaca = url ? await bacaSambungan(baru.id) : baru;
  return NextResponse.json({ sambungan: dibaca ?? baru });
}

export async function PATCH(req: Request) {
  const akun = await akunMasuk();
  if (!akun || !bolehLayar(akun, "sinkron")) return tidakAda();
  const o = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const id = teks(o.id, 40);
  const patch: { nama?: string; url?: string; tokenBaru?: boolean } = {};
  if (o.nama !== undefined) {
    const n = teks(o.nama, 60);
    if (!n) return galat("Nama situs tidak boleh kosong.");
    patch.nama = n;
  }
  if (o.url !== undefined) {
    const mentah = teks(o.url, 2000);
    if (mentah) {
      const rapi = rapikanUrl(mentah);
      if (!rapi) return galat("Tautan harus berawalan https:// (atau webcal://) dan bukan alamat jaringan dalam.");
      patch.url = rapi;
    } else patch.url = "";
  }
  if (o.tokenBaru === true) patch.tokenBaru = true;
  const baru = await ubahSambungan(id, patch);
  if (!baru) return galat("Sambungan tidak ditemukan.", 404);
  const dibaca = patch.url ? await bacaSambungan(id) : baru;
  return NextResponse.json({ sambungan: dibaca ?? baru });
}

export async function DELETE(req: Request) {
  const akun = await akunMasuk();
  if (!akun || !bolehLayar(akun, "sinkron")) return tidakAda();
  const o = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  if (!(await hapusSambungan(teks(o.id, 40)))) return galat("Sambungan tidak ditemukan.", 404);
  return NextResponse.json({ ok: true });
}
