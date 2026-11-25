import "server-only";

import { bacaJson, ubahJson } from "./gudang";

/**
 * Sakelar yang bisa dibalik dari dashboard tanpa membuka panel hosting.
 * Berkas `pengaturan.json` di folder data server.
 *
 * Bawaannya menjaga keadaan sebelum sakelar ada: sistem lama menyala.
 */
export interface Pengaturan {
  /**
   * Membaca booking dan jadwal Turtle dari sistem staf lama (Apps Script).
   * Dimatikan, dashboard memakai data sendiri untuk Turtle dan tidak lagi
   * memanggil sistem itu sama sekali.
   */
  sistemLamaAktif: boolean;
  /**
   * Membaca jadwal dive center (dan daftar booking untuk dicocokkan) dari
   * sistem lama, tanpa memakai booking-nya di kalender. Berdiri sendiri dari
   * `sistemLamaAktif`, supaya kalender bisa memakai data dashboard sendiri
   * sementara jadwal diving tetap tampil.
   */
  jadwalLamaAktif: boolean;
  diubahOleh?: string;
  diubahPada?: string;
}

const BERKAS = "pengaturan.json";
const BAWAAN: Pengaturan = { sistemLamaAktif: true, jadwalLamaAktif: true };

export async function bacaPengaturan(): Promise<Pengaturan> {
  const o = await bacaJson<Partial<Pengaturan>>(BERKAS, {});
  return { ...BAWAAN, ...o, sistemLamaAktif: o.sistemLamaAktif !== false, jadwalLamaAktif: o.jadwalLamaAktif !== false };
}

export async function ubahPengaturan(patch: Partial<Pick<Pengaturan, "sistemLamaAktif" | "jadwalLamaAktif">>, oleh: string): Promise<Pengaturan> {
  const baru = await ubahJson<Partial<Pengaturan>>(BERKAS, {}, (lama) => ({
    ...lama,
    ...patch,
    diubahOleh: oleh.slice(0, 80),
    diubahPada: new Date().toISOString(),
  }));
  return { ...BAWAAN, ...baru, sistemLamaAktif: baru.sistemLamaAktif !== false, jadwalLamaAktif: baru.jadwalLamaAktif !== false };
}
