import { NextResponse } from "next/server";

import { akunMasuk, bolehLayar, propertiBoleh, tidakAda } from "@/lib/server/akses";
import { ambilKamar, ambilPesanan, bacaSemua, bookingDariLuar, daftarSambungan } from "@/lib/server/buku";

/**
 * Isi buku di server: kamar, pesanan yang dicatat di dashboard, malam yang
 * terbaca dari situs luar, dan (untuk yang punya layar Sinkronisasi) daftar
 * sambungan. Sambungan yang bacaannya sudah lebih tua dari 15 menit dibaca
 * ulang di belakang layar, tanpa membuat jawaban ini menunggu.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const akun = await akunMasuk();
  if (!akun) return tidakAda();
  void bacaSemua(true).catch((e) => console.error("[sinkron] bacaan latar", e));
  const [kamar, manual, luar, sambungan] = await Promise.all([
    ambilKamar(), ambilPesanan(), bookingDariLuar(), daftarSambungan(),
  ]);
  return NextResponse.json({
    kamar,
    pesanan: [...manual, ...luar],
    /* Hanya sambungan di kamar yang boleh disentuh akun ini; tautan ekspornya
       memuat rahasia. */
    sambungan: bolehLayar(akun, "sinkron")
      ? sambungan.filter((s) => {
          const prop = kamar.find((r) => r.id === s.roomId)?.prop;
          return prop !== undefined && propertiBoleh(akun).includes(prop);
        })
      : [],
  });
}
