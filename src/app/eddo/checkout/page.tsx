import type { Metadata, Viewport } from "next";

import { EddoCheckout } from "@/components/eddo/checkout-page";

/**
 * Where an order is looked over before it is paid for.
 *
 * Its own route rather than a panel on the front page, because Midtrans opens
 * its payment sheet over whatever is showing, and what was showing was a
 * photograph of a beach with the headline behind it.
 *
 * Kept out of search results. There is nothing here until a reader has chosen
 * something in their own tab, so a crawler would only ever meet the empty
 * state, and an address that renders somebody's order is not one worth
 * publishing.
 *
 * On the live domain this answers at `/checkout`: the config bounces
 * `/eddo/checkout` to the short form and rewrites it back to render.
 */
export const metadata: Metadata = {
  title: "Eddo Homestay",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#06777d",
};

export default function EddoCheckoutPage() {
  return <EddoCheckout />;
}
