import type { Metadata } from "next";

import { Maintenance } from "@/components/web/maintenance";
import { TurtleSite } from "@/components/web/site";
import { PreviewBadge } from "@/components/preview-badge";
import { midtransConfigured } from "@/lib/midtrans";
import { isClosedFor, isPreviewing } from "@/lib/preview";
import { canonical } from "@/lib/site-domains";
import { siteConfig } from "@/lib/site-config";
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
  alternates: { canonical: canonical("turtle") },
  other: { "contact:email": EMAIL },
  /* A crawler that reaches the holding page must not file it as what this
     site says. The switch is read at build time, so this is decided once per
     deploy alongside the page it describes. */
  ...(siteConfig("turtle").maintenance
      ? { robots: { index: false, follow: false } }
      : {}),
};

export default async function TurtlePage() {
  if (await isClosedFor("turtle")) return <Maintenance />;
  /*
   * Whether the site may offer to be paid, decided here rather than in the
   * browser: the server key is server-only by design, and the component runs
   * where it cannot be read.
   *
   * Read at build, like the maintenance switch above it, so turning payments
   * on is the same minute-long redeploy that a price change is. That is the
   * right trade for a key that is set once and then left alone, and it keeps
   * this page a static file for the guests reading it on island signal.
   *
   * Without keys the site is exactly the site it was: every room and every
   * package still asks, and nothing offers a button that would open a broken
   * payment window.
   */
  return (
    <>
      <TurtleSite payable={midtransConfigured()} />
      {(await isPreviewing("turtle")) && <PreviewBadge site="turtle" />}
    </>
  );
}
