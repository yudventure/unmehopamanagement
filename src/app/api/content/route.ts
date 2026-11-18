import { NextResponse } from "next/server";

import { lihatSemua } from "@/lib/peran";
import { akunMasuk, bolehLayar, propertiBoleh } from "@/lib/server/akses";
import { cocokSandi } from "@/lib/server/akun";
import { catat } from "@/lib/server/batas";
import {
  SITE_CONFIG, hanyaMengubahSitus, isSiteConfig, tidakMenyentuhPenutupan, type SiteConfig,
} from "@/lib/site-config";

/**
 * Reads and writes `content/site.json` — the file the website's contact
 * details and dive prices come from.
 *
 * With no database, the repository is the store. A save commits the file
 * through the GitHub API, the host sees the commit and rebuilds, and a minute
 * later the site is serving the new figures. Slower than a database and
 * completely durable, with every change kept in the repository's own history
 * next to the name of whoever made it.
 *
 * Needs, on the server:
 *
 *   GITHUB_TOKEN   fine-grained token, Contents: read and write, this repo
 *   GITHUB_REPO    "owner/name"
 *   GITHUB_BRANCH  optional, defaults to main
 *
 * Tidak ada lagi kata sandi CMS bersama (`CMS_PASSWORD`). Yang menyimpan harus
 * punya sesi dashboard yang sah, layar Website, dan mengetik ulang kata sandi
 * AKUNNYA SENDIRI sebagai konfirmasi: menyimpan menayangkan situs ke publik,
 * jadi sesi yang tertinggal terbuka di komputer bersama tidak cukup. Percobaan
 * dibatasi per akun. Apa yang boleh diubah mengikuti perannya, diperiksa terhadap
 * berkas yang sedang ada di GitHub (bukan salinan di peramban):
 *
 *   developer, pemilik, general manager   seluruh berkas
 *   public relation                       seluruh berkas kecuali penutupan situs
 *   manajer unit                          hanya bagian situs unitnya
 */

export const runtime = "nodejs";

const PATH = "content/site.json";

export async function GET() {
  return NextResponse.json({
    config: SITE_CONFIG,
    writable: Boolean(process.env.GITHUB_TOKEN && process.env.GITHUB_REPO),
  });
}

export async function PUT(req: Request) {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO;
  const branch = process.env.GITHUB_BRANCH ?? "main";

  if (!token || !repo) {
    return NextResponse.json({ error: "not-configured" }, { status: 503 });
  }

  let body: { sandi?: string; config?: unknown; by?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad-json" }, { status: 400 });
  }

  const akun = await akunMasuk();
  if (!akun || !bolehLayar(akun, "website")) {
    return NextResponse.json({ error: "unauthorised" }, { status: 401 });
  }
  if (catat(`cms:${akun.email}`, 10 * 60 * 1000) > 10) {
    return NextResponse.json({ error: "too-many" }, { status: 429 });
  }
  if (!(await cocokSandi(String(body.sandi ?? ""), akun.sandi))) {
    return NextResponse.json({ error: "wrong-password" }, { status: 401 });
  }

  const config = body.config;
  if (!isSiteConfig(config)) {
    return NextResponse.json({ error: "bad-config" }, { status: 422 });
  }

  const next: SiteConfig = {
    ...config,
    updatedAt: new Date().toISOString(),
    updatedBy: akun.nama.slice(0, 80),
  };

  /* Dapat diganti untuk uji dengan GitHub tiruan; di produksi tidak diisi. */
  const api = `${process.env.GITHUB_API_URL ?? "https://api.github.com"}/repos/${repo}/contents/${PATH}`;
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "Content-Type": "application/json",
  };

  /* GitHub needs the blob SHA it is replacing. Fetching it here rather than
     trusting one from the browser is what stops a stale tab overwriting a
     change somebody else saved a minute ago: if the file moved on, the SHA is
     wrong and GitHub rejects the write. */
  const head = await fetch(`${api}?ref=${encodeURIComponent(branch)}`, {
    headers,
    cache: "no-store",
  });
  if (!head.ok) {
    return NextResponse.json(
      { error: "read-failed", detail: await head.text() },
      { status: 502 },
    );
  }
  const { sha, content: isiLama } = (await head.json()) as { sha: string; content?: string };

  /* Yang bukan pemegang semua unit hanya boleh mengubah bagiannya. */
  if (!lihatSemua(akun.peran)) {
    let lama: SiteConfig | null = null;
    try {
      const o: unknown = JSON.parse(Buffer.from(isiLama ?? "", "base64").toString("utf8"));
      lama = isSiteConfig(o) ? o : null;
    } catch {
      lama = null;
    }
    if (!lama) return NextResponse.json({ error: "read-failed" }, { status: 502 });
    const unit = propertiBoleh(akun);
    const situs = unit.includes("turtle") ? "turtle" : unit.includes("eddo") ? "eddo" : null;
    const boleh =
      akun.peran === "manajer"
        ? situs !== null && hanyaMengubahSitus(lama, config, situs)
        : tidakMenyentuhPenutupan(lama, config);
    if (!boleh) {
      return NextResponse.json(
        { error: "forbidden", pesan: "Anda hanya bisa mengubah bagian website yang menjadi milik Anda." },
        { status: 403 },
      );
    }
  }

  const write = await fetch(api, {
    method: "PUT",
    headers,
    body: JSON.stringify({
      message: `Update website content${next.updatedBy ? ` (${next.updatedBy})` : ""}`,
      content: Buffer.from(JSON.stringify(next, null, 2) + "\n").toString(
        "base64",
      ),
      sha,
      branch,
    }),
  });

  if (!write.ok) {
    return NextResponse.json(
      { error: "write-failed", detail: await write.text() },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true, config: next });
}
