import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { SESSION_COOKIE, valid } from "@/lib/session";

/**
 * What the server thinks of its own configuration.
 *
 * Every variable here fails quietly by design: no Resend key and the form
 * opens WhatsApp, no Midtrans key and the button asks instead of charging, no
 * GitHub token and the CMS simply will not save. That is the right behaviour
 * for a visitor and a miserable one for whoever is setting the thing up,
 * because a site that never complains is indistinguishable from a site that is
 * configured correctly.
 *
 * So this says out loud what is missing, what is truncated, and what is
 * inconsistent, in one place, instead of leaving it to be discovered one
 * disappointed guest at a time.
 *
 * ## It never returns a value
 *
 * Only whether something is set, how long it is, and whether its shape matches
 * what it claims to be. A diagnostics page that prints secrets is a worse
 * problem than the one it solves, and this one is reachable from the internet.
 *
 * ## It is behind the dashboard session
 *
 * Knowing which integrations a site has wired up is reconnaissance. Signed out,
 * this answers 404 rather than 401, because 401 confirms the endpoint exists.
 */

export const runtime = "nodejs";

type State = "ok" | "kosong" | "curiga";

interface Check {
  nama: string;
  keadaan: State;
  catatan: string;
}

const set = (v: string | undefined) => Boolean(v && v.trim());

/**
 * A fine-grained GitHub token runs to roughly a hundred characters. Anything
 * much shorter has been cut somewhere between the panel that displayed it and
 * the box it was pasted into, which is a real thing that happens because the
 * panel truncates the display and the eye does not notice.
 */
const TOKEN_MIN = 60;

export async function GET() {
  const jar = await cookies();
  if (!valid(jar.get(SESSION_COOKIE)?.value)) {
    return NextResponse.json({ error: "not-found" }, { status: 404 });
  }

  const env = process.env;
  const checks: Check[] = [];

  const need = (nama: string, catatanKosong: string) => {
    checks.push(
      set(env[nama])
        ? { nama, keadaan: "ok", catatan: `terisi, ${env[nama]!.trim().length} karakter` }
        : { nama, keadaan: "kosong", catatan: catatanKosong },
    );
  };

  need("DASHBOARD_PASSWORD", "tidak ada yang bisa masuk ke dashboard");
  need("SESSION_SECRET", "sesi putus tiap server restart");
  need("CMS_PASSWORD", "CMS menolak menyimpan sama sekali");
  need("GITHUB_REPO", "CMS tidak tahu harus menulis ke mana");
  need("RESEND_API_KEY", "tombol Kirim beralih membuka WhatsApp");
  need("ENQUIRY_FROM", "sama seperti di atas");
  need("PREVIEW_TOKEN", "situs yang ditutup tidak bisa dibuka siapa pun");

  /* Length rather than content, so a token cut short by a copy-paste is caught
     without the token ever being echoed. */
  const token = (env.GITHUB_TOKEN ?? "").trim();
  checks.push(
    !token
      ? { nama: "GITHUB_TOKEN", keadaan: "kosong", catatan: "CMS tidak bisa menyimpan" }
      : token.length < TOKEN_MIN
        ? {
            nama: "GITHUB_TOKEN",
            keadaan: "curiga",
            catatan: `cuma ${token.length} karakter, kemungkinan terpotong saat disalin`,
          }
        : { nama: "GITHUB_TOKEN", keadaan: "ok", catatan: `terisi, ${token.length} karakter` },
  );

  /*
   * Midtrans rejects a key used in the wrong environment, and what comes back
   * reads like the application is broken rather than like the keys are in the
   * wrong pair. So this looks, but only as far as it honestly can.
   *
   * An `SB-` prefix means sandbox and nothing else, so that one direction is
   * safe to call. The absence of it means nothing at all: checked against a
   * real account on 18 September 2026, the Sandbox dashboard issued keys named
   * plain `Mid-server-…`, with no prefix. An earlier version of this file
   * treated the missing prefix as proof of a production key and would have told
   * somebody their perfectly good sandbox key was wrong, which is worse than
   * not checking.
   */
  const server = (env.MIDTRANS_SERVER_KEY ?? "").trim();
  const produksi = env.MIDTRANS_IS_PRODUCTION === "true";
  const bertandaSandbox = server.startsWith("SB-");

  if (!server) {
    checks.push({
      nama: "MIDTRANS_SERVER_KEY",
      keadaan: "kosong",
      catatan: "tombol bayar bertanya lewat formulir, bukan menagih",
    });
  } else if (!server.includes("Mid-server-")) {
    checks.push({
      nama: "MIDTRANS_SERVER_KEY",
      keadaan: "curiga",
      catatan: "bentuknya tidak memuat Mid-server-, mungkin tersalin sebagian",
    });
  } else if (produksi && bertandaSandbox) {
    checks.push({
      nama: "MIDTRANS_SERVER_KEY",
      keadaan: "curiga",
      catatan: "kunci bertanda SB- dipakai dengan MIDTRANS_IS_PRODUCTION=true, akan ditolak Midtrans",
    });
  } else {
    checks.push({
      nama: "MIDTRANS_SERVER_KEY",
      keadaan: "ok",
      catatan: produksi
        ? "terisi, mode produksi; cocokkan sendiri dengan lingkungan di dashboard Midtrans"
        : "terisi, mode sandbox; cocokkan sendiri dengan lingkungan di dashboard Midtrans",
    });
  }

  /* Read at build and compiled into the browser bundle, so its absence cannot
     be fixed from this panel. Named here anyway, because the symptom, a pay
     button that quietly asks instead of charging, otherwise sends people
     hunting on the wrong side of the wire. */
  checks.push({
    nama: "NEXT_PUBLIC_MIDTRANS_CLIENT_KEY",
    keadaan: set(env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY) ? "ok" : "kosong",
    catatan: set(env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY)
      ? "tertanam saat build"
      : "dibaca saat build, isinya di GitHub sebagai repository variable, bukan di panel server",
  });

  /* Set on the server it does nothing at all, which is worth saying so nobody
     keeps adjusting it and waiting for a change. */
  if (set(env.MIDTRANS_CLIENT_KEY)) {
    checks.push({
      nama: "MIDTRANS_CLIENT_KEY",
      keadaan: "curiga",
      catatan: "tidak dibaca aplikasi ini, boleh dihapus; yang dipakai NEXT_PUBLIC_MIDTRANS_CLIENT_KEY",
    });
  }

  checks.push({
    nama: "SITE_DOMAIN_EDDO",
    keadaan: set(env.SITE_DOMAIN_EDDO) ? "ok" : "kosong",
    catatan: set(env.SITE_DOMAIN_EDDO)
      ? "tertanam saat build"
      : "dibaca saat build; kalau domainnya tetap menyajikan situs yang benar, ini memang wajar dan bukan masalah",
  });

  const bermasalah = checks.filter((c) => c.keadaan !== "ok");

  return NextResponse.json(
    {
      ringkas: bermasalah.length
        ? `${bermasalah.length} perlu diperiksa`
        : "semua terisi dan konsisten",
      perluDiperiksa: bermasalah,
      semua: checks,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
