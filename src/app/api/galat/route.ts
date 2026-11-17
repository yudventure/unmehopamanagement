import { NextResponse } from "next/server";

import { sistemLamaSiap } from "@/lib/sistem-lama";
import { aksesPenuh, lihatSemua } from "@/lib/peran";
import { akunMasuk, tidakAda } from "@/lib/server/akses";
import { daftarSambungan } from "@/lib/server/buku";
import { bacaGalat, hapusGalat } from "@/lib/server/galat";
import { peringatanMidtrans } from "@/lib/server/midtrans-cek";
import { bacaPengaturan } from "@/lib/server/pengaturan";

/**
 * Peringatan galat untuk dashboard.
 *
 *   GET     semua yang sedang salah, dari dua sumber: keadaan yang diperiksa
 *           sekarang (kunci yang bertabrakan, sistem lama menyala tapi belum
 *           diatur, sambungan kalender yang gagal dibaca) dan catatan galat
 *           tujuh hari terakhir. Developer, pemilik, dan GM.
 *   DELETE  ?id=… atau tanpa id untuk semuanya. Developer dan pemilik.
 *           Hanya menghapus catatan; keadaan yang diperiksa hilang sendiri
 *           begitu sebabnya diperbaiki.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TUJUH_HARI = 7 * 24 * 60 * 60 * 1000;

export interface Peringatan {
  id: string;
  jenis: "keadaan" | "catatan";
  sumber: string;
  pesan: string;
  jumlah?: number;
  terakhir?: string;
}

export async function GET() {
  const akun = await akunMasuk();
  if (!akun || !lihatSemua(akun.peran)) return tidakAda();

  const daftar: Peringatan[] = [];

  const produksi = process.env.MIDTRANS_IS_PRODUCTION === "true";
  peringatanMidtrans((process.env.MIDTRANS_SERVER_KEY ?? "").trim(), (process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY ?? "").trim(), produksi).forEach((pesan, i) =>
    daftar.push({ id: `midtrans-${i}`, jenis: "keadaan", sumber: "Pembayaran Midtrans", pesan }),
  );

  if ((await bacaPengaturan()).sistemLamaAktif && !sistemLamaSiap()) {
    daftar.push({ id: "lama-belum", jenis: "keadaan", sumber: "Sistem lama Turtle", pesan: "Sakelar sistem lama menyala, tapi alamat dan kata sandinya belum diisi di server. Tidak ada yang bisa dibaca." });
  }

  for (const s of await daftarSambungan().catch(() => [])) {
    if (s.galat) daftar.push({ id: `sinkron-${s.id}`, jenis: "keadaan", sumber: `Sinkronisasi ${s.nama}`, pesan: s.galat, terakhir: s.dicoba });
  }

  const batas = Date.now() - TUJUH_HARI;
  for (const c of await bacaGalat()) {
    if (Date.parse(c.terakhir) >= batas) daftar.push({ id: c.id, jenis: "catatan", sumber: c.sumber, pesan: c.pesan, jumlah: c.jumlah, terakhir: c.terakhir });
  }

  return NextResponse.json({ peringatan: daftar, bolehHapus: aksesPenuh(akun.peran) });
}

export async function DELETE(req: Request) {
  const akun = await akunMasuk();
  if (!akun || !aksesPenuh(akun.peran)) return tidakAda();
  await hapusGalat(new URL(req.url).searchParams.get("id") ?? undefined);
  return NextResponse.json({ ok: true });
}
