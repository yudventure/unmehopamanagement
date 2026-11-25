import "server-only";

import { bacaJson, ubahJson } from "./gudang";

/**
 * Catatan operasional per booking, terpisah dari booking-nya: perlu dijemput
 * atau tidak, dan jam serta tempatnya. Terpisah supaya bisa dipakai untuk
 * booking yang tidak bisa diubah di dashboard (Booking.com, iCal, sistem
 * lama), dengan kunci id booking-nya yang tetap. Berkas `catatan-tamu.json`.
 */
export interface CatatanTamu {
  roomId: string;
  jemput: "ya" | "tidak";
  catatan: string;
  oleh: string;
  pada: string;
}

const BERKAS = "catatan-tamu.json";

export async function semuaCatatanTamu(): Promise<Record<string, CatatanTamu>> {
  const o = await bacaJson<Record<string, CatatanTamu>>(BERKAS, {});
  return o && typeof o === "object" ? o : {};
}

export async function simpanCatatanTamu(bookingId: string, isi: CatatanTamu | null): Promise<void> {
  await ubahJson<Record<string, CatatanTamu>>(BERKAS, {}, (l) => {
    const baru = { ...(l ?? {}) };
    if (isi) baru[bookingId] = isi;
    else delete baru[bookingId];
    return baru;
  });
}
