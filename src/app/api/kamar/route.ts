import { NextResponse } from "next/server";

import { PROPERTIES_BERKAMAR } from "@/lib/data";
import { lihatSemua } from "@/lib/peran";
import { akunMasuk, galat, tidakAda } from "@/lib/server/akses";
import { ambilPesanan, daftarSambungan, simpanKamar, ambilKamar } from "@/lib/server/buku";
import type { Room } from "@/lib/types";

/**
 * Mengatur daftar kamar: tambah, ubah nama, kapasitas, tarif, dan hapus.
 * Hanya yang melihat semua unit (developer, pemilik, general manager).
 *
 * Kamar yang sudah punya pesanan atau sambungan tidak bisa dihapus. Pesanan
 * yang kamarnya hilang tidak punya tempat di kalender, jadi jalannya
 * menonaktifkan kamar itu, bukan menghapusnya.
 */
export const runtime = "nodejs";

const BATAS_KAMAR = 200;

export async function PUT(req: Request) {
  const akun = await akunMasuk();
  if (!akun || !lihatSemua(akun.peran)) return tidakAda();
  const o = (await req.json().catch(() => ({}))) as { kamar?: unknown };
  if (!Array.isArray(o.kamar) || o.kamar.length > BATAS_KAMAR) return galat("Daftar kamar tidak sah.");

  const punya = new Set(PROPERTIES_BERKAMAR.map((p) => p.key));
  const rapi: Room[] = [];
  const dipakai = new Set<string>();
  for (const x of o.kamar as Record<string, unknown>[]) {
    const id = typeof x.id === "string" ? x.id.trim().slice(0, 20) : "";
    const nama = typeof x.name === "string" ? x.name.trim().slice(0, 60) : "";
    const cap = typeof x.cap === "string" ? x.cap.trim().slice(0, 60) : "";
    const rate = Number(x.rate);
    if (!id || !nama) return galat("Tiap kamar perlu id dan nama.");
    if (dipakai.has(id)) return galat(`Id kamar ${id} dipakai dua kali.`);
    if (!punya.has(x.prop as never)) return galat(`Properti kamar ${nama} tidak dikenal.`);
    if (!Number.isFinite(rate) || rate < 0 || rate > 1e9) return galat(`Tarif kamar ${nama} tidak sah.`);
    dipakai.add(id);
    rapi.push({ id, prop: x.prop as Room["prop"], name: nama, cap, rate: Math.round(rate), active: x.active !== false });
  }

  /* Yang dibuang dari daftar tidak boleh masih dipakai. */
  const lama = await ambilKamar();
  const hilang = lama.filter((r) => !dipakai.has(r.id)).map((r) => r.id);
  if (hilang.length) {
    const terpakai = new Set([
      ...(await ambilPesanan()).map((b) => b.roomId),
      ...(await daftarSambungan()).map((s) => s.roomId),
    ]);
    const tertahan = hilang.find((id) => terpakai.has(id));
    if (tertahan) {
      const nama = lama.find((r) => r.id === tertahan)?.name ?? tertahan;
      return galat(`${nama} masih punya pesanan atau sambungan kalender. Nonaktifkan saja, jangan dihapus.`, 409);
    }
  }
  await simpanKamar(rapi);
  return NextResponse.json({ kamar: rapi });
}
