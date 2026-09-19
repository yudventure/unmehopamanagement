import { NextResponse } from "next/server";

import { PREVIEW_COOKIE, tokenOk } from "@/lib/preview";
import { redirectTo } from "@/lib/redirect";

/**
 * The door into a site that is closed for work.
 *
 *   /preview?token=…   hand in the token, get the cookie, land on the site
 *   /preview?clear=1   give the cookie back
 *
 * A link rather than a login screen, because the people who need it are the
 * two or three building the site and they need it on a phone as often as on a
 * laptop. Opening one link is a thing you can do standing on a jetty.
 *
 * The cookie is `httpOnly`, so no script on the page can read it or copy it
 * somewhere else, and `sameSite=lax`, so it rides along with a normal visit
 * but not with a request some other site makes on your behalf.
 *
 * It works on whichever host it is opened on: this is a real route, and route
 * files are matched before the host rewrites that would otherwise bury it
 * under `/eddo`. So `eddohomestay.com/preview?token=…` reaches it.
 *
 * And it lands back on that same host, which it did not always: the redirect
 * used to be built from `req.url` and so pointed at whatever address the server
 * had bound to. See `redirectTo`.
 */

export const runtime = "nodejs";

const YEAR = 60 * 60 * 24 * 365;

export async function GET(req: Request) {
  const url = new URL(req.url);

  if (url.searchParams.get("clear")) {
    const res = redirectTo("/");
    res.cookies.delete(PREVIEW_COOKIE);
    return res;
  }

  const token = url.searchParams.get("token") ?? "";

  /* Wrong token and missing token answer the same way, and neither says which
     it was. There is nothing to learn from the difference except whether
     guessing is worth continuing. */
  if (!tokenOk(token)) {
    return NextResponse.json({ error: "no" }, { status: 404 });
  }

  const res = redirectTo("/");
  res.cookies.set(PREVIEW_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    /* Secure on https and not on plain http, so this still works against a
       local server while never travelling in the clear in production. */
    secure: url.protocol === "https:",
    path: "/",
    maxAge: YEAR,
  });
  return res;
}
