import { NextResponse } from "next/server";

import { lihatSemua } from "@/lib/peran";
import { akunMasuk, bolehLayar, galat, propertiBoleh, tidakAda } from "@/lib/server/akses";
import { alamatPeminta, catat } from "@/lib/server/batas";
import { SITUS, bacaStatistik, catatKunjungan, negaraDari, robot, type Situs } from "@/lib/server/kunjungan";

/**
 * Kunjungan situs publik.
 *
 *   POST  { situs, jalur }   dicatat oleh situs publik (beacon), tanpa sesi.
 *                            Dilewati bila Do Not Track atau Global Privacy
 *                            Control menyala, bila pengunjungnya robot, atau
 *                            bila yang membuka sedang masuk ke dashboard.
 *   GET   ?situs=&rentang=&hari=   statistik, hanya untuk yang boleh. Manajer
 *                                  unit hanya mendapat situs unitnya.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const dilewati = () => new NextResponse(null, { status: 204 });

export async function POST(req: Request) {
  if (req.headers.get("dnt") === "1" || req.headers.get("sec-gpc") === "1") return dilewati();
  const ua = req.headers.get("user-agent") ?? "";
  if (robot(ua)) return dilewati();
  const ip = alamatPeminta(req);
  if (catat(`kunjungan:${ip}`, 60_000) > 60) return dilewati();

  const o = (await req.json().catch(() => ({}))) as { situs?: unknown; jalur?: unknown };
  if (!SITUS.includes(o.situs as Situs)) return dilewati();
  const jalur = typeof o.jalur === "string" && o.jalur.startsWith("/") ? o.jalur.split(/[?#]/)[0].slice(0, 80) : "/";

  /* Pengelola yang sedang masuk tidak dihitung. */
  if (await akunMasuk()) return dilewati();

  await catatKunjungan({
    situs: o.situs as Situs,
    jalur,
    ip,
    ua,
    negara: negaraDari({
      negaraHeader:
        req.headers.get("cf-ipcountry") ?? req.headers.get("x-vercel-ip-country") ??
        req.headers.get("cloudfront-viewer-country") ?? req.headers.get("x-country-code") ?? "",
      bahasa: req.headers.get("accept-language") ?? "",
    }),
  });
  return dilewati();
}

export async function GET(req: Request) {
  const akun = await akunMasuk();
  if (!akun || !bolehLayar(akun, "statistik")) return tidakAda();

  /* Situs yang boleh dilihat akun ini. */
  const boleh: Situs[] = lihatSemua(akun.peran) || akun.peran === "pr"
    ? [...SITUS]
    : SITUS.filter((s) => propertiBoleh(akun).includes(s));
  if (boleh.length === 0) return tidakAda();

  const q = new URL(req.url).searchParams;
  const diminta = q.get("situs") ?? "all";
  let situs: Situs[];
  if (diminta === "all") situs = boleh;
  else if (SITUS.includes(diminta as Situs)) {
    if (!boleh.includes(diminta as Situs)) return galat("Anda hanya bisa melihat statistik unit Anda.", 403);
    situs = [diminta as Situs];
  } else return galat("Situs tidak dikenal.");

  const rentang = q.get("rentang") === "30" ? 30 : 7;
  return NextResponse.json({ boleh, statistik: await bacaStatistik(situs, rentang, q.get("hari") ?? undefined) });
}
