import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

import type { Metadata } from "next";

import { EddoSite } from "@/components/eddo/site";
import { EDDO, EDDO_COPY } from "@/lib/eddo-content";
import { canonical, siteDomain } from "@/lib/site-domains";
import { isClosedFor } from "@/lib/preview";
import { siteConfig } from "@/lib/site-config";
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
  ...(siteConfig("eddo").maintenance
    ? { robots: { index: false, follow: false } }
    : {}),
};

export default async function EddoPage() {
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
  /* The room carousel takes whatever is in the folder, so "no maximum" is
     true of the site and not just of the component: `eddo-kamar-1.jpg`,
     `-2`, `-3` and on. Sorted by their number rather than by their name, or
     ten would come between one and two. Counted at build, like the hero. */
  const roomPhotos = readdirSync(join(process.cwd(), "public"))
    .filter((f) => /^eddo-kamar-\d+\.(jpe?g|png|webp)$/i.test(f))
    .sort((a, b) => Number(a.replace(/\D/g, "")) - Number(b.replace(/\D/g, "")))
    .map((f) => `/${f}`);
  return (
    <EddoSite
      maintenance={await isClosedFor("eddo")}
      sisterHref={turtle ? `https://${turtle}/` : "/turtle"}
      hasHeroPhoto={hasHeroPhoto}
      roomPhotos={roomPhotos}
    />
  );
}
