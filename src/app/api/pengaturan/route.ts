import { NextResponse } from "next/server";

import { sistemLamaSiap } from "@/lib/sistem-lama";
import { aksesPenuh } from "@/lib/peran";
import { akunMasuk, galat, tidakAda } from "@/lib/server/akses";
import { bacaPengaturan, ubahPengaturan } from "@/lib/server/pengaturan";

/**
 * Sakelar dashboard.
 *
 *   GET   keadaan sakelar, untuk siapa pun yang masuk, beserta apakah akun itu
 *         boleh membaliknya
 *   PUT   { sistemLamaAktif?, jadwalLamaAktif? }   hanya developer dan pemilik; general manager hanya melihat
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const akun = await akunMasuk();
  if (!akun) return tidakAda();
  const p = await bacaPengaturan();
  return NextResponse.json({
    sistemLamaAktif: p.sistemLamaAktif,
    jadwalLamaAktif: p.jadwalLamaAktif,
    /* Dimatikan atau menyala, ia hanya bisa menyala bila server tahu alamat dan
       kata sandinya. */
    sistemLamaSiap: sistemLamaSiap(),
    diubahOleh: p.diubahOleh ?? null,
    diubahPada: p.diubahPada ?? null,
    bolehUbah: aksesPenuh(akun.peran),
  });
}

export async function PUT(req: Request) {
  const akun = await akunMasuk();
  if (!akun || !aksesPenuh(akun.peran)) return tidakAda();
  const o = (await req.json().catch(() => ({}))) as { sistemLamaAktif?: unknown; jadwalLamaAktif?: unknown };
  const patch: { sistemLamaAktif?: boolean; jadwalLamaAktif?: boolean } = {};
  if (typeof o.sistemLamaAktif === "boolean") patch.sistemLamaAktif = o.sistemLamaAktif;
  if (typeof o.jadwalLamaAktif === "boolean") patch.jadwalLamaAktif = o.jadwalLamaAktif;
  if (!Object.keys(patch).length) return galat("Nilai sakelar tidak sah.");
  const p = await ubahPengaturan(patch, akun.nama);
  return NextResponse.json({ sistemLamaAktif: p.sistemLamaAktif, jadwalLamaAktif: p.jadwalLamaAktif, diubahOleh: p.diubahOleh, diubahPada: p.diubahPada });
}
