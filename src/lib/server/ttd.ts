import "server-only";

import { bacaJson, ubahJson } from "./gudang";
import type { PropertyKey } from "@/lib/types";

/**
 * Gambar tanda tangan dan stempel untuk sertifikat, per unit, di
 * `ttd-stempel.json` (folder data server, izin 600). Gambar PNG sebagai data
 * URL yang sudah diperkecil di peramban. Tanda tangan menyimpan nama dan
 * jabatan pemiliknya, supaya sertifikat tidak pernah memakai tanda tangan
 * seseorang di bawah nama orang lain.
 */
export interface GambarTtd {
  gambar: string;
  oleh: string;
  pada: string;
}
export interface TtdUnit {
  ttd?: GambarTtd & { nama: string; jabatan: string };
  stempel?: GambarTtd;
}

const BERKAS = "ttd-stempel.json";

export async function semuaTtd(): Promise<Partial<Record<PropertyKey, TtdUnit>>> {
  const o = await bacaJson<Partial<Record<PropertyKey, TtdUnit>>>(BERKAS, {});
  return o && typeof o === "object" ? o : {};
}

export async function simpanTtd(unit: PropertyKey, jenis: "ttd" | "stempel", isi: (GambarTtd & { nama?: string; jabatan?: string }) | null): Promise<void> {
  await ubahJson<Partial<Record<PropertyKey, TtdUnit>>>(
    BERKAS,
    {},
    (l) => {
      const u: TtdUnit = { ...(l[unit] ?? {}) };
      if (!isi) delete u[jenis];
      else if (jenis === "ttd") u.ttd = { gambar: isi.gambar, oleh: isi.oleh, pada: isi.pada, nama: isi.nama ?? "", jabatan: isi.jabatan ?? "" };
      else u.stempel = { gambar: isi.gambar, oleh: isi.oleh, pada: isi.pada };
      return { ...l, [unit]: u };
    },
    0o600,
  );
}
