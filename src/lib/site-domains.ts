/**
 * Which domain each public site answers on, when it has one.
 *
 * The same two variables `next.config.mjs` reads to route by host, read here
 * for the one thing routing cannot fix by itself: the canonical address.
 *
 * Without this, a page served at `turtlehomestay.com/` would still declare its
 * canonical URL as `/turtle` — pointing a search engine at the long form of an
 * address the reader was never shown, and splitting whatever ranking the site
 * earns across two URLs for the same page. With a domain configured the
 * canonical becomes that domain's own root, which is the address on the
 * business card.
 *
 * Unset, every function here returns the path-based form, which is what the
 * site is today and what it stays until the domains are bought.
 */

const SITE_ENV = {
  turtle: "SITE_DOMAIN_TURTLE",
  eddo: "SITE_DOMAIN_EDDO",
} as const;

export type PublicSite = keyof typeof SITE_ENV;

/**
 * The public sites, as a list something can check a string against.
 *
 * The type alone cannot do that at runtime, and a route taking `?site=` from a
 * query string needs to know whether what arrived is one of these before it
 * acts on it. Derived from the same object the type is, so adding a third site
 * cannot leave this behind.
 */
export const PUBLIC_SITE_KEYS = Object.keys(SITE_ENV) as PublicSite[];

export const isPublicSite = (v: string): v is PublicSite =>
  (PUBLIC_SITE_KEYS as string[]).includes(v);

/**
 * The first host configured for a site, which is the canonical one. Later
 * entries in the list are alternates such as the `www.` form, and an alternate
 * is by definition not what should be advertised.
 */
export function siteDomain(site: PublicSite): string | null {
  const first = (process.env[SITE_ENV[site]] ?? "").split(",")[0]?.trim();
  return first ? first.toLowerCase() : null;
}

/**
 * The canonical URL for a page on a public site. `path` is relative to the
 * site's own root: `""` for its front page, `"about"` for a page under it.
 */
export function canonical(site: PublicSite, path = ""): string {
  const tail = path.replace(/^\/+/, "");
  const host = siteDomain(site);
  if (host) return `https://${host}/${tail}`;
  return `/${site}${tail ? `/${tail}` : ""}`;
}
