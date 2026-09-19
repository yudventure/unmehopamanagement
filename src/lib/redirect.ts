import { NextResponse } from "next/server";

/**
 * A redirect that stays on whatever address the visitor actually used.
 *
 * `NextResponse.redirect` wants an absolute URL, and the only absolute URL a
 * route handler has to hand is built from `req.url`. That is the address the
 * server bound to, not the one the browser typed. Behind a hosting panel's
 * proxy it is `localhost:3000`, or `0.0.0.0:3000`, and a visitor who followed
 * it would be sent to a port on their own machine.
 *
 * Measured rather than feared: asked for `/preview?token=…` with a `Host` of
 * `eddohomestay.com`, the old code answered `Location: http://localhost:5041/`.
 * The way into a closed site would have led out of it.
 *
 * A relative `Location` is allowed by RFC 7231 and is resolved by the browser
 * against the request it made, which is the one address here that cannot be
 * wrong. Cookies still attach to the response exactly as before.
 */
export function redirectTo(path: string): NextResponse {
  return new NextResponse(null, { status: 307, headers: { Location: path } });
}
