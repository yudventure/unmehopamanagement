import { existsSync } from "node:fs";
import { join } from "node:path";

import type { Metadata } from "next";

import { EddoSite } from "@/components/eddo/site";
import { EDDO, EDDO_COPY } from "@/lib/eddo-content";
import { canonical, siteDomain } from "@/lib/site-domains";
import { SITE_CONFIG } from "@/lib/site-config";
import { DEFAULT_LANG } from "@/lib/web-content";

/**
 * The second public site, on its own route the way `/turtle` is. The two share
 * the booking manager's room table, the enquiry endpoint, and the reader's
 * language and currency choice, and nothing else, so either can move to its
 * own domain without the other noticing.
 */
const copy = EDDO_COPY[DEFAULT_LANG];

export const metadata: Metadata = {
  title: copy.meta.title,
  description: copy.meta.description,
  openGraph: {
    title: `${EDDO.name} · ${EDDO.village}, ${EDDO.island}`,
    description: copy.hero.sub,
    locale: DEFAULT_LANG === "en" ? "en_US" : "id_ID",
    type: "website",
  },
  alternates: { canonical: canonical("eddo") },
  ...(SITE_CONFIG.maintenance ? { robots: { index: false, follow: false } } : {}),
};

export default function EddoPage() {
  /* Resolved here rather than in the component: the component runs in the
     browser, where a server-only variable is not readable. Once Turtle has a
     domain of its own, the footer's "sister homestay" link has to leave this
     domain rather than point at a copy of Turtle sitting under it. */
  const turtle = siteDomain("turtle");
  /* Looked up on disk rather than guessed in the browser. The hero is one
     column without the photograph and two with it, and deciding that after
     the page has painted means the reader watches it rearrange. This page is
     prerendered, so the check runs once at build and costs nothing. */
  const hasHeroPhoto = existsSync(join(process.cwd(), "public", "eddo-hero.jpg"));
  return (
    <EddoSite
      maintenance={SITE_CONFIG.maintenance}
      sisterHref={turtle ? `https://${turtle}/` : "/turtle"}
      hasHeroPhoto={hasHeroPhoto}
    />
  );
}
