import type { Metadata } from "next";

import { AboutPage } from "@/components/web/about";
import { Maintenance } from "@/components/web/maintenance";
import { siteConfig } from "@/lib/site-config";
import { COPY, DEFAULT_LANG, PROPERTY } from "@/lib/web-content";

/**
 * The homestay's own profile page.
 *
 * Metadata in the default language only, same as the package pages: the page
 * switches on a click, but a crawler and a link preview see one language, and
 * English is the one most people arriving here read.
 */
export const metadata: Metadata = {
  title: `About · ${PROPERTY.name}`,
  description: COPY[DEFAULT_LANG].about.lede,
  ...(siteConfig("turtle").maintenance
      ? { robots: { index: false, follow: false } }
      : {}),
};

export default function Page() {
  if (siteConfig("turtle").maintenance) return <Maintenance />;
  return <AboutPage />;
}
