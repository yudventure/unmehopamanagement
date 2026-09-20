import type { Metadata, Viewport } from "next";
import { DM_Sans, JetBrains_Mono, Kaushan_Script } from "next/font/google";

import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  axes: ["opsz"],
  variable: "--font-dm-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

/* The Eddo site's one flourish: a brush script for a single line under each
   heading. One weight, latin only, self-hosted at build like the other two,
   so it costs a file and not a request to a font service. */
const kaushan = Kaushan_Script({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-script",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Unmehopa Management · Booking Manager",
  description:
    "Satu kalender untuk semua saluran booking Turtle dan Eddo Homestay, Raja Ampat.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#DCE8E2",
};

/*
 * A link someone was sent opens at the top of the page.
 *
 * Two things move a first load away from the top, and to whoever opened the
 * link both look like the link itself was wrong. The browser puts back the
 * offset it remembers for that address, so a reload lands wherever the last
 * visit stopped. And a `#bagian` left in a shared address skips everything
 * above it — one person taps a nav item, copies what is now in the address
 * bar, and everyone they send it to arrives halfway down a page they have
 * never seen.
 *
 * This has to run while the head is being read, not from an effect: the
 * browser jumps to the fragment as soon as that element is parsed, so an
 * effect can only correct it after it has already been shown.
 *
 * Only a fresh document is touched. Moving between routes afterwards is the
 * router's business, which is what keeps the package pages' "kembali ke
 * diving" links landing on the diving section rather than at the top.
 */
/*
 * The second half arms the scroll animations, and it is here rather than in a
 * component for the same reason: it has to be decided before the first paint.
 *
 * Things that animate in start invisible, and the rule that hides them is
 * behind `html[data-anim]`. Setting the flag here means the page is drawn with
 * them already hidden, so nothing appears and then jumps back out.
 *
 * The timer is the part worth keeping. `useReveal` upgrades the flag to "on"
 * when it takes charge; if it never does, because the bundle failed, hydration
 * threw or an extension ate it, the flag is dropped and everything becomes
 * visible. Without that, one failed request turns the site into a blank page,
 * which is a far worse bargain than losing an animation.
 *
 * ## Why this no longer reads `prefers-reduced-motion`
 *
 * It used to, and the effect was that a whole class of machine got a site with
 * nothing moving on it at all. On a Mac "Reduce motion" is an accessibility
 * switch that is off unless somebody turned it on. On Windows the same signal
 * comes from "Animation effects", which is off on any machine set to "Adjust
 * for best performance" and on a good deal of what ships from a shop. The web
 * gives both the same name, so the site could not tell a reader who gets motion
 * sick from a laptop that was tuned for speed, and it treated every Windows
 * machine as the first.
 *
 * So the decision moved from this script into the stylesheet, where it can be
 * made per animation rather than for all of them at once. What still stops
 * under `prefers-reduced-motion` is the one thing on these pages that crosses
 * a card on its own and leaves — the manta, the shower, the gusts. The hero
 * that moves under the reader's own scroll, the sections that land as they
 * arrive, and the drift inside the drawings all keep going; the reasoning,
 * including what that costs, is written where those rules live in
 * `globals.css`.
 */
const START_AT_TOP = `
if ("scrollRestoration" in history) history.scrollRestoration = "manual";
if (location.hash) history.replaceState(null, "", location.pathname + location.search);
try {
  var r = document.documentElement;
  r.dataset.anim = "";
  setTimeout(function () { if (r.dataset.anim !== "on") delete r.dataset.anim; }, 3000);
} catch (e) {}
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    /*
     * `suppressHydrationWarning` is about the `data-anim` the script below
     * writes onto this element.
     *
     * The script runs while the HTML is still being parsed, which is the whole
     * point of it — the flag has to be there before the first paint or the
     * things it hides have already been seen. But React then hydrates against
     * markup it rendered without that attribute, finds one it did not put
     * there, and reports a mismatch on every single page load. In development
     * that is the red "1 Issue" badge sitting in the corner of every screen,
     * including the dashboard, which does not animate anything at all and is
     * simply inheriting the warning from this layout.
     *
     * Suppressing it here says what is actually true: on this one element the
     * DOM is the authority and React's copy is not. It is scoped to `<html>`
     * itself and does not reach the tree inside, so a genuine mismatch
     * anywhere in the application is still reported.
     */
    <html
      lang="id"
      className={`${dmSans.variable} ${jetbrainsMono.variable} ${kaushan.variable}`}
      suppressHydrationWarning
    >
      <body>
        <script dangerouslySetInnerHTML={{ __html: START_AT_TOP }} />
        {children}
      </body>
    </html>
  );
}
