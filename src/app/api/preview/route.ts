import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { PREVIEW_COOKIE } from "@/lib/preview";
import { isSecureRequest } from "@/lib/request-url";
import { redirectTo } from "@/lib/redirect";
import { SESSION_COOKIE, valid } from "@/lib/session";
import { isPublicSite } from "@/lib/site-domains";

/**
 * The button in the dashboard that opens a closed site.
 *
 *   /api/preview?site=eddo   let me in, then take me there
 *
 * `/preview?token=…` already existed and still does: it is the link you send
 * to somebody who is not signed in here, and it is the only way in from a
 * phone that has never seen the dashboard. This is the same door for the
 * person who is already standing inside it.
 *
 * ## Why a route rather than a link the screen builds
 *
 * The screen cannot build that link, because building it means knowing
 * `PREVIEW_TOKEN`, and knowing it means shipping it to the browser inside the
 * dashboard's own HTML. The token would then sit in the page source, in the
 * address bar, in browser history and in the referrer of the next click.
 *
 * Here the token never leaves the server. The browser is handed the cookie the
 * token would have earned it and nothing else, which is the same access with
 * none of the copies.
 *
 * ## Why it redirects to the path form
 *
 * `/eddo` works from either address: on the homestay's own domain the rewrite
 * bounces it to `/`, and on the dashboard's domain it serves the site directly.
 * Redirecting to the domain instead would set the cookie on the wrong origin,
 * since a cookie set here belongs to here; the reader would arrive at the
 * homestay's address without it and be shown the holding page they were trying
 * to get past.
 *
 * ## Signed out it is not here
 *
 * 404 rather than 401, the same as the diagnostics page. Knowing this endpoint
 * exists tells a stranger that the site has a way in worth looking for.
 */

export const runtime = "nodejs";

const YEAR = 60 * 60 * 24 * 365;

export async function GET(req: Request) {
  const jar = await cookies();
  if (!valid(jar.get(SESSION_COOKIE)?.value)) {
    return NextResponse.json({ error: "not-found" }, { status: 404 });
  }

  const url = new URL(req.url);
  const asked = (url.searchParams.get("site") ?? "").trim().toLowerCase();
  if (!isPublicSite(asked)) {
    return NextResponse.json({ error: "unknown-site" }, { status: 400 });
  }

  const token = process.env.PREVIEW_TOKEN;
  const res = redirectTo(`/${asked}`);

  /*
   * No token configured is not an error here, and the redirect still happens.
   * An open site is worth looking at whether or not anybody has set up a way
   * into a closed one, and a button that refuses to open a site that is not
   * even shut would be a puzzle. The screen says so in words instead.
   */
  if (token) {
    res.cookies.set(PREVIEW_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      /* Secure on https and not on plain http, so this still works against a
         local server while never travelling in the clear in production. Read
         from the forwarding header first: behind a proxy that terminates TLS
         the request itself arrives as plain http, and trusting that would
         leave the flag off on every deployment that has one. */
      secure: isSecureRequest(req),
      path: "/",
      maxAge: YEAR,
    });
  }
  return res;
}
