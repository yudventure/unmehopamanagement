import type { Metadata } from "next";

import { EddoSite } from "@/components/eddo/site";
import { EDDO, EDDO_COPY } from "@/lib/eddo-content";
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
  alternates: { canonical: "/eddo" },
  ...(SITE_CONFIG.maintenance ? { robots: { index: false, follow: false } } : {}),
};

export default function EddoPage() {
  return <EddoSite maintenance={SITE_CONFIG.maintenance} />;
}
