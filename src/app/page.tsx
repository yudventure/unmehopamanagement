import { cookies } from "next/headers";

import { BookingManager } from "@/components/booking-manager";
import { SignIn } from "@/components/sign-in";
import { SESSION_COOKIE, valid } from "@/lib/session";
import { semuaAkun, publik } from "@/lib/server/akun";
import { aksesPenuh } from "@/lib/peran";

/**
 * The manager, behind its door.
 *
 * Decided here rather than inside the manager so that an unsigned visitor is
 * never sent it in the first place. Reading the cookie makes this render per
 * request, which is what a dashboard should do anyway: there is nothing here
 * worth caching and quite a lot worth not handing out.
 */
export default async function Home() {
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
