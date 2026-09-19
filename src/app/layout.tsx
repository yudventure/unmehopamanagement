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
 * them already hidden, so nothing appears and then jumps back out. Leaving the
 * flag unset means a browser with no JavaScript, or a reader who has asked for
 * less motion, gets the whole page at rest and fully readable.
 *
 * The timer is the part worth keeping. `useReveal` upgrades the flag to "on"
 * when it takes charge; if it never does — the bundle failed, hydration threw,
 * an extension ate it — the flag is dropped and everything becomes visible.
 * Without that, one failed request turns the site into a blank page, which is
 * a far worse bargain than losing an animation.
 */
const START_AT_TOP = `
if ("scrollRestoration" in history) history.scrollRestoration = "manual";
if (location.hash) history.replaceState(null, "", location.pathname + location.search);
try {
  if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
    var r = document.documentElement;
    r.dataset.anim = "";
    setTimeout(function () { if (r.dataset.anim !== "on") delete r.dataset.anim; }, 3000);
  }
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
