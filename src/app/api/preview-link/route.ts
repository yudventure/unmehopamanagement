import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { requestOrigin } from "@/lib/request-url";
import { SESSION_COOKIE, valid } from "@/lib/session";
import { PUBLIC_SITE_KEYS, siteDomain } from "@/lib/site-domains";

/**
 * The link the owner hands to whoever is waiting to see the work.
 *
 * A site closed for work is closed to the person paying for it too, and that
 * is the wrong way round: the changes are theirs to look at. `/preview?token=…`
 * already lets anyone holding it through, so what was missing was not a
 * mechanism but a way to get the address without opening the server panel and
 * copying an environment variable by hand — which is not something to ask of
 * somebody on a phone, and not something to do over WhatsApp from memory.
 *
 * ## Why this is not part of `/api/content`
 *
 * Because `GET /api/content` answers anybody. It carries prices and contact
 * details that are on the public site anyway, so that has been survivable, but
 * `PREVIEW_TOKEN` is the one thing standing between the internet and a site
 * its owner has deliberately closed. Putting it in that response would publish
 * it.
 *
 * So this is its own route and it checks the dashboard session before it says
 * anything. Same cookie the manager itself is gated on, checked the same way,
 * and an unsigned visitor is told nothing at all rather than told it exists.
 *
 * ## Which host the link points at
 *
 * The cookie is set for the host the link is opened on, so a link built from
 * the dashboard's own address would arm the wrong domain the day the manager
 * moves to `unmehopamanagement.com`. Each site's configured domain is used
 * where there is one, and the address this request arrived on only as the
 * fallback for the state the application is in today, where all three share a
 * host.
 *
 * That fallback is read from the request's own headers rather than from
 * `req.url`, and `lib/request-url.ts` says why at length: the short version is
 * that `req.url` carries the address the server binds to, which on the
 * standalone build is `0.0.0.0` — a wildcard no browser will open.
 */

export const runtime = "nodejs";

export async function GET(req: Request) {
  const jar = await cookies();
  /* 404 rather than 401, matching `/api/preview` beside it: telling a stranger
     that this endpoint exists tells them the site has a way in worth looking
     for, and a refusal that names itself is an invitation to come back with a
     session. */
  if (!(await valid(jar.get(SESSION_COOKIE)?.value))) {
    return NextResponse.json({ error: "not-found" }, { status: 404 });
  }

  const token = process.env.PREVIEW_TOKEN;
  /* Not an error. An unset token is the ordinary state before anyone has set
     one up, and the screen explains it rather than showing a failure. */
  if (!token) return NextResponse.json({ configured: false, links: {} });

  /* The address the browser asked for, not the one the server bound to. The
     standalone build listens on 0.0.0.0, and a link carrying that host is one
     Chrome refuses to open — on the client's phone, after it has been sent. */
  const origin = requestOrigin(req);
  const links: Record<string, string> = {};
  for (const site of PUBLIC_SITE_KEYS) {
    const host = siteDomain(site);
    const base = host ? `https://${host}` : origin;
    /* `site` so the link lands on that homestay rather than on `/`, which
       is the dashboard on any address the site does not own yet. */
    links[site] = `${base}/preview?token=${encodeURIComponent(token)}&site=${site}`;
  }

  return NextResponse.json({ configured: true, links });
}
