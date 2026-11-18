import "server-only";

import { bacaJson, ubahJson } from "./gudang";

/**
 * Bentrok kamar yang dinyatakan sudah diselesaikan di luar sistem, misalnya
 * dengan memberi tamu kompensasi, tanpa membatalkan salah satu booking.
 * Berkas `bentrok-selesai.json` di folder data server.
 *
 * Kuncinya memuat kedua id booking dan rentang malam yang bentrok. Kalau
 * tanggal salah satu booking diubah sesudahnya, rentangnya berubah, kuncinya
 * tidak cocok lagi, dan bentroknya muncul kembali: penyelesaian hanya berlaku
 * untuk bentrok yang memang dibereskan.
 *
 * Booking dari sistem lama tidak bisa ditulisi, jadi catatannya di sini, per
 * pasangan, bukan di bookingnya.
 */
export const JENIS_SOLUSI = ["tetap", "pindah", "kompensasi", "tanggal", "lain"] as const;
export type JenisSolusi = (typeof JENIS_SOLUSI)[number];

/** Apa yang didapat satu tamu: tetap di kamar itu, pindah kamar, kompensasi, ganti tanggal, atau lainnya. */
export interface Solusi {
  jenis: JenisSolusi;
  catatan: string;
}

/**
 * Kedua tamu harus mendapat solusi: yang tetap di kamar itu tetap tercatat
 * ("tetap"), jadi penyelesaian tidak pernah berarti satu tamu dibiarkan.
 * Disimpan per id booking.
 */
export interface Penyelesaian {
  roomId: string;
  solusi: Record<string, Solusi>;
  oleh: string;
  pada: string;
}

const BERKAS = "bentrok-selesai.json";
const TGL = /^\d{4}-\d{2}-\d{2}$/;

export interface KunciBentrok {
  a: string;
  b: string;
  from: string;
  to: string;
}

export const kunciBentrok = (k: KunciBentrok) => {
  const [x, y] = [k.a, k.b].sort();
  return `${x}|${y}|${k.from}|${k.to}`;
};

export const kunciSah = (k: Partial<KunciBentrok>): boolean =>
  typeof k.a === "string" && typeof k.b === "string" && k.a !== k.b && k.a.length < 80 && k.b.length < 80 &&
  typeof k.from === "string" && TGL.test(k.from) && typeof k.to === "string" && TGL.test(k.to);

export async function bacaPenyelesaian(): Promise<Record<string, Penyelesaian>> {
  const o = await bacaJson<Record<string, Penyelesaian>>(BERKAS, {});
  return o && typeof o === "object" && !Array.isArray(o) ? o : {};
}

export async function setPenyelesaian(k: KunciBentrok, nilai: Penyelesaian | null): Promise<void> {
  const kunci = kunciBentrok(k);
  await ubahJson<Record<string, Penyelesaian>>(BERKAS, {}, (l) => {
    const baru = { ...(l && typeof l === "object" ? l : {}) };
    if (nilai) baru[kunci] = nilai;
    else delete baru[kunci];
    return baru;
  });
}
