import type { Metadata } from "next";

import { cookies } from "next/headers";

import { BookingManager } from "@/components/booking-manager";
import { SignIn } from "@/components/sign-in";
import { SESSION_COOKIE, valid } from "@/lib/session";
import { semuaAkun, publik } from "@/lib/server/akun";
import { aksesPenuh } from "@/lib/peran";

/**
 * The booking manager, reachable from a homestay's own domain.
 *
 * `/` is the manager, but on a domain listed in `SITE_DOMAIN_*` that address
 * belongs to the homestay, and every other path there is rewritten under the
 * site's prefix. The effect, found the hard way once eddohomestay.com went
 * live, is that the manager has no address at all on the only domain currently
 * pointing at the application: `/` is the homestay and everything else is a
 * 404.
 *
 * A second address fixes it without a second deployment. Path rewrites run
 * after the filesystem, so a real route wins over them, which is the same
 * reason `/turtle`, `/api/...` and `/preview` still work on the homestay's
 * domain. So `eddohomestay.com/kelola` reaches this, and so does
 * `unmehopamanagement.com/kelola` later, alongside `/` which keeps working on
 * any host that is not a homestay's.
 *
 * The alternative was giving the subdomain its own Node application. That
 * means deploying the same archive twice and keeping the two in step forever,
 * and the day they drift is the day someone edits prices on the copy nobody is
 * serving.
 */

export const metadata: Metadata = {
  title: "Kelola · Unmehopa Management",
  /* The manager is not a page anyone should arrive at from a search. Its own
     door is not a secret, but it is not an entrance either. */
  robots: { index: false, follow: false },
};

export default async function KelolaPage() {
  const jar = await cookies();
  const saya = await valid(jar.get(SESSION_COOKIE)?.value);
  /* Daftar akun hanya dikirim ke yang boleh mengaturnya. Yang lain cukup tahu
     dirinya sendiri: daftar rekan kerja bukan urusan staf. */
  const daftar = saya && aksesPenuh(saya.peran) ? (await semuaAkun()).map(publik) : saya ? [publik(saya)] : [];
  const perluPenyiapan = !saya && (await semuaAkun()).length === 0;
  /* The whole manager sits inside this one attribute. `globals.css` redefines
     the theme variables under it, so every screen is restyled at once while
     the homestay sites, which share most of those variables, are untouched. */
  return (
    <div data-manager className="min-h-screen bg-canvas">
      {saya ? <BookingManager akun={publik(saya)} daftarAkun={daftar} /> : <SignIn perluPenyiapan={perluPenyiapan} />}
    </div>
  );
}
