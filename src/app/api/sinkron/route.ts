import { NextResponse } from "next/server";

import { akunMasuk, bolehLayar, galat, propertiBoleh, propertiKamar, tidakAda } from "@/lib/server/akses";
import type { Akun } from "@/lib/server/akun";
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
 *   PATCH  { id, nama?, url?, tokenBaru?, kamarLain? }   ubah, buat tautan ekspor baru,
 *          atau bagikan bacaannya ke kamar lain dalam tipe yang sama
 *   DELETE { id }                    hapus
 *
 * Hanya akun yang punya layar Sinkronisasi.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const teks = (v: unknown, n: number) => (typeof v === "string" ? v.trim().slice(0, n) : "");

/** Kamar itu ada di unit yang boleh disentuh akun ini. */
async function kamarBoleh(a: Akun, roomId: string) {
  const prop = await propertiKamar(roomId);
  return prop !== null && propertiBoleh(a).includes(prop);
}

/** Sambungan itu terikat ke kamar di unit akun ini. */
async function sambunganBoleh(a: Akun, id: string) {
  const s = (await daftarSambungan()).find((x) => x.id === id);
  return Boolean(s) && (await kamarBoleh(a, s!.roomId));
}

export async function GET() {
  const akun = await akunMasuk();
  if (!akun || !bolehLayar(akun, "sinkron")) return tidakAda();
  const semua = await daftarSambungan();
  const boleh: typeof semua = [];
  for (const s of semua) if (await kamarBoleh(akun, s.roomId)) boleh.push(s);
  return NextResponse.json({ sambungan: boleh });
}

export async function POST(req: Request) {
  const akun = await akunMasuk();
  if (!akun || !bolehLayar(akun, "sinkron")) return tidakAda();
  const o = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const roomId = teks(o.roomId, 20);
  const nama = teks(o.nama, 60);
  const mentah = teks(o.url, 2000);
  if (!(await ambilKamar()).some((r) => r.id === roomId)) return galat("Pilih kamar yang ada.");
  if (!(await kamarBoleh(akun, roomId))) return galat("Kamar itu bukan di unit Anda.", 403);
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
  if (!(await sambunganBoleh(akun, id))) return galat("Sambungan tidak ditemukan.", 404);
  const patch: { nama?: string; url?: string; tokenBaru?: boolean; kamarLain?: string[] } = {};
  if (o.kamarLain !== undefined) {
    if (!Array.isArray(o.kamarLain) || o.kamarLain.length > 40) return galat("Daftar kamar tidak sah.");
    const utama = (await daftarSambungan()).find((x) => x.id === id)!;
    const kamar = await ambilKamar();
    const propUtama = kamar.find((r) => r.id === utama.roomId)?.prop;
    const ids = [...new Set(o.kamarLain.map((v) => teks(v, 20)).filter((v) => v && v !== utama.roomId))];
    for (const r of ids) {
      const k = kamar.find((x) => x.id === r);
      if (!k || k.prop !== propUtama) return galat("Kamar lain harus kamar yang ada, di unit yang sama.");
      if (!(await kamarBoleh(akun, r))) return galat("Kamar itu bukan di unit Anda.", 403);
    }
    patch.kamarLain = ids;
  }
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
  const id = teks(o.id, 40);
  if (!(await sambunganBoleh(akun, id))) return galat("Sambungan tidak ditemukan.", 404);
  if (!(await hapusSambungan(id))) return galat("Sambungan tidak ditemukan.", 404);
  return NextResponse.json({ ok: true });
}
