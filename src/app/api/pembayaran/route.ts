import { NextResponse } from "next/server";

import { lihatSemua } from "@/lib/peran";
import { akunMasuk, tidakAda } from "@/lib/server/akses";
import { akhir, bentukKlien, bentukServer, peringatanMidtrans } from "@/lib/server/midtrans-cek";
import { requestOrigin } from "@/lib/request-url";
import { aksesPenuh } from "@/lib/peran";

/**
 * Keadaan pembayaran Midtrans, untuk layar Pengaturan. Dilihat developer,
 * pemilik, dan general manager (GM hanya melihat; mengubah dan tes hanya
 * developer dan pemilik).
 *
 * Kunci TIDAK PERNAH dikirim ke peramban. Yang dikirim hanya apakah kunci
 * itu ada, bentuknya (sandbox atau produksi, dari awalan), dan empat huruf
 * terakhir untuk mengenali kunci mana yang terpasang. Kuncinya sendiri tetap
 * di variabel environment server.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const akun = await akunMasuk();
  if (!akun || !lihatSemua(akun.peran)) return tidakAda();

  const server = (process.env.MIDTRANS_SERVER_KEY ?? "").trim();
  const klien = (process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY ?? "").trim();
  const produksi = process.env.MIDTRANS_IS_PRODUCTION === "true";
  const bs = server ? bentukServer(server) : null;
  const bk = klien ? bentukKlien(klien) : null;

  const peringatan = peringatanMidtrans(server, klien, produksi);

  return NextResponse.json({
    serverKey: { ada: Boolean(server), bentuk: bs, akhir: akhir(server) },
    clientKey: { ada: Boolean(klien), bentuk: bk, akhir: akhir(klien) },
    mode: produksi ? "produksi" : "sandbox",
    siap: Boolean(server && klien) && peringatan.length === 0,
    peringatan,
    bolehUji: aksesPenuh(akun.peran),
    notifikasiUrl: `${requestOrigin(req)}/api/pay/notify`,
  });
}
