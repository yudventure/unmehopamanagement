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
  if (!valid(jar.get(SESSION_COOKIE)?.value)) return <SignIn />;
  return <BookingManager signedIn />;
}
