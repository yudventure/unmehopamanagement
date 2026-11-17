import "server-only";
import { randomBytes } from "node:crypto";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

/**
 * Gudang data di server: berkas JSON di satu folder (pola Fantasea).
 *
 * Akun beberapa orang tidak butuh basis data. Folder diambil dari
 * `UNMEHOPA_DATA_DIR` kalau diisi; kalau tidak, `.unmehopa-data` di folder
 * home akun hosting, di luar folder aplikasi supaya deploy ulang tidak
 * menghapusnya; kalau home tidak bisa ditulis, `.data/` di folder aplikasi.
 *
 * Penulisan atomik (berkas sementara lalu rename) dan berurutan lewat satu
 * antrean, supaya dua simpanan bersamaan tidak saling menimpa.
 */
let dirCache: string | null = null;

async function bisaDitulis(dir: string) {
  try {
    await fs.mkdir(dir, { recursive: true, mode: 0o700 });
    await fs.access(dir, fs.constants.W_OK);
    return true;
  } catch {
    return false;
  }
}

export async function dirData(): Promise<string> {
  if (dirCache) return dirCache;
  const kandidat = [
    process.env.UNMEHOPA_DATA_DIR?.trim(),
    path.join(os.homedir(), ".unmehopa-data"),
    path.join(process.cwd(), ".data"),
  ].filter((d): d is string => Boolean(d));
  for (const d of kandidat) {
    if (await bisaDitulis(d)) {
      dirCache = d;
      return d;
    }
  }
  throw new Error(`tidak ada folder data yang bisa ditulis: ${kandidat.join(", ")}`);
}

let antrean: Promise<unknown> = Promise.resolve();
function berurutan<T>(kerja: () => Promise<T>): Promise<T> {
  const hasil = antrean.then(kerja, kerja);
  antrean = hasil.catch(() => undefined);
  return hasil;
}

export async function bacaJson<T>(nama: string, bawaan: T): Promise<T> {
  try {
    return JSON.parse(await fs.readFile(path.join(await dirData(), nama), "utf8")) as T;
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return bawaan;
    console.error(`[gudang] ${nama} tidak bisa dibaca`, e);
    return bawaan;
  }
}

async function tulisLangsung(nama: string, isi: unknown, mode: number) {
  const tujuan = path.join(await dirData(), nama);
  const sementara = `${tujuan}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(sementara, JSON.stringify(isi, null, 2) + "\n", { encoding: "utf8", mode });
  await fs.rename(sementara, tujuan);
}

/** Ubah-baca-tulis dalam satu giliran antrean, supaya tidak ada pembaruan yang hilang. */
export function ubahJson<T>(nama: string, bawaan: T, ubah: (lama: T) => T, mode = 0o600): Promise<T> {
  return berurutan(async () => {
    const baru = ubah(await bacaJson(nama, bawaan));
    await tulisLangsung(nama, baru, mode);
    return baru;
  });
}

/** Rahasia penanda tangan sesi: dibuat sekali, disimpan di folder data. */
let rahasiaCache: string | null = null;
export async function rahasiaSesi(): Promise<string> {
  const dariEnv = process.env.SESSION_SECRET?.trim();
  if (dariEnv) return dariEnv;
  if (rahasiaCache) return rahasiaCache;
  const jalur = path.join(await dirData(), "rahasia.txt");
  try {
    const isi = (await fs.readFile(jalur, "utf8")).trim();
    if (isi.length >= 32) return (rahasiaCache = isi);
  } catch {
    /* belum ada */
  }
  const baru = randomBytes(32).toString("hex");
  await fs.writeFile(jalur, baru + "\n", { mode: 0o600 });
  return (rahasiaCache = baru);
}
