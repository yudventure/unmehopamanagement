import { NextResponse } from "next/server";

import { akunMasuk, bolehCatat, bolehLayar, galat, propertiBoleh, propertiKamar, tidakAda } from "@/lib/server/akses";
import { semuaCatatanTamu, simpanCatatanTamu } from "@/lib/server/catatan-tamu";

/**
 * Catatan jemputan per booking.
 *
 *   GET  { catatan: { [bookingId]: { jemput, catatan, oleh, pada, roomId } } }
 *        untuk akun yang punya Kalender, hanya di unit yang boleh dilihatnya
 *   PUT  { bookingId, roomId, jemput: "ya" | "tidak" | null, catatan? }
 *        null menghapus catatan. Akun yang boleh mencatat pesanan.
 *
 * Kamar dari sistem lama (`lama-…`) milik Turtle.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const propDari = async (roomId: string) => (await propertiKamar(roomId)) ?? (roomId.startsWith("lama-") ? "turtle" : null);

export async function GET() {
  const akun = await akunMasuk();
  if (!akun || !bolehLayar(akun, "kalender")) return tidakAda();
  const boleh = new Set<string>(propertiBoleh(akun));
  const semua = await semuaCatatanTamu();
  const hasil: typeof semua = {};
  const cache = new Map<string, string | null>();
  for (const [id, c] of Object.entries(semua)) {
    if (!cache.has(c.roomId)) cache.set(c.roomId, await propDari(c.roomId));
    const p = cache.get(c.roomId);
    if (p && boleh.has(p)) hasil[id] = c;
  }
  return NextResponse.json({ catatan: hasil });
}

export async function PUT(req: Request) {
  const akun = await akunMasuk();
  if (!akun || !bolehCatat(akun)) return tidakAda();
  const o = (await req.json().catch(() => ({}))) as { bookingId?: unknown; roomId?: unknown; jemput?: unknown; catatan?: unknown };
  const bookingId = typeof o.bookingId === "string" ? o.bookingId.slice(0, 120) : "";
  const roomId = typeof o.roomId === "string" ? o.roomId.slice(0, 60) : "";
  if (!bookingId || !roomId) return galat("Booking tidak sah.");
  const p = await propDari(roomId);
  if (!p || !(propertiBoleh(akun) as string[]).includes(p)) return tidakAda();
  if (o.jemput === null) {
    await simpanCatatanTamu(bookingId, null);
    return NextResponse.json({ ok: true });
  }
  if (o.jemput !== "ya" && o.jemput !== "tidak") return galat("Pilih perlu dijemput atau tidak.");
  const catatan = typeof o.catatan === "string" ? o.catatan.trim().slice(0, 200) : "";
  await simpanCatatanTamu(bookingId, { roomId, jemput: o.jemput, catatan, oleh: akun.nama.slice(0, 80), pada: new Date().toISOString() });
  return NextResponse.json({ ok: true });
}
