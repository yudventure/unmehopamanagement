import { cookies } from "next/headers";

import type { PublicSite } from "./site-domains";
import { siteConfig } from "./site-config";

/**
 * Letting the people building a site see it while everyone else sees the
 * holding page.
 *
 * Maintenance mode was all or nothing: flip it and the site is closed to the
 * builder too, which makes it useless for the one thing it is most wanted for,
 * working on a site that already has a domain pointing at it. This is the way
 * back in.
 *
 * Needs one variable on the server:
 *
 *   PREVIEW_TOKEN   any hard-to-guess string
 *
 * Unset, there is no way past the holding page at all. That direction is
 * deliberate: an unset token must never mean "everybody may look", because the
 * failure would be silent and would look exactly like the site working.
 */

/** The cookie the browser keeps once a token has been accepted. */
export const PREVIEW_COOKIE = "eddo_preview";

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Whether a value matches the configured token. False whenever it cannot. */
export function tokenOk(value: string | undefined): boolean {
  const token = process.env.PREVIEW_TOKEN;
  if (!token || !value) return false;
  return timingSafeEqual(value, token);
}

/**
 * Whether this visitor should be shown the holding page.
 *
 * Reading cookies makes a page render per request rather than once at build,
 * so this is called only after the build-time switch says the site is closed.
 * That ordering is the whole performance story: a live site stays prerendered
 * and never touches this, and a closed one is dynamic, which costs nothing
 * worth counting because nobody is being served it.
 */
export async function isClosedFor(site: PublicSite): Promise<boolean> {
  if (!siteConfig(site).maintenance) return false;
  const jar = await cookies();
  return !tokenOk(jar.get(PREVIEW_COOKIE)?.value);
}
