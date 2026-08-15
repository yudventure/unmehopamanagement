import type { Metadata } from "next";

import { TurtleSite } from "@/components/web/site";
import { EMAIL, PROPERTY } from "@/lib/web-content";

/**
 * The public site, on its own route. The booking manager keeps `/` — the two
 * share the room rates and the illustration kit and nothing else, so either
 * can move to its own domain later without the other noticing.
 */
export const metadata: Metadata = {
  title: `${PROPERTY.name} · ${PROPERTY.tagline} di Raja Ampat`,
  description:
    "Homestay keluarga dan dive center di Yenbuba, Pulau Mansuar. Kamar di atas air, tiga kali makan, dan penyelaman harian di Selat Dampier.",
  openGraph: {
    title: `${PROPERTY.name} — ${PROPERTY.village}, ${PROPERTY.island}`,
    description:
      "Tidur di atas air, sarapan menghadap Selat Dampier, menyelam sebelum matahari tinggi.",
    locale: "id_ID",
    type: "website",
  },
  alternates: { canonical: "/turtle" },
  other: { "contact:email": EMAIL },
};

export default function TurtlePage() {
  return <TurtleSite />;
}
