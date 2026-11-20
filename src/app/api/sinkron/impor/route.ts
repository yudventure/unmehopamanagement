import { NextResponse } from "next/server";

import { akunMasuk, bolehLayar, galat, propertiBoleh, propertiKamar, tidakAda } from "@/lib/server/akses";
import { catat } from "@/lib/server/batas";
import { acaraSambungan, daftarSambungan, tandaiImpor } from "@/lib/server/buku";
import { bacaEksporBooking, berlaku, hapusImpor, semuaImpor, simpanImpor } from "@/lib/server/impor-booking";

/**
 * Impor daftar pesanan Booking.com (ekspor .xls atau .csv dari Extranet) ke
 * satu sambungan.
 *
 *   POST   { id, berkas (base64), tipeUnit?, simpan? }
 *          tanpa `simpan`: pratinjau (berapa pesanan, tipe unit, rentang,
 *          multi-kamar, berapa acara iCal yang akan digantikan). Dengan
 *          `simpan: true`: digabung menurut nomor pemesanan dan dipakai.
 *          Berkas dengan beberapa tipe unit wajib memilih satu.
 *   DELETE { id }  menghapus impor sambungan itu; acara iCal kembali terbaca apa adanya.
 *
 * Hanya akun yang punya layar Sinkronisasi dan memegang unit kamar itu.
 * Berkasnya tidak disimpan; hanya pesanan yang terbaca, tanpa alamat.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BATAS = 6 * 1024 * 1024;

async function sambunganUntuk(id: string) {
  const akun = await akunMasuk();
  if (!akun || !bolehLayar(akun, "sinkron")) return null;
  const sb = (await daftarSambungan()).find((x) => x.id === id);
  if (!sb) return null;
  const prop = await propertiKamar(sb.roomId);
  if (!prop || !propertiBoleh(akun).includes(prop)) return null;
  return { akun, sb };
}

export async function POST(req: Request) {
  const o = (await req.json().catch(() => ({}))) as { id?: unknown; berkas?: unknown; tipeUnit?: unknown; simpan?: unknown };
  const ada = await sambunganUntuk(typeof o.id === "string" ? o.id : "");
  if (!ada) return tidakAda();
  if (catat(`impor:${ada.akun.email}`, 10 * 60 * 1000) > 30) return galat("Terlalu sering. Tunggu sebentar.", 429);
  const b64 = typeof o.berkas === "string" ? o.berkas.replace(/^data:[^,]*,/, "") : "";
  if (!b64) return galat("Pilih berkasnya dulu.");
  const buf = Buffer.from(b64, "base64");
  if (buf.length > BATAS) return galat("Berkas terlalu besar. Maksimal 6 MB.", 413);

  let semua;
  try {
    semua = bacaEksporBooking(buf);
  } catch (e) {
    return galat(e instanceof Error ? e.message : "Berkas tidak bisa dibaca.", 422);
  }

  const tipe = new Map<string, number>();
  for (const p of semua) tipe.set(p.tipeUnit || "(tanpa tipe)", (tipe.get(p.tipeUnit || "(tanpa tipe)") ?? 0) + 1);
  const daftarTipe = [...tipe.entries()].map(([nama, jumlah]) => ({ nama, jumlah }));
  const dipilih = typeof o.tipeUnit === "string" && o.tipeUnit ? o.tipeUnit : daftarTipe.length === 1 ? daftarTipe[0].nama : "";
  const pesanan = dipilih ? semua.filter((p) => (p.tipeUnit || "(tanpa tipe)") === dipilih) : [];
  const ok = pesanan.filter(berlaku);

  /* Berapa acara iCal yang akan digantikan pesanan impor (tanggal sama persis). */
  const sisa = new Map<string, number>();
  for (const p of ok) sisa.set(`${p.checkIn}|${p.checkOut}`, (sisa.get(`${p.checkIn}|${p.checkOut}`) ?? 0) + 1);
  let cocok = 0;
  const acara = await acaraSambungan(ada.sb.id);
  for (const a of acara) {
    const k = `${a.mulai}|${a.selesai}`;
    if ((sisa.get(k) ?? 0) > 0) {
      sisa.set(k, sisa.get(k)! - 1);
      cocok++;
    }
  }
  const ringkas = {
    tipeUnit: daftarTipe,
    dipilih,
    jumlah: pesanan.length,
    berlaku: ok.length,
    batal: pesanan.length - ok.length,
    kamar: ok.reduce((n, p) => n + p.kamar, 0),
    multiKamar: ok.filter((p) => p.kamar > 1).length,
    dariTanggal: pesanan.length ? pesanan.reduce((m, p) => (p.checkIn < m ? p.checkIn : m), pesanan[0].checkIn) : null,
    sampaiTanggal: pesanan.length ? pesanan.reduce((m, p) => (p.checkOut > m ? p.checkOut : m), pesanan[0].checkOut) : null,
    nilai: ok.reduce((n, p) => n + p.harga, 0),
    komisi: ok.reduce((n, p) => n + p.komisi, 0),
    acaraIcal: acara.length,
    acaraDigantikan: cocok,
  };

  if (o.simpan !== true) return NextResponse.json({ pratinjau: ringkas });
  if (!dipilih) return galat("Berkas ini memuat beberapa tipe unit. Pilih tipe yang sesuai dengan sambungan ini.");
  const hasil = await simpanImpor(ada.sb.id, dipilih, pesanan, ada.akun.nama);
  await tandaiImpor(ada.sb.id, { tipeUnit: dipilih, jumlah: hasil.pesanan.length, berlaku: hasil.pesanan.filter(berlaku).length, pada: hasil.pada, oleh: hasil.oleh });
  return NextResponse.json({ ok: true, pratinjau: ringkas, tersimpan: hasil.pesanan.length });
}

export async function DELETE(req: Request) {
  const o = (await req.json().catch(() => ({}))) as { id?: unknown };
  const ada = await sambunganUntuk(typeof o.id === "string" ? o.id : "");
  if (!ada) return tidakAda();
  if (!(await semuaImpor())[ada.sb.id]) return galat("Sambungan ini belum punya impor.", 404);
  await hapusImpor(ada.sb.id);
  await tandaiImpor(ada.sb.id, null);
  return NextResponse.json({ ok: true });
}
