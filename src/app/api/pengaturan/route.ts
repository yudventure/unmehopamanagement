import { NextResponse } from "next/server";

import { sistemLamaSiap } from "@/lib/sistem-lama";
import { lihatSemua } from "@/lib/peran";
import { akunMasuk, galat, tidakAda } from "@/lib/server/akses";
import { bacaPengaturan, ubahPengaturan } from "@/lib/server/pengaturan";

/**
 * Sakelar dashboard.
 *
 *   GET   keadaan sakelar, untuk siapa pun yang masuk, beserta apakah akun itu
 *         boleh membaliknya
 *   PUT   { sistemLamaAktif }   hanya developer, pemilik, dan general manager
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const akun = await akunMasuk();
  if (!akun) return tidakAda();
  const p = await bacaPengaturan();
  return NextResponse.json({
    sistemLamaAktif: p.sistemLamaAktif,
    /* Dimatikan atau menyala, ia hanya bisa menyala bila server tahu alamat dan
       kata sandinya. */
    sistemLamaSiap: sistemLamaSiap(),
    diubahOleh: p.diubahOleh ?? null,
    diubahPada: p.diubahPada ?? null,
    bolehUbah: lihatSemua(akun.peran),
  });
}

export async function PUT(req: Request) {
  const akun = await akunMasuk();
  if (!akun || !lihatSemua(akun.peran)) return tidakAda();
  const o = (await req.json().catch(() => ({}))) as { sistemLamaAktif?: unknown };
  if (typeof o.sistemLamaAktif !== "boolean") return galat("Nilai sakelar tidak sah.");
  const p = await ubahPengaturan({ sistemLamaAktif: o.sistemLamaAktif }, akun.nama);
  return NextResponse.json({ sistemLamaAktif: p.sistemLamaAktif, diubahOleh: p.diubahOleh, diubahPada: p.diubahPada });
}
