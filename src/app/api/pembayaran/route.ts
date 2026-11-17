import { NextResponse } from "next/server";

import { aksesPenuh } from "@/lib/peran";
import { akunMasuk, tidakAda } from "@/lib/server/akses";
import { requestOrigin } from "@/lib/request-url";

/**
 * Keadaan pembayaran Midtrans, untuk layar Pengaturan. Hanya developer dan
 * pemilik.
 *
 * Kunci TIDAK PERNAH dikirim ke peramban. Yang dikirim hanya apakah kunci
 * itu ada, bentuknya (sandbox atau produksi, dari awalan), dan empat huruf
 * terakhir untuk mengenali kunci mana yang terpasang. Kuncinya sendiri tetap
 * di variabel environment server.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Bentuk = "sandbox" | "produksi" | "tidak-dikenal";

function bentukServer(k: string): Bentuk {
  if (k.startsWith("SB-")) return "sandbox";
  if (k.startsWith("Mid-server-")) return "produksi";
  return "tidak-dikenal";
}
function bentukKlien(k: string): Bentuk {
  if (k.startsWith("SB-Mid-client-")) return "sandbox";
  if (k.startsWith("Mid-client-")) return "produksi";
  return "tidak-dikenal";
}
const akhir = (k: string) => (k.length >= 8 ? k.slice(-4) : "");

export async function GET(req: Request) {
  const akun = await akunMasuk();
  if (!akun || !aksesPenuh(akun.peran)) return tidakAda();

  const server = (process.env.MIDTRANS_SERVER_KEY ?? "").trim();
  const klien = (process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY ?? "").trim();
  const produksi = process.env.MIDTRANS_IS_PRODUCTION === "true";
  const bs = server ? bentukServer(server) : null;
  const bk = klien ? bentukKlien(klien) : null;

  /* Hal yang bertabrakan, ditulis sebagai kalimat untuk pemilik. */
  const peringatan: string[] = [];
  if (bs === "sandbox" && produksi) peringatan.push("Server key sandbox dipakai dengan mode produksi. Midtrans akan menolaknya.");
  if (bs === "produksi" && !produksi) peringatan.push("Server key produksi dipakai dengan mode sandbox. Midtrans akan menolaknya.");
  if (bk && bs && bk !== "tidak-dikenal" && bs !== "tidak-dikenal" && bk !== bs) peringatan.push("Client key dan server key berasal dari lingkungan yang berbeda (sandbox dan produksi).");
  if (server && !klien) peringatan.push("Client key belum terisi, jadi tombol bayar tidak tampil di situs.");
  if (!server && klien) peringatan.push("Server key belum terisi, jadi pembayaran akan ditolak walau tombolnya tampil.");

  return NextResponse.json({
    serverKey: { ada: Boolean(server), bentuk: bs, akhir: akhir(server) },
    clientKey: { ada: Boolean(klien), bentuk: bk, akhir: akhir(klien) },
    mode: produksi ? "produksi" : "sandbox",
    siap: Boolean(server && klien) && peringatan.length === 0,
    peringatan,
    notifikasiUrl: `${requestOrigin(req)}/api/pay/notify`,
  });
}
