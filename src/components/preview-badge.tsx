import type { PublicSite } from "@/lib/site-domains";

/**
 * The mark that says this page is not what the public is being served.
 *
 * `/preview?token=…` hands out a cookie and then drops the reader on the site
 * itself, which is the right thing for working on it and the wrong thing for
 * knowing where you are: the page that arrives is indistinguishable from the
 * live one. The cookie lasts a year, so somebody can open the link once in
 * August, come back in October on the same phone, and have no way to tell that
 * everyone else is still meeting the holding page.
 *
 * ## Why a corner and not a strip across the top
 *
 * A full-width banner is the usual answer and it is the wrong one here. What
 * this is for is looking at the site while it is being worked on, and a bar
 * pushed in above the header changes the very thing being looked at — the
 * hero's height, where the fold lands, whether the nav overlaps the
 * photograph. A corner overlay sits on top of the layout instead of inside it,
 * so what is being judged is the page as it will actually ship.
 *
 * ## Why `<details>` and why it opens
 *
 * It opens by default because a mark nobody notices is not a mark. It folds
 * because the corner it sits in is part of the design too, and somebody
 * checking the footer should be able to move it out of the way — but folding
 * it leaves the word "Pratinjau" and the dot behind rather than dismissing it,
 * so there is no state in which the page looks live while it is not.
 *
 * `<details>` gives that with no JavaScript at all. It works before hydration,
 * it works if the bundle never arrives, and on a page already carrying a
 * holding-page switch the failure mode worth avoiding is exactly the one where
 * the marker is the part that did not load.
 *
 * ## Why the colours are literals
 *
 * Every other surface here draws from the theme tokens, and this one must not.
 * The tokens are redefined under `[data-manager]` and again between the two
 * public sites, so a badge built from them would restyle itself per site and
 * could land on a background near its own colour. Amber on near-black belongs
 * to neither palette, which is the point: it has to read as something laid
 * over the site rather than as part of it.
 */

const SITE_LABEL: Record<PublicSite, string> = {
  turtle: "Turtle Dive Homestay",
  eddo: "Eddo Homestay",
};

export function PreviewBadge({ site }: { site: PublicSite }) {
  return (
    <details
      open
      /*
       * Above everything, modals included: a checkout sheet opened over the
       * site is still being looked at in preview.
       *
       * Right rather than left, which is where this first sat. Next's own
       * development indicator takes the bottom-left corner, and the two landed
       * on top of each other — the exit link underneath the dev button. That
       * indicator is not in a production build, so the collision only happens
       * while somebody is working on the site locally, which is most of the
       * time this badge is being seen at all.
       */
      className="fixed right-3 bottom-3 z-[200] max-w-[min(330px,calc(100vw-24px))] rounded-[12px] border border-[#facc15]/40 bg-[#1c1917]/95 text-left shadow-[0_12px_30px_-12px_rgba(0,0,0,.75)]"
    >
      <summary className="flex cursor-pointer list-none items-center gap-[8px] px-[12px] py-[9px] text-[12.5px] font-semibold text-[#fde68a] [&::-webkit-details-marker]:hidden">
        <span
          aria-hidden="true"
          className="h-[8px] w-[8px] shrink-0 rounded-full bg-[#facc15]"
        />
        Pratinjau
      </summary>

      <div className="border-t border-[#facc15]/25 px-[12px] py-[10px] text-[12px] leading-[1.55] text-[#e7e5e4]">
        Situs <strong className="font-semibold">{SITE_LABEL[site]}</strong>{" "}
        sedang ditutup untuk umum. Pengunjung lain melihat halaman tunggu; Anda
        melihat aslinya karena browser ini memegang cookie pratinjau.
        {/* A plain link, so it works with the bundle gone and so a long-press
            can hand the address to somebody else's phone. Losing the cookie is
            the one action anyone needs from here, and the wording says what
            happens next rather than only what the link does. */}
        <a
          href="/preview?clear=1"
          className="mt-[9px] inline-block rounded-[8px] border border-[#facc15]/45 px-[10px] py-[5px] text-[11.5px] font-medium text-[#fde68a] no-underline hover:bg-[#facc15]/15 hover:no-underline"
        >
          Keluar dari pratinjau
        </a>
      </div>
    </details>
  );
}
