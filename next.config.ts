import type { NextConfig } from "next";

/**
 * One application, three sites, told apart by the domain that was asked for.
 *
 * On Vercel — and on any other host — attaching a domain to this project makes
 * that domain serve `/`, which is the booking dashboard. That is right for the
 * manager's domain and wrong for the other two: a guest who types the homestay
 * address should land on the homestay, not on a login screen. This is the
 * layer that sorts that out, and it is the one thing "point the domain at the
 * project" does not do by itself.
 *
 * **Inert until it is configured.** With neither variable set, both lists come
 * back empty and routing is exactly what it was: `/` the dashboard, `/turtle`
 * and `/eddo` the two public sites. So this can sit in the repository from
 * today and start working the day the domains are bought, without a deploy in
 * between changing how anything behaves.
 *
 * **Why `next.config` and not a proxy.** A rewrite here is resolved by the
 * routing layer before anything runs, so it costs nothing per request and
 * behaves identically on Vercel and on a plain Node server behind Caddy. A
 * proxy would cost an invocation on every request to do work that never
 * changes.
 *
 * **Why two lists.** `beforeFiles` runs before the filesystem, `afterFiles`
 * after it. The root has to be rewritten before, because `/` is a real page
 * and would otherwise be served as the dashboard. Everything else has to be
 * rewritten after, so that `/api/...`, `/_next/...`, and files in `public/`
 * are found first and never get a site prefix glued to the front of them.
 */

const SITES = [
  { env: "SITE_DOMAIN_TURTLE", base: "/turtle" },
  { env: "SITE_DOMAIN_EDDO", base: "/eddo" },
] as const;

/**
 * Hosts for one site. A comma-separated list, because the apex and the `www.`
 * form are two different hosts as far as matching is concerned, and a redirect
 * between them is a setting on the host rather than something this can assume.
 */
function hostsFor(name: string): string[] {
  return (process.env[name] ?? "")
    .split(",")
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean);
}

function hostRewrites() {
  const beforeFiles = [];
  const afterFiles = [];

  for (const site of SITES) {
    for (const host of hostsFor(site.env)) {
      const has = [{ type: "host" as const, value: host }];
      beforeFiles.push({ source: "/", has, destination: site.base });
      afterFiles.push({
        source: "/:path*",
        has,
        destination: `${site.base}/:path*`,
      });
    }
  }

  return { beforeFiles, afterFiles };
}

/**
 * One page, one address.
 *
 * The rewrite above makes `turtlehomestay.com/` serve the site, but it does
 * not stop `turtlehomestay.com/turtle` from serving the very same page: that
 * path is a real page and the filesystem finds it. Two addresses for one page
 * is a small mess that a search engine has to guess its way out of, so the
 * long one bounces to the short one.
 *
 * There is no loop in this. Redirects are checked before rewrites, so
 * `/turtle/about` is answered with a bounce to `/about`, and only then does
 * the rewrite quietly turn that back into `/turtle/about` to render it. The
 * address bar keeps the short form; the router keeps the long one.
 *
 * Temporary rather than permanent on purpose. A permanent redirect is cached
 * by the browser for a long time and is unpleasant to take back if a domain
 * turns out to be wrong. It can be promoted once the addresses have settled.
 */
function canonicalPathRedirects() {
  const out = [];
  for (const site of SITES) {
    for (const host of hostsFor(site.env)) {
      const has = [{ type: "host" as const, value: host }];
      /*
       * Two rules, and the split is not tidiness. A single `/:path*` covers
       * the bare `/turtle` as well, matching zero segments — and a zero-segment
       * `:path*` interpolates to nothing, so the redirect goes out as a 307
       * with an empty `Location`, which is a dead end in a browser. Measured,
       * not guessed. `:path+` demands at least one segment and leaves the bare
       * case to a rule that names its destination outright.
       */
      out.push({ source: site.base, has, destination: "/", permanent: false });
      out.push({
        source: `${site.base}/:path+`,
        has,
        destination: "/:path+",
        permanent: false,
      });
    }
  }
  return out;
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  /**
   * Ship the server, not the toolchain.
   *
   * `next build` traces which files each route actually loads and, with this
   * set, copies just those into `.next/standalone` together with a small
   * `server.js` that replaces `next start`. The result runs with no
   * `node_modules` install on the far side, which is what makes this
   * deployable somewhere that cannot spare the memory to build.
   *
   * The build itself is unchanged and just as heavy; it simply stops having to
   * happen on the machine that serves the site. Vercel is unaffected, which is
   * the point: this is additive, and the deployment that works today keeps
   * working the same way.
   *
   * `server.js` does not serve `public/` or `.next/static` on its own. Both
   * have to be copied in beside it, which is what `npm run package` does. Skip
   * that and the pages render with no photographs and no stylesheet, which
   * looks like a broken build rather than a missing copy step.
   */
  output: "standalone",
  async rewrites() {
    const { beforeFiles, afterFiles } = hostRewrites();
    return { beforeFiles, afterFiles, fallback: [] };
  },
  async redirects() {
    return canonicalPathRedirects();
  },
};

export default nextConfig;
