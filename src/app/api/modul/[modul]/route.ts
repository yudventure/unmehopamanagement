import { NextResponse } from "next/server";

import { KOLEKSI, rapikanParameter, type Modul, type Rekaman } from "@/lib/modul";
import { aksesModul, ubahParameterSdm } from "@/lib/peran";
import { akunMasuk, galat, propertiBoleh, tidakAda } from "@/lib/server/akses";
import { bacaModul, hapusRekaman, parameterSdm, simpanParameterSdm, simpanRekaman, unitSah } from "@/lib/server/modul";

/**
 * Data modul keuangan, SDM, dan gudang.
 *
 *   GET     semua catatan modul itu di unit yang boleh disentuh akun, beserta
 *           akses akunnya ("tulis" atau "baca"); untuk SDM juga angka acuan
 *   POST    { koleksi, unit, id?, data }   tambah (tanpa id) atau ubah
 *   PUT     { parameter }                  ubah angka acuan gaji (SDM saja)
 *   DELETE  ?koleksi=&id=                  hapus
 *
 * Yang boleh apa mengikuti `aksesModul`; unit mengikuti `propertiBoleh`, jadi
 * manajer Eddo tidak melihat atau mengubah catatan Turtle. Staf hanya boleh
 * mencatat keluar masuk barang gudang, bukan mengubah daftar barangnya.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const modulSah = (m: string): m is Modul => m === "keuangan" || m === "sdm" || m === "gudang";
const STAF_BOLEH = new Set(["mutasi"]);

export async function GET(_: Request, { params }: { params: Promise<{ modul: string }> }) {
  const { modul } = await params;
  const akun = await akunMasuk();
  if (!modulSah(modul) || !akun) return tidakAda();
  const akses = aksesModul(akun.peran, modul);
  if (!akses) return tidakAda();
  const boleh = new Set<string>(propertiBoleh(akun));
  const isi = await bacaModul(modul);
  const data: Record<string, unknown[]> = {};
  for (const k of KOLEKSI.filter((x) => x.modul === modul)) {
    data[k.id] = (Array.isArray(isi[k.id]) ? (isi[k.id] as Rekaman[]) : []).filter((r) => boleh.has(r.unit));
  }
  const tulisKoleksi = akses === "tulis" ? (akun.peran === "staf" ? [...STAF_BOLEH] : KOLEKSI.filter((x) => x.modul === modul).map((x) => x.id)) : [];
  return NextResponse.json({
    data,
    akses,
    tulisKoleksi,
    unit: [...boleh],
    ...(modul === "sdm" ? { parameter: await parameterSdm(), bolehUbahParameter: ubahParameterSdm(akun.peran) } : {}),
  });
}

export async function POST(req: Request, { params }: { params: Promise<{ modul: string }> }) {
  const { modul } = await params;
  const akun = await akunMasuk();
  if (!modulSah(modul) || !akun || aksesModul(akun.peran, modul) !== "tulis") return tidakAda();
  const o = (await req.json().catch(() => ({}))) as { koleksi?: unknown; unit?: unknown; id?: unknown; data?: unknown };
  const koleksi = typeof o.koleksi === "string" ? o.koleksi : "";
  if (akun.peran === "staf" && !STAF_BOLEH.has(koleksi)) return tidakAda();
  if (!unitSah(o.unit) || !propertiBoleh(akun).includes(o.unit)) return galat("Pilih unit yang sah.", 403);
  const id = typeof o.id === "string" && o.id ? o.id : undefined;
  const r = await simpanRekaman(modul, koleksi, o.unit, (o.data && typeof o.data === "object" ? o.data : {}) as Record<string, unknown>, akun.nama, id);
  if (r.tidakAda) return tidakAda();
  if (r.galat) return galat(r.galat);
  return NextResponse.json({ rekaman: r.rekaman });
}

export async function PUT(req: Request, { params }: { params: Promise<{ modul: string }> }) {
  const { modul } = await params;
  const akun = await akunMasuk();
  if (modul !== "sdm" || !akun || !ubahParameterSdm(akun.peran) || aksesModul(akun.peran, "sdm") !== "tulis") return tidakAda();
  const o = (await req.json().catch(() => ({}))) as { parameter?: unknown };
  return NextResponse.json({ parameter: await simpanParameterSdm(rapikanParameter(o.parameter)) });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ modul: string }> }) {
  const { modul } = await params;
  const akun = await akunMasuk();
  if (!modulSah(modul) || !akun || aksesModul(akun.peran, modul) !== "tulis") return tidakAda();
  const u = new URL(req.url);
  const koleksi = u.searchParams.get("koleksi") ?? "";
  const id = u.searchParams.get("id") ?? "";
  if (akun.peran === "staf") return tidakAda();
  const boleh = new Set<string>(propertiBoleh(akun));
  const r = await hapusRekaman(modul, koleksi, id, (x) => boleh.has(x));
  if (r.tidakAda) return tidakAda();
  if (r.galat) return galat(r.galat, 409);
  return NextResponse.json({ ok: true });
}
