import type { Metadata, Viewport } from "next";
import { DM_Sans, JetBrains_Mono } from "next/font/google";

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
const START_AT_TOP = `
if ("scrollRestoration" in history) history.scrollRestoration = "manual";
if (location.hash) history.replaceState(null, "", location.pathname + location.search);
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={`${dmSans.variable} ${jetbrainsMono.variable}`}>
      <body>
        <script dangerouslySetInnerHTML={{ __html: START_AT_TOP }} />
        {children}
      </body>
    </html>
  );
}
