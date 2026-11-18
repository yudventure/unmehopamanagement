import { NextResponse } from "next/server";

import { akunMasuk, bolehCatat, bolehLayar, galat, propertiBoleh, propertiKamar, tidakAda } from "@/lib/server/akses";
import { JENIS_SOLUSI, bacaPenyelesaian, kunciBentrok, kunciSah, setPenyelesaian, type JenisSolusi, type KunciBentrok, type Solusi } from "@/lib/server/bentrok";

/**
 * Bentrok kamar yang sudah diselesaikan di luar sistem (misalnya dengan
 * kompensasi untuk tamu), supaya berhenti menjadi peringatan tanpa ada booking
 * yang dibatalkan.
 *
 *   GET  { selesai: { [kunci]: { roomId, solusi, oleh, pada } } }
 *        untuk akun yang punya Kalender
 *   PUT  { roomId, a, b, from, to, selesai: boolean, solusi?: { [idBooking]: { jenis, catatan } } }
 *        menandai atau membuka kembali. Menandai butuh solusi untuk KEDUA tamu.
 *        Hanya akun yang boleh mencatat pesanan dan memegang unit kamar itu.
 *
 * Kamar dari sistem lama (awalan `lama-`) milik Turtle, dan tidak ada di buku
 * kamar kita.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const propKamar = (prop: Map<string, string>, id: string): string | null => prop.get(id) ?? (id.startsWith("lama-") ? "turtle" : null);

export async function GET() {
  const akun = await akunMasuk();
  if (!akun || !bolehLayar(akun, "kalender")) return tidakAda();
  const semua = await bacaPenyelesaian();
  const boleh = new Set<string>(propertiBoleh(akun));
  const { ambilKamar } = await import("@/lib/server/buku");
  const prop = new Map((await ambilKamar()).map((r) => [r.id, r.prop]));
  const selesai = Object.fromEntries(Object.entries(semua).filter(([, v]) => { const p = propKamar(prop, v.roomId); return !p || boleh.has(p); }));
  return NextResponse.json({ selesai });
}

export async function PUT(req: Request) {
  const akun = await akunMasuk();
  if (!akun || !bolehCatat(akun)) return tidakAda();
  const o = (await req.json().catch(() => ({}))) as Partial<KunciBentrok> & { selesai?: unknown; roomId?: unknown; solusi?: unknown };
  if (!kunciSah(o)) return galat("Data bentrok tidak sah.");
  const k = o as KunciBentrok;
  const roomId = typeof o.roomId === "string" ? o.roomId : "";
  const prop = (await propertiKamar(roomId)) ?? (roomId.startsWith("lama-") ? "turtle" : null);
  if (!prop || !(propertiBoleh(akun) as string[]).includes(prop)) return tidakAda();
  if (typeof o.selesai !== "boolean") return galat("Pilihan tidak sah.");
  if (!o.selesai) {
    await setPenyelesaian(k, null);
    return NextResponse.json({ ok: true, kunci: kunciBentrok(k) });
  }
  const mentah = (o.solusi && typeof o.solusi === "object" ? o.solusi : {}) as Record<string, { jenis?: unknown; catatan?: unknown }>;
  const solusi: Record<string, Solusi> = {};
  for (const id of [k.a, k.b]) {
    const x = mentah[id];
    const jenis = x?.jenis as JenisSolusi;
    if (!JENIS_SOLUSI.includes(jenis)) return galat("Pilih solusi untuk kedua tamu.");
    const catatan = typeof x?.catatan === "string" ? x.catatan.trim().slice(0, 300) : "";
    if ((jenis === "kompensasi" || jenis === "lain") && !catatan) return galat("Tulis kompensasi atau solusinya untuk tamu itu.");
    solusi[id] = { jenis, catatan };
  }
  await setPenyelesaian(k, { roomId, solusi, oleh: akun.nama.slice(0, 80), pada: new Date().toISOString() });
  return NextResponse.json({ ok: true, kunci: kunciBentrok(k) });
}
