import "server-only";
import { randomBytes } from "node:crypto";

import { bacaJson, ubahJson } from "./gudang";
import { KOLEKSI, PARAMETER_AWAL, koleksiDari, rapikanParameter, type Bidang, type Modul, type ParameterSdm, type Rekaman } from "@/lib/modul";
import type { PropertyKey } from "@/lib/types";

/**
 * Penyimpanan modul keuangan, SDM, dan gudang: satu berkas JSON per modul di
 * folder data server (`modul-keuangan.json` dan seterusnya), isinya
 * `{ [koleksi]: Rekaman[] }`, ditambah `parameter` untuk SDM.
 *
 * Semua yang masuk diperiksa terhadap skema di `@/lib/modul`: bidang yang tidak
 * dikenal dibuang, angka dan tanggal diperiksa bentuknya, pilihan harus salah
 * satu opsi, dan rujukan harus menunjuk catatan yang ada di unit yang sama.
 */
type Isi = { [koleksi: string]: Rekaman[] | unknown };
const daftarDari = (isi: Isi, id: string): Rekaman[] => (Array.isArray(isi[id]) ? (isi[id] as Rekaman[]) : []);

const berkas = (m: Modul) => `modul-${m}.json`;
const TGL = /^\d{4}-\d{2}-\d{2}$/;
const UNIT: PropertyKey[] = ["turtle", "eddo", "divecenter"];

export const unitSah = (u: unknown): u is PropertyKey => UNIT.includes(u as PropertyKey);

export async function bacaModul(m: Modul): Promise<Isi> {
  const o = await bacaJson<Isi>(berkas(m), {} as Isi);
  return o && typeof o === "object" ? o : ({} as Isi);
}

export async function parameterSdm(): Promise<ParameterSdm> {
  const o = await bacaModul("sdm");
  return o.parameter ? rapikanParameter(o.parameter) : { ...PARAMETER_AWAL };
}

export async function simpanParameterSdm(p: unknown): Promise<ParameterSdm> {
  const baru = rapikanParameter(p);
  await ubahJson<Isi>(berkas("sdm"), {} as Isi, (l) => ({ ...l, parameter: baru }));
  return baru;
}

/** Memeriksa satu bidang. Kembali berisi nilai bersih, atau pesan galat. */
function periksa(b: Bidang, mentah: unknown): { nilai?: string | number; galat?: string } {
  const kosong = mentah === undefined || mentah === null || mentah === "";
  if (kosong) return b.wajib && b.tipe !== "angka" ? { galat: `${b.label} wajib diisi.` } : b.tipe === "angka" ? (b.wajib ? { galat: `${b.label} wajib diisi.` } : { nilai: 0 }) : { nilai: "" };
  switch (b.tipe) {
    case "angka": {
      const n = Number(mentah);
      if (!Number.isFinite(n) || Math.abs(n) > 1e12) return { galat: `${b.label}: angka tidak sah.` };
      if (n < 0 && !b.negatif) return { galat: `${b.label} tidak boleh negatif.` };
      return { nilai: Math.round(n * 100) / 100 };
    }
    case "tanggal":
      return typeof mentah === "string" && TGL.test(mentah) ? { nilai: mentah } : { galat: `${b.label}: tanggal tidak sah.` };
    case "pilih":
      return typeof mentah === "string" && b.opsi?.includes(mentah) ? { nilai: mentah } : { galat: `${b.label}: pilihan tidak sah.` };
    case "catatan":
      return { nilai: String(mentah).trim().slice(0, 400) };
    case "rujuk":
      return typeof mentah === "string" && mentah.length < 40 ? { nilai: mentah } : { galat: `${b.label}: rujukan tidak sah.` };
    default:
      return { nilai: String(mentah).trim().slice(0, 120) };
  }
}

export async function simpanRekaman(
  m: Modul, koleksiId: string, unit: PropertyKey, mentah: Record<string, unknown>, oleh: string, id?: string,
): Promise<{ rekaman?: Rekaman; galat?: string; tidakAda?: boolean }> {
  const k = koleksiDari(koleksiId);
  if (!k || k.modul !== m) return { galat: "Jenis data tidak dikenal." };
  const bersih: Record<string, string | number> = {};
  for (const b of k.bidang) {
    const r = periksa(b, mentah[b.k]);
    if (r.galat) return { galat: r.galat };
    bersih[b.k] = r.nilai ?? "";
  }
  /* Rujukan harus menunjuk catatan yang ada, di unit yang sama. */
  const isi = await bacaModul(m);
  for (const b of k.bidang) {
    if (b.tipe === "rujuk" && bersih[b.k] !== "") {
      const sasaran = daftarDari(isi, b.ke!).find((x) => x.id === bersih[b.k]);
      if (!sasaran || sasaran.unit !== unit) return { galat: `${b.label}: tidak ditemukan di unit ini.` };
    }
  }
  const sekarang = new Date().toISOString();
  let hasil: Rekaman | undefined;
  let hilang = false;
  await ubahJson<Isi>(berkas(m), {} as Isi, (l) => {
    const daftar = [...daftarDari(l, k.id)];
    if (id) {
      const i = daftar.findIndex((x) => x.id === id);
      if (i < 0 || daftar[i].unit !== unit) {
        hilang = true;
        return l;
      }
      daftar[i] = { ...daftar[i], ...bersih, id, unit, diubahOleh: oleh.slice(0, 80), diubahPada: sekarang };
      hasil = daftar[i];
    } else {
      hasil = { ...bersih, id: randomBytes(6).toString("hex"), unit, dibuat: sekarang, diubahOleh: oleh.slice(0, 80), diubahPada: sekarang };
      daftar.push(hasil);
    }
    return { ...l, [k.id]: daftar };
  });
  return hilang ? { tidakAda: true } : { rekaman: hasil };
}

/** Menghapus satu catatan; catatan yang masih dirujuk catatan lain tidak dihapus. */
export async function hapusRekaman(m: Modul, koleksiId: string, id: string, unitBoleh: (u: PropertyKey) => boolean): Promise<{ ok?: boolean; galat?: string; tidakAda?: boolean }> {
  const k = koleksiDari(koleksiId);
  if (!k || k.modul !== m) return { galat: "Jenis data tidak dikenal." };
  const isi = await bacaModul(m);
  const ada = daftarDari(isi, k.id).find((x) => x.id === id);
  if (!ada || !unitBoleh(ada.unit)) return { tidakAda: true };
  /* Yang dirujuk tidak dihapus diam-diam: absensi dan stok akan kehilangan induknya. */
  const dirujuk = KOLEKSI.some((o) => o.modul === m && o.bidang.some((b) => b.tipe === "rujuk" && b.ke === k.id && daftarDari(isi, o.id).some((x) => x[b.k] === id)));
  if (dirujuk) return { galat: "Masih ada catatan yang memakai ini (absensi, asuransi, inventaris, atau keluar masuk barang). Hapus atau pindahkan catatan itu dulu." };
  await ubahJson<Isi>(berkas(m), {} as Isi, (l) => ({ ...l, [k.id]: daftarDari(l, k.id).filter((x) => x.id !== id) }));
  return { ok: true };
}
