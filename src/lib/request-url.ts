/**
 * The address a request actually arrived on, as a browser could use it again.
 *
 * `new URL(req.url)` looks like the obvious source and is the wrong one behind
 * anything. Next builds that URL from the address the server is *bound* to,
 * and the standalone build binds to `0.0.0.0` unless told otherwise — so a
 * link built from it reads `http://0.0.0.0:3000/…`, which is not a broken
 * host name but a wildcard meaning "every interface on this machine". Chrome
 * refuses to open it outright (`ERR_ADDRESS_INVALID`), and the failure only
 * happens on the other person's phone: in the manager the link looks perfect,
 * and it is sent to a client before anybody has clicked it.
 *
 * The same reading is wrong in the other direction in production. Behind a
 * proxy that terminates TLS — which is every managed host, and the shared one
 * this runs on — the request reaches the application as plain http, so a
 * cookie marked
 * `secure` only when `req.url` says https is never marked secure at all.
 *
 * Both are answered by the headers the proxy sets and the browser sends, which
 * is what these read.
 */

/** The first value of a possibly comma-joined forwarding header. */
function first(value: string | null): string {
  return (value ?? "").split(",")[0]?.trim() ?? "";
}

/**
 * Whether the browser reached us over https.
 *
 * `x-forwarded-proto` first, because a proxy that speaks TLS to the world and
 * http to us is the normal shape of a deployment and the only one that knows
 * the answer. The request's own scheme after that, for running without one.
 */
export function isSecureRequest(req: Request): boolean {
  const forwarded = first(req.headers.get("x-forwarded-proto")).toLowerCase();
  if (forwarded) return forwarded === "https";
  try {
    return new URL(req.url).protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * A wildcard bind address is not somewhere a browser can go.
 *
 * `0.0.0.0` and `::` mean "listen on everything" to a server and nothing at
 * all to a client. The loopback name is what the person running that server
 * would have typed themselves, so it is what a link should carry when the
 * request gives us nothing better.
 */
function openable(host: string): string {
  /* Host and port, with an IPv6 address kept inside its brackets. Splitting on
     the first colon would take `[::]:3000` apart in the wrong place, and
     comparing the whole string would miss `0.0.0.0:3000` — which is the form
     this is actually for, since a dev server is never on port 80. */
  const parts = /^(\[[^\]]*\]|[^:]*)(:\d+)?$/.exec(host);
  if (!parts) return host;
  const name = parts[1].replace(/^\[|\]$/g, "").toLowerCase();
  const port = parts[2] ?? "";
  if (name === "0.0.0.0" || name === "::" || name === "0:0:0:0:0:0:0:0") {
    return `localhost${port}`;
  }
  return host;
}

/**
 * Scheme and host, with no trailing slash — the part a path is appended to.
 *
 * The `Host` header is what the browser asked for and therefore what it can
 * ask for again; `x-forwarded-host` overrides it where a proxy rewrote it. The
 * bound address in `req.url` is the last resort, and even then its wildcard
 * form is swapped for something openable.
 */
export function requestOrigin(req: Request): string {
  const proto = isSecureRequest(req) ? "https" : "http";
  const host =
    first(req.headers.get("x-forwarded-host")) ||
    (req.headers.get("host") ?? "").trim();
  if (host) return `${proto}://${openable(host)}`;

  try {
    const url = new URL(req.url);
    /* Port and all: a link to :3000 without the port goes nowhere. */
    return `${proto}://${openable(url.host)}`;
  } catch {
    return `${proto}://localhost`;
  }
}
