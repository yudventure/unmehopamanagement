import { cookies } from "next/headers";

import { BookingManager } from "@/components/booking-manager";
import { SignIn } from "@/components/sign-in";
import { SESSION_COOKIE, valid } from "@/lib/session";

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
  const inside = valid(jar.get(SESSION_COOKIE)?.value);
  /* The whole manager sits inside this one attribute. `globals.css` redefines
     the theme variables under it, so every screen is restyled at once while
     the homestay sites, which share most of those variables, are untouched. */
  return (
    <div data-manager className="min-h-screen bg-canvas">
      {inside ? <BookingManager signedIn /> : <SignIn />}
    </div>
  );
}
