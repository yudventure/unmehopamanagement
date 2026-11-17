import "server-only";

import { bacaJson, ubahJson } from "./gudang";

/**
 * Catatan galat di server (`galat.json`): hal yang gagal diam-diam dan baru
 * ketahuan ketika tamu mengeluh. Lima puluh terakhir; galat yang sama berturut-
 * turut digabung dan dihitung, supaya satu layanan yang mati tidak memenuhi
 * catatan.
 *
 * Mencatat tidak boleh pernah merusak permintaan yang sedang dilayani: gagal
 * menulis catatan ditelan.
 */
export interface CatatanGalat {
  id: string;
  sumber: string;
  pesan: string;
  pertama: string;
  terakhir: string;
  jumlah: number;
}

const BERKAS = "galat.json";
const MAKS = 50;

export async function catatGalat(sumber: string, pesan: string): Promise<void> {
  try {
    const sekarang = new Date().toISOString();
    await ubahJson<CatatanGalat[]>(BERKAS, [], (l) => {
      const daftar = Array.isArray(l) ? l : [];
      const i = daftar.findIndex((c) => c.sumber === sumber && c.pesan === pesan);
      if (i >= 0) {
        const c = { ...daftar[i], terakhir: sekarang, jumlah: daftar[i].jumlah + 1 };
        return [c, ...daftar.filter((_, j) => j !== i)].slice(0, MAKS);
      }
      return [{ id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`, sumber, pesan: pesan.slice(0, 300), pertama: sekarang, terakhir: sekarang, jumlah: 1 }, ...daftar].slice(0, MAKS);
    });
  } catch (e) {
    console.error("[galat] gagal mencatat", e);
  }
}

export async function bacaGalat(): Promise<CatatanGalat[]> {
  const l = await bacaJson<CatatanGalat[]>(BERKAS, []);
  return Array.isArray(l) ? l : [];
}

export async function hapusGalat(id?: string): Promise<void> {
  await ubahJson<CatatanGalat[]>(BERKAS, [], (l) => (id ? (Array.isArray(l) ? l : []).filter((c) => c.id !== id) : []));
}
