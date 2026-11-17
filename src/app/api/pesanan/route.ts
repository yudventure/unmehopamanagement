import { NextResponse } from "next/server";

import { akunMasuk, bolehCatat, galat, propertiBoleh, tidakAda } from "@/lib/server/akses";
import { ambilKamar, ambilPesanan, tambahPesanan, ubahPesanan } from "@/lib/server/buku";
import type { Booking, BookingStatus } from "@/lib/types";

/**
 * Pesanan yang dicatat di dashboard, disimpan di server supaya tidak hilang
 * saat halaman ditutup dan supaya ikut ke tautan ekspor kalender.
 *
 * Kamarnya harus ada dan berada di unit yang boleh disentuh akun itu.
 */
export const runtime = "nodejs";

const STATUS: BookingStatus[] = ["Tentative", "Confirmed", "Checked-in", "Checked-out", "Cancelled", "Tidak datang"];
const TGL = /^\d{4}-\d{2}-\d{2}$/;
const teks = (v: unknown, n: number) => (typeof v === "string" ? v.trim().slice(0, n) : "");

async function kamarBoleh(akunProps: string[], roomId: string) {
  const r = (await ambilKamar()).find((x) => x.id === roomId);
  return r && akunProps.includes(r.prop) ? r : null;
}

export async function POST(req: Request) {
  const akun = await akunMasuk();
  if (!akun || !bolehCatat(akun)) return tidakAda();
  const o = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const roomId = teks(o.roomId, 20);
  if (!(await kamarBoleh(propertiBoleh(akun), roomId))) return galat("Kamar itu tidak ada atau bukan unit Anda.", 403);
  const checkIn = teks(o.checkIn, 10), checkOut = teks(o.checkOut, 10);
  if (!TGL.test(checkIn) || !TGL.test(checkOut) || checkOut <= checkIn) return galat("Tanggalnya tidak sah.");
  const status = STATUS.includes(o.status as BookingStatus) ? (o.status as BookingStatus) : "Tentative";
  const id = teks(o.id, 40) || `BK${Date.now().toString(36)}`;
  const b: Booking = {
    id, code: teks(o.code, 20) || id.slice(-6).toUpperCase(), roomId,
    guest: teks(o.guest, 80) || "Tamu", phone: teks(o.phone, 30),
    pax: Number.isFinite(Number(o.pax)) && Number(o.pax) > 0 ? Math.round(Number(o.pax)) : null,
    channel: ["Booking.com", "Traveloka", "Agoda", "WhatsApp", "OTA lain"].includes(o.channel as string)
      ? (o.channel as Booking["channel"]) : "WhatsApp",
    checkIn, checkOut,
    total: Number.isFinite(Number(o.total)) && Number(o.total) >= 0 ? Math.round(Number(o.total)) : 0,
    status, notes: teks(o.notes, 400), src: "manual",
    createdAt: teks(o.createdAt, 10) || undefined,
    updatedAt: new Date().toISOString(), updatedBy: akun.nama,
  };
  if (!(await tambahPesanan(b))) return galat("Pesanan itu sudah ada.", 409);
  return NextResponse.json({ pesanan: b });
}

export async function PATCH(req: Request) {
  const akun = await akunMasuk();
  if (!akun || !bolehCatat(akun)) return tidakAda();
  const o = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const id = teks(o.id, 40);
  const ada = (await ambilPesanan()).find((b) => b.id === id);
  if (!ada) return galat("Pesanan tidak ditemukan.", 404);
  const props = propertiBoleh(akun);
  if (!(await kamarBoleh(props, ada.roomId))) return galat("Pesanan itu bukan di unit Anda.", 403);
  const patch: Partial<Booking> = { updatedAt: new Date().toISOString(), updatedBy: akun.nama };
  if (o.status !== undefined) {
    if (!STATUS.includes(o.status as BookingStatus)) return galat("Status tidak sah.");
    patch.status = o.status as BookingStatus;
  }
  if (o.notes !== undefined) patch.notes = teks(o.notes, 400);
  if (o.paid !== undefined && Number.isFinite(Number(o.paid)) && Number(o.paid) >= 0) patch.paid = Math.round(Number(o.paid));
  const baru = await ubahPesanan(id, patch);
  return NextResponse.json({ pesanan: baru });
}
