import { NextResponse } from "next/server";

import { isSecureRequest } from "@/lib/request-url";
import { SESSION_COOKIE, issue, loginConfigured, passwordOk } from "@/lib/session";

/**
 * Signing in and out of the booking manager.
 *
 *   POST  { password }   correct, and a signed session cookie comes back
 *   DELETE               hands the cookie back
 *
 * The comparison happens here rather than in the browser, which is the whole
 * point: the previous login could be satisfied by typing any character at all,
 * and even a strict check shipped to the browser is a check the browser is
 * free to skip.
 *
 * The cookie is `httpOnly`, so no script can read it, and `sameSite=lax`, so
 * it travels with a normal visit but not with a request another site makes on
 * the reader's behalf.
 */

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!loginConfigured()) {
    /* Said out loud rather than answered as a wrong password, because this is
       the one failure the person typing can do nothing about and the operator
       needs to recognise immediately. */
    return NextResponse.json({ error: "not-configured" }, { status: 503 });
  }

  let body: { password?: string };
  try {
    body = (await req.json()) as { password?: string };
  } catch {
    return NextResponse.json({ error: "bad-json" }, { status: 400 });
  }

  if (!passwordOk(body.password ?? "")) {
    /* No detail, and the same answer whether the password was wrong, empty or
       missing. There is nothing to learn from the difference except whether to
       keep guessing. */
    return NextResponse.json({ error: "no" }, { status: 401 });
  }

  const { value, maxAge } = issue();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, value, {
    httpOnly: true,
    sameSite: "lax",
    /* Secure over https and not over plain http, so a local server still works
       while the cookie never travels in the clear in production. Taken from
       the forwarding header where there is one: behind a proxy that speaks TLS
       to the browser and http to us, the request's own scheme says http and
       the session cookie would go out unmarked. */
    secure: isSecureRequest(req),
    path: "/",
    maxAge,
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(SESSION_COOKIE);
  return res;
}
