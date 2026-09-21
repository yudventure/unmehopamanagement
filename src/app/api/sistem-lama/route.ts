import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { SESSION_COOKIE, valid } from "@/lib/session";
import {
  bacaDaftarBooking,
  bacaSistemLama,
  modeBacaValid,
  sistemLamaSiap,
} from "@/lib/sistem-lama";

/**
 * What the old Turtle system has, read from here.
 *
 * This is a door onto somebody else's live system, so it is worth being
 * precise about what it is and what it is not.
 *
 * It is **not** a proxy. A proxy passes on what it is given; this passes on
 * nothing. The method is GET and cannot be anything else, the mode must be
 * one of the read modes named in `sistem-lama.ts`, and the password is added
 * on this side and never sent back. A caller who wants to write to the old
 * system cannot express that request here — there is no shape for it.
 *
 * It is also not open. Signed out it answers 404, the same as `/api/preview`
 * and for the same reason: an endpoint that admits to existing tells a
 * stranger the site has a way into the client's booking data.
 *
 * ## The honest limit
 *
 * The session cookie says somebody signed in. It does not say who, because
 * there is one dashboard password and the role is picked in the browser. So
 * this cannot be owner-only on the server, and anyone who can sign into the
 * dashboard can read the old system through it. That is the same blast radius
 * the dashboard already has over its own bookings, which is why it is
 * acceptable here and would not be if this endpoint could write.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const jar = await cookies();
  if (!valid(jar.get(SESSION_COOKIE)?.value)) {
    return NextResponse.json({ error: "not-found" }, { status: 404 });
  }

  if (!sistemLamaSiap()) {
    return NextResponse.json({
      ok: false,
      siap: false,
      pesan:
        "SISTEM_LAMA_URL dan SISTEM_LAMA_PASSWORD belum diisi di server, " +
        "jadi belum ada yang bisa dibaca.",
    });
  }

  const mode = (
    new URL(req.url).searchParams.get("mode") ?? "adminList"
  ).trim();

  if (mode === "adminList") {
    const hasil = await bacaDaftarBooking();
    return NextResponse.json({
      ok: hasil.ok,
      siap: true,
      pesan: hasil.pesan ?? null,
      ms: hasil.ms,
      bookings: hasil.data ?? [],
    });
  }

  if (!modeBacaValid(mode)) {
    /* Named rather than shrugged at: the modes left out of the whitelist are
       left out on purpose, and a flat "unknown mode" would read like a typo
       to the next person wondering why their mode does not work. */
    return NextResponse.json(
      {
        ok: false,
        siap: true,
        pesan: `Mode "${mode}" tidak ada dalam daftar baca. Yang bisa menulis sengaja tidak dipasang.`,
      },
      { status: 400 },
    );
  }

  /* Parameter ikut diteruskan — daftar putihnya ada di `sistem-lama.ts`, yang
     membuang apa pun di luar itu. Tanpa ini, `adminGetUpcomingSessions`
     dipanggil tanpa `activityPrefix` dan memulangkan jadwal aktivitas yang
     salah tanpa mengeluh. */
  const params: Record<string, string> = {};
  for (const [k, v] of new URL(req.url).searchParams) {
    if (k !== "mode") params[k] = v;
  }

  const hasil = await bacaSistemLama(mode, params);
  return NextResponse.json({
    ok: hasil.ok,
    siap: true,
    pesan: hasil.pesan ?? null,
    ms: hasil.ms,
    data: hasil.data ?? null,
  });
}
