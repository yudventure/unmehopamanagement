import type { Metadata } from "next";

import { Maintenance } from "@/components/web/maintenance";
import { TurtleSite } from "@/components/web/site";
import { SITE_CONFIG } from "@/lib/site-config";
import { COPY, DEFAULT_LANG, EMAIL, PROPERTY } from "@/lib/web-content";

/**
 * The public site, on its own route. The booking manager keeps `/` — the two
 * share the room rates and the illustration kit and nothing else, so either
 * can move to its own domain later without the other noticing.
 *
 * The page ships in the default language and the switch happens in the
 * browser, so this metadata is the default language's. Search engines and
 * link previews therefore see English only; giving Indonesian its own
 * indexable page means a second route, which is a bigger change than the
 * switch itself and worth doing when the site has a domain of its own.
 */
const copy = COPY[DEFAULT_LANG];

export const metadata: Metadata = {
  title: copy.meta.title,
  description: copy.meta.description,
  openGraph: {
    title: `${PROPERTY.name} — ${PROPERTY.village}, ${PROPERTY.island}`,
    description: copy.hero.sub,
    locale: DEFAULT_LANG === "en" ? "en_US" : "id_ID",
    type: "website",
  },
  alternates: { canonical: "/turtle" },
  other: { "contact:email": EMAIL },
  /* A crawler that reaches the holding page must not file it as what this
     site says. The switch is read at build time, so this is decided once per
     deploy alongside the page it describes. */
  ...(SITE_CONFIG.maintenance ? { robots: { index: false, follow: false } } : {}),
};

export default function TurtlePage() {
  if (SITE_CONFIG.maintenance) return <Maintenance />;
  return <TurtleSite />;
}
