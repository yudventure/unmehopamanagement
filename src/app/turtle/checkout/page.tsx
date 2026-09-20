import type { Metadata } from "next";

import { TurtleCheckout } from "@/components/web/checkout-page";

/**
 * Where an order is looked over before it is paid for.
 *
 * Its own route rather than a panel on the front page, because Midtrans opens
 * its payment sheet over whatever is showing, and what would be showing is a
 * photograph of the reef with the headline behind it.
 *
 * Kept out of search results. There is nothing here until a reader has chosen
 * something in their own tab, so a crawler would only ever meet the empty
 * state, and an address that renders somebody's order is not one worth
 * publishing.
 *
 * Not behind the maintenance switch, unlike every other page on this site.
 * Closing the site stops new orders at the door, since the dialog that fills
 * this page lives on pages that are themselves closed; a reader already
 * halfway through paying should be able to finish rather than meet a holding
 * page with their money in the air.
 *
 * On the live domain this answers at `/checkout`: the config bounces
 * `/turtle/checkout` to the short form and rewrites it back to render.
 */
export const metadata: Metadata = {
  title: "Turtle Dive Homestay",
  robots: { index: false, follow: false },
};

export default function TurtleCheckoutPage() {
  return <TurtleCheckout />;
}
