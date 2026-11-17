import "server-only";

import { bacaJson, ubahJson } from "./gudang";

/**
 * Kunci API yang dimasukkan dari layar Pengaturan, disimpan di `kunci.json`
 * (folder data server, izin hanya pemilik berkas).
 *
 * Sengaja hanya untuk kunci pembaca screenshot. Kunci pembayaran tetap di
 * variabel environment: itu angka yang menagih uang sungguhan.
 *
 * Tulis-saja: kuncinya tidak pernah dikirim balik ke peramban, hanya apakah ia
 * ada dan empat huruf terakhir. Yang dimasukkan dari sini didahulukan atas
 * `ANTHROPIC_API_KEY` di environment, supaya pemilik bisa menggantinya tanpa
 * membuka panel hosting.
 */
interface Simpanan {
  anthropic?: string;
  anthropicDiubahOleh?: string;
  anthropicDiubahPada?: string;
}
const BERKAS = "kunci.json";

export async function kunciAnthropic(): Promise<{ kunci: string; sumber: "dashboard" | "environment" | null }> {
  const s = await bacaJson<Simpanan>(BERKAS, {});
  if (s.anthropic?.trim()) return { kunci: s.anthropic.trim(), sumber: "dashboard" };
  const e = process.env.ANTHROPIC_API_KEY?.trim();
  return e ? { kunci: e, sumber: "environment" } : { kunci: "", sumber: null };
}

export async function infoKunciAnthropic() {
  const s = await bacaJson<Simpanan>(BERKAS, {});
  const { kunci, sumber } = await kunciAnthropic();
  return {
    ada: Boolean(kunci),
    sumber,
    akhir: kunci.length >= 12 ? kunci.slice(-4) : "",
    bentukBenar: kunci ? kunci.startsWith("sk-ant-") : null,
    diubahOleh: sumber === "dashboard" ? (s.anthropicDiubahOleh ?? null) : null,
    diubahPada: sumber === "dashboard" ? (s.anthropicDiubahPada ?? null) : null,
  };
}

export async function simpanKunciAnthropic(kunci: string, oleh: string) {
  await ubahJson<Simpanan>(BERKAS, {}, (l) => ({ ...l, anthropic: kunci, anthropicDiubahOleh: oleh.slice(0, 80), anthropicDiubahPada: new Date().toISOString() }));
}

export async function hapusKunciAnthropic() {
  await ubahJson<Simpanan>(BERKAS, {}, (l) => ({ ...l, anthropic: undefined, anthropicDiubahOleh: undefined, anthropicDiubahPada: undefined }));
}
